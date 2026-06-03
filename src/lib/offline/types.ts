export interface SyncQueueItem {
  id: string
  table: string
  operation: 'create' | 'update' | 'delete'
  record_id: string
  payload: unknown
  created_at: number
  retries: number
  last_error: string | null
}
