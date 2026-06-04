import { useState, useEffect, useCallback } from 'react'
import { risorseCantiereRepo } from '../lib/offline'
import type { RisorsaCantiere, TipoRisorsa } from '../types'

interface UseRisorseCantiereResult {
  risorse: RisorsaCantiere[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useRisorseCantiere(cantiereId: string | undefined, tipo: TipoRisorsa | undefined): UseRisorseCantiereResult {
  const [risorse, setRisorse] = useState<RisorsaCantiere[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRisorse = useCallback(async () => {
    if (!cantiereId || !tipo) {
      setLoading(false)
      setRisorse([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await risorseCantiereRepo.list(cantiereId, tipo)
      setRisorse(rows)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setRisorse([])
    } finally {
      setLoading(false)
    }
  }, [cantiereId, tipo])

  useEffect(() => {
    fetchRisorse()
  }, [fetchRisorse])

  return { risorse, loading, error, refetch: fetchRisorse }
}
