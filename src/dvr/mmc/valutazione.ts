/**
 * Valutazione del DVR Movimentazione manuale dei carichi: ogni attività ha un metodo (NIOSH semplice
 * o composto, Snook e Ciriello, check list OCRA) e le mansioni che la svolgono.
 * Il livello di rischio comune ai metodi serve per il riepilogo, le conclusioni e il piano.
 */
import { valutaNiosh, valutaNioshComposto, type CompitoNiosh, type RisultatoComposto, type RisultatoNiosh } from './niosh'
import { valutaOcra, type CompitoOcra } from './ocra'
import { valutaSnook, type CompitoSnook, type RisultatoSnook } from './snook'

export type MetodoMmc = 'niosh' | 'niosh_composto' | 'snook' | 'ocra'

export const ETICHETTE_METODO: Record<MetodoMmc, string> = {
  niosh: 'NIOSH',
  niosh_composto: 'NIOSH composto',
  snook: 'Snook e Ciriello',
  ocra: 'Check list OCRA',
}

export interface AttivitaMmc {
  id: string
  titolo: string
  /** descrizione sintetica per l'elenco del capitolo 4 (se manca, il primo paragrafo della descrizione) */
  sintesi?: string
  /** descrizione dell'attività e delle ipotesi di calcolo; paragrafi separati da una riga vuota */
  descrizione: string
  /** id delle mansioni che svolgono l'attività */
  mansioni: string[]
  metodo: MetodoMmc
  /** NIOSH: un compito; NIOSH composto: due o più compiti */
  compiti?: CompitoNiosh[]
  /** misura di campo da cui è stata importata l'attività */
  misuraId?: string | null
  snook?: CompitoSnook
  ocra?: CompitoOcra
}

/** 0 nullo/accettabile, 1 da tenere sotto controllo, 2 presente, 3 elevato */
export type LivelloMmc = 0 | 1 | 2 | 3

export const ETICHETTE_LIVELLO: Record<LivelloMmc, string> = {
  0: 'accettabile',
  1: 'significativo',
  2: 'presente',
  3: 'elevato',
}

export interface EsitoAttivitaMmc {
  attivita: AttivitaMmc
  niosh?: RisultatoNiosh
  composto?: RisultatoComposto
  snook?: RisultatoSnook
  ocra?: ReturnType<typeof valutaOcra>
  /** livello per i maschi adulti e per giovani e anziani (per Snook e OCRA coincidono) */
  livello: { adulti: LivelloMmc; anziani: LivelloMmc }
}

export interface AvvisoMmc {
  livello: 'errore' | 'attenzione'
  codice: string
  messaggio: string
  attivita?: string
}

const OCRA_LIVELLO: Record<number, LivelloMmc> = { 1: 0, 2: 1, 3: 2, 4: 2, 5: 3 }

export function valutaAttivita(a: AttivitaMmc): { esito: EsitoAttivitaMmc | null; avvisi: AvvisoMmc[] } {
  const avvisi: AvvisoMmc[] = []
  const errore = (codice: string, messaggio: string) => avvisi.push({ livello: 'errore', codice, messaggio, attivita: a.titolo })
  const attenzione = (codice: string, messaggio: string) => avvisi.push({ livello: 'attenzione', codice, messaggio, attivita: a.titolo })
  if (!a.mansioni.length) attenzione('senza_mansioni', 'Nessuna mansione associata: l’attività non compare nel riepilogo.')

  if (a.metodo === 'niosh' || a.metodo === 'niosh_composto') {
    const compiti = a.compiti ?? []
    if (a.metodo === 'niosh' && compiti.length !== 1) {
      errore('compiti', 'Il metodo NIOSH semplice richiede un solo sollevamento.')
      return { esito: null, avvisi }
    }
    if (a.metodo === 'niosh_composto' && compiti.length < 2) {
      errore('compiti', 'L’indice composto richiede almeno due compiti di sollevamento.')
      return { esito: null, avvisi }
    }
    if (compiti.some((c) => !(c.peso > 0))) {
      errore('peso', 'Manca il peso sollevato.')
      return { esito: null, avvisi }
    }
    if (compiti.some((c) => c.peso / Math.max(1, c.persone ?? 1) < 3)) {
      attenzione('peso_basso', 'Carico inferiore a 3 kg per lavoratore: di norma non comporta rischio di sovraccarico e si può escludere.')
    }
    if (a.metodo === 'niosh_composto' && new Set(compiti.map((c) => c.durata)).size > 1) {
      attenzione('durate', 'Compiti con durata diversa: per l’indice composto si usa la durata del primo.')
    }
    if (a.metodo === 'niosh') {
      const niosh = valutaNiosh(compiti[0])
      return { esito: { attivita: a, niosh, livello: { adulti: niosh.adulti.fascia, anziani: niosh.anziani.fascia } }, avvisi }
    }
    const composto = valutaNioshComposto(compiti)
    return { esito: { attivita: a, composto, livello: { adulti: composto.adulti.fascia, anziani: composto.anziani.fascia } }, avvisi }
  }

  if (a.metodo === 'snook') {
    if (!a.snook || !(a.snook.valore > 0)) {
      errore('snook', 'Mancano i dati per Snook e Ciriello (peso o forza).')
      return { esito: null, avvisi }
    }
    const snook = valutaSnook(a.snook)
    snook.avvisi.forEach((x) => attenzione(x.codice, x.messaggio))
    return { esito: { attivita: a, snook, livello: { adulti: snook.fascia, anziani: snook.fascia } }, avvisi }
  }

  if (!a.ocra || (a.ocra.dx == null && a.ocra.sx == null)) {
    errore('ocra', 'Manca il punteggio della check list OCRA.')
    return { esito: null, avvisi }
  }
  const ocra = valutaOcra(a.ocra)
  const l = OCRA_LIVELLO[ocra.fascia]
  return { esito: { attivita: a, ocra, livello: { adulti: l, anziani: l } }, avvisi }
}

export interface MansioneMmc {
  id: string
  nome: string
  attivita?: string
}

export interface ValutazioneDvrMmc {
  esiti: EsitoAttivitaMmc[]
  perMansione: { mansione: MansioneMmc; esiti: EsitoAttivitaMmc[]; livello: { adulti: LivelloMmc; anziani: LivelloMmc } }[]
  avvisi: AvvisoMmc[]
}

export function valutaDvrMmc(mansioni: MansioneMmc[], attivita: AttivitaMmc[]): ValutazioneDvrMmc {
  const avvisi: AvvisoMmc[] = []
  const esiti: EsitoAttivitaMmc[] = []
  for (const a of attivita) {
    const r = valutaAttivita(a)
    avvisi.push(...r.avvisi)
    if (r.esito) esiti.push(r.esito)
  }
  const ids = new Set(mansioni.map((m) => m.id))
  for (const a of attivita) {
    const fuori = a.mansioni.filter((id) => !ids.has(id))
    if (fuori.length) {
      avvisi.push({ livello: 'attenzione', codice: 'mansione_fuori_dvr', attivita: a.titolo, messaggio: `${fuori.length} mansione/i associate non sono incluse nel DVR.` })
    }
  }
  const perMansione = mansioni.map((m) => {
    const proprie = esiti.filter((e) => e.attivita.mansioni.includes(m.id))
    const max = (k: 'adulti' | 'anziani') => Math.max(0, ...proprie.map((e) => e.livello[k])) as LivelloMmc
    return { mansione: m, esiti: proprie, livello: { adulti: max('adulti'), anziani: max('anziani') } }
  })
  return { esiti, perMansione, avvisi }
}
