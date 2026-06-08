import { useState, useCallback } from 'react'
import { risorseCantiereRepo } from '../lib/offline'
import { humanizeError } from '../lib/humanizeError'
import { toast } from '../lib/toast/toastApi'
import type { RisorsaCantiere, TipoRisorsa } from '../types'

const VALIDATION = Symbol('validation')

interface CreateRisorsaInput {
  cantiere_id: string
  tipo: TipoRisorsa
  valore: string
  esistenti?: RisorsaCantiere[]
}

interface UseCreateRisorsaResult {
  saving: boolean
  error: string | null
  createRisorsa: (input: CreateRisorsaInput) => Promise<RisorsaCantiere | null>
  resetError: () => void
}

export function useCreateRisorsa(): UseCreateRisorsaResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createRisorsa = useCallback(async (input: CreateRisorsaInput): Promise<RisorsaCantiere | null> => {
    setSaving(true)
    setError(null)
    try {
      const valoreTrimmed = input.valore.trim()
      if (valoreTrimmed.length < 2) {
        throw Object.assign(new Error('Il nome deve contenere almeno 2 caratteri'), { [VALIDATION]: true })
      }

      // Controllo duplicato app-side (DB non ha UNIQUE)
      if (input.esistenti) {
        const valoreLower = valoreTrimmed.toLowerCase()
        const dup = input.esistenti.find((r) => r.valore.trim().toLowerCase() === valoreLower)
        if (dup) {
          const labelTipo = labelDelTipo(input.tipo)
          throw Object.assign(new Error(`Esiste già ${labelTipo} con il nome "${dup.valore}"`), { [VALIDATION]: true })
        }
      }

      const payload = {
        cantiere_id: input.cantiere_id,
        tipo: input.tipo,
        valore: valoreTrimmed,
      }
      return await risorseCantiereRepo.create(payload)
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

  return { saving, error, createRisorsa, resetError }
}

function labelDelTipo(tipo: TipoRisorsa): string {
  if (tipo === 'macchina') return 'una macchina'
  if (tipo === 'fase') return 'una fase'
  return 'una postazione'
}
