import { syncPendingOperations } from './syncExecutor'
import { pullFromCloud } from './pullExecutor'
import { queryClient } from '../queryClient'

let listenerRegistered = false
// Orchestration guard: prevents concurrent drain→pull sequences.
let syncRunning = false

async function runFullSync(): Promise<void> {
  if (syncRunning) return
  syncRunning = true

  try {
    try {
      await syncPendingOperations()
    } catch (err) {
      console.error('[initSync] drain failed:', err)
      // Continue to pull: pullFromCloud has its own onLine guard.
    }

    try {
      await pullFromCloud()
    } catch (err) {
      console.error('[initSync] pull failed:', err)
    }
  } finally {
    syncRunning = false
  }
}

/**
 * Aggancia il drain completo della coda offline (dati + foto) seguito dal pull
 * cloud→locale al rientro online e all'avvio app.
 * Guard HMR-safe: listener registrati una sola volta.
 * Ordine garantito: drain risolve prima che pull parta (await sequenziale).
 */
export function initOfflineSync(): void {
  if (listenerRegistered) return
  listenerRegistered = true

  window.addEventListener('online', () => {
    void runFullSync()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      void runFullSync()
    }
  })

  window.addEventListener('pull-completed', () => {
    void queryClient.invalidateQueries()
  })

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    void runFullSync()
  }
}
