import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Campagna } from '../types'

interface UseCampagneResult {
  campagne: Campagna[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCampagne(cantiereId: string | undefined, tipoCampionamento: string | undefined): UseCampagneResult {
  const [campagne, setCampagne] = useState<Campagna[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampagne = useCallback(async () => {
    if (!cantiereId || !tipoCampionamento) {
      setLoading(false)
      setCampagne([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: supabaseError } = await supabase
        .from('campagne')
        .select('id, cantiere_id, tipo_campionamento, data_ora, strumento_id, tecnici_ids, pin_tecnico, pin_osservatore, stato, sync_pending, created_at')
        .eq('cantiere_id', cantiereId)
        .eq('tipo_campionamento', tipoCampionamento)
        .order('data_ora', { ascending: false })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      setCampagne((data ?? []) as Campagna[])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setCampagne([])
    } finally {
      setLoading(false)
    }
  }, [cantiereId, tipoCampionamento])

  useEffect(() => {
    fetchCampagne()
  }, [fetchCampagne])

  return { campagne, loading, error, refetch: fetchCampagne }
}
