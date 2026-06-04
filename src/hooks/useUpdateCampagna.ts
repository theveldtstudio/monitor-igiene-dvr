import { useState, useCallback } from 'react'
import { campagneRepo } from '../lib/offline'
import type { Campagna } from '../types'

interface UpdateCampagnaInput {
  id: string
  data_ora?: string
  tecnici_ids?: string[]
  strumento_id?: string | null
  stato?: Campagna['stato']
}

interface UseUpdateCampagnaResult {
  saving: boolean
  error: string | null
  updateCampagna: (input: UpdateCampagnaInput) => Promise<Campagna | null>
  resetError: () => void
}

export function useUpdateCampagna(): UseUpdateCampagnaResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const updateCampagna = useCallback(async (input: UpdateCampagnaInput): Promise<Campagna | null> => {
    setSaving(true)
    setError(null)
    try {
      const patch: Partial<Campagna> = {}
      if (input.data_ora !== undefined) patch.data_ora = input.data_ora
      if (input.tecnici_ids !== undefined) patch.tecnici_ids = input.tecnici_ids
      if (input.strumento_id !== undefined) patch.strumento_id = input.strumento_id
      if (input.stato !== undefined) patch.stato = input.stato

      if (Object.keys(patch).length === 0) {
        throw new Error('Nessun campo da aggiornare')
      }

      return await campagneRepo.update(input.id, patch)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return { saving, error, updateCampagna, resetError }
}
