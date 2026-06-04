import { useState, useCallback } from 'react'
import { misureRepo } from '../lib/offline'
import type { Misura } from '../types'

interface CreateMisuraInput {
  campagna_id: string
  dati: Record<string, unknown>
  note?: string
}

interface UseCreateMisuraResult {
  saving: boolean
  error: string | null
  createMisura: (input: CreateMisuraInput) => Promise<Misura | null>
  resetError: () => void
}

export function useCreateMisura(): UseCreateMisuraResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createMisura = useCallback(async (input: CreateMisuraInput): Promise<Misura | null> => {
    setSaving(true)
    setError(null)
    try {
      return await misureRepo.create({
        campagna_id: input.campagna_id,
        dati: input.dati,
        note: input.note,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return { saving, error, createMisura, resetError }
}
