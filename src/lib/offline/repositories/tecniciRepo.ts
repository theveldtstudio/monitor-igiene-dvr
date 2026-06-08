import { supabase } from '../../supabase'
import { db } from '../db'
import { enqueueSyncOperation } from '../syncQueue'
import type { Tecnico } from '../../../types'

export interface TecniciRepo {
  list(): Promise<Tecnico[]>
  create(input: Omit<Tecnico, 'id' | 'created_at'>): Promise<Tecnico>
}

export const tecniciRepo: TecniciRepo = {
  async list() {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('tecnici')
        .select('id, nome, cognome, sync_pending, updated_at, created_at')
        .order('cognome', { ascending: true })
        .order('nome', { ascending: true })
      if (error) throw new Error(error.message)
      const rows = data ?? []
      void db.tecnici.bulkPut(rows).catch(err =>
        console.warn('[tecniciRepo.list] mirror Dexie failed', err)
      )
      return rows
    }
    const rows = await db.tecnici.toArray()
    return rows.sort((a, b) => {
      const cmp = a.cognome.localeCompare(b.cognome, 'it')
      return cmp !== 0 ? cmp : a.nome.localeCompare(b.nome, 'it')
    })
  },

  async create(input) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('tecnici')
        .insert(input)
        .select('id, nome, cognome, sync_pending, updated_at, created_at')
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Create tecnico: nessun dato restituito da Supabase')
      void db.tecnici.put(data).catch(err =>
        console.warn('[tecniciRepo.create] mirror Dexie failed', err)
      )
      return data
    }
    const local: Tecnico = {
      ...input,
      id: crypto.randomUUID(),
      sync_pending: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await db.tecnici.put(local)
    await enqueueSyncOperation('tecnici', 'create', local.id, local)
    return local
  },
}
