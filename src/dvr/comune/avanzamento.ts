/**
 * Tempi per metro lineare di avanzamento nello scavo tradizionale (come nei DVR Castagnola): durata
 * media di ogni fase per metro con esplosivo e con martellone, e metri scavati nel periodo. Sono dati
 * forniti dalla direzione di cantiere, salvati in `contenuti.avanzamento` e scritti in tutti i DVR
 * dopo il ciclo di lavoro (blocco {#conAvanzamento} dei template).
 */
import { formattaIt } from './numeri'

export type MetodoScavo = 'esplosivo' | 'martellone'

export interface FaseAvanzamento {
  fase: string
  /** minuti per metro lineare */
  esplosivo: number | null
  martellone: number | null
}

export interface ProduzioneAvanzamento {
  metodo: MetodoScavo
  metri: number | null
  giorni: number | null
}

export interface Avanzamento {
  fasi: FaseAvanzamento[]
  produzione: ProduzioneAvanzamento[]
  /** periodo della produzione (es. "Gennaio – Dicembre 2025"); vuoto = periodo di riferimento */
  periodo?: string
}

/** Fasi del ciclo di avanzamento dei DVR Castagnola (i tempi si scrivono per ogni cantiere). */
export const FASI_AVANZAMENTO: string[] = ['Perforazione', 'Caricamento volata', 'Volata + sfumo', 'Disgaggio/Scavo', 'Smarino', 'Pre-spritz/spritz', 'Posa centina']

const num = (x: number | null | undefined, d = 0) => {
  if (x == null || !Number.isFinite(x)) return '/'
  const [intera, dec] = formattaIt(x, d).split(',')
  return intera.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (dec ? `,${dec}` : '')
}
const decimali = (x: number) => (Number.isInteger(x) ? 0 : 1)

/** Minuti totali per metro con il metodo (fasi con un tempo). */
export function totaleMetro(a: Avanzamento, m: MetodoScavo): number | null {
  const xs = a.fasi.map((f) => f[m]).filter((x): x is number => x != null)
  return xs.length ? xs.reduce((s, x) => s + x, 0) : null
}

/** Chiavi del template per il blocco dei tempi per metro lineare. */
export function datiAvanzamento(a: Avanzamento | null | undefined, periodoDocumento = '') {
  const fasi = (a?.fasi ?? []).filter((f) => f.fase.trim() && (f.esplosivo != null || f.martellone != null))
  if (!a || !fasi.length) return { conAvanzamento: false, avanzamentoTesto: '', avanzamento: [], conProduzione: false, produzioneTesto: '', produzione: [] as string[] }
  const metodi = (['esplosivo', 'martellone'] as const).filter((m) => fasi.some((f) => f[m] != null))
  const produzione = a.produzione
    .filter((p) => p.metri != null && p.metri > 0)
    .map((p) => {
      const giorni = p.giorni != null && p.giorni > 0 ? ` in ${num(p.giorni)} giorni (${num(p.metri! / p.giorni, 1)} m al giorno)` : ''
      return `${num(p.metri, decimali(p.metri!))} m di avanzamento con ${p.metodo === 'esplosivo' ? 'esplosivo' : 'martellone'}${giorni};`
    })
  if (produzione.length) produzione[produzione.length - 1] = produzione[produzione.length - 1].replace(/;$/, '.')
  const periodo = a.periodo?.trim() || periodoDocumento.trim()
  return {
    conAvanzamento: true,
    avanzamentoTesto:
      metodi.length > 1
        ? 'La direzione di cantiere ha fornito, per ciascuna tipologia di avanzamento, la durata media delle varie fasi lavorative per metro lineare di avanzamento.'
        : `La direzione di cantiere ha fornito la durata media delle varie fasi lavorative per metro lineare di avanzamento con ${metodi[0]}.`,
    avanzamento: [
      ...fasi.map((f) => ({ fase: f.fase, esplosivo: num(f.esplosivo, f.esplosivo != null ? decimali(f.esplosivo) : 0), martellone: num(f.martellone, f.martellone != null ? decimali(f.martellone) : 0) })),
      { fase: 'Totale per metro lineare', esplosivo: num(totaleMetro({ ...a, fasi }, 'esplosivo')), martellone: num(totaleMetro({ ...a, fasi }, 'martellone')) },
    ],
    conProduzione: produzione.length > 0,
    produzioneTesto: `In particolare, ${periodo ? `nel periodo ${periodo}` : 'nel periodo di riferimento'} sono stati effettuati:`,
    produzione,
  }
}
