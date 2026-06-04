import { syncPendingOperations } from './syncExecutor'

let listenerRegistered = false

/**
 * Aggancia il drain completo della coda offline (misure + foto) al rientro
 * online e all'avvio app. Guard HMR-safe: il listener è registrato una sola volta.
 */
export function initOfflineSync(): void {
  if (listenerRegistered) return
  listenerRegistered = true

  window.addEventListener('online', () => {
    void syncPendingOperations()
  })

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    void syncPendingOperations()
  }
}
