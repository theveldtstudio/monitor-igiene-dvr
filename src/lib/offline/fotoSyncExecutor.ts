import { db } from './db'
import { getFotoBlob, deleteFotoBlob } from './repositories/fotoBlobStore'
import { uploadFotoBlob } from '../../utils/fotoStorage'
import { supabase } from '../supabase'
import { queryClient } from '../queryClient'

// Soglia oltre la quale una foto è considerata in errore terminale.
const MAX_RETRIES = 3

// GUARD concorrenza globale: una sola esecuzione di syncPendingFoto alla volta.
let running = false
// LOCK per-foto: record_id attualmente in upload (difesa extra contro doppio upload).
const inFlight = new Set<string>()

export interface SyncFotoResult {
  uploaded: number
  failed: number
  skipped: number
}

/**
 * Mini-executor: carica su Supabase Storage le foto rimaste pending in locale,
 * aggiorna lo stato e svuota la coda. Atomico per-foto: tocca Dexie solo
 * dopo upload+insert riusciti. Dopo MAX_RETRIES fallimenti la foto resta
 * pending (badge errore derivato da retries in useFotoMisure).
 */
export async function syncPendingFoto(): Promise<SyncFotoResult> {
  // RISCHIO 1: due chiamate concorrenti -> la seconda esce subito, niente doppio upload.
  if (running) return { uploaded: 0, failed: 0, skipped: 0 }
  // Non processare offline (gli upload fallirebbero a catena).
  if (!navigator.onLine) return { uploaded: 0, failed: 0, skipped: 0 }

  running = true
  let uploaded = 0
  let failed = 0
  let skipped = 0

  try {
    // record_id non è indicizzato -> filter(). Solo op di creazione foto.
    const ops = await db._sync_queue
      .filter((op) => op.table === 'foto_misura' && op.operation === 'create')
      .toArray()

    for (const op of ops) {
      const recordId = op.record_id

      // Errore terminale: già esauriti i tentativi -> non ritentare.
      if (op.retries >= MAX_RETRIES) {
        skipped++
        continue
      }

      // RISCHIO 1 (per-foto): salta se lo stesso record è già in volo.
      if (inFlight.has(recordId)) {
        skipped++
        continue
      }
      inFlight.add(recordId)

      try {
        const blobRec = await getFotoBlob(recordId)
        if (!blobRec) {
          // Op orfana (blob assente): rimuovi op, nulla da caricare.
          await db._sync_queue.filter((o) => o.record_id === recordId).delete()
          skipped++
          continue
        }

        const payload = op.payload as { misura_id?: string } | null
        const misuraId =
          payload?.misura_id ?? (await db.foto_misura.get(recordId))?.misura_id
        if (!misuraId) {
          // Impossibile determinare la misura: op orfana.
          await db._sync_queue.filter((o) => o.record_id === recordId).delete()
          skipped++
          continue
        }

        // RISCHIO 2 (atomicità): prima Storage + insert remoto, poi Dexie.
        // Path DETERMINISTICO (<misuraId>/<recordId>.jpg) + upsert: i retry
        // sovrascrivono lo stesso file invece di accumulare orfani nel bucket.
        const path = await uploadFotoBlob(misuraId, blobRec.blob, {
          path: `${misuraId}/${recordId}.jpg`,
          upsert: true,
        })

        const { error } = await supabase.from('foto_misura').insert({
          id: recordId, // stesso id locale -> dedup garantito nel merge di useFotoMisure
          misura_id: misuraId,
          path_locale: path,
          url_storage: null,
          sync_pending: false,
        })
        if (error) throw new Error(error.message)

        // Successo: record locale -> synced, blob via, op rimossa.
        await db.foto_misura.update(recordId, { path_locale: path, sync_pending: false })
        await deleteFotoBlob(recordId)
        await db._sync_queue.filter((o) => o.record_id === recordId).delete()
        uploaded++
      } catch (err) {
        // Fallimento: incrementa retries, salva errore. NON cancellare blob/op.
        // foto_misura resta sync_pending=true -> badge 'pending'/'error'.
        const current = await db._sync_queue.get(op.id)
        const retries = (current?.retries ?? op.retries) + 1
        await db._sync_queue.update(op.id, { retries, last_error: String(err) })
        failed++
      } finally {
        inFlight.delete(recordId)
      }
    }

    // RISCHIO 4: invalidazione da fuori React via queryClient a livello modulo.
    if (uploaded > 0) {
      queryClient.invalidateQueries({ queryKey: ['foto_misura'] })
      queryClient.invalidateQueries({ queryKey: ['foto-misure-campagna'] })
    }
  } finally {
    running = false
  }

  return { uploaded, failed, skipped }
}
