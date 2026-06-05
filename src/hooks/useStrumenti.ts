import { useState, useEffect, useCallback } from 'react'
import { strumentiRepo } from '../lib/offline'
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
      const rows = await strumentiRepo.list()
      setStrumenti(rows)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setStrumenti([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStrumenti()
  }, [fetchStrumenti])

  return { strumenti, loading, error, refetch: fetchStrumenti }
}
