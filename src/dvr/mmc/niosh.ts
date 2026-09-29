/**
 * Metodo NIOSH (UNI ISO 11228-1, allegato XXXIII D.Lgs. 81/08) per il sollevamento di carichi.
 *
 * Peso limite raccomandato PLR = CP × A × B × C × D × E × F (× 0,85 se in più persone, × 0,6 se con
 * una mano); indice di sollevamento IS = peso sollevato / PLR. CP = 25 kg per i maschi adulti
 * (18–45 anni), 20 kg per giovani e anziani.
 * I fattori sono quelli della tabella del DVR nei punti della tabella; tra un punto e l'altro si usano
 * le formule della norma (A, B, C, D) o l'interpolazione lineare (E).
 * Indice composto (compiti diversi nello stesso turno): ISC = IS1 + Σ ISIFk·(1/E(F1..k) − 1/E(F1..k−1)).
 */
import { arrotonda } from '../comune/numeri'

export type DurataNiosh = 'breve' | 'media' | 'lunga'
export type PresaNiosh = 'buono' | 'medio' | 'scarso'
export type FasciaNiosh = 0 | 1 | 2

export interface CompitoNiosh {
  descrizione?: string
  /** peso complessivo del carico [kg] (se sollevato in più persone si divide per il numero di persone) */
  peso: number
  persone?: number
  unaMano?: boolean
  /** altezza da terra delle mani a inizio sollevamento [cm] */
  altezza: number
  /** distanza verticale di spostamento [cm] */
  dislocazione: number
  /** distanza orizzontale massima del peso dal corpo [cm] */
  distanza: number
  /** dislocazione angolare [gradi] */
  asimmetria: number
  /** atti al minuto */
  frequenza: number
  /** breve ≤ 1 ora, media 1–2 ore, lunga 2–8 ore */
  durata: DurataNiosh
  presa: PresaNiosh
}

export const COSTANTE_PESO = { adulti: 25, anziani: 20 } as const
export type PopolazioneNiosh = keyof typeof COSTANTE_PESO

export const TABELLA_NIOSH = {
  altezza: { punti: [0, 25, 50, 75, 100, 125, 150], fattori: [0.77, 0.85, 0.93, 1, 0.93, 0.85, 0.78], oltre: 175 },
  dislocazione: { punti: [25, 30, 40, 50, 70, 100, 170], fattori: [1, 0.97, 0.93, 0.91, 0.88, 0.87, 0.86], oltre: 175 },
  distanza: { punti: [25, 30, 40, 50, 55, 60], fattori: [1, 0.83, 0.63, 0.5, 0.45, 0.42], oltre: 63 },
  asimmetria: { punti: [0, 30, 60, 90, 120, 135], fattori: [1, 0.9, 0.81, 0.71, 0.62, 0.57], oltre: 135 },
  frequenza: {
    punti: [0.2, 1, 4, 6, 9, 12, 15],
    breve: [1, 0.94, 0.84, 0.75, 0.52, 0.37, 0],
    media: [0.95, 0.88, 0.72, 0.5, 0.3, 0.21, 0],
    lunga: [0.85, 0.75, 0.45, 0.27, 0.15, 0, 0],
  },
  presa: { buono: 1, medio: 0.95, scarso: 0.9 },
  persone: 0.85,
  unaMano: 0.6,
} as const

export const SOGLIE_NIOSH = { verde: 0.85, rossa: 1 } as const
export const ETICHETTE_NIOSH: Record<FasciaNiosh, { fascia: string; rischio: string }> = {
  0: { fascia: 'Verde', rischio: 'trascurabile' },
  1: { fascia: 'Gialla', rischio: 'significativo' },
  2: { fascia: 'Rossa', rischio: 'presente' },
}

const r2 = (x: number) => arrotonda(x, 2)

function daTabella(valore: number, punti: readonly number[], fattori: readonly number[], formula: (x: number) => number): number | null {
  const k = punti.indexOf(valore)
  return k >= 0 ? fattori[k] : r2(formula(valore))
}

export function fattoreAltezza(v: number): number {
  const t = TABELLA_NIOSH.altezza
  if (v > t.oltre || v < 0) return 0
  return daTabella(v, t.punti, t.fattori, (x) => 1 - 0.003 * Math.abs(x - 75))!
}

export function fattoreDislocazione(d: number): number {
  const t = TABELLA_NIOSH.dislocazione
  if (d > t.oltre) return 0
  if (d <= 25) return 1
  return daTabella(d, t.punti, t.fattori, (x) => Math.min(1, 0.82 + 4.5 / x))!
}

export function fattoreDistanza(h: number): number {
  const t = TABELLA_NIOSH.distanza
  if (h > t.oltre) return 0
  if (h <= 25) return 1
  return daTabella(h, t.punti, t.fattori, (x) => 25 / x)!
}

export function fattoreAsimmetria(a: number): number {
  const t = TABELLA_NIOSH.asimmetria
  if (a > t.oltre) return 0
  if (a <= 0) return 1
  return daTabella(a, t.punti, t.fattori, (x) => 1 - 0.0032 * x)!
}

export function fattoreFrequenza(f: number, durata: DurataNiosh): number {
  const t = TABELLA_NIOSH.frequenza
  const valori = t[durata]
  if (f <= t.punti[0]) return valori[0]
  if (f >= t.punti[t.punti.length - 1]) return 0
  let i = 0
  while (f > t.punti[i + 1]) i++
  const [x0, x1] = [t.punti[i], t.punti[i + 1]]
  return r2(valori[i] + ((valori[i + 1] - valori[i]) * (f - x0)) / (x1 - x0))
}

export interface FattoriNiosh {
  A: number
  B: number
  C: number
  D: number
  E: number
  F: number
  /** 0,85 se il carico è sollevato da più persone, altrimenti 1 */
  persone: number
  /** 0,6 se con una mano, altrimenti 1 */
  mano: number
}

export function fattoriNiosh(c: CompitoNiosh, frequenza = c.frequenza): FattoriNiosh {
  return {
    A: fattoreAltezza(c.altezza),
    B: fattoreDislocazione(c.dislocazione),
    C: fattoreDistanza(c.distanza),
    D: fattoreAsimmetria(c.asimmetria),
    E: fattoreFrequenza(frequenza, c.durata),
    F: TABELLA_NIOSH.presa[c.presa],
    persone: (c.persone ?? 1) > 1 ? TABELLA_NIOSH.persone : 1,
    mano: c.unaMano ? TABELLA_NIOSH.unaMano : 1,
  }
}

const prodotto = (f: FattoriNiosh, conFrequenza = true) => f.A * f.B * f.C * f.D * (conFrequenza ? f.E : 1) * f.F * f.persone * f.mano

/** Peso sollevato da ciascun lavoratore. */
export const pesoPerPersona = (c: CompitoNiosh) => c.peso / Math.max(1, c.persone ?? 1)

export function fasciaNiosh(is: number): FasciaNiosh {
  if (is <= SOGLIE_NIOSH.verde) return 0
  if (is < SOGLIE_NIOSH.rossa) return 1
  return 2
}

export interface EsitoNiosh {
  /** peso limite raccomandato, a 0,1 kg */
  plr: number
  /** indice di sollevamento, a 0,01 */
  is: number
  fascia: FasciaNiosh
}

export interface RisultatoNiosh {
  fattori: FattoriNiosh
  peso: number
  adulti: EsitoNiosh
  anziani: EsitoNiosh
}

export function valutaNiosh(c: CompitoNiosh): RisultatoNiosh {
  const fattori = fattoriNiosh(c)
  const peso = pesoPerPersona(c)
  const esito = (pop: PopolazioneNiosh): EsitoNiosh => {
    const plr = arrotonda(COSTANTE_PESO[pop] * prodotto(fattori), 1)
    const is = plr > 0 ? r2(peso / plr) : Infinity
    return { plr, is, fascia: fasciaNiosh(is) }
  }
  return { fattori, peso, adulti: esito('adulti'), anziani: esito('anziani') }
}

// ---------------------------------------------------------------- indice composto

export interface RisultatoComposto {
  compiti: { compito: CompitoNiosh; fattori: FattoriNiosh; fili: Record<PopolazioneNiosh, number>; stli: Record<PopolazioneNiosh, number> }[]
  adulti: { isc: number; fascia: FasciaNiosh }
  anziani: { isc: number; fascia: FasciaNiosh }
}

/** Indice di sollevamento composto: i compiti devono avere la stessa durata. */
export function valutaNioshComposto(compiti: CompitoNiosh[]): RisultatoComposto {
  const dati = compiti.map((c) => {
    const fattori = fattoriNiosh(c)
    const peso = pesoPerPersona(c)
    const per = (pop: PopolazioneNiosh, conE: boolean) => {
      const plr = COSTANTE_PESO[pop] * prodotto(fattori, conE)
      return plr > 0 ? peso / plr : Infinity
    }
    return {
      compito: c,
      fattori,
      fili: { adulti: per('adulti', false), anziani: per('anziani', false) },
      stli: { adulti: per('adulti', true), anziani: per('anziani', true) },
    }
  })
  const durata = compiti[0]?.durata ?? 'breve'
  const isc = (pop: PopolazioneNiosh) => {
    if (!dati.length) return 0
    const ordinati = [...dati].sort((a, b) => b.stli[pop] - a.stli[pop])
    let totale = ordinati[0].stli[pop]
    let frequenza = ordinati[0].compito.frequenza
    for (const d of ordinati.slice(1)) {
      const prima = fattoreFrequenza(frequenza, durata)
      frequenza += d.compito.frequenza
      const dopo = fattoreFrequenza(frequenza, durata)
      if (prima === 0) break // già oltre la frequenza ammessa: indice infinito
      totale += dopo > 0 ? d.fili[pop] * (1 / dopo - 1 / prima) : Infinity
    }
    return r2(totale)
  }
  const a = isc('adulti')
  const z = isc('anziani')
  return { compiti: dati, adulti: { isc: a, fascia: fasciaNiosh(a) }, anziani: { isc: z, fascia: fasciaNiosh(z) } }
}
