import type { Cantiere, Campagna, Misura, FotoMisura, RisorsaCantiere, Tecnico, Strumento } from '../../types'
import { db } from './db'
import { supabase } from '../supabase'
import { CAMPAGNA_SELECT } from './repositories/campagneRepo'
import { MISURA_SELECT } from './repositories/misureRepo'
import { isRemoteNewer } from './lwwMerge'

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
    // cantieri — LWW + local-wins on sync_pending
    {
      const { data, error } = await supabase
        .from('cantieri')
        .select(CANTIERE_SELECT)
        .order('created_at', { ascending: false })
      if (error) {
        result.errors.push(`cantieri: ${error.message}`)
      } else {
        const remote = (data ?? []) as Cantiere[]
        const local = await db.cantieri.toArray()
        const localById = new Map(local.map(r => [r.id, r]))
        const pendingIds = new Set(local.filter(r => r.sync_pending === true).map(r => r.id))
        const toWrite = remote.filter(r => {
          if (pendingIds.has(r.id)) return false
          const loc = localById.get(r.id)
          if (!loc) return true
          return isRemoteNewer(r.updated_at, loc.updated_at)
        })
        result.skippedPending['cantieri'] = remote.length - toWrite.length
        await db.cantieri.bulkPut(toWrite)
        result.byEntity['cantieri'] = toWrite.length
        totalWritten += toWrite.length
      }
    }

    // risorse_cantiere — LWW + local-wins on sync_pending
    {
      const { data, error } = await supabase
        .from('risorse_cantiere')
        .select(RISORSA_SELECT)
      if (error) {
        result.errors.push(`risorse_cantiere: ${error.message}`)
      } else {
        const remote = (data ?? []) as RisorsaCantiere[]
        const local = await db.risorse_cantiere.toArray()
        const localById = new Map(local.map(r => [r.id, r]))
        const pendingIds = new Set(local.filter(r => r.sync_pending === true).map(r => r.id))
        const toWrite = remote.filter(r => {
          if (pendingIds.has(r.id)) return false
          const loc = localById.get(r.id)
          if (!loc) return true
          return isRemoteNewer(r.updated_at, loc.updated_at)
        })
        result.skippedPending['risorse_cantiere'] = remote.length - toWrite.length
        await db.risorse_cantiere.bulkPut(toWrite)
        result.byEntity['risorse_cantiere'] = toWrite.length
        totalWritten += toWrite.length
      }
    }

    // tecnici — LWW + local-wins on sync_pending
    {
      const { data, error } = await supabase
        .from('tecnici')
        .select(TECNICO_SELECT)
      if (error) {
        result.errors.push(`tecnici: ${error.message}`)
      } else {
        const remote = (data ?? []) as Tecnico[]
        const local = await db.tecnici.toArray()
        const localById = new Map(local.map(r => [r.id, r]))
        const pendingIds = new Set(local.filter(r => r.sync_pending === true).map(r => r.id))
        const toWrite = remote.filter(r => {
          if (pendingIds.has(r.id)) return false
          const loc = localById.get(r.id)
          if (!loc) return true
          return isRemoteNewer(r.updated_at, loc.updated_at)
        })
        result.skippedPending['tecnici'] = remote.length - toWrite.length
        await db.tecnici.bulkPut(toWrite)
        result.byEntity['tecnici'] = toWrite.length
        totalWritten += toWrite.length
      }
    }

    // strumenti — LWW + local-wins on sync_pending
    {
      const { data, error } = await supabase
        .from('strumenti')
        .select(STRUMENTO_SELECT)
      if (error) {
        result.errors.push(`strumenti: ${error.message}`)
      } else {
        const remote = (data ?? []) as Strumento[]
        const local = await db.strumenti.toArray()
        const localById = new Map(local.map(r => [r.id, r]))
        const pendingIds = new Set(local.filter(r => r.sync_pending === true).map(r => r.id))
        const toWrite = remote.filter(r => {
          if (pendingIds.has(r.id)) return false
          const loc = localById.get(r.id)
          if (!loc) return true
          return isRemoteNewer(r.updated_at, loc.updated_at)
        })
        result.skippedPending['strumenti'] = remote.length - toWrite.length
        await db.strumenti.bulkPut(toWrite)
        result.byEntity['strumenti'] = toWrite.length
        totalWritten += toWrite.length
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
        const localById = new Map(local.map(c => [c.id, c]))
        const pendingIds = new Set(local.filter(c => c.sync_pending === true).map(c => c.id))
        const toWrite = remote.filter(r => {
          if (pendingIds.has(r.id)) return false
          const loc = localById.get(r.id)
          if (!loc) return true
          return isRemoteNewer(r.updated_at, loc.updated_at)
        })
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
        const localById = new Map(local.map(m => [m.id, m]))
        const pendingIds = new Set(
          local.filter(m => m.sync_pending === true).map(m => m.id)
        )
        const toWrite = remote.filter(r => {
          if (pendingIds.has(r.id)) return false
          const loc = localById.get(r.id)
          if (!loc) return true
          return isRemoteNewer(r.updated_at, loc.updated_at)
        })
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
