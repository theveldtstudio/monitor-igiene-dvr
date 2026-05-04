import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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

      const { data, error: supabaseError } = await supabase
        .from('tecnici')
        .insert(payload)
        .select('id, nome, cognome, created_at')
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      if (!data) {
        throw new Error('Nessun dato restituito dal server')
      }

      return data as Tecnico
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
