import { supabase } from '../../supabase'
import { db } from '../db'
import { enqueueSyncOperation } from '../syncQueue'
import type { Strumento } from '../../../types'

export interface StrumentiRepo {
  list(): Promise<Strumento[]>
  create(input: Omit<Strumento, 'id' | 'created_at'>): Promise<Strumento>
}

export const strumentiRepo: StrumentiRepo = {
  async list() {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('strumenti')
        .select('id, nome, modello, matricola, sync_pending, updated_at, created_at')
        .order('nome', { ascending: true })
      if (error) throw new Error(error.message)
      const rows = data ?? []
      void db.strumenti.bulkPut(rows).catch(err =>
        console.warn('[strumentiRepo.list] mirror Dexie failed', err)
      )
      return rows
    }
    const rows = await db.strumenti.toArray()
    return rows.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
  },

  async create(input) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('strumenti')
        .insert(input)
        .select('id, nome, modello, matricola, sync_pending, updated_at, created_at')
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Create strumento: nessun dato restituito da Supabase')
      void db.strumenti.put(data).catch(err =>
        console.warn('[strumentiRepo.create] mirror Dexie failed', err)
      )
      return data
    }
    const local: Strumento = {
      ...input,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await db.strumenti.put(local)
    await enqueueSyncOperation('strumenti', 'create', local.id, local)
    return local
  },
}
