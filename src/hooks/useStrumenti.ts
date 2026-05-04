import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Strumento } from '../types'

interface UseStrumentiResult {
  strumenti: Strumento[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useStrumenti(): UseStrumentiResult {
  const [strumenti, setStrumenti] = useState<Strumento[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStrumenti = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: supabaseError } = await supabase
        .from('strumenti')
        .select('id, nome, modello, matricola, created_at')
        .order('nome', { ascending: true })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      setStrumenti((data ?? []) as Strumento[])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setStrumenti([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStrumenti()
  }, [fetchStrumenti])

  return { strumenti, loading, error, refetch: fetchStrumenti }
}
