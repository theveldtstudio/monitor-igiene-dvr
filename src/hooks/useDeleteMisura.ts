import { useState, useCallback } from 'react'
import { misureRepo } from '../lib/offline'
import { humanizeError } from '../lib/humanizeError'
import { toast } from '../lib/toast/toastApi'

interface UseDeleteMisuraResult {
  deleting: boolean
  error: string | null
  deleteMisura: (id: string) => Promise<boolean>
  resetError: () => void
}

export function useDeleteMisura(): UseDeleteMisuraResult {
  const [deleting, setDeleting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const deleteMisura = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true)
    setError(null)
    try {
      await misureRepo.remove(id)
      return true
    } catch (e) {
      const message = humanizeError(e)
      toast.error(message)
      setError(message)
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return { deleting, error, deleteMisura, resetError }
}
