import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Cantiere } from '../types'

interface UpdateCantiereInput {
  id: string
  nome?: string
  indirizzo?: string
  committente?: string | null
  stato?: Cantiere['stato']
}

interface UseUpdateCantiereResult {
  saving: boolean
  error: string | null
  updateCantiere: (input: UpdateCantiereInput) => Promise<Cantiere | null>
  resetError: () => void
}

export function useUpdateCantiere(): UseUpdateCantiereResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const updateCantiere = useCallback(
    async (input: UpdateCantiereInput): Promise<Cantiere | null> => {
      setSaving(true)
      setError(null)
      try {
        const payload: Record<string, string | null> = {}
        if (input.nome !== undefined) payload.nome = input.nome.trim()
        if (input.indirizzo !== undefined) payload.indirizzo = input.indirizzo.trim()
        if (input.committente !== undefined) payload.committente = input.committente
        if (input.stato !== undefined) payload.stato = input.stato

        if (Object.keys(payload).length === 0) {
          throw new Error('Nessun campo da aggiornare')
        }

        const { data, error: supabaseError } = await supabase
          .from('cantieri')
          .update(payload)
          .eq('id', input.id)
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

  return { saving, error, updateCantiere, resetError }
}
