/**
 * Motore di calcolo del DVR Rumore (D.Lgs. 81/08, Titolo VIII Capo II; UNI EN ISO 9612:2011).
 *
 * Per ogni mansione: livello di esposizione giornaliera LEX,8h, incertezza, picco massimo,
 * fascia di esposizione (art. 189) e controlli di coerenza. Nessun valore viene scritto a mano:
 * fasce ed elenchi delle conclusioni derivano sempre dai numeri.
 */
import { arrotonda, mediaEnergetica } from '../comune/numeri'

/** Giornata lavorativa di riferimento in minuti (8 ore). */
export const MINUTI_RIFERIMENTO = 480

/** Da dove viene il livello di un periodo: misura della campagna, dato di campagne precedenti o valore convenzionale. */
export type OrigineLivello = 'misura' | 'storico' | 'convenzionale'

/** Periodo acusticamente omogeneo nella giornata tipo di una mansione (una riga della TAV). */
export interface PeriodoEsposizione {
  minuti: number
  fase: string
  postazione: string
  macchine?: string
  /** LAeq in dB(A). */
  laeq: number
  /** LCeq in dB(C): serve per l'attenuazione dei DPI con il metodo HML. */
  lceq?: number | null
  /** Lpeak in dB(C). */
  lpeak?: number | null
  origine: OrigineLivello
  /** Riferimento alla misura (id o codice rilievo) per la tracciabilità. */
  riferimento?: string | null
}

/**
 * Parametri dell'incertezza sul LEX,8h (UNI EN ISO 9612 appendice C, metodo per compiti).
 * u²(LEX) = Σ c_m² · (u_posizionamento² + u_strumento²) + u_comune²
 * con c_m = (T_m / T_0) · 10^((LAeq,m − LEX) / 10).
 * I valori predefiniti riproducono il foglio di calcolo usato nei DVR ECO-TER
 * (verificato su tutte le 23 mansioni del DVR Rumore Xenia 2026).
 */
export interface ParametriIncertezza {
  uPosizionamento: number
  uStrumento: number
  uComune: number
}

export const INCERTEZZA_PREDEFINITA: ParametriIncertezza = {
  uPosizionamento: 1.0,
  uStrumento: 0.7,
  uComune: 0.5,
}

/** Valori di azione e limite dell'art. 189 D.Lgs. 81/08. */
export const SOGLIE = {
  lexInferiore: 80,
  lexSuperiore: 85,
  lexLimite: 87,
  piccoInferiore: 135,
  piccoSuperiore: 137,
  piccoLimite: 140,
} as const

/** 1 = sotto i valori inferiori di azione; 2 = tra inferiori e superiori; 3 = pari o sopra i superiori. */
export type Fascia = 1 | 2 | 3

export type CriterioFascia =
  /** Si confronta il valore calcolato (arrotondato a 0,1 dB) con le soglie. */
  | 'valore'
  /** Si confronta valore + incertezza: più cautelativo per i casi al confine tra due fasce. */
  | 'valore_piu_incertezza'

export interface OpzioniCalcolo {
  incertezza?: ParametriIncertezza
  criterio?: CriterioFascia
}

export type LivelloAvviso = 'errore' | 'attenzione'

export interface Avviso {
  livello: LivelloAvviso
  codice:
    | 'minuti_diversi_da_480'
    | 'periodo_senza_durata'
    | 'livello_non_valido'
    | 'nessun_periodo'
    | 'dati_storici'
    | 'vicino_al_confine'
    | 'limite_superato'
    | 'mansione_duplicata'
    | 'livelli_incoerenti'
  messaggio: string
}

export interface RisultatoMansione {
  minutiTotali: number
  /** LEX,8h non arrotondato. */
  lex: number
  /** LEX,8h arrotondato a 0,1 dB, come riportato nel documento. */
  lexArrotondato: number
  /** Incertezza tipo u(LEX), arrotondata a 0,1 dB. */
  incertezza: number
  /** Picco massimo in dB(C), null se nessun periodo ha il picco. */
  piccoMax: number | null
  fasciaLex: Fascia
  fasciaPicco: Fascia
  /** Fascia complessiva: la peggiore tra LEX e picco. */
  fascia: Fascia
  /** Coefficienti di sensibilità c_m (quota di energia sonora di ciascun periodo). */
  contributi: number[]
  avvisi: Avviso[]
}

/** LEX,8h = 10·log10( Σ T_m · 10^(LAeq,m/10) / T_0 ). */
export function calcolaLex(periodi: Pick<PeriodoEsposizione, 'minuti' | 'laeq'>[]): number {
  return mediaEnergetica(periodi.map((p) => ({ durata: p.minuti, livello: p.laeq })), MINUTI_RIFERIMENTO)
}

export function coefficientiSensibilita(periodi: Pick<PeriodoEsposizione, 'minuti' | 'laeq'>[], lex: number): number[] {
  return periodi.map((p) => (p.minuti / MINUTI_RIFERIMENTO) * 10 ** ((p.laeq - lex) / 10))
}

export function calcolaIncertezza(contributi: number[], par: ParametriIncertezza = INCERTEZZA_PREDEFINITA): number {
  const perPeriodo = par.uPosizionamento ** 2 + par.uStrumento ** 2
  const somma = contributi.reduce((s, c) => s + c * c * perPeriodo, 0)
  return Math.sqrt(somma + par.uComune ** 2)
}

export function fasciaDaLex(lex: number): Fascia {
  const v = arrotonda(lex, 1)
  if (v >= SOGLIE.lexSuperiore) return 3
  if (v >= SOGLIE.lexInferiore) return 2
  return 1
}

export function fasciaDaPicco(picco: number | null): Fascia {
  if (picco === null) return 1
  const v = arrotonda(picco, 1)
  if (v >= SOGLIE.piccoSuperiore) return 3
  if (v >= SOGLIE.piccoInferiore) return 2
  return 1
}

const peggiore = (a: Fascia, b: Fascia): Fascia => (a > b ? a : b)

export function valutaMansione(periodi: PeriodoEsposizione[], opzioni: OpzioniCalcolo = {}): RisultatoMansione {
  const par = opzioni.incertezza ?? INCERTEZZA_PREDEFINITA
  const criterio = opzioni.criterio ?? 'valore'
  const avvisi: Avviso[] = []

  if (periodi.length === 0) {
    avvisi.push({ livello: 'errore', codice: 'nessun_periodo', messaggio: 'La mansione non ha periodi di esposizione.' })
  }
  periodi.forEach((p, i) => {
    if (!(p.minuti > 0)) {
      avvisi.push({ livello: 'errore', codice: 'periodo_senza_durata', messaggio: `Riga ${i + 1} (${p.fase}): durata mancante o nulla.` })
    }
    if (!Number.isFinite(p.laeq) || p.laeq <= 0 || p.laeq > 150) {
      avvisi.push({ livello: 'errore', codice: 'livello_non_valido', messaggio: `Riga ${i + 1} (${p.fase}): LAeq non valido.` })
    }
  })

  const validi = periodi.filter((p) => p.minuti > 0 && Number.isFinite(p.laeq))
  const minutiTotali = periodi.reduce((s, p) => s + (p.minuti > 0 ? p.minuti : 0), 0)
  if (periodi.length > 0 && minutiTotali !== MINUTI_RIFERIMENTO) {
    avvisi.push({
      livello: 'errore',
      codice: 'minuti_diversi_da_480',
      messaggio: `La giornata tipo somma ${minutiTotali} minuti invece di ${MINUTI_RIFERIMENTO}.`,
    })
  }
  const storici = periodi.filter((p) => p.origine === 'storico')
  if (storici.length > 0) {
    avvisi.push({
      livello: 'attenzione',
      codice: 'dati_storici',
      messaggio: `${storici.length} periodi usano dati di campagne precedenti: vanno dichiarati nel documento.`,
    })
  }

  const lex = validi.length ? calcolaLex(validi) : 0
  const contributi = validi.length ? coefficientiSensibilita(validi, lex) : []
  const u = arrotonda(calcolaIncertezza(contributi, par), 1)
  const picchi = validi.map((p) => p.lpeak).filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  const piccoMax = picchi.length ? Math.max(...picchi) : null

  const lexArrotondato = arrotonda(lex, 1)
  const lexPerFascia = criterio === 'valore_piu_incertezza' ? lexArrotondato + u : lexArrotondato
  const fasciaLex = fasciaDaLex(lexPerFascia)
  const fasciaPicco = fasciaDaPicco(piccoMax)

  // Caso al confine: l'incertezza a cavallo di una soglia può cambiare la fascia.
  const soglie = [SOGLIE.lexInferiore, SOGLIE.lexSuperiore, SOGLIE.lexLimite]
  const soglia = soglie.find((s) => lexArrotondato < s && lexArrotondato + u >= s)
  if (criterio === 'valore' && soglia !== undefined) {
    avvisi.push({
      livello: 'attenzione',
      codice: 'vicino_al_confine',
      messaggio: `LEX ${lexArrotondato} ± ${u} dB(A): con l'incertezza raggiunge la soglia di ${soglia} dB(A).`,
    })
  }
  if (lexArrotondato >= SOGLIE.lexLimite || (piccoMax !== null && piccoMax >= SOGLIE.piccoLimite)) {
    avvisi.push({
      livello: 'attenzione',
      codice: 'limite_superato',
      messaggio: 'Superato il valore limite senza DPI: verificare che con i DPI l\'esposizione resti sotto 87 dB(A) e 140 dB(C).',
    })
  }

  return {
    minutiTotali,
    lex,
    lexArrotondato,
    incertezza: u,
    piccoMax,
    fasciaLex,
    fasciaPicco,
    fascia: peggiore(fasciaLex, fasciaPicco),
    contributi,
    avvisi,
  }
}
