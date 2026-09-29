/**
 * Valutazione completa del DVR Vibrazioni: per ogni mansione corpo intero e mano-braccio,
 * elenchi per fascia e controlli di coerenza tra le TAV.
 */
import {
  valutaVibrazioni,
  type AvvisoVibrazioni,
  type FasciaVibrazioni,
  type OpzioniVibrazioni,
  type PeriodoVibrazione,
  type RisultatoVibrazioni,
  type TipoVibrazione,
} from './calcolo'

export interface MansioneVibrazioni {
  id: string
  nome: string
  attivita?: string
  wbv: PeriodoVibrazione[]
  hav: PeriodoVibrazione[]
}

export interface EsitoMansioneVibrazioni {
  mansione: MansioneVibrazioni
  wbv: RisultatoVibrazioni
  hav: RisultatoVibrazioni
}

export interface AvvisoDvrVibrazioni extends AvvisoVibrazioni {
  mansione?: string
}

export interface ValutazioneDvrVibrazioni {
  esiti: EsitoMansioneVibrazioni[]
  perFascia: Record<TipoVibrazione, Record<FasciaVibrazioni, string[]>>
  avvisi: AvvisoDvrVibrazioni[]
}

const vuoto = (): Record<FasciaVibrazioni, string[]> => ({ 0: [], 1: [], 2: [], 3: [] })

export function valutaDvrVibrazioni(mansioni: MansioneVibrazioni[], opzioni: OpzioniVibrazioni = {}): ValutazioneDvrVibrazioni {
  const avvisi: AvvisoDvrVibrazioni[] = []
  const conteggio = new Map<string, number>()
  mansioni.forEach((m) => conteggio.set(m.nome.trim().toLowerCase(), (conteggio.get(m.nome.trim().toLowerCase()) ?? 0) + 1))
  for (const [nome, n] of conteggio) {
    if (n > 1) avvisi.push({ livello: 'errore', codice: 'mansione_duplicata', messaggio: `Mansione ripetuta ${n} volte: ${nome}.` })
  }

  const esiti = mansioni.map((m) => {
    const wbv = valutaVibrazioni('wbv', m.wbv, opzioni)
    const hav = valutaVibrazioni('hav', m.hav, opzioni)
    ;[...wbv.avvisi, ...hav.avvisi].forEach((a) => avvisi.push({ ...a, mansione: m.nome }))
    return { mansione: m, wbv, hav }
  })

  // Stessa macchina, fase e regime/impugnatura con valori diversi tra le mansioni.
  for (const tipo of ['wbv', 'hav'] as const) {
    const valori = new Map<string, Set<number>>()
    for (const m of mansioni) {
      for (const p of m[tipo]) {
        if (p.origine === 'convenzionale') continue
        const k = [p.macchina ?? '', p.fase, p.dettaglio ?? ''].map((x) => x.trim().toLowerCase()).join(' – ')
        valori.set(k, (valori.get(k) ?? new Set()).add(p.a))
      }
    }
    for (const [k, v] of valori) {
      if (v.size > 1) {
        avvisi.push({
          livello: 'attenzione',
          codice: 'valori_incoerenti',
          messaggio: `${tipo.toUpperCase()} “${k}” ha valori diversi tra le mansioni: ${[...v].join(' / ')} m/s².`,
        })
      }
    }
  }

  const perFascia = { wbv: vuoto(), hav: vuoto() }
  esiti.forEach((e) => {
    perFascia.wbv[e.wbv.fascia].push(e.mansione.nome)
    perFascia.hav[e.hav.fascia].push(e.mansione.nome)
  })
  return { esiti, perFascia, avvisi }
}
