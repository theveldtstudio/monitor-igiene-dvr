import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Campagna } from '../types'

interface UseCampagnaResult {
  campagna: Campagna | null
  loading: boolean
  error: string | null
  notFound: boolean
  refetch: () => Promise<void>
}

export function useCampagna(id: string | undefined): UseCampagnaResult {
  const [campagna, setCampagna] = useState<Campagna | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState<boolean>(false)

  const fetchCampagna = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const { data, error: supabaseError } = await supabase
        .from('campagne')
        .select('id, cantiere_id, tipo_campionamento, data_ora, strumento_id, tecnici_ids, pin_tecnico, pin_osservatore, stato, sync_pending, created_at')
        .eq('id', id)
        .maybeSingle()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      if (!data) {
        setNotFound(true)
        setCampagna(null)
        return
      }
      setCampagna(data as Campagna)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setCampagna(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCampagna()
  }, [fetchCampagna])

  return { campagna, loading, error, notFound, refetch: fetchCampagna }
}
