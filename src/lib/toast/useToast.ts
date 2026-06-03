import { useEffect, useState } from 'react'
import type { ToastItem } from './types'
import { toastStore } from './toastApi'

export function useToastItems(): ToastItem[] {
  const [items, setItems] = useState<ToastItem[]>(() => toastStore.getSnapshot())
  useEffect(() => toastStore.subscribe(setItems), [])
  return items
}
