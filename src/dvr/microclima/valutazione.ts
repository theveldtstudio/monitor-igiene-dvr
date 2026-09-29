/**
 * Valutazione del DVR Microclima. Quattro scenari, come i DVR modello:
 * - galleria_inverno: rilievi in galleria, ambiente moderato → PMV/PPD per lavorazione;
 * - galleria_estate: rilievi in galleria, ambiente caldo → WBGTi per lavorazione e confronto con il limite;
 * - esterno_estate: dati meteo medi mensili → PMV/PPD per mese; giornata di picco → WBGTe;
 * - esterno_inverno: dati meteo medi mensili → PMV/PPD per mese; giornate peggiori → IREQ, DLE e WCI.
 */
import { arrotonda } from '../comune/numeri'
import {
  categoriaComfort,
  classeIreq,
  dle,
  effettoWci,
  ireq,
  limiteWbgt,
  pmv,
  ppd,
  radianteDaGlobo,
  wbgtEsterno,
  wbgtInterno,
  wci,
  type CategoriaComfort,
  type ClasseIreq,
} from './indici'

export type ScenarioMicroclima = 'galleria_inverno' | 'galleria_estate' | 'esterno_estate' | 'esterno_inverno'

export const ETICHETTE_SCENARIO: Record<ScenarioMicroclima, string> = {
  galleria_inverno: 'Interno galleria – periodo invernale (PMV/PPD sui rilievi)',
  galleria_estate: 'Interno galleria – periodo estivo (WBGT sui rilievi)',
  esterno_estate: 'Attività in esterno – periodo estivo (PMV/PPD su dati meteo, WBGTe nella giornata di picco)',
  esterno_inverno: 'Attività in esterno – periodo invernale (PMV/PPD su dati meteo, IREQ e WCI nelle giornate peggiori)',
}

export const conRilievi = (s: ScenarioMicroclima) => s === 'galleria_inverno' || s === 'galleria_estate'
export const estivo = (s: ScenarioMicroclima) => s === 'galleria_estate' || s === 'esterno_estate'

export interface RilievoMicroclima {
  id: string
  codice: string
  data: string
  fase: string
  postazione: string
  ta: number
  tg: number
  tnw: number | null
  ur: number
  va: number
  /** temperatura di rugiada, se registrata */
  trugiada?: number | null
  /** misura dell'app da cui è stato importato */
  misuraId?: string
}

export interface LavorazioneMicroclima {
  id: string
  fase: string
  /** id delle mansioni coinvolte */
  mansioni: string[]
  /** dispendio metabolico [met] */
  met: number
  /** rilievo usato (scenari con misure) */
  rilievo?: string | null
}

export interface MeseMeteo {
  mese: string
  /** medie del mese */
  ta: number
  ur: number
  va: number
  /** minimo e massimo delle medie giornaliere di temperatura (solo per la tabella dei dati meteo) */
  taMin?: number | null
  taMax?: number | null
  /** temperatura media radiante (se nota; altrimenti = ta) */
  tr?: number | null
  /** giornata peggiore del mese (inverno: IREQ e WCI) */
  peggiore?: { ta: number; ur: number; va: number } | null
}

export interface ParametriMicroclima {
  scenario: ScenarioMicroclima
  /** isolamento del vestiario [clo] */
  clo: number
  /** diametro del globotermometro [m] */
  diametroGlobo?: number
  acclimatati?: boolean
  meteo?: {
    /** fonte dei dati, es. "www.ilmeteo.it" */
    fonte?: string
    /** stazione meteo, es. "Campomorone (GE)" */
    stazione?: string
    /** anni di riferimento, es. "2023–2025" */
    periodo?: string
    mesi: MeseMeteo[]
    /** estate: giornata più gravosa per il WBGTe */
    picco?: { data?: string; ta: number; ur: number; va: number; tg: number; tnw: number } | null
  }
}

export interface MansioneMicroclima {
  id: string
  nome: string
  attivita?: string
}

/** 0 accettabile, 1 discomfort o esposizione da limitare, 2 rischio per la salute */
export type LivelloMicroclima = 0 | 1 | 2

export interface EsitoPmv {
  pmv: number
  ppd: number
  categoria: CategoriaComfort
}

export interface EsitoLavorazione {
  lavorazione: LavorazioneMicroclima
  rilievo?: RilievoMicroclima
  /** galleria_inverno */
  comfort?: EsitoPmv & { tr: number }
  /** galleria_estate */
  wbgt?: { valore: number; limite: number; superato: boolean }
  /** scenari esterni: un esito per mese */
  mesi?: { mese: string; comfort: EsitoPmv; freddo?: { min: number; neu: number; classe: ClasseIreq; dle: number } | null }[]
  /** esterno_estate: giornata di picco */
  picco?: { valore: number; limite: number; superato: boolean } | null
  livello: LivelloMicroclima
}

export interface AvvisoMicroclima {
  livello: 'errore' | 'attenzione'
  codice: string
  messaggio: string
}

export interface ValutazioneMicroclima {
  esiti: EsitoLavorazione[]
  wci: { mese: string; ta: number; va: number; valore: number; effetto: string; intervallo: string }[]
  piccoWbgt: number | null
  perMansione: { mansione: MansioneMicroclima; livello: LivelloMicroclima; esiti: EsitoLavorazione[] }[]
  /** temperatura dell'aria e umidità dei rilievi: media, minima, massima */
  temperature: { media: number; min: number; max: number; urMin: number; urMax: number } | null
  avvisi: AvvisoMicroclima[]
}

const r1 = (x: number) => arrotonda(x, 1)
const livelloComfort = (c: CategoriaComfort): LivelloMicroclima => (c === 'D' ? 1 : 0)
const livelloIreq = (c: ClasseIreq): LivelloMicroclima => (c === 'C' ? 2 : c === 'B' ? 1 : 0)

function comfort(ta: number, tr: number, va: number, ur: number, met: number, clo: number): EsitoPmv {
  const p = pmv({ ta, tr, va, ur, met, clo })
  return { pmv: p, ppd: ppd(p), categoria: categoriaComfort(p) }
}

export function valutaMicroclima(
  parametri: ParametriMicroclima,
  lavorazioni: LavorazioneMicroclima[],
  rilievi: RilievoMicroclima[],
  mansioni: MansioneMicroclima[],
): ValutazioneMicroclima {
  const avvisi: AvvisoMicroclima[] = []
  const { scenario, clo } = parametri
  const diametro = parametri.diametroGlobo ?? 0.15
  const acclimatati = parametri.acclimatati ?? true
  const perId = new Map(rilievi.map((r) => [r.id, r]))
  const mesi = parametri.meteo?.mesi ?? []
  const picco = parametri.meteo?.picco ?? null
  const piccoWbgt = scenario === 'esterno_estate' && picco ? wbgtEsterno(picco.tnw, picco.tg, picco.ta) : null

  if (!conRilievi(scenario) && !mesi.length) avvisi.push({ livello: 'errore', codice: 'meteo', messaggio: 'Mancano i dati meteo mensili.' })
  if (scenario === 'esterno_estate' && !picco) avvisi.push({ livello: 'attenzione', codice: 'picco', messaggio: 'Manca la giornata di picco: il WBGTe non viene calcolato.' })

  const esiti: EsitoLavorazione[] = []
  for (const l of lavorazioni) {
    if (!(l.met > 0)) {
      avvisi.push({ livello: 'errore', codice: 'met', messaggio: `“${l.fase}”: manca il dispendio metabolico.` })
      continue
    }
    if (!l.mansioni.length) avvisi.push({ livello: 'attenzione', codice: 'mansioni', messaggio: `“${l.fase}”: nessuna mansione associata.` })
    if (conRilievi(scenario)) {
      const r = l.rilievo ? perId.get(l.rilievo) : undefined
      if (!r) {
        avvisi.push({ livello: 'errore', codice: 'rilievo', messaggio: `“${l.fase}”: manca il rilievo microclimatico.` })
        continue
      }
      if (scenario === 'galleria_inverno') {
        const tr = radianteDaGlobo(r.tg, r.ta, r.va, diametro)
        if (r.ta < 10 || r.ta > 30) {
          avvisi.push({ livello: 'attenzione', codice: 'campo_pmv', messaggio: `${r.codice}: temperatura ${r1(r.ta)} °C fuori dal campo di validità del PMV (10–30 °C).` })
        }
        const c = { ...comfort(r.ta, tr, r.va, r.ur, l.met, clo), tr }
        esiti.push({ lavorazione: l, rilievo: r, comfort: c, livello: livelloComfort(c.categoria) })
      } else {
        if (r.tnw == null) {
          avvisi.push({ livello: 'errore', codice: 'tnw', messaggio: `${r.codice}: manca la temperatura di bulbo umido naturale.` })
          continue
        }
        const valore = r1(wbgtInterno(r.tnw, r.tg))
        const limite = limiteWbgt(l.met, acclimatati)
        esiti.push({ lavorazione: l, rilievo: r, wbgt: { valore, limite, superato: valore > limite }, livello: valore > limite ? 2 : 0 })
      }
      continue
    }
    const perMese = mesi.map((m) => {
      const c = comfort(m.ta, m.tr ?? m.ta, m.va, m.ur, l.met, clo)
      let freddo = null
      if (scenario === 'esterno_inverno' && m.peggiore) {
        const p = { ta: m.peggiore.ta, tr: m.peggiore.ta, va: m.peggiore.va, ur: m.peggiore.ur, met: l.met }
        const r = ireq(p)
        freddo = { min: r.min, neu: r.neu, classe: classeIreq(clo, r), dle: dle(p, clo) }
      }
      return { mese: m.mese, comfort: c, freddo }
    })
    let livello: LivelloMicroclima = Math.max(0, ...perMese.map((x) => Math.max(livelloComfort(x.comfort.categoria), x.freddo ? livelloIreq(x.freddo.classe) : 0))) as LivelloMicroclima
    let piccoEsito = null
    if (piccoWbgt !== null) {
      const limite = limiteWbgt(l.met, acclimatati)
      const valore = r1(piccoWbgt)
      piccoEsito = { valore, limite, superato: valore > limite }
      if (piccoEsito.superato) livello = 2
    }
    esiti.push({ lavorazione: l, mesi: perMese, picco: piccoEsito, livello })
  }

  const wciMesi =
    scenario === 'esterno_inverno'
      ? mesi
          .filter((m) => m.peggiore)
          .map((m) => {
            const valore = Math.round(wci(m.peggiore!.ta, m.peggiore!.va))
            return { mese: m.mese, ta: m.peggiore!.ta, va: m.peggiore!.va, valore, ...effettoWci(valore) }
          })
      : []

  const perMansione = mansioni.map((m) => {
    const proprie = esiti.filter((e) => e.lavorazione.mansioni.includes(m.id))
    let livello = Math.max(0, ...proprie.map((e) => e.livello)) as LivelloMicroclima
    if (proprie.length && wciMesi.some((w) => w.valore >= 1200)) livello = 2
    return { mansione: m, livello, esiti: proprie }
  })

  const usati = [...new Set(esiti.map((e) => e.rilievo).filter((r): r is RilievoMicroclima => !!r))]
  const ta = usati.map((r) => r.ta)
  const temperature = usati.length
    ? {
        media: r1(ta.reduce((s, x) => s + x, 0) / ta.length),
        min: r1(Math.min(...ta)),
        max: r1(Math.max(...ta)),
        urMin: r1(Math.min(...usati.map((r) => r.ur))),
        urMax: r1(Math.max(...usati.map((r) => r.ur))),
      }
    : null

  return { esiti, wci: wciMesi, piccoWbgt: piccoWbgt === null ? null : r1(piccoWbgt), perMansione, temperature, avvisi }
}
