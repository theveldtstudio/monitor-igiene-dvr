export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  /** Durata in ms. 0 = persistente. */
  duration?: number
  /** id custom (default: generato) */
  id?: string
}

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
  createdAt: number
}

export type ToastListener = (toasts: ToastItem[]) => void
