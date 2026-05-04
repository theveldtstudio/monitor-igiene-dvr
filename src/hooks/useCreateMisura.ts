import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Misura } from '../types'

interface CreateMisuraInput {
  campagna_id: string
  dati: Record<string, unknown>
  note?: string
}

interface UseCreateMisuraResult {
  saving: boolean
  error: string | null
  createMisura: (input: CreateMisuraInput) => Promise<Misura | null>
  resetError: () => void
}

export function useCreateMisura(): UseCreateMisuraResult {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const createMisura = useCallback(async (input: CreateMisuraInput): Promise<Misura | null> => {
    setSaving(true)
    setError(null)
    try {
      const { data: existing, error: maxErr } = await supabase
        .from('misure')
        .select('numero')
        .eq('campagna_id', input.campagna_id)
        .order('numero', { ascending: false })
        .limit(1)

      if (maxErr) throw new Error(maxErr.message)
      const prossimoNumero = (existing && existing.length > 0 ? (existing[0] as { numero: number }).numero : 0) + 1

      const payload = {
        campagna_id: input.campagna_id,
        numero: prossimoNumero,
        dati: input.dati,
        note: input.note ?? '',
      }

      const { data, error: insertErr } = await supabase
        .from('misure')
        .insert(payload)
        .select('id, campagna_id, numero, dati, note, sync_pending, created_at')
        .single()

      if (insertErr) throw new Error(insertErr.message)
      if (!data) throw new Error('Nessun dato restituito dal server')

      return data as Misura
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Errore sconosciuto'
      setError(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return { saving, error, createMisura, resetError }
}
