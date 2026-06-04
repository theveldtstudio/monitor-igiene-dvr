import { useState, useCallback } from 'react'
import { tecniciRepo } from '../lib/offline'
import type { Tecnico } from '../types'

interface CreateTecnicoInput {
  nome: string
  cognome: string
}

interface UseCreateTecnicoResult {
  saving: boolean
  error: string | null
  createTecnico: (input: CreateTecnicoInput) => Promise<Tecnico | null>
  resetError: () => void
}

export function useCreateTecnico(): UseCreateTecnicoResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createTecnico = useCallback(async (input: CreateTecnicoInput): Promise<Tecnico | null> => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        nome: input.nome.trim(),
        cognome: input.cognome.trim(),
      }
      return await tecniciRepo.create(payload)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return { saving, error, createTecnico, resetError }
}
