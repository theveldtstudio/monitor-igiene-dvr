import { useState, useEffect, useCallback } from 'react'
import { campagneRepo } from '../lib/offline'
import type { Campagna } from '../types'

interface UseCampagnaResult {
  campagna: Campagna | null
  loading: boolean
  error: string | null
  notFound: boolean
  refetch: () => Promise<void>
}

export function useCampagna(id: string | undefined): UseCampagnaResult {
  const [campagna, setCampagna] = useState<Campagna | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState<boolean>(false)

  const fetchCampagna = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await campagneRepo.getById(id)
      if (!data) {
        setNotFound(true)
        setCampagna(null)
        return
      }
      setCampagna(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setCampagna(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCampagna()
  }, [fetchCampagna])

  return { campagna, loading, error, notFound, refetch: fetchCampagna }
}
