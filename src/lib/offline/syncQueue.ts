import { db } from './db'
import type { SyncQueueItem } from './types'

export async function enqueueSyncOperation(
  table: string,
  operation: 'create' | 'update' | 'delete',
  recordId: string,
  payload: unknown,
): Promise<void> {
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    table,
    operation,
    record_id: recordId,
    payload,
    created_at: Date.now(),
    retries: 0,
    last_error: null,
  }
  await db._sync_queue.put(item)
}
