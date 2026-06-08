import { useState, useCallback } from 'react'
import { risorseCantiereRepo } from '../lib/offline'
import { humanizeError } from '../lib/humanizeError'
import { toast } from '../lib/toast/toastApi'
import type { RisorsaCantiere } from '../types'

const VALIDATION = Symbol('validation')

interface UpdateRisorsaInput {
  id: string
  valore: string
  esistenti?: RisorsaCantiere[]
}

interface UseUpdateRisorsaResult {
  saving: boolean
  error: string | null
  updateRisorsa: (input: UpdateRisorsaInput) => Promise<RisorsaCantiere | null>
  resetError: () => void
}

export function useUpdateRisorsa(): UseUpdateRisorsaResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const updateRisorsa = useCallback(async (input: UpdateRisorsaInput): Promise<RisorsaCantiere | null> => {
    setSaving(true)
    setError(null)
    try {
      const valoreTrimmed = input.valore.trim()
      if (valoreTrimmed.length < 2) {
        throw Object.assign(new Error('Il nome deve contenere almeno 2 caratteri'), { [VALIDATION]: true })
      }

      // Duplicato (escludendo se stesso)
      if (input.esistenti) {
        const valoreLower = valoreTrimmed.toLowerCase()
        const dup = input.esistenti.find((r) => r.id !== input.id && r.valore.trim().toLowerCase() === valoreLower)
        if (dup) {
          throw Object.assign(new Error(`Esiste già un altro elemento con il nome "${dup.valore}"`), { [VALIDATION]: true })
        }
      }

      return await risorseCantiereRepo.update(input.id, { valore: valoreTrimmed })
    } catch (e) {
      // errore di validazione: solo inline, niente toast
      if (e instanceof Error && (e as unknown as Record<symbol, unknown>)[VALIDATION] === true) {
        setError(e.message)
        return null
      }
      // errore CRUD reale: toast + inline humanizzati
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

  return { saving, error, updateRisorsa, resetError }
}
