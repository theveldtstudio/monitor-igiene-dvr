import { useState, useCallback } from 'react'
import { campagneRepo } from '../lib/offline'

interface UseDeleteCampagnaResult {
  deleting: boolean
  error: string | null
  deleteCampagna: (id: string) => Promise<boolean>
  resetError: () => void
}

export function useDeleteCampagna(): UseDeleteCampagnaResult {
  const [deleting, setDeleting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const deleteCampagna = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true)
    setError(null)
    try {
      await campagneRepo.remove(id)
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return { deleting, error, deleteCampagna, resetError }
}
