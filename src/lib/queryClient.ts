import { QueryClient } from '@tanstack/react-query'

// Istanza condivisa del QueryClient.
// Estratta da main.tsx per essere importabile da codice non-React
// (es. fotoSyncExecutor) che deve invalidare query dopo upload.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      networkMode: 'offlineFirst',
    },
  },
})
