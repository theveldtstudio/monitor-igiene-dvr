import { useState, useEffect, useCallback } from 'react'
import { campagneRepo } from '../lib/offline'
import type { Campagna, TipoCampionamento } from '../types'

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
      const rows = await campagneRepo.list(cantiereId, tipoCampionamento as TipoCampionamento)
      setCampagne(rows)
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
