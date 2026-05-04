import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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

        const { data, error: supabaseError } = await supabase
          .from('cantieri')
          .insert(payload)
          .select('id, nome, indirizzo, committente, stato, created_at')
          .single()

        if (supabaseError) {
          throw new Error(supabaseError.message)
        }
        if (!data) {
          throw new Error('Nessun dato restituito dal server')
        }

        return data as Cantiere
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Errore sconosciuto'
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
