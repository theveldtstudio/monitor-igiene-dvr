import { useQuery } from '@tanstack/react-query'
import { risorseCantiereRepo } from '../lib/offline'
import type { RisorsaCantiere, TipoRisorsa } from '../types'

interface UseRisorseCantiereResult {
  risorse: RisorsaCantiere[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useRisorseCantiere(cantiereId: string | undefined, tipo: TipoRisorsa | undefined): UseRisorseCantiereResult {
  const query = useQuery({
    queryKey: ['risorse', cantiereId, tipo],
    enabled: !!cantiereId && !!tipo,
    queryFn: () => risorseCantiereRepo.list(cantiereId!, tipo!),
  })

  return {
    risorse: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error != null ? String(query.error) : null,
    refetch: async () => { await query.refetch() },
  }
}
