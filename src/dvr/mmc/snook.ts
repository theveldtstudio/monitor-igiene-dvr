/**
 * Metodo Snook e Ciriello (UNI ISO 11228-2) per traino, spinta e trasporto in piano.
 * Tabelle della popolazione maschile (protezione del 90%) riportate nel DVR modello.
 * Indice = forza o peso effettivi / valore limite raccomandato; per spinta e traino si considera
 * il peggiore tra forza iniziale e forza di mantenimento.
 *
 * Scelta della colonna: la distanza della tabella uguale o immediatamente superiore a quella reale,
 * la frequenza della tabella uguale o immediatamente più frequente di quella reale (a favore di
 * sicurezza), l'altezza delle mani più vicina.
 */
import { arrotonda } from '../comune/numeri'

export type AzioneSnook = 'spinta' | 'traino' | 'trasporto'
export type FasciaSnook = 0 | 1 | 2 | 3

/** Intervallo tra due azioni, in secondi, per ogni colonna. */
const S = 1
const M = 60
const H = 3600
const FREQ_2 = [6 * S, 12 * S, 1 * M, 5 * M, 30 * M, 8 * H]
const FREQ_7 = [15 * S, 22 * S, 1 * M, 5 * M, 30 * M, 8 * H]
const FREQ_15 = [25 * S, 35 * S, 1 * M, 5 * M, 30 * M, 8 * H]
const FREQ_60 = [2 * M, 5 * M, 30 * M, 8 * H]

interface Gruppo {
  distanza: number
  intervalli: number[]
}

interface TabellaSnook {
  gruppi: Gruppo[]
  /** per altezza delle mani [cm]: valori iniziali (e di mantenimento per spinta/traino) concatenati per gruppo */
  righe: { altezza: number; iniziale: number[]; mantenimento?: number[] }[]
}

const GRUPPI_4: Gruppo[] = [
  { distanza: 2, intervalli: FREQ_2 },
  { distanza: 7.5, intervalli: FREQ_7 },
  { distanza: 15, intervalli: FREQ_15 },
  { distanza: 60, intervalli: FREQ_60 },
]

export const TABELLE_SNOOK: Record<AzioneSnook, TabellaSnook> = {
  spinta: {
    gruppi: GRUPPI_4,
    righe: [
      {
        altezza: 145,
        iniziale: [20, 22, 25, 26, 26, 31, 14, 16, 21, 22, 22, 26, 16, 18, 19, 20, 21, 25, 12, 14, 14, 18],
        mantenimento: [10, 13, 15, 18, 18, 22, 8, 9, 13, 15, 16, 18, 8, 9, 11, 13, 14, 16, 7, 8, 9, 11],
      },
      {
        altezza: 95,
        iniziale: [21, 24, 26, 28, 28, 34, 16, 18, 23, 25, 25, 30, 18, 21, 22, 23, 24, 28, 14, 16, 16, 20],
        mantenimento: [10, 13, 16, 19, 19, 23, 8, 10, 13, 15, 15, 18, 8, 10, 11, 13, 13, 16, 7, 8, 9, 11],
      },
      {
        altezza: 65,
        iniziale: [19, 22, 24, 25, 26, 31, 13, 14, 20, 21, 21, 26, 15, 17, 19, 20, 20, 24, 12, 14, 14, 17],
        mantenimento: [10, 13, 16, 18, 19, 23, 8, 10, 12, 14, 15, 18, 8, 10, 11, 12, 13, 15, 7, 8, 9, 10],
      },
    ],
  },
  traino: {
    gruppi: GRUPPI_4,
    righe: [
      {
        altezza: 135,
        iniziale: [14, 16, 18, 19, 19, 23, 11, 13, 16, 17, 18, 21, 13, 15, 15, 16, 17, 20, 10, 11, 11, 14],
        mantenimento: [8, 10, 12, 15, 15, 16, 6, 8, 10, 12, 12, 15, 7, 8, 9, 10, 11, 13, 6, 6, 7, 9],
      },
      {
        altezza: 90,
        // 60 m ogni 5 min: 18 nel modello (fuori sequenza con 13 e 16); si usa il valore più basso vicino, 16
        iniziale: [19, 22, 25, 27, 27, 32, 15, 18, 23, 24, 24, 29, 18, 20, 21, 23, 23, 28, 13, 16, 16, 19],
        mantenimento: [10, 13, 16, 19, 20, 24, 6, 10, 13, 16, 16, 19, 9, 10, 12, 14, 14, 17, 7, 9, 10, 12],
      },
      {
        altezza: 60,
        iniziale: [22, 25, 28, 30, 30, 36, 18, 20, 26, 27, 28, 33, 20, 23, 24, 26, 26, 31, 15, 18, 18, 22],
        mantenimento: [11, 14, 17, 20, 21, 25, 9, 11, 14, 17, 17, 20, 9, 11, 12, 15, 15, 18, 8, 9, 10, 12],
      },
    ],
  },
  trasporto: {
    gruppi: GRUPPI_4.slice(0, 3),
    righe: [
      { altezza: 110, iniziale: [10, 14, 17, 19, 21, 25, 9, 11, 15, 17, 19, 22, 10, 11, 13, 15, 17, 20] },
      { altezza: 80, iniziale: [13, 17, 21, 23, 26, 31, 11, 14, 18, 21, 23, 27, 13, 15, 17, 20, 22, 26] },
    ],
  },
}

export interface CompitoSnook {
  azione: AzioneSnook
  /** altezza delle mani da terra [cm] */
  altezza: number
  /** distanza percorsa [m] */
  distanza: number
  /** intervallo tra due azioni [s] */
  intervallo: number
  /** trasporto: peso trasportato [kg]; spinta/traino: forza iniziale [kg] */
  valore: number
  /** spinta/traino: forza di mantenimento [kg] */
  mantenimento?: number | null
}

export interface AvvisoSnook {
  codice: string
  messaggio: string
}

export interface RisultatoSnook {
  altezzaTabella: number
  distanzaTabella: number
  intervalloTabella: number
  limite: number
  limiteMantenimento: number | null
  indice: number
  fascia: FasciaSnook
  avvisi: AvvisoSnook[]
}

export const ETICHETTE_SNOOK: Record<FasciaSnook, { fascia: string; rischio: string }> = {
  0: { fascia: 'Verde', rischio: 'accettabile' },
  1: { fascia: 'Gialla', rischio: 'significativo' },
  2: { fascia: 'Rossa', rischio: 'presente' },
  3: { fascia: 'Viola', rischio: 'elevato' },
}

/** ≤ 0,75 verde; fino a 1,25 gialla; oltre rossa; oltre 3 viola. */
export function fasciaSnook(indice: number): FasciaSnook {
  if (indice <= 0.75) return 0
  if (indice <= 1.25) return 1
  if (indice <= 3) return 2
  return 3
}

export function testoIntervallo(s: number): string {
  if (s >= H && s % H === 0) return `${s / H} h`
  if (s >= M && s % M === 0) return `${s / M} min`
  return `${s} s`
}

export function valutaSnook(c: CompitoSnook): RisultatoSnook {
  const t = TABELLE_SNOOK[c.azione]
  const avvisi: AvvisoSnook[] = []
  const riga = t.righe.reduce((a, b) => (Math.abs(b.altezza - c.altezza) < Math.abs(a.altezza - c.altezza) ? b : a))
  let g = t.gruppi.findIndex((x) => x.distanza >= c.distanza)
  if (g < 0) {
    g = t.gruppi.length - 1
    avvisi.push({ codice: 'distanza_oltre', messaggio: `Distanza di ${c.distanza} m oltre la tabella: si usa ${t.gruppi[g].distanza} m.` })
  }
  const gruppo = t.gruppi[g]
  let k = -1
  gruppo.intervalli.forEach((x, i) => {
    if (x <= c.intervallo) k = i
  })
  if (k < 0) {
    k = 0
    avvisi.push({ codice: 'frequenza_oltre', messaggio: `Azioni più frequenti della tabella: si usa 1 azione ogni ${testoIntervallo(gruppo.intervalli[0])}.` })
  }
  const inizio = t.gruppi.slice(0, g).reduce((s, x) => s + x.intervalli.length, 0)
  const limite = riga.iniziale[inizio + k]
  const limiteMantenimento = riga.mantenimento ? riga.mantenimento[inizio + k] : null
  let indice = c.valore / limite
  if (limiteMantenimento && c.mantenimento != null) indice = Math.max(indice, c.mantenimento / limiteMantenimento)
  indice = arrotonda(indice, 2)
  return {
    altezzaTabella: riga.altezza,
    distanzaTabella: gruppo.distanza,
    intervalloTabella: gruppo.intervalli[k],
    limite,
    limiteMantenimento,
    indice,
    fascia: fasciaSnook(indice),
    avvisi,
  }
}

/** Colonne di frequenza disponibili per l'azione e la distanza (per le scelte nell'interfaccia). */
export function intervalliDisponibili(azione: AzioneSnook, distanza: number): number[] {
  const t = TABELLE_SNOOK[azione]
  return (t.gruppi.find((x) => x.distanza >= distanza) ?? t.gruppi[t.gruppi.length - 1]).intervalli
}
