import { supabase } from '../../supabase'
import { db } from '../db'
import { enqueueSyncOperation } from '../syncQueue'
import type { RisorsaCantiere, TipoRisorsa } from '../../../types'

export interface RisorseCantiereRepo {
  list(cantiereId: string, tipo: TipoRisorsa): Promise<RisorsaCantiere[]>
  create(input: Omit<RisorsaCantiere, 'id' | 'created_at'>): Promise<RisorsaCantiere>
  update(id: string, patch: Partial<RisorsaCantiere>): Promise<RisorsaCantiere>
  remove(id: string): Promise<void>
}

export const risorseCantiereRepo: RisorseCantiereRepo = {
  async list(cantiereId, tipo) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('risorse_cantiere')
        .select('id, cantiere_id, tipo, valore, sync_pending, updated_at, created_at')
        .eq('cantiere_id', cantiereId)
        .eq('tipo', tipo)
        .order('valore', { ascending: true })
      if (error) throw new Error(error.message)
      const rows = data ?? []
      void db.risorse_cantiere.bulkPut(rows).catch(err =>
        console.warn('[risorseCantiereRepo.list] mirror Dexie failed', err)
      )
      return rows
    }
    return db.risorse_cantiere
      .where('[cantiere_id+tipo]')
      .equals([cantiereId, tipo])
      .sortBy('valore')
  },

  async create(input) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('risorse_cantiere')
        .insert(input)
        .select('id, cantiere_id, tipo, valore, sync_pending, updated_at, created_at')
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Create risorsa: nessun dato restituito da Supabase')
      void db.risorse_cantiere.put(data).catch(err =>
        console.warn('[risorseCantiereRepo.create] mirror Dexie failed', err)
      )
      return data
    }
    const local: RisorsaCantiere = {
      ...input,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await db.risorse_cantiere.put(local)
    await enqueueSyncOperation('risorse_cantiere', 'create', local.id, local)
    return local
  },

  async update(id, patch) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('risorse_cantiere')
        .update(patch)
        .eq('id', id)
        .select('id, cantiere_id, tipo, valore, sync_pending, updated_at, created_at')
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Update risorsa: nessun dato restituito da Supabase')
      void db.risorse_cantiere.put(data).catch(err =>
        console.warn('[risorseCantiereRepo.update] mirror Dexie failed', err)
      )
      return data
    }
    const existing = await db.risorse_cantiere.get(id)
    if (!existing) throw new Error(`Risorsa ${id} non trovata in storage locale`)
    const nowIso = new Date().toISOString()
    const updated: RisorsaCantiere = { ...existing, ...patch, updated_at: nowIso }
    await db.risorse_cantiere.put(updated)
    await enqueueSyncOperation('risorse_cantiere', 'update', id, { ...patch, updated_at: nowIso })
    return updated
  },

  async remove(id) {
    if (navigator.onLine) {
      const { error } = await supabase
        .from('risorse_cantiere')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
      void db.risorse_cantiere.delete(id).catch(err =>
        console.warn('[risorseCantiereRepo.remove] mirror Dexie failed', err)
      )
      return
    }
    await db.risorse_cantiere.delete(id)
    await enqueueSyncOperation('risorse_cantiere', 'delete', id, null)
  },
}
