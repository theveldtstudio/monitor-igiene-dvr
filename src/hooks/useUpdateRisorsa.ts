import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RisorsaCantiere } from '../types'

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
        throw new Error('Il nome deve contenere almeno 2 caratteri')
      }

      // Duplicato (escludendo se stesso)
      if (input.esistenti) {
        const valoreLower = valoreTrimmed.toLowerCase()
        const dup = input.esistenti.find((r) => r.id !== input.id && r.valore.trim().toLowerCase() === valoreLower)
        if (dup) {
          throw new Error(`Esiste già un altro elemento con il nome "${dup.valore}"`)
        }
      }

      const { data, error: supabaseError } = await supabase
        .from('risorse_cantiere')
        .update({ valore: valoreTrimmed })
        .eq('id', input.id)
        .select('id, cantiere_id, tipo, valore, created_at')
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      if (!data) {
        throw new Error('Nessun dato restituito dal server')
      }

      return data as RisorsaCantiere
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

  return { saving, error, updateRisorsa, resetError }
}
