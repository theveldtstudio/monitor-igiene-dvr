import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Cantiere } from '../types'

interface UseCantieriResult {
  cantieri: Cantiere[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCantieri(): UseCantieriResult {
  const [cantieri, setCantieri] = useState<Cantiere[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCantieri = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: supabaseError } = await supabase
        .from('cantieri')
        .select('id, nome, indirizzo, committente, stato, created_at')
        .order('created_at', { ascending: false })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      setCantieri((data ?? []) as Cantiere[])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setCantieri([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCantieri()
  }, [fetchCantieri])

  return {
    cantieri,
    loading,
    error,
    refetch: fetchCantieri,
  }
}
