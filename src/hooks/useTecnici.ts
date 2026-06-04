import { useState, useEffect, useCallback } from 'react'
import { tecniciRepo } from '../lib/offline'
import type { Tecnico } from '../types'

interface UseTecniciResult {
  tecnici: Tecnico[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTecnici(): UseTecniciResult {
  const [tecnici, setTecnici] = useState<Tecnico[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTecnici = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await tecniciRepo.list()
      setTecnici(rows)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      setTecnici([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTecnici()
  }, [fetchTecnici])

  return { tecnici, loading, error, refetch: fetchTecnici }
}
