import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Cantiere, Campagna, Misura, FotoMisura, RisorsaCantiere, Tecnico, Strumento } from '../../types'
import type { SyncQueueItem, FotoBlobLocale } from './types'

class MonitorIgieneDB extends Dexie {
  cantieri!: Table<Cantiere, string>
  campagne!: Table<Campagna, string>
  misure!: Table<Misura, string>
  foto_misura!: Table<FotoMisura, string>
  risorse_cantiere!: Table<RisorsaCantiere, string>
  tecnici!: Table<Tecnico, string>
  strumenti!: Table<Strumento, string>
  _sync_queue!: Table<SyncQueueItem, string>
  foto_blobs!: Table<FotoBlobLocale, string>

  constructor() {
    super('MonitorIgiene')
    this.version(1).stores({
      cantieri: 'id',
      campagne: 'id, cantiere_id',
      misure: 'id, campagna_id',
      foto_misura: 'id, misura_id',
      risorse_cantiere: 'id, cantiere_id, [cantiere_id+tipo]',
      tecnici: 'id',
      strumenti: 'id',
      _sync_queue: 'id, created_at',
    })
    this.version(2).stores({
      cantieri: 'id',
      campagne: 'id, cantiere_id',
      misure: 'id, campagna_id',
      foto_misura: 'id, misura_id',
      risorse_cantiere: 'id, cantiere_id, [cantiere_id+tipo]',
      tecnici: 'id',
      strumenti: 'id',
      _sync_queue: 'id, created_at',
      foto_blobs: 'id, misura_id',
    })
    this.version(3).stores({
      cantieri: 'id',
      campagne: 'id, cantiere_id',
      misure: 'id, campagna_id',
      foto_misura: 'id, misura_id',
      risorse_cantiere: 'id, cantiere_id, [cantiere_id+tipo]',
      tecnici: 'id',
      strumenti: 'id',
      _sync_queue: 'id, created_at, table',
      foto_blobs: 'id, misura_id',
    })
  }
}

export const db = new MonitorIgieneDB()
