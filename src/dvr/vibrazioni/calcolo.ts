/**
 * Motore di calcolo del DVR Vibrazioni (D.Lgs. 81/08, Titolo VIII Capo III, art. 201-204;
 * UNI ISO 2631-1 corpo intero, UNI EN ISO 5349 mano-braccio; linee guida INAIL).
 *
 * A(8) = √( Σ a_i² · T_i / 480 ), con a = A(w)max per il corpo intero (WBV) e A(w)sum per il mano-braccio (HAV).
 * Esposizione giornaliera = A(8) × 1,2 (incremento del 20% per l'incertezza, linee guida INAIL).
 * Le fasce si calcolano sull'esposizione giornaliera arrotondata a 0,01 m/s².
 */
import { arrotonda } from '../comune/numeri'

export const MINUTI_RIFERIMENTO = 480

export type TipoVibrazione = 'wbv' | 'hav'

export const ETICHETTE_TIPO: Record<TipoVibrazione, string> = {
  wbv: 'corpo intero (WBV)',
  hav: 'mano-braccio (HAV)',
}

/** Valori d'azione, limite e limite su periodi brevi dell'art. 201 [m/s²]. */
export const SOGLIE_VIBRAZIONI: Record<TipoVibrazione, { azione: number; limite: number; breve: number }> = {
  wbv: { azione: 0.5, limite: 1.0, breve: 1.5 },
  hav: { azione: 2.5, limite: 5.0, breve: 20 },
}

export type OrigineValore = 'misura' | 'storico' | 'convenzionale'

export interface PeriodoVibrazione {
  minuti: number
  fase: string
  /** Regime (WBV) o impugnatura (HAV). */
  dettaglio?: string
  macchina?: string
  /** A(w)max (WBV) o A(w)sum (HAV) in m/s². */
  a: number
  origine: OrigineValore
  riferimento?: string | null
}

/**
 * 0 = trascurabile (nessuna macchina o utensile vibrante nella giornata tipo);
 * 1 = sotto il valore d'azione; 2 = oltre il valore d'azione; 3 = oltre il valore limite.
 */
export type FasciaVibrazioni = 0 | 1 | 2 | 3

export interface OpzioniVibrazioni {
  /** Incremento per l'incertezza (INAIL: 20%). */
  incremento?: number
}

export interface AvvisoVibrazioni {
  livello: 'errore' | 'attenzione'
  codice:
    | 'minuti_diversi_da_480'
    | 'periodo_non_valido'
    | 'nessun_periodo'
    | 'dati_storici'
    | 'limite_breve'
    | 'limite_superato'
    | 'vicino_al_confine'
    | 'mansione_duplicata'
    | 'valori_incoerenti'
  messaggio: string
}

export interface RisultatoVibrazioni {
  tipo: TipoVibrazione
  minutiTotali: number
  a8: number
  a8Arrotondato: number
  /** A(8) con l'incremento per l'incertezza, arrotondato a 0,01. */
  esposizione: number
  fascia: FasciaVibrazioni
  avvisi: AvvisoVibrazioni[]
}

export function calcolaA8(periodi: Pick<PeriodoVibrazione, 'minuti' | 'a'>[]): number {
  const somma = periodi.reduce((s, p) => s + p.a * p.a * p.minuti, 0)
  return Math.sqrt(somma / MINUTI_RIFERIMENTO)
}

/**
 * Fascia dall'esposizione giornaliera. Le soglie sono "superate" (art. 203, 204): il valore
 * pari alla soglia resta nella fascia inferiore.
 */
export function fasciaVibrazioni(tipo: TipoVibrazione, esposizione: number, trascurabile = false): FasciaVibrazioni {
  if (trascurabile) return 0
  const s = SOGLIE_VIBRAZIONI[tipo]
  const v = arrotonda(esposizione, 2)
  if (v > s.limite) return 3
  if (v > s.azione) return 2
  return 1
}

export function valutaVibrazioni(
  tipo: TipoVibrazione,
  periodi: PeriodoVibrazione[],
  opzioni: OpzioniVibrazioni = {},
): RisultatoVibrazioni {
  const incremento = opzioni.incremento ?? 0.2
  const s = SOGLIE_VIBRAZIONI[tipo]
  const avvisi: AvvisoVibrazioni[] = []
  const nome = ETICHETTE_TIPO[tipo]

  if (periodi.length === 0) {
    avvisi.push({ livello: 'errore', codice: 'nessun_periodo', messaggio: `Nessun periodo per le vibrazioni ${nome}.` })
  }
  periodi.forEach((p, i) => {
    if (!(p.minuti > 0) || !Number.isFinite(p.a) || p.a < 0) {
      avvisi.push({ livello: 'errore', codice: 'periodo_non_valido', messaggio: `${nome}, riga ${i + 1} (${p.fase}): minuti o accelerazione non validi.` })
    }
    if (p.a > s.breve) {
      avvisi.push({
        livello: 'attenzione',
        codice: 'limite_breve',
        messaggio: `${nome}, “${p.fase}”: ${arrotonda(p.a, 2)} m/s² supera il valore limite su periodi brevi (${s.breve} m/s²).`,
      })
    }
  })
  const validi = periodi.filter((p) => p.minuti > 0 && Number.isFinite(p.a) && p.a >= 0)
  const minutiTotali = validi.reduce((x, p) => x + p.minuti, 0)
  if (periodi.length > 0 && minutiTotali !== MINUTI_RIFERIMENTO) {
    avvisi.push({ livello: 'errore', codice: 'minuti_diversi_da_480', messaggio: `${nome}: la giornata tipo somma ${minutiTotali} minuti invece di 480.` })
  }
  const storici = periodi.filter((p) => p.origine === 'storico').length
  if (storici) {
    avvisi.push({ livello: 'attenzione', codice: 'dati_storici', messaggio: `${nome}: ${storici} periodi usano dati di campagne precedenti.` })
  }

  const a8 = validi.length ? calcolaA8(validi) : 0
  const esposizione = arrotonda(a8 * (1 + incremento), 2)
  const trascurabile = !validi.some((p) => p.origine !== 'convenzionale')
  const fascia = fasciaVibrazioni(tipo, esposizione, trascurabile)

  if (!trascurabile && esposizione <= s.azione && esposizione >= s.azione * 0.9) {
    avvisi.push({
      livello: 'attenzione',
      codice: 'vicino_al_confine',
      messaggio: `${nome}: esposizione ${esposizione} m/s², vicina al valore d'azione (${s.azione} m/s²).`,
    })
  }
  if (fascia === 3) {
    avvisi.push({
      livello: 'attenzione',
      codice: 'limite_superato',
      messaggio: `${nome}: esposizione ${esposizione} m/s² oltre il valore limite (${s.limite} m/s²): misure immediate (art. 203 c. 3).`,
    })
  }

  return { tipo, minutiTotali, a8, a8Arrotondato: arrotonda(a8, 2), esposizione, fascia, avvisi }
}

// ---------------------------------------------------------------- valori per il calcolo

export interface MisuraVibrazione {
  id: string
  tipo: TipoVibrazione
  /** Macchina (WBV) o utensile (HAV). */
  macchina: string
  fase: string
  /** Regime (WBV) o impugnatura (HAV). */
  dettaglio: string
  a: number
  codice: string
}

export interface ValorePerCalcolo {
  chiave: string
  tipo: TipoVibrazione
  macchina: string
  fase: string
  /** Regime per il WBV; per l'HAV le impugnature misurate (es. "DX/SX"). */
  dettaglio: string
  n: number
  valore: number
  codici: string[]
}

export const chiaveValore = (tipo: TipoVibrazione, macchina: string, fase: string, dettaglio: string) =>
  [tipo, macchina, fase, tipo === 'wbv' ? dettaglio : ''].map((x) => x.trim().toLowerCase()).join('|')

/** Media + deviazione standard (di popolazione) delle misure ripetute, come nel foglio ECO-TER. */
export function mediaPiuDeviazione(valori: number[]): number {
  if (valori.length === 0) return 0
  const media = valori.reduce((s, x) => s + x, 0) / valori.length
  const varianza = valori.reduce((s, x) => s + (x - media) ** 2, 0) / valori.length
  return media + Math.sqrt(varianza)
}

/**
 * Raggruppa le misure nei valori usati per il calcolo:
 * - misure ripetute sulla stessa macchina, fase e regime → media + deviazione standard;
 * - HAV con doppia impugnatura → si usa l'impugnatura con la vibrazione più alta.
 */
export function valoriPerCalcolo(misure: MisuraVibrazione[]): ValorePerCalcolo[] {
  const gruppi = new Map<string, MisuraVibrazione[]>()
  for (const m of misure) {
    const k = chiaveValore(m.tipo, m.macchina, m.fase, m.dettaglio)
    gruppi.set(k, [...(gruppi.get(k) ?? []), m])
  }
  return [...gruppi.entries()].map(([chiave, ms]) => {
    const primo = ms[0]
    let valore: number
    let dettaglio = primo.dettaglio
    if (primo.tipo === 'hav') {
      const perImpugnatura = new Map<string, number[]>()
      ms.forEach((m) => perImpugnatura.set(m.dettaglio, [...(perImpugnatura.get(m.dettaglio) ?? []), m.a]))
      valore = Math.max(...[...perImpugnatura.values()].map(mediaPiuDeviazione))
      dettaglio = [...perImpugnatura.keys()].filter(Boolean).join('/')
    } else {
      valore = mediaPiuDeviazione(ms.map((m) => m.a))
    }
    return {
      chiave,
      tipo: primo.tipo,
      macchina: primo.macchina,
      fase: primo.fase,
      dettaglio,
      n: ms.length,
      valore: arrotonda(valore, 2),
      codici: ms.map((m) => m.codice),
    }
  })
}
