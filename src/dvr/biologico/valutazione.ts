/**
 * Valutazione del rischio biologico (D.Lgs. 81/08, Titolo X) per un cantiere, dove l'esposizione è
 * potenziale (art. 271 c. 4: l'attività non prevede l'uso deliberato di agenti biologici).
 * - Agenti biologici potenziali: gruppo di pericolosità (art. 268, allegato XLVI), probabilità
 *   P 1–4 scelta dal tecnico, danno D dal gruppo (modificabile), R = P × D, classi di rischio.
 * - Carica microbica dell'aria (campionatore SAS): batteri a 22 °C e a 36 °C, muffe e lieviti in
 *   UFC/m³, classificati con le categorie indicative della European Collaborative Action, report
 *   n. 12 (1993), per gli ambienti non industriali. Non sono limiti di legge.
 */

export type Gruppo = 1 | 2 | 3 | 4

export interface AgenteBiologico {
  id: string
  nome: string
  gruppo: Gruppo
  /** malattia o effetto (es. tetano) */
  malattia: string
  /** via di trasmissione e sorgente (es. ferite con materiale contaminato da terra) */
  trasmissione: string
  /** attività e luoghi in cui è possibile l'esposizione */
  attivita: string
  mansioni?: string[]
  /** probabilità 1–4 */
  probabilita: number
  /** danno 1–4; se vuoto = gruppo */
  danno?: number | null
  /** vaccino disponibile (testo) */
  vaccino?: string
}

export interface MisuraSas {
  id: string
  postazione: string
  fase?: string
  data?: string
  volume?: number | null
  /** UFC/m³ */
  conta22: number | null
  conta36: number | null
  muffe: number | null
  note?: string
  misuraId?: string
}

export type ClasseRischio = 'trascurabile' | 'basso' | 'medio' | 'alto'

export const CLASSI: { classe: ClasseRischio; da: number; a: number; azioni: string }[] = [
  { classe: 'trascurabile', da: 1, a: 2, azioni: 'Misure generali di igiene e informazione dei lavoratori.' },
  { classe: 'basso', da: 3, a: 4, azioni: 'Misure generali, formazione e controllo periodico.' },
  { classe: 'medio', da: 6, a: 8, azioni: 'Misure specifiche di prevenzione e DPI, sorveglianza sanitaria secondo il medico competente.' },
  { classe: 'alto', da: 9, a: 16, azioni: 'Misure specifiche con priorità, DPI, sorveglianza sanitaria e verifica dell’efficacia.' },
]

export const GRUPPI: Record<Gruppo, string> = {
  1: 'Agente che presenta poche probabilità di causare malattie in soggetti umani.',
  2: 'Agente che può causare malattie in soggetti umani e costituire un rischio per i lavoratori; è poco probabile che si propaghi nella comunità; sono di norma disponibili efficaci misure profilattiche o terapeutiche.',
  3: 'Agente che può causare malattie gravi in soggetti umani e costituisce un serio rischio per i lavoratori; può propagarsi nella comunità, ma di norma sono disponibili efficaci misure profilattiche o terapeutiche.',
  4: 'Agente che può provocare malattie gravi in soggetti umani e costituisce un serio rischio per i lavoratori; può presentare un elevato rischio di propagazione nella comunità; non sono disponibili, di norma, efficaci misure profilattiche o terapeutiche.',
}

export function classeRischio(r: number): ClasseRischio {
  return (CLASSI.find((c) => r <= c.a) ?? CLASSI[CLASSI.length - 1]).classe
}
export const ORDINE: ClasseRischio[] = CLASSI.map((c) => c.classe)
export const peggiore = (xs: ClasseRischio[]): ClasseRischio | null => (xs.length ? xs.reduce((a, b) => (ORDINE.indexOf(b) > ORDINE.indexOf(a) ? b : a)) : null)

/** Categorie ECA (1993) per la carica microbica dell'aria negli ambienti non industriali, UFC/m³. */
export type CategoriaAria = 'molto bassa' | 'bassa' | 'intermedia' | 'alta' | 'molto alta'
export const CATEGORIE_ARIA: { categoria: CategoriaAria; batteri: number; funghi: number }[] = [
  { categoria: 'molto bassa', batteri: 50, funghi: 25 },
  { categoria: 'bassa', batteri: 100, funghi: 100 },
  { categoria: 'intermedia', batteri: 500, funghi: 500 },
  { categoria: 'alta', batteri: 2000, funghi: 2000 },
  { categoria: 'molto alta', batteri: Infinity, funghi: Infinity },
]
const ORDINE_ARIA = CATEGORIE_ARIA.map((c) => c.categoria)

export function categoriaAria(ufc: number | null | undefined, tipo: 'batteri' | 'funghi'): CategoriaAria | null {
  if (ufc == null || !Number.isFinite(ufc)) return null
  return CATEGORIE_ARIA.find((c) => ufc < c[tipo])!.categoria
}

export interface EsitoAgente {
  agente: AgenteBiologico
  d: number
  r: number
  classe: ClasseRischio
}

export interface EsitoMisuraSas {
  misura: MisuraSas
  c22: CategoriaAria | null
  c36: CategoriaAria | null
  muffe: CategoriaAria | null
  peggiore: CategoriaAria | null
}

export interface ValutazioneBiologica {
  agenti: EsitoAgente[]
  misure: EsitoMisuraSas[]
  mansioni: { mansione: { id: string; nome: string }; agenti: EsitoAgente[]; classe: ClasseRischio | null }[]
  avvisi: { livello: 'errore' | 'attenzione'; messaggio: string }[]
}

const limita = (x: number) => Math.min(4, Math.max(1, Math.round(x)))

export function valutaBiologico(agenti: AgenteBiologico[], misure: MisuraSas[], mansioni: { id: string; nome: string }[]): ValutazioneBiologica {
  const avvisi: ValutazioneBiologica['avvisi'] = []
  const esiti = agenti.map((a) => {
    const d = limita(a.danno ?? a.gruppo)
    const r = limita(a.probabilita) * d
    if (!a.nome.trim()) avvisi.push({ livello: 'errore', messaggio: 'Un agente biologico non ha il nome.' })
    if (a.gruppo === 4) avvisi.push({ livello: 'attenzione', messaggio: `${a.nome}: agente del gruppo 4, verificare la valutazione con il medico competente.` })
    return { agente: a, d, r, classe: classeRischio(r) }
  })
  const esitiMisure = misure.map((m) => {
    const c22 = categoriaAria(m.conta22, 'batteri')
    const c36 = categoriaAria(m.conta36, 'batteri')
    const muffe = categoriaAria(m.muffe, 'funghi')
    const cs = [c22, c36, muffe].filter((x): x is CategoriaAria => x != null)
    const p = cs.length ? cs.reduce((a, b) => (ORDINE_ARIA.indexOf(b) > ORDINE_ARIA.indexOf(a) ? b : a)) : null
    if (!cs.length) avvisi.push({ livello: 'attenzione', messaggio: `Misura SAS ${m.postazione || '(senza postazione)'}: nessun risultato.` })
    return { misura: m, c22, c36, muffe, peggiore: p }
  })
  const perMansione = mansioni.map((mn) => {
    // un agente senza mansioni indicate riguarda tutte le mansioni
    const ag = esiti.filter((e) => !e.agente.mansioni?.length || e.agente.mansioni.includes(mn.id))
    return { mansione: mn, agenti: ag, classe: peggiore(ag.map((e) => e.classe)) }
  })
  if (!agenti.length) avvisi.push({ livello: 'errore', messaggio: 'Nessun agente biologico: caricare l’elenco proposto o aggiungerne.' })
  return { agenti: esiti, misure: esitiMisure, mansioni: perMansione, avvisi }
}

export const indiceAria = (c: CategoriaAria) => ORDINE_ARIA.indexOf(c)
