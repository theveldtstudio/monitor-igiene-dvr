import type { Table } from 'dexie'
import { db } from './db'
import { supabase } from '../supabase'
import { syncPendingFoto } from './fotoSyncExecutor'
import { toast } from '../toast'

const MAX_RETRIES = 3

const TABLE_ORDER = [
  'cantieri',
  'strumenti',
  'tecnici',
  'campagne',
  'risorse_cantiere',
  'misure',
] as const

type SyncTable = (typeof TABLE_ORDER)[number]

const TABLES_WITH_SYNC_PENDING = new Set<string>(['campagne', 'misure'])

const COLUMN_WHITELIST: Record<SyncTable, string[]> = {
  cantieri: ['id', 'nome', 'indirizzo', 'stato', 'committente', 'created_at'],
  strumenti: ['id', 'nome', 'modello', 'matricola', 'created_at'],
  tecnici: ['id', 'nome', 'cognome', 'created_at'],
  campagne: [
    'id',
    'cantiere_id',
    'tipo_campionamento',
    'data_ora',
    'strumento_id',
    'tecnici_ids',
    'pin_tecnico',
    'pin_osservatore',
    'stato',
    'sync_pending',
    'created_at',
  ],
  risorse_cantiere: ['id', 'cantiere_id', 'tipo', 'valore', 'created_at'],
  misure: ['id', 'campagna_id', 'numero', 'dati', 'note', 'sync_pending', 'created_at'],
}

function sanitize(table: SyncTable, payload: unknown): Record<string, unknown> {
  const whitelist = COLUMN_WHITELIST[table]
  const raw = payload as Record<string, unknown>
  const out: Record<string, unknown> = {}

  for (const key of whitelist) {
    if (!(key in raw)) continue
    if (key === 'created_at') {
      const v = raw[key]
      if (typeof v === 'number') {
        out[key] = new Date(v).toISOString()
      } else if (typeof v === 'string') {
        out[key] = v
      }
    } else {
      out[key] = raw[key]
    }
  }

  if (TABLES_WITH_SYNC_PENDING.has(table)) {
    out['sync_pending'] = false
  }

  return out
}

function getTable(name: SyncTable): Table<Record<string, unknown>, string> {
  return db[name] as unknown as Table<Record<string, unknown>, string>
}

export interface SyncOperationsResult {
  uploaded: number
  failed: number
  skipped: number
}

let running = false

export async function syncPendingOperations(): Promise<SyncOperationsResult> {
  if (running) return { uploaded: 0, failed: 0, skipped: 0 }
  if (!navigator.onLine) return { uploaded: 0, failed: 0, skipped: 0 }

  running = true
  let uploaded = 0
  let failed = 0
  let skipped = 0
  let discardedMissing = 0

  try {
    for (const table of TABLE_ORDER) {
      const ops = await db._sync_queue
        .where('table')
        .equals(table)
        .sortBy('created_at')

      for (const op of ops) {
        if (op.retries >= MAX_RETRIES) {
          skipped++
          continue
        }

        try {
          if (op.operation === 'delete') {
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('id', op.record_id)
            if (error) throw new Error(error.message)
          } else {
            const sanitized = sanitize(table, op.payload)
            if (op.operation === 'create') {
              const { error } = await supabase.from(table).insert(sanitized)
              if (error) throw new Error(error.message)
            } else {
              const { data, error } = await supabase
                .from(table)
                .update(sanitized)
                .eq('id', op.record_id)
                .select()
              if (error) throw new Error(error.message)
              // 0 righe modificate senza errore => il record non esiste più sul
              // cloud (cancellato da un altro device). Le RLS di tutte le tabelle
              // mutabili sono `ALL using(true)`, quindi .select() post-update è
              // affidabile: array vuoto == record assente, non blocco RLS.
              // Il delete altrui prevale: scarta l'edit, niente resurrezione.
              if (!data || data.length === 0) {
                await getTable(table).delete(op.record_id)
                await db._sync_queue.delete(op.id)
                discardedMissing++
                continue
              }
            }
          }

          if (TABLES_WITH_SYNC_PENDING.has(table) && op.operation !== 'delete') {
            await getTable(table).update(op.record_id, { sync_pending: false })
          }
          await db._sync_queue.delete(op.id)
          uploaded++
        } catch (err) {
          await db._sync_queue.update(op.id, {
            retries: op.retries + 1,
            last_error: String(err),
          })
          failed++
        }
      }
    }

    // Le foto referenziano misura_id (FK foto_misura -> misure). Invia le foto
    // SOLO se la coda misure è completamente drenata: se restano op misure in
    // coda (fallite con retry < MAX, o esaurite i retry) il loro id non esiste
    // ancora su Supabase e l'insert foto fallirebbe con 23503. In tal caso
    // rimanda l'invio foto al ciclo di sync successivo, lasciando le op in coda.
    const misureRimaste = await db._sync_queue.where('table').equals('misure').count()
    if (misureRimaste === 0) {
      await syncPendingFoto()
    } else {
      console.warn(
        `[sync] ${misureRimaste} misure ancora in coda: invio foto rimandato al prossimo ciclo`,
      )
    }

    if (uploaded > 0) {
      window.dispatchEvent(new CustomEvent('sync-completed'))
    }

    // A2 — avviso conflitti: 1 solo toast aggregato per ciclo, niente spam.
    // toast è un singleton imperativo (modulo non-React): chiamabile diretto.
    if (discardedMissing > 0) {
      toast.warning(
        discardedMissing === 1
          ? 'Una modifica non è stata salvata: l’elemento è stato eliminato da un altro dispositivo.'
          : `${discardedMissing} modifiche non sono state salvate: gli elementi sono stati eliminati da un altro dispositivo.`,
      )
    }
  } finally {
    running = false
  }

  return { uploaded, failed, skipped }
}
