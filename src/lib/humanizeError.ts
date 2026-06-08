// Converte un errore qualsiasi (unknown) in un messaggio italiano leggibile per
// l'utente finale (RSPP non tecnico). Mai esporre code/message grezzi di
// Postgres/Supabase. Funzione difensiva: input unknown, non lancia mai.

const MSG = {
  offline: 'Sei offline. Controlla la connessione e riprova.',
  duplicato: 'Esiste già un elemento con questi dati.',
  collegato: "Operazione non consentita: l'elemento è collegato ad altri dati.",
  recupero: 'Errore nel recupero dei dati. Riprova.',
  sessione: 'Sessione scaduta. Ricarica la pagina.',
  server: 'Errore del server. Riprova tra qualche istante.',
  nonTrovato: 'Elemento non trovato.',
  connessione: 'Errore di connessione. Riprova.',
  annullato: 'Operazione annullata.',
  generico: 'Si è verificato un errore. Riprova.',
} as const

function isRecord(e: unknown): e is Record<string, unknown> {
  return typeof e === 'object' && e !== null
}

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === 'string' ? v : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key]
  return typeof v === 'number' ? v : undefined
}

// Estrae uno status HTTP numerico da e.status / e.statusCode (anche annidati).
function extractStatus(obj: Record<string, unknown>): number | undefined {
  return getNumber(obj, 'status') ?? getNumber(obj, 'statusCode')
}

function looksLikeSession(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('jwt') || m.includes('token') || m.includes('session')
}

export function humanizeError(e: unknown): string {
  // 1. OFFLINE
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return MSG.offline
  }

  // 2. ERRORE SUPABASE/POSTGREST (oggetto con 'code' string e/o 'message')
  if (isRecord(e)) {
    const code = getString(e, 'code')
    const message = getString(e, 'message')

    if (code !== undefined || message !== undefined) {
      if (message !== undefined && looksLikeSession(message)) {
        return MSG.sessione
      }
      if (code === '23505') return MSG.duplicato
      if (code === '23503') return MSG.collegato
      if (code !== undefined && code.startsWith('PGRST')) return MSG.recupero
      // altri code noti/ignoti: prosegui verso status/fallback senza esporre il code
    }
  }

  // 3. ERRORE HTTP con status numerico
  if (isRecord(e)) {
    const status = extractStatus(e)
    if (status !== undefined) {
      if (status >= 500) return MSG.server
      if (status === 401 || status === 403) return MSG.sessione
      if (status === 404) return MSG.nonTrovato
      if (status >= 400) return MSG.generico
    }
  }

  // 4. ERRORE DI RETE
  if (e instanceof Error) {
    const m = e.message.toLowerCase()
    if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
      return MSG.connessione
    }
  }

  // 5. ABORT
  if (e instanceof Error && e.name === 'AbortError') {
    return MSG.annullato
  }

  // 6. FALLBACK
  return MSG.generico
}
