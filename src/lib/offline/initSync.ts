import { syncPendingFoto } from './fotoSyncExecutor'

// RISCHIO 3: il listener 'online' va registrato UNA sola volta, anche se
// questo modulo venisse importato/valutato più volte (HMR, doppio import).
let listenerRegistered = false

/**
 * Aggancia il drain delle foto pending:
 * - al rientro online (evento 'online'), una sola registrazione;
 * - all'avvio app, se siamo già online (caso "chiusa offline con coda, riaperta online").
 * Fuori da React: non dipende dal mount di alcun componente, nessun duplicato
 * del listener di useOnlineStatus (quello serve solo alla UI dell'OfflineBanner).
 */
export function initFotoSync(): void {
  if (listenerRegistered) return
  listenerRegistered = true

  window.addEventListener('online', () => {
    void syncPendingFoto()
  })

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    void syncPendingFoto()
  }
}
