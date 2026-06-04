import { supabase } from '../../supabase'
import { db } from '../db'
import { enqueueSyncOperation } from '../syncQueue'
import type { Campagna, TipoCampionamento } from '../../../types'

interface CampagnaCreateInput {
  cantiere_id: string
  tipo_campionamento: string
  data_ora: string
  pin_tecnico: string
  pin_osservatore: string
  stato: Campagna['stato']
  strumento_id?: string | null
  tecnici_ids?: string[]
  sync_pending?: boolean
}

export interface CampagneRepo {
  list(cantiereId: string, tipoCampionamento: TipoCampionamento): Promise<Campagna[]>
  getById(id: string): Promise<Campagna | null>
  create(input: CampagnaCreateInput): Promise<Campagna>
  update(id: string, patch: Partial<Campagna>): Promise<Campagna>
  remove(id: string): Promise<void>
}

const CAMPAGNA_SELECT = 'id, cantiere_id, tipo_campionamento, data_ora, strumento_id, tecnici_ids, pin_tecnico, pin_osservatore, stato, sync_pending, created_at'

export const campagneRepo: CampagneRepo = {
  async list(cantiereId, tipoCampionamento) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('campagne')
        .select(CAMPAGNA_SELECT)
        .eq('cantiere_id', cantiereId)
        .eq('tipo_campionamento', tipoCampionamento)
        .order('data_ora', { ascending: false })
      if (error) throw new Error(error.message)
      const rows = (data ?? []) as Campagna[]
      void db.campagne.bulkPut(rows).catch(err =>
        console.warn('[campagneRepo.list] mirror Dexie failed', err)
      )
      return rows
    }
    const all = await db.campagne.where('cantiere_id').equals(cantiereId).toArray()
    return all
      .filter(c => c.tipo_campionamento === tipoCampionamento)
      .sort((a, b) => b.data_ora.localeCompare(a.data_ora))
  },

  async getById(id) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('campagne')
        .select(CAMPAGNA_SELECT)
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (data) {
        void db.campagne.put(data as Campagna).catch(err =>
          console.warn('[campagneRepo.getById] mirror Dexie failed', err)
        )
      }
      return (data as Campagna) ?? null
    }
    const local = await db.campagne.get(id)
    return local ?? null
  },

  async create(input) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('campagne')
        .insert(input)
        .select(CAMPAGNA_SELECT)
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Create campagna: nessun dato restituito da Supabase')
      void db.campagne.put(data as Campagna).catch(err =>
        console.warn('[campagneRepo.create] mirror Dexie failed', err)
      )
      return data as Campagna
    }
    const local: Campagna = {
      id: crypto.randomUUID(),
      cantiere_id: input.cantiere_id,
      tipo_campionamento: input.tipo_campionamento as TipoCampionamento,
      data_ora: input.data_ora,
      pin_tecnico: input.pin_tecnico,
      pin_osservatore: input.pin_osservatore,
      stato: input.stato,
      strumento_id: input.strumento_id ?? null,
      tecnici_ids: input.tecnici_ids ?? [],
      sync_pending: input.sync_pending ?? false,
      created_at: null,
    }
    await db.campagne.put(local)
    await enqueueSyncOperation('campagne', 'create', local.id, local)
    return local
  },

  async update(id, patch) {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('campagne')
        .update(patch)
        .eq('id', id)
        .select(CAMPAGNA_SELECT)
        .single()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Update campagna: nessun dato restituito da Supabase')
      void db.campagne.put(data as Campagna).catch(err =>
        console.warn('[campagneRepo.update] mirror Dexie failed', err)
      )
      return data as Campagna
    }
    const existing = await db.campagne.get(id)
    if (!existing) throw new Error(`Campagna ${id} non trovata in storage locale`)
    const updated: Campagna = { ...existing, ...patch }
    await db.campagne.put(updated)
    await enqueueSyncOperation('campagne', 'update', id, patch)
    return updated
  },

  async remove(id) {
    if (navigator.onLine) {
      const { error } = await supabase
        .from('campagne')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
      void db.campagne.delete(id).catch(err =>
        console.warn('[campagneRepo.remove] mirror Dexie failed', err)
      )
      return
    }
    await db.campagne.delete(id)
    await enqueueSyncOperation('campagne', 'delete', id, null)
  },
}
