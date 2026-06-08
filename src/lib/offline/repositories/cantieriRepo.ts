import { supabase } from '../../supabase'
import { db } from '../db'
import { enqueueSyncOperation } from '../syncQueue'
import type { Cantiere } from '../../../types'

export interface CantieriRepo {
  list(): Promise<Cantiere[]>
  getById(id: string): Promise<Cantiere | null>
  create(input: Omit<Cantiere, 'id' | 'created_at'>): Promise<Cantiere>
  update(id: string, patch: Partial<Cantiere>): Promise<Cantiere>
}

export const cantieriRepo: CantieriRepo = {
  async list() {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('cantieri')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      const rows = data ?? []
      void db.cantieri.bulkPut(rows).catch(err =>
        console.warn('[cantieriRepo.list] mirror Dexie failed', err)
      )
      return rows
    }
    return db.cantieri.toArray()
  },

  async getById(id) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('cantieri')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (data) {
        void db.cantieri.put(data).catch(err =>
          console.warn('[cantieriRepo.getById] mirror Dexie failed', err)
        )
      }
      return data ?? null
    }
    const local = await db.cantieri.get(id)
    return local ?? null
  },

  async create(input) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('cantieri')
        .insert(input)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Create cantiere: nessun dato restituito da Supabase')
      void db.cantieri.put(data).catch(err =>
        console.warn('[cantieriRepo.create] mirror Dexie failed', err)
      )
      return data
    }
    const localCantiere: Cantiere = {
      ...input,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await db.cantieri.put(localCantiere)
    await enqueueSyncOperation('cantieri', 'create', localCantiere.id, localCantiere)
    return localCantiere
  },

  async update(id, patch) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('cantieri')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Update cantiere: nessun dato restituito da Supabase')
      void db.cantieri.put(data).catch(err =>
        console.warn('[cantieriRepo.update] mirror Dexie failed', err)
      )
      return data
    }
    const existing = await db.cantieri.get(id)
    if (!existing) throw new Error(`Cantiere ${id} non trovato in storage locale`)
    const nowIso = new Date().toISOString()
    const updated: Cantiere = { ...existing, ...patch, updated_at: nowIso }
    await db.cantieri.put(updated)
    await enqueueSyncOperation('cantieri', 'update', id, { ...patch, updated_at: nowIso })
    return updated
  },
}
