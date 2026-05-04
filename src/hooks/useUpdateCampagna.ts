import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Campagna } from '../types'

interface UpdateCampagnaInput {
  id: string
  data_ora?: string
  tecnici_ids?: string[]
  strumento_id?: string | null
  stato?: Campagna['stato']
}

interface UseUpdateCampagnaResult {
  saving: boolean
  error: string | null
  updateCampagna: (input: UpdateCampagnaInput) => Promise<Campagna | null>
  resetError: () => void
}

export function useUpdateCampagna(): UseUpdateCampagnaResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const updateCampagna = useCallback(async (input: UpdateCampagnaInput): Promise<Campagna | null> => {
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      if (input.data_ora !== undefined) payload.data_ora = input.data_ora
      if (input.tecnici_ids !== undefined) payload.tecnici_ids = input.tecnici_ids
      if (input.strumento_id !== undefined) payload.strumento_id = input.strumento_id
      if (input.stato !== undefined) payload.stato = input.stato

      if (Object.keys(payload).length === 0) {
        throw new Error('Nessun campo da aggiornare')
      }

      const { data, error: supabaseError } = await supabase
        .from('campagne')
        .update(payload)
        .eq('id', input.id)
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

  return { saving, error, updateCampagna, resetError }
}
