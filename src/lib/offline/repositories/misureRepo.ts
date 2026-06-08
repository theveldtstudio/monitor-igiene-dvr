import { supabase } from '../../supabase'
import { db } from '../db'
import { enqueueSyncOperation } from '../syncQueue'
import type { Misura } from '../../../types'

interface MisuraCreateInput {
  campagna_id: string
  dati: Record<string, unknown>
  note?: string
}

export interface MisureRepo {
  list(campagnaId: string): Promise<Misura[]>
  getById(id: string): Promise<Misura | null>
  create(input: MisuraCreateInput): Promise<Misura>
  update(id: string, patch: Partial<Misura>): Promise<Misura>
  remove(id: string): Promise<void>
}

export const MISURA_SELECT = 'id, campagna_id, numero, dati, note, sync_pending, updated_at, created_at'

async function nextNumeroLocale(campagnaId: string): Promise<number> {
  const esistenti = await db.misure.where('campagna_id').equals(campagnaId).toArray()
  const max = esistenti.reduce((acc, m) => (m.numero > acc ? m.numero : acc), 0)
  return max + 1
}

export const misureRepo: MisureRepo = {
  async list(campagnaId) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('misure')
        .select(MISURA_SELECT)
        .eq('campagna_id', campagnaId)
        .order('numero', { ascending: true })
      if (error) throw new Error(error.message)
      const rows = (data ?? []) as Misura[]
      void db.misure.bulkPut(rows).catch(err =>
        console.warn('[misureRepo.list] mirror Dexie failed', err)
      )
      return rows
    }
    const all = await db.misure.where('campagna_id').equals(campagnaId).toArray()
    return all.sort((a, b) => a.numero - b.numero)
  },

  async getById(id) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('misure')
        .select(MISURA_SELECT)
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (data) {
        void db.misure.put(data as Misura).catch(err =>
          console.warn('[misureRepo.getById] mirror Dexie failed', err)
        )
      }
      return (data as Misura) ?? null
    }
    const local = await db.misure.get(id)
    return local ?? null
  },

  async create(input) {
    if (navigator.onLine) {
      const { data: existing, error: maxErr } = await supabase
        .from('misure')
        .select('numero')
        .eq('campagna_id', input.campagna_id)
        .order('numero', { ascending: false })
        .limit(1)
      if (maxErr) throw new Error(maxErr.message)
      const prossimoNumero = (existing && existing.length > 0 ? (existing[0] as { numero: number }).numero : 0) + 1

      const payload = {
        campagna_id: input.campagna_id,
        numero: prossimoNumero,
        dati: input.dati,
        note: input.note ?? '',
      }
      const { data, error } = await supabase
        .from('misure')
        .insert(payload)
        .select(MISURA_SELECT)
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Create misura: nessun dato restituito da Supabase')
      void db.misure.put(data as Misura).catch(err =>
        console.warn('[misureRepo.create] mirror Dexie failed', err)
      )
      return data as Misura
    }

    const local: Misura = {
      id: crypto.randomUUID(),
      campagna_id: input.campagna_id,
      numero: await nextNumeroLocale(input.campagna_id),
      dati: input.dati,
      note: input.note ?? '',
      sync_pending: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await db.misure.put(local)
    await enqueueSyncOperation('misure', 'create', local.id, local)
    return local
  },

  async update(id, patch) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('misure')
        .update(patch)
        .eq('id', id)
        .select(MISURA_SELECT)
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Update misura: nessun dato restituito da Supabase')
      void db.misure.put(data as Misura).catch(err =>
        console.warn('[misureRepo.update] mirror Dexie failed', err)
      )
      return data as Misura
    }
    const existing = await db.misure.get(id)
    if (!existing) throw new Error(`Misura ${id} non trovata in storage locale`)
    const nowIso = new Date().toISOString()
    const updated: Misura = { ...existing, ...patch, sync_pending: true, updated_at: nowIso }
    await db.misure.put(updated)
    await enqueueSyncOperation('misure', 'update', id, { ...patch, updated_at: nowIso })
    return updated
  },

  async remove(id) {
    if (navigator.onLine) {
      const { error } = await supabase
        .from('misure')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
      void db.misure.delete(id).catch(err =>
        console.warn('[misureRepo.remove] mirror Dexie failed', err)
      )
      return
    }
    await db.misure.delete(id)
    await enqueueSyncOperation('misure', 'delete', id, null)
  },
}
