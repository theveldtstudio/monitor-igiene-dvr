/**
 * Check list OCRA (UNI ISO 11228-3) per i movimenti ripetitivi degli arti superiori.
 * Il punteggio reale (già corretto per la durata) si calcola nel modulo di misura OCRA dell'app;
 * qui si classifica e si converte nell'indice OCRA equivalente.
 */
import { calcolaFasciaRischio } from '../../data/ocraChecklistData'
import { arrotonda } from '../comune/numeri'

export type FasciaOcra = 1 | 2 | 3 | 4 | 5

/** Corrispondenza tra punteggio della check list e indice OCRA ai limiti delle fasce. */
const PUNTI_CHECKLIST = [0, 7.5, 11, 14, 22.5]
const PUNTI_INDICE = [0, 2.2, 3.5, 4.5, 9]

export function indiceOcraEquivalente(punteggio: number): number {
  if (punteggio <= 0) return 0
  for (let i = 1; i < PUNTI_CHECKLIST.length; i++) {
    if (punteggio <= PUNTI_CHECKLIST[i]) {
      const [x0, x1, y0, y1] = [PUNTI_CHECKLIST[i - 1], PUNTI_CHECKLIST[i], PUNTI_INDICE[i - 1], PUNTI_INDICE[i]]
      return arrotonda(y0 + ((y1 - y0) * (punteggio - x0)) / (x1 - x0), 1)
    }
  }
  return arrotonda((punteggio * 9) / 22.5, 1)
}

export interface CompitoOcra {
  /** punteggio reale della check list, arto destro e sinistro (null = arto non impegnato) */
  dx: number | null
  sx: number | null
  /** tempo netto di lavoro ripetitivo [min] */
  minuti?: number | null
}

export interface EsitoArto {
  punteggio: number
  indice: number
  fascia: FasciaOcra
  etichetta: string
}

export function valutaArto(punteggio: number): EsitoArto {
  const f = calcolaFasciaRischio(punteggio)
  return { punteggio, indice: indiceOcraEquivalente(punteggio), fascia: f.livello, etichetta: f.label }
}

export function valutaOcra(c: CompitoOcra) {
  const dx = c.dx != null ? valutaArto(c.dx) : null
  const sx = c.sx != null ? valutaArto(c.sx) : null
  const fascia = Math.max(dx?.fascia ?? 1, sx?.fascia ?? 1) as FasciaOcra
  return { dx, sx, fascia }
}
