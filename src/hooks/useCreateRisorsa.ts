import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RisorsaCantiere, TipoRisorsa } from '../types'

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
        throw new Error('Il nome deve contenere almeno 2 caratteri')
      }

      // Controllo duplicato app-side (DB non ha UNIQUE)
      if (input.esistenti) {
        const valoreLower = valoreTrimmed.toLowerCase()
        const dup = input.esistenti.find((r) => r.valore.trim().toLowerCase() === valoreLower)
        if (dup) {
          const labelTipo = labelDelTipo(input.tipo)
          throw new Error(`Esiste già ${labelTipo} con il nome "${dup.valore}"`)
        }
      }

      const payload = {
        cantiere_id: input.cantiere_id,
        tipo: input.tipo,
        valore: valoreTrimmed,
      }

      const { data, error: supabaseError } = await supabase
        .from('risorse_cantiere')
        .insert(payload)
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

  return { saving, error, createRisorsa, resetError }
}

function labelDelTipo(tipo: TipoRisorsa): string {
  if (tipo === 'macchina') return 'una macchina'
  if (tipo === 'fase') return 'una fase'
  return 'una postazione'
}
