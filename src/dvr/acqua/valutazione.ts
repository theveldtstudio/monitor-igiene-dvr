/**
 * Monitoraggio delle acque di cantiere: punti di monitoraggio con la loro destinazione, misure di
 * campo (pH, conducibilità, temperatura, ossigeno disciolto) e confronto con i limiti della
 * destinazione:
 * - acque destinate al consumo umano: D.Lgs. 18/2023, allegato I parte C (parametri indicatori);
 * - scarico in acque superficiali e in fognatura: D.Lgs. 152/2006, parte III, allegato 5, tabella 3;
 * - solo monitoraggio: nessun limite (valori riportati come indicatori di processo).
 * I limiti si possono modificare per ogni punto (es. prescrizioni dell'autorizzazione allo scarico).
 */

export type Destinazione = 'consumo_umano' | 'scarico_superficiale' | 'scarico_fognatura' | 'monitoraggio'

export interface LimitiAcqua {
  phMin: number | null
  phMax: number | null
  /** µS/cm */
  conducibilitaMax: number | null
  /** °C */
  tMax: number | null
  /** mg/L */
  o2Min: number | null
}

export const DESTINAZIONI: Record<Destinazione, { nome: string; fonte: string; limiti: LimitiAcqua }> = {
  consumo_umano: {
    nome: 'Acqua destinata al consumo umano',
    fonte: 'D.Lgs. 18/2023, all. I parte C',
    limiti: { phMin: 6.5, phMax: 9.5, conducibilitaMax: 2500, tMax: null, o2Min: null },
  },
  scarico_superficiale: {
    nome: 'Scarico in acque superficiali',
    fonte: 'D.Lgs. 152/2006, all. 5 parte III, tab. 3',
    limiti: { phMin: 5.5, phMax: 9.5, conducibilitaMax: null, tMax: null, o2Min: null },
  },
  scarico_fognatura: {
    nome: 'Scarico in rete fognaria',
    fonte: 'D.Lgs. 152/2006, all. 5 parte III, tab. 3',
    limiti: { phMin: 5.5, phMax: 9.5, conducibilitaMax: null, tMax: null, o2Min: null },
  },
  monitoraggio: {
    nome: 'Solo monitoraggio (acque di processo, di galleria)',
    fonte: 'nessun limite',
    limiti: { phMin: null, phMax: null, conducibilitaMax: null, tMax: null, o2Min: null },
  },
}

export interface PuntoAcqua {
  id: string
  nome: string
  destinazione: Destinazione
  descrizione?: string
  /** limiti modificati (es. prescrizioni dell'autorizzazione) */
  limiti?: Partial<LimitiAcqua>
}

export interface MisuraAcqua {
  id: string
  puntoId: string
  data?: string
  ph: number | null
  /** µS/cm */
  conducibilita: number | null
  tAcqua: number | null
  tAmbiente: number | null
  o2Perc: number | null
  o2MgL: number | null
  note?: string
  misuraId?: string
}

export type Parametro = 'ph' | 'conducibilita' | 'tAcqua' | 'o2MgL'
export const PARAMETRI: { id: Parametro; nome: string; unita: string; decimali: number }[] = [
  { id: 'ph', nome: 'pH', unita: '', decimali: 1 },
  { id: 'conducibilita', nome: 'Conducibilità', unita: 'µS/cm', decimali: 0 },
  { id: 'tAcqua', nome: 'Temperatura dell’acqua', unita: '°C', decimali: 1 },
  { id: 'o2MgL', nome: 'Ossigeno disciolto', unita: 'mg/L', decimali: 1 },
]

export type Esito = 'conforme' | 'non conforme' | 'senza limite'

export function limitiPunto(p: PuntoAcqua): LimitiAcqua {
  const base = DESTINAZIONI[p.destinazione].limiti
  const o = p.limiti ?? {}
  const scegli = <K extends keyof LimitiAcqua>(k: K) => (o[k] !== undefined ? o[k]! : base[k])
  return { phMin: scegli('phMin'), phMax: scegli('phMax'), conducibilitaMax: scegli('conducibilitaMax'), tMax: scegli('tMax'), o2Min: scegli('o2Min') }
}

/** Esito di un parametro rispetto ai limiti (null se il parametro non è misurato). */
export function esitoParametro(par: Parametro, valore: number | null, l: LimitiAcqua): Esito | null {
  if (valore == null) return null
  const [min, max] = par === 'ph' ? [l.phMin, l.phMax] : par === 'conducibilita' ? [null, l.conducibilitaMax] : par === 'tAcqua' ? [null, l.tMax] : [l.o2Min, null]
  if (min == null && max == null) return 'senza limite'
  if ((min != null && valore < min) || (max != null && valore > max)) return 'non conforme'
  return 'conforme'
}

export function testoLimite(par: Parametro, l: LimitiAcqua): string {
  const f = (x: number) => String(x).replace('.', ',')
  if (par === 'ph') return l.phMin != null && l.phMax != null ? `${f(l.phMin)} – ${f(l.phMax)}` : l.phMin != null ? `≥ ${f(l.phMin)}` : l.phMax != null ? `≤ ${f(l.phMax)}` : '-'
  if (par === 'conducibilita') return l.conducibilitaMax != null ? `≤ ${f(l.conducibilitaMax)}` : '-'
  if (par === 'tAcqua') return l.tMax != null ? `≤ ${f(l.tMax)}` : '-'
  return l.o2Min != null ? `≥ ${f(l.o2Min)}` : '-'
}

const peggiore = (xs: (Esito | null)[]): Esito | null =>
  xs.includes('non conforme') ? 'non conforme' : xs.includes('conforme') ? 'conforme' : xs.includes('senza limite') ? 'senza limite' : null

export interface EsitoMisuraAcqua {
  misura: MisuraAcqua
  punto: PuntoAcqua | undefined
  esiti: Record<Parametro, Esito | null>
  esito: Esito | null
}

export interface EsitoPunto {
  punto: PuntoAcqua
  limiti: LimitiAcqua
  misure: EsitoMisuraAcqua[]
  intervalli: Record<Parametro, { min: number; max: number; n: number } | null>
  /** parametri con almeno una misura non conforme */
  nonConformi: Parametro[]
  esito: Esito | null
}

export interface ValutazioneAcqua {
  punti: EsitoPunto[]
  misure: EsitoMisuraAcqua[]
  avvisi: { livello: 'errore' | 'attenzione'; messaggio: string }[]
}

export function valutaAcqua(punti: PuntoAcqua[], misure: MisuraAcqua[]): ValutazioneAcqua {
  const avvisi: ValutazioneAcqua['avvisi'] = []
  const perId = new Map(punti.map((p) => [p.id, p]))
  const esitiMisure: EsitoMisuraAcqua[] = misure.map((m) => {
    const punto = perId.get(m.puntoId)
    if (!punto) avvisi.push({ livello: 'errore', messaggio: `Una misura del ${m.data || 'giorno non indicato'} non ha un punto di monitoraggio.` })
    const l = punto ? limitiPunto(punto) : DESTINAZIONI.monitoraggio.limiti
    const esiti = Object.fromEntries(PARAMETRI.map((p) => [p.id, esitoParametro(p.id, m[p.id], l)])) as Record<Parametro, Esito | null>
    return { misura: m, punto, esiti, esito: peggiore(Object.values(esiti)) }
  })
  const esitiPunti: EsitoPunto[] = punti.map((p) => {
    const ms = esitiMisure.filter((e) => e.misura.puntoId === p.id)
    if (!ms.length) avvisi.push({ livello: 'attenzione', messaggio: `${p.nome}: nessuna misura.` })
    const intervalli = Object.fromEntries(
      PARAMETRI.map((par) => {
        const vs = ms.map((e) => e.misura[par.id]).filter((x): x is number => x != null)
        return [par.id, vs.length ? { min: Math.min(...vs), max: Math.max(...vs), n: vs.length } : null]
      }),
    ) as EsitoPunto['intervalli']
    const nonConformi = PARAMETRI.filter((par) => ms.some((e) => e.esiti[par.id] === 'non conforme')).map((par) => par.id)
    return { punto: p, limiti: limitiPunto(p), misure: ms, intervalli, nonConformi, esito: peggiore(ms.map((e) => e.esito)) }
  })
  return { punti: esitiPunti, misure: esitiMisure, avvisi }
}
