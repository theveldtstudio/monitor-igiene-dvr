import { useState, useEffect, useCallback } from 'react'
import { misureRepo } from '../lib/offline'
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
      const rows = await misureRepo.list(campagnaId)
      setMisure(rows)
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
