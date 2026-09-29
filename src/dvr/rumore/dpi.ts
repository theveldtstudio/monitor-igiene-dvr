/**
 * Valutazione dei DPI per l'udito: attenuazione reale (coefficiente β), livello all'orecchio
 * con il metodo HML (UNI EN ISO 4869-2) e livello di protezione secondo UNI 9432:2011, prospetto C.5.
 */
import { arrotonda, mediaEnergetica } from '../comune/numeri'
import { MINUTI_RIFERIMENTO, SOGLIE, type PeriodoEsposizione } from './calcolo'

export type TipoDpiUdito = 'inserti' | 'cuffie' | 'archetto'

export interface DpiUdito {
  nome: string
  tipo: TipoDpiUdito
  /** Attenuazioni dichiarate dal costruttore, in dB. */
  h: number
  m: number
  l: number
  snr?: number | null
  /** Coefficiente di correzione per l'uso reale (UNI 9432: 0,5 per gli inserti, 0,75 per le cuffie). */
  beta: number
  /** Attenuazione media e deviazione standard per banda d'ottava (125–8000 Hz), facoltative. */
  ottave?: { frequenza: number; media: number; deviazione: number }[]
}

/** β consigliato da UNI 9432:2011 per tipo di dispositivo. */
export const BETA_PREDEFINITO: Record<TipoDpiUdito, number> = {
  inserti: 0.5,
  archetto: 0.5,
  cuffie: 0.75,
}

export interface AttenuazioneReale {
  h: number
  m: number
  l: number
}

export function attenuazioneReale(dpi: DpiUdito): AttenuazioneReale {
  return { h: dpi.h * dpi.beta, m: dpi.m * dpi.beta, l: dpi.l * dpi.beta }
}

/**
 * Riduzione prevista del livello (PNR) con il metodo HML.
 * Se LC − LA ≤ 2 dB: PNR = M − (H − M)/4 · (LC − LA − 2)
 * altrimenti:       PNR = M − (M − L)/8 · (LC − LA − 2)
 * Senza LCeq si usa solo M (stima semplificata, segnalata).
 */
export function pnrHml(att: AttenuazioneReale, laeq: number, lceq: number | null | undefined): number {
  if (lceq === null || lceq === undefined || !Number.isFinite(lceq)) return att.m
  const d = lceq - laeq
  return d <= 2 ? att.m - ((att.h - att.m) / 4) * (d - 2) : att.m - ((att.m - att.l) / 8) * (d - 2)
}

export type LivelloProtezione = 'insufficiente' | 'accettabile' | 'buona' | 'troppo_alta'

export const ETICHETTE_PROTEZIONE: Record<LivelloProtezione, string> = {
  insufficiente: 'Insufficiente',
  accettabile: 'Accettabile',
  buona: 'Buona',
  troppo_alta: 'Troppo alta (iperprotezione)',
}

/** UNI 9432:2011 prospetto C.5: > 80 insufficiente; 75–80 accettabile; 70–75 buona; 65–70 accettabile; < 65 troppo alta. */
export function livelloProtezione(livelloAllOrecchio: number): LivelloProtezione {
  const v = arrotonda(livelloAllOrecchio, 1)
  if (v > 80) return 'insufficiente'
  if (v >= 75) return 'accettabile'
  if (v >= 70) return 'buona'
  if (v >= 65) return 'accettabile'
  return 'troppo_alta'
}

export const dpiAdeguato = (p: LivelloProtezione) => p === 'buona' || p === 'accettabile'

export interface VerificaFaseDpi {
  laeq: number
  lceq: number | null
  lpeak: number | null
  /** Livello all'orecchio con il DPI indossato, arrotondato a 0,1 dB(A). */
  livelloConDpi: number
  /** Picco all'orecchio stimato in modo cautelativo sottraendo l'attenuazione reale L. */
  piccoConDpi: number | null
  protezione: LivelloProtezione
  adeguato: boolean
  /** true se manca LCeq e si è usata solo l'attenuazione M. */
  stimaSemplificata: boolean
}

export function verificaFase(
  dpi: DpiUdito,
  livelli: Pick<PeriodoEsposizione, 'laeq' | 'lceq' | 'lpeak'>,
): VerificaFaseDpi {
  const att = attenuazioneReale(dpi)
  const lceq = livelli.lceq ?? null
  const lpeak = livelli.lpeak ?? null
  const livelloConDpi = arrotonda(livelli.laeq - pnrHml(att, livelli.laeq, lceq), 1)
  const piccoConDpi = lpeak === null ? null : arrotonda(lpeak - att.l, 1)
  const protezione = livelloProtezione(livelloConDpi)
  const piccoOk = piccoConDpi === null || piccoConDpi < SOGLIE.piccoInferiore
  return {
    laeq: livelli.laeq,
    lceq,
    lpeak,
    livelloConDpi,
    piccoConDpi,
    protezione,
    adeguato: dpiAdeguato(protezione) && piccoOk,
    stimaSemplificata: lceq === null,
  }
}

/**
 * Esposizione giornaliera con il DPI indossato nei periodi rumorosi (LAeq > 80 dB(A)).
 * Serve per verificare il rispetto del valore limite di 87 dB(A) (art. 189 c. 2).
 */
export function lexConDpi(periodi: PeriodoEsposizione[], dpi: DpiUdito, sogliaUso = SOGLIE.lexInferiore): number {
  const att = attenuazioneReale(dpi)
  return mediaEnergetica(
    periodi
      .filter((p) => p.minuti > 0)
      .map((p) => ({
        durata: p.minuti,
        livello: p.laeq > sogliaUso ? p.laeq - pnrHml(att, p.laeq, p.lceq) : p.laeq,
      })),
    MINUTI_RIFERIMENTO,
  )
}

/**
 * Controlli sui dati del DPI copiati dalla scheda del costruttore: segnala valori quasi certamente
 * sbagliati (es. virgola persa: deviazione 46 invece di 4,6, attenuazione 4,8 invece di 48).
 */
export function controllaDpi(dpi: DpiUdito): string[] {
  const avvisi: string[] = []
  if (!(dpi.h >= dpi.m && dpi.m >= dpi.l)) avvisi.push(`${dpi.nome}: di norma H ≥ M ≥ L (dati: H ${dpi.h}, M ${dpi.m}, L ${dpi.l}).`)
  if (dpi.beta <= 0 || dpi.beta > 1) avvisi.push(`${dpi.nome}: coefficiente β fuori intervallo (${dpi.beta}).`)
  const ott = dpi.ottave ?? []
  ott.forEach((o, i) => {
    if (o.deviazione > 15) avvisi.push(`${dpi.nome}: deviazione standard a ${o.frequenza} Hz pari a ${o.deviazione} dB, probabile errore di battitura.`)
    const vicini = [ott[i - 1]?.media, ott[i + 1]?.media].filter((x): x is number => typeof x === 'number')
    if (vicini.length && o.media < Math.min(...vicini) / 3) {
      avvisi.push(`${dpi.nome}: attenuazione a ${o.frequenza} Hz pari a ${o.media} dB, molto più bassa delle bande vicine: verificare.`)
    }
  })
  return avvisi
}
