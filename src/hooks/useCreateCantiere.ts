import { useState, useCallback } from 'react'
import { cantieriRepo } from '../lib/offline'
import { humanizeError } from '../lib/humanizeError'
import { toast } from '../lib/toast/toastApi'
import type { Cantiere } from '../types'

interface CreateCantiereInput {
  nome: string
  indirizzo: string
  committente: string | null
}

interface UseCreateCantiereResult {
  saving: boolean
  error: string | null
  createCantiere: (input: CreateCantiereInput) => Promise<Cantiere | null>
  resetError: () => void
}

export function useCreateCantiere(): UseCreateCantiereResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createCantiere = useCallback(
    async (input: CreateCantiereInput): Promise<Cantiere | null> => {
      setSaving(true)
      setError(null)
      try {
        const payload = {
          nome: input.nome.trim(),
          indirizzo: input.indirizzo.trim(),
          committente: input.committente,
          stato: 'aperto' as const,
        }

        const data = await cantieriRepo.create(payload)
        return data
      } catch (e) {
        const message = humanizeError(e)
        toast.error(message)
        setError(message)
        return null
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return { saving, error, createCantiere, resetError }
}
