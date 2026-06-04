import { useState, useCallback } from 'react'
import { risorseCantiereRepo } from '../lib/offline'

interface UseDeleteRisorsaResult {
  deleting: boolean
  error: string | null
  deleteRisorsa: (id: string) => Promise<boolean>
  resetError: () => void
}

export function useDeleteRisorsa(): UseDeleteRisorsaResult {
  const [deleting, setDeleting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const deleteRisorsa = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true)
    setError(null)
    try {
      await risorseCantiereRepo.remove(id)
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return { deleting, error, deleteRisorsa, resetError }
}
