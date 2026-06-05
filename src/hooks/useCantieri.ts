import { useState, useEffect, useCallback } from 'react'
import { cantieriRepo } from '../lib/offline'
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
      const data = await cantieriRepo.list()
      setCantieri(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setCantieri([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCantieri()
  }, [fetchCantieri])

  return {
    cantieri,
    loading,
    error,
    refetch: fetchCantieri,
  }
}
