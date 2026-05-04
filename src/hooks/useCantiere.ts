import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Cantiere } from '../types'

interface UseCantiereResult {
  cantiere: Cantiere | null
  loading: boolean
  error: string | null
  notFound: boolean
  refetch: () => Promise<void>
}

export function useCantiere(id: string | undefined): UseCantiereResult {
  const [cantiere, setCantiere] = useState<Cantiere | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState<boolean>(false)

  const fetchCantiere = useCallback(async () => {
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
        .from('cantieri')
        .select('id, nome, indirizzo, committente, stato, created_at')
        .eq('id', id)
        .maybeSingle()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      if (!data) {
        setNotFound(true)
        setCantiere(null)
        return
      }
      setCantiere(data as Cantiere)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setCantiere(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCantiere()
  }, [fetchCantiere])

  return { cantiere, loading, error, notFound, refetch: fetchCantiere }
}
