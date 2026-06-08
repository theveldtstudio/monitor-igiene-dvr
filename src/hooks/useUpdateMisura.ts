import { useState, useCallback } from 'react'
import { misureRepo } from '../lib/offline'
import { humanizeError } from '../lib/humanizeError'
import { toast } from '../lib/toast/toastApi'
import type { Misura } from '../types'

interface UpdateMisuraInput {
  id: string
  dati?: Record<string, unknown>
  note?: string
}

interface UseUpdateMisuraResult {
  saving: boolean
  error: string | null
  updateMisura: (input: UpdateMisuraInput) => Promise<Misura | null>
  resetError: () => void
}

export function useUpdateMisura(): UseUpdateMisuraResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const updateMisura = useCallback(async (input: UpdateMisuraInput): Promise<Misura | null> => {
    setSaving(true)
    setError(null)
    try {
      const patch: Partial<Misura> = {}
      if (input.dati !== undefined) patch.dati = input.dati
      if (input.note !== undefined) patch.note = input.note

      if (Object.keys(patch).length === 0) {
        throw new Error('Nessun campo da aggiornare')
      }

      return await misureRepo.update(input.id, patch)
    } catch (e) {
      if (e instanceof Error && e.message === 'Nessun campo da aggiornare') {
        setError(e.message)
        return null
      }
      const message = humanizeError(e)
      toast.error(message)
      setError(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return { saving, error, updateMisura, resetError }
}
