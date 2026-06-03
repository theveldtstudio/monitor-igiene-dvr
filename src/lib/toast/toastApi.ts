import type { ToastItem, ToastListener, ToastOptions, ToastType } from './types'
import { DEFAULT_DURATION } from './styles'

let items: ToastItem[] = []
const listeners = new Set<ToastListener>()

function notify() {
  listeners.forEach(l => l([...items]))
}

function genId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function push(type: ToastType, message: string, opts?: ToastOptions): string {
  const id = opts?.id ?? genId()
  const duration = opts?.duration ?? DEFAULT_DURATION[type]
  items = items.filter(t => t.id !== id)
  items.push({ id, type, message, duration, createdAt: Date.now() })
  notify()
  return id
}

function dismiss(id: string): void {
  items = items.filter(t => t.id !== id)
  notify()
}

function clear(): void {
  items = []
  notify()
}

export const toastStore = {
  subscribe(l: ToastListener): () => void {
    listeners.add(l)
    l([...items])
    return () => { listeners.delete(l) }
  },
  getSnapshot(): ToastItem[] {
    return [...items]
  },
}

export const toast = {
  success: (msg: string, opts?: ToastOptions) => push('success', msg, opts),
  error:   (msg: string, opts?: ToastOptions) => push('error',   msg, opts),
  warning: (msg: string, opts?: ToastOptions) => push('warning', msg, opts),
  info:    (msg: string, opts?: ToastOptions) => push('info',    msg, opts),
  dismiss,
  clear,
}
