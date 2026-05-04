import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Campagna } from '../types'

interface CreateCampagnaInput {
  cantiere_id: string
  tipo_campionamento: string
  data_ora: string
}

interface UseCreateCampagnaResult {
  saving: boolean
  error: string | null
  createCampagna: (input: CreateCampagnaInput) => Promise<Campagna | null>
  resetError: () => void
}

export function useCreateCampagna(): UseCreateCampagnaResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createCampagna = useCallback(async (input: CreateCampagnaInput): Promise<Campagna | null> => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        cantiere_id: input.cantiere_id,
        tipo_campionamento: input.tipo_campionamento,
        data_ora: input.data_ora,
        pin_tecnico: '',
        pin_osservatore: '',
        stato: 'bozza' as const,
      }

      const { data, error: supabaseError } = await supabase
        .from('campagne')
        .insert(payload)
        .select('id, cantiere_id, tipo_campionamento, data_ora, strumento_id, tecnici_ids, pin_tecnico, pin_osservatore, stato, sync_pending, created_at')
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      if (!data) {
        throw new Error('Nessun dato restituito dal server')
      }

      return data as Campagna
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

  return { saving, error, createCampagna, resetError }
}
