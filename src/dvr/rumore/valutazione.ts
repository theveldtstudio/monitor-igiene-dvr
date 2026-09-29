/**
 * Valutazione completa del DVR Rumore di un cantiere: mette insieme i risultati per mansione,
 * le verifiche dei DPI e i controlli di coerenza tra le tabelle.
 * L'uscita è pronta per riempire il documento Word.
 */
import { arrotonda } from '../comune/numeri'
import {
  SOGLIE,
  valutaMansione,
  type Avviso,
  type Fascia,
  type OpzioniCalcolo,
  type PeriodoEsposizione,
  type RisultatoMansione,
} from './calcolo'
import { lexConDpi, verificaFase, type DpiUdito, type VerificaFaseDpi } from './dpi'

export interface MansioneRumore {
  id: string
  nome: string
  attivita?: string
  periodi: PeriodoEsposizione[]
  /** Esposizione anche a vibrazioni (HAV o WBV): dalla valutazione vibrazioni. */
  vibrazioni: boolean
  /** Esposizione anche a sostanze ototossiche: dalla valutazione chimica. */
  ototossiche: boolean
}

export interface InputDvrRumore {
  mansioni: MansioneRumore[]
  dpi: DpiUdito[]
  opzioni?: OpzioniCalcolo
}

export interface EsitoMansione extends RisultatoMansione {
  mansione: MansioneRumore
  /** LEX,8h con ciascun DPI indossato nei periodi sopra 80 dB(A), nello stesso ordine di `dpi`. */
  lexConDpi: number[]
}

export interface RigaVerificaDpi {
  fase: string
  postazione: string
  mansioniEsposte: string[]
  verifica: VerificaFaseDpi
}

export interface VerificaDpi {
  dpi: DpiUdito
  righe: RigaVerificaDpi[]
  tuttiAdeguati: boolean
  livelloMinimo: number | null
  livelloMassimo: number | null
}

export interface AvvisoDvr extends Avviso {
  mansione?: string
}

export interface ValutazioneDvrRumore {
  esiti: EsitoMansione[]
  perFascia: Record<Fascia, string[]>
  verificheDpi: VerificaDpi[]
  /** true se con almeno un DPI adeguato nessuna mansione supera il valore limite di 87 dB(A). */
  limiteRispettatoConDpi: boolean
  avvisi: AvvisoDvr[]
}

const chiaveFase = (p: PeriodoEsposizione) => `${p.fase.trim().toLowerCase()}|${p.postazione.trim().toLowerCase()}`

export function valutaDvrRumore(input: InputDvrRumore): ValutazioneDvrRumore {
  const avvisi: AvvisoDvr[] = []

  // Mansioni duplicate: una sola TAV per mansione.
  const visti = new Map<string, number>()
  for (const m of input.mansioni) {
    const k = m.nome.trim().toLowerCase()
    visti.set(k, (visti.get(k) ?? 0) + 1)
  }
  for (const [nome, n] of visti) {
    if (n > 1) avvisi.push({ livello: 'errore', codice: 'mansione_duplicata', messaggio: `Mansione ripetuta ${n} volte: ${nome}.` })
  }

  const esiti: EsitoMansione[] = input.mansioni.map((m) => {
    const r = valutaMansione(m.periodi, input.opzioni)
    r.avvisi.forEach((a) => avvisi.push({ ...a, mansione: m.nome }))
    return {
      ...r,
      mansione: m,
      lexConDpi: input.dpi.map((d) => arrotonda(lexConDpi(m.periodi, d), 1)),
    }
  })

  // Stessa fase e postazione con livelli diversi in mansioni diverse: di solito è un errore di copia.
  const livelliPerFase = new Map<string, Set<number>>()
  for (const m of input.mansioni) {
    for (const p of m.periodi) {
      if (p.origine === 'convenzionale') continue
      const k = chiaveFase(p)
      if (!livelliPerFase.has(k)) livelliPerFase.set(k, new Set())
      livelliPerFase.get(k)!.add(p.laeq)
    }
  }
  for (const [k, livelli] of livelliPerFase) {
    if (livelli.size > 1) {
      const [fase, postazione] = k.split('|')
      avvisi.push({
        livello: 'attenzione',
        codice: 'livelli_incoerenti',
        messaggio: `"${fase}" (${postazione}) ha livelli diversi tra le mansioni: ${[...livelli].join(' / ')} dB(A).`,
      })
    }
  }

  const perFascia: Record<Fascia, string[]> = { 1: [], 2: [], 3: [] }
  esiti.forEach((e) => perFascia[e.fascia].push(e.mansione.nome))

  // Verifica DPI: una riga per fase/postazione con LAeq > 80 dB(A) o picco > 135 dB(C).
  const fasiRumorose = new Map<string, { periodo: PeriodoEsposizione; mansioni: Set<string> }>()
  for (const m of input.mansioni) {
    for (const p of m.periodi) {
      const rumorosa = p.laeq > SOGLIE.lexInferiore || (p.lpeak ?? 0) > SOGLIE.piccoInferiore
      if (!rumorosa) continue
      const k = `${chiaveFase(p)}|${p.laeq}`
      if (!fasiRumorose.has(k)) fasiRumorose.set(k, { periodo: p, mansioni: new Set() })
      fasiRumorose.get(k)!.mansioni.add(m.nome)
    }
  }
  const verificheDpi: VerificaDpi[] = input.dpi.map((dpi) => {
    const righe = [...fasiRumorose.values()].map(({ periodo, mansioni }) => ({
      fase: periodo.fase,
      postazione: periodo.postazione,
      mansioniEsposte: [...mansioni],
      verifica: verificaFase(dpi, periodo),
    }))
    const livelli = righe.map((r) => r.verifica.livelloConDpi)
    return {
      dpi,
      righe,
      tuttiAdeguati: righe.every((r) => r.verifica.adeguato),
      livelloMinimo: livelli.length ? Math.min(...livelli) : null,
      livelloMassimo: livelli.length ? Math.max(...livelli) : null,
    }
  })

  const indiciAdeguati = verificheDpi.map((v, i) => (v.tuttiAdeguati ? i : -1)).filter((i) => i >= 0)
  const limiteRispettatoConDpi =
    input.dpi.length === 0
      ? esiti.every((e) => e.lexArrotondato < SOGLIE.lexLimite)
      : esiti.every((e) => indiciAdeguati.some((i) => e.lexConDpi[i] < SOGLIE.lexLimite))

  return { esiti, perFascia, verificheDpi, limiteRispettatoConDpi, avvisi }
}
