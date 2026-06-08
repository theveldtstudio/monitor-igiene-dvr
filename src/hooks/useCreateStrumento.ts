import { useState, useCallback } from 'react'
import { strumentiRepo } from '../lib/offline'
import { humanizeError } from '../lib/humanizeError'
import { toast } from '../lib/toast/toastApi'
import type { Strumento } from '../types'

interface CreateStrumentoInput {
  nome: string
  modello: string
  matricola: string
}

interface UseCreateStrumentoResult {
  saving: boolean
  error: string | null
  createStrumento: (input: CreateStrumentoInput) => Promise<Strumento | null>
  resetError: () => void
}

export function useCreateStrumento(): UseCreateStrumentoResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createStrumento = useCallback(async (input: CreateStrumentoInput): Promise<Strumento | null> => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        nome: input.nome.trim(),
        modello: input.modello.trim(),
        matricola: input.matricola.trim(),
      }
      return await strumentiRepo.create(payload)
    } catch (e) {
      const message = humanizeError(e)
      toast.error(message)
      setError(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return { saving, error, createStrumento, resetError }
}
