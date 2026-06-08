import type { Cantiere, Campagna, Misura, FotoMisura, RisorsaCantiere, Tecnico, Strumento } from '../../types'
import { db } from './db'
import { supabase } from '../supabase'
import { CAMPAGNA_SELECT } from './repositories/campagneRepo'
import { MISURA_SELECT } from './repositories/misureRepo'

export interface PullResult {
  byEntity: Record<string, number>
  skippedPending: Record<string, number>
  errors: string[]
}

const CANTIERE_SELECT = 'id, nome, indirizzo, committente, stato, sync_pending, updated_at, created_at'
const RISORSA_SELECT = 'id, cantiere_id, tipo, valore, sync_pending, updated_at, created_at'
const TECNICO_SELECT = 'id, nome, cognome, sync_pending, updated_at, created_at'
const STRUMENTO_SELECT = 'id, nome, modello, matricola, sync_pending, updated_at, created_at'
const FOTO_MISURA_SELECT = 'id, misura_id, url_storage, path_locale, sync_pending, updated_at, created_at'

interface RawFotoMisura {
  id: string
  misura_id: string
  url_storage: string | null
  path_locale: string | null
  sync_pending: boolean | null
  updated_at: string | null
  created_at: string | null
}

let pulling = false

export async function pullFromCloud(): Promise<PullResult> {
  if (pulling) return { byEntity: {}, skippedPending: {}, errors: ['pull already running'] }
  if (!navigator.onLine) return { byEntity: {}, skippedPending: {}, errors: ['offline'] }

  pulling = true
  const result: PullResult = { byEntity: {}, skippedPending: {}, errors: [] }
  let totalWritten = 0

  try {
    // cantieri — no sync_pending
    {
      const { data, error } = await supabase
        .from('cantieri')
        .select(CANTIERE_SELECT)
        .order('created_at', { ascending: false })
      if (error) {
        result.errors.push(`cantieri: ${error.message}`)
      } else {
        const rows = (data ?? []) as Cantiere[]
        await db.cantieri.bulkPut(rows)
        result.byEntity['cantieri'] = rows.length
        totalWritten += rows.length
      }
    }

    // risorse_cantiere — no sync_pending
    {
      const { data, error } = await supabase
        .from('risorse_cantiere')
        .select(RISORSA_SELECT)
      if (error) {
        result.errors.push(`risorse_cantiere: ${error.message}`)
      } else {
        const rows = (data ?? []) as RisorsaCantiere[]
        await db.risorse_cantiere.bulkPut(rows)
        result.byEntity['risorse_cantiere'] = rows.length
        totalWritten += rows.length
      }
    }

    // tecnici — no sync_pending
    {
      const { data, error } = await supabase
        .from('tecnici')
        .select(TECNICO_SELECT)
      if (error) {
        result.errors.push(`tecnici: ${error.message}`)
      } else {
        const rows = (data ?? []) as Tecnico[]
        await db.tecnici.bulkPut(rows)
        result.byEntity['tecnici'] = rows.length
        totalWritten += rows.length
      }
    }

    // strumenti — no sync_pending
    {
      const { data, error } = await supabase
        .from('strumenti')
        .select(STRUMENTO_SELECT)
      if (error) {
        result.errors.push(`strumenti: ${error.message}`)
      } else {
        const rows = (data ?? []) as Strumento[]
        await db.strumenti.bulkPut(rows)
        result.byEntity['strumenti'] = rows.length
        totalWritten += rows.length
      }
    }

    // campagne — local-wins on sync_pending
    {
      const { data, error } = await supabase
        .from('campagne')
        .select(CAMPAGNA_SELECT)
        .order('created_at', { ascending: false })
      if (error) {
        result.errors.push(`campagne: ${error.message}`)
      } else {
        const remote = (data ?? []) as Campagna[]
        const local = await db.campagne.toArray()
        const pendingIds = new Set(local.filter(c => c.sync_pending).map(c => c.id))
        const toWrite = remote.filter(r => !pendingIds.has(r.id))
        result.skippedPending['campagne'] = remote.length - toWrite.length
        await db.campagne.bulkPut(toWrite)
        result.byEntity['campagne'] = toWrite.length
        totalWritten += toWrite.length
      }
    }

    // misure — local-wins on sync_pending (sync_pending è boolean | null nel tipo)
    {
      const { data, error } = await supabase
        .from('misure')
        .select(MISURA_SELECT)
        .order('numero', { ascending: true })
      if (error) {
        result.errors.push(`misure: ${error.message}`)
      } else {
        const remote = (data ?? []) as Misura[]
        const local = await db.misure.toArray()
        const pendingIds = new Set(
          local.filter(m => m.sync_pending === true).map(m => m.id)
        )
        const toWrite = remote.filter(r => !pendingIds.has(r.id))
        result.skippedPending['misure'] = remote.length - toWrite.length
        await db.misure.bulkPut(toWrite)
        result.byEntity['misure'] = toWrite.length
        totalWritten += toWrite.length
      }
    }

    // foto_misura — local-wins on sync_pending
    {
      const { data, error } = await supabase
        .from('foto_misura')
        .select(FOTO_MISURA_SELECT)
      if (error) {
        result.errors.push(`foto_misura: ${error.message}`)
      } else {
        const raw = (data ?? []) as RawFotoMisura[]
        const withPath = raw.filter((r): r is RawFotoMisura & { path_locale: string } => r.path_locale != null)
        const nullCount = raw.length - withPath.length
        if (nullCount > 0) {
          result.errors.push(`foto_misura: scartati ${nullCount} record con path_locale null`)
        }
        const remote = withPath as FotoMisura[]
        const local = await db.foto_misura.toArray()
        const pendingIds = new Set(local.filter(f => f.sync_pending).map(f => f.id))
        const toWrite = remote.filter(r => !pendingIds.has(r.id))
        result.skippedPending['foto_misura'] = remote.length - toWrite.length
        await db.foto_misura.bulkPut(toWrite)
        result.byEntity['foto_misura'] = toWrite.length
        totalWritten += toWrite.length
      }
    }

    if (totalWritten > 0) {
      window.dispatchEvent(new CustomEvent('pull-completed'))
    }
  } finally {
    pulling = false
  }

  return result
}
