import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Misura } from '../types'

interface UpdateMisuraInput {
  id: string
  dati?: Record<string, unknown>
  note?: string
}

interface UseUpdateMisuraResult {
  saving: boolean
  error: string | null
  updateMisura: (input: UpdateMisuraInput) => Promise<Misura | null>
  resetError: () => void
}

export function useUpdateMisura(): UseUpdateMisuraResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const updateMisura = useCallback(async (input: UpdateMisuraInput): Promise<Misura | null> => {
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      if (input.dati !== undefined) payload.dati = input.dati
      if (input.note !== undefined) payload.note = input.note

      if (Object.keys(payload).length === 0) {
        throw new Error('Nessun campo da aggiornare')
      }

      const { data, error: supabaseError } = await supabase
        .from('misure')
        .update(payload)
        .eq('id', input.id)
        .select('id, campagna_id, numero, dati, note, sync_pending, created_at')
        .single()

      if (supabaseError) throw new Error(supabaseError.message)
      if (!data) throw new Error('Nessun dato restituito dal server')

      return data as Misura
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return { saving, error, updateMisura, resetError }
}
