/**
 * Numeri di graduazione dei filtri per saldatura e tecniche connesse (UNI EN 169).
 * Prospetto IV (saldatura ad arco, in funzione della corrente) letto dal DVR ROA Castagnola;
 * prospetti II e III (saldatura a gas e ossitaglio, in funzione della portata).
 */

export type ProcessoEn169 =
  | 'elettrodi'
  | 'mig_pesanti'
  | 'mig_leggere'
  | 'tig'
  | 'mag'
  | 'aria_arco'
  | 'plasma'
  | 'gas'
  | 'ossitaglio'

interface Fascia {
  /** limite superiore della fascia (compreso): corrente [A] o portata [l/h] */
  fino: number
  /** numero di graduazione; null = procedimento non usato in questo campo */
  n: number | null
}

export const PROCESSI_EN169: Record<ProcessoEn169, { nome: string; unita: 'A' | 'l/h'; grandezza: string; fasce: Fascia[] }> = {
  elettrodi: {
    nome: 'Saldatura ad elettrodo rivestito',
    unita: 'A',
    grandezza: 'corrente',
    fasce: [{ fino: 20, n: null }, { fino: 40, n: 9 }, { fino: 80, n: 10 }, { fino: 175, n: 11 }, { fino: 300, n: 12 }, { fino: 500, n: 13 }, { fino: Infinity, n: 14 }],
  },
  mig_pesanti: {
    nome: 'Saldatura MIG su metalli pesanti',
    unita: 'A',
    grandezza: 'corrente',
    fasce: [{ fino: 80, n: null }, { fino: 100, n: 10 }, { fino: 175, n: 11 }, { fino: 300, n: 12 }, { fino: 500, n: 13 }, { fino: Infinity, n: 14 }],
  },
  mig_leggere: {
    nome: 'Saldatura MIG su leghe leggere',
    unita: 'A',
    grandezza: 'corrente',
    fasce: [{ fino: 80, n: null }, { fino: 100, n: 10 }, { fino: 175, n: 11 }, { fino: 250, n: 12 }, { fino: 350, n: 13 }, { fino: 500, n: 14 }, { fino: Infinity, n: 15 }],
  },
  tig: {
    nome: 'Saldatura TIG',
    unita: 'A',
    grandezza: 'corrente',
    fasce: [{ fino: 5, n: null }, { fino: 20, n: 9 }, { fino: 40, n: 10 }, { fino: 100, n: 11 }, { fino: 175, n: 12 }, { fino: 250, n: 13 }, { fino: 400, n: 14 }, { fino: Infinity, n: null }],
  },
  mag: {
    nome: 'Saldatura MAG',
    unita: 'A',
    grandezza: 'corrente',
    // la scansione del prospetto nel DVR riporta 16 nell'ultima fascia: la norma dà 15
    fasce: [{ fino: 40, n: null }, { fino: 80, n: 10 }, { fino: 125, n: 11 }, { fino: 175, n: 12 }, { fino: 300, n: 13 }, { fino: 450, n: 14 }, { fino: Infinity, n: 15 }],
  },
  aria_arco: {
    nome: 'Taglio aria-arco',
    unita: 'A',
    grandezza: 'corrente',
    fasce: [{ fino: 125, n: null }, { fino: 175, n: 10 }, { fino: 225, n: 11 }, { fino: 275, n: 12 }, { fino: 350, n: 13 }, { fino: 450, n: 14 }, { fino: Infinity, n: 15 }],
  },
  plasma: {
    nome: 'Taglio al plasma',
    unita: 'A',
    grandezza: 'corrente',
    fasce: [{ fino: 60, n: null }, { fino: 150, n: 11 }, { fino: 250, n: 12 }, { fino: 400, n: 13 }, { fino: Infinity, n: null }],
  },
  gas: {
    nome: 'Saldatura e brasatura a gas di metalli pesanti',
    unita: 'l/h',
    grandezza: 'portata di acetilene',
    fasce: [{ fino: 70, n: 4 }, { fino: 200, n: 5 }, { fino: 800, n: 6 }, { fino: Infinity, n: 7 }],
  },
  ossitaglio: {
    nome: 'Ossitaglio',
    unita: 'l/h',
    grandezza: 'portata di ossigeno',
    fasce: [{ fino: 900, n: null }, { fino: 2000, n: 5 }, { fino: 4000, n: 6 }, { fino: Infinity, n: 7 }],
  },
}

export interface GraduazioneRichiesta {
  /** sotto-intervallo del campo di utilizzo */
  da: number
  a: number
  n: number
}

/** Numeri di graduazione richiesti nel campo di utilizzo [min, max] (una voce per fascia attraversata). */
export function graduazioniRichieste(processo: ProcessoEn169, min: number, max: number): { richieste: GraduazioneRichiesta[]; fuoriTabella: boolean } {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  const richieste: GraduazioneRichiesta[] = []
  let fuoriTabella = false
  let inizio = 0
  for (const f of PROCESSI_EN169[processo].fasce) {
    const da = Math.max(lo, inizio)
    const a = Math.min(hi, f.fino)
    const tocca = da < a || (lo === hi && lo > inizio && lo <= f.fino)
    if (tocca) {
      if (f.n === null) fuoriTabella = true
      else richieste.push({ da, a, n: f.n })
    }
    inizio = f.fino
  }
  return { richieste, fuoriTabella }
}

/** "10-11; 9-13" oppure "5" → gradi disponibili con i DPI in dotazione. */
export function gradiDisponibili(dotazione: string): number[] {
  const out = new Set<number>()
  for (const parte of dotazione.split(/[;,/]|\s+e\s+/)) {
    const m = parte.match(/(\d+)\s*(?:[-÷–]\s*(\d+))?/)
    if (!m) continue
    const a = Number(m[1])
    const b = m[2] ? Number(m[2]) : a
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) out.add(n)
  }
  return [...out].sort((x, y) => x - y)
}

/**
 * Adeguatezza: per ogni numero richiesto c'è un filtro pari o immediatamente superiore (+1, più scuro),
 * come ammesso dalla norma per le condizioni di lavoro. Filtri più chiari non sono adeguati.
 */
export function verificaDpi(richieste: GraduazioneRichiesta[], disponibili: number[]): { adeguato: boolean; mancanti: number[] } {
  const mancanti = [...new Set(richieste.map((r) => r.n))].filter((n) => !disponibili.includes(n) && !disponibili.includes(n + 1))
  return { adeguato: richieste.length > 0 && mancanti.length === 0, mancanti }
}
