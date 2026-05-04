import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Misura } from '../types'

interface UseMisureResult {
  misure: Misura[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMisure(campagnaId: string | undefined): UseMisureResult {
  const [misure, setMisure] = useState<Misura[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMisure = useCallback(async () => {
    if (!campagnaId) {
      setLoading(false)
      setMisure([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: supabaseError } = await supabase
        .from('misure')
        .select('id, campagna_id, numero, dati, note, sync_pending, created_at')
        .eq('campagna_id', campagnaId)
        .order('numero', { ascending: true })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      setMisure((data ?? []) as Misura[])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setMisure([])
    } finally {
      setLoading(false)
    }
  }, [campagnaId])

  useEffect(() => {
    fetchMisure()
  }, [fetchMisure])

  return { misure, loading, error, refetch: fetchMisure }
}
