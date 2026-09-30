/**
 * Dal database ai DVR Agenti chimici, Fumi di saldatura e Agenti cancerogeni.
 * - Ambienti di lavoro con le misure e testi nei contenuti del documento (`contenuti.chimico`);
 *   le misure di polveri, gas e carbonio elementare delle campagne si importano raggruppate per
 *   fase e postazione.
 * - Giornata tipo per mansione nella matrice dei tempi (`dvr_tempi`): ogni riga indica l'ambiente
 *   di cui usa le concentrazioni (`valori.ambiente`) oppure concentrazioni scritte a mano
 *   (`valori.concentrazioni`, es. pausa o dato storico).
 */
import type { MisuraRumore as MisuraCampagna, RigaTempi } from '../api'
import type { Ingresso } from '../comune/ingresso'
import type { BloccoTesto } from '../rumore/testiPredefiniti'
import { meseAnno } from '../rumore/daDatabase'
import { AGENTI_PREDEFINITI, CAMPAGNE_PER_TIPO, type TipoDvrChimico } from './agenti'
import type { DatiDvrChimico } from './documento'
import type { TestiChimico } from './testi'
import type { AmbienteChimico, MisuraAmbiente, PeriodoChimico } from './valutazione'

export interface ContenutiChimico {
  ambienti: AmbienteChimico[]
  /** limiti e gravità modificati (id agente → valori) */
  agenti?: DatiDvrChimico['agenti']
  testi?: TestiChimico
}

export const RISCHI_CHIMICI = ['chimico', 'fumi_saldatura', 'cancerogeno'] as const
export const eRischioChimico = (r: string): r is TipoDvrChimico => (RISCHI_CHIMICI as readonly string[]).includes(r)

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const testo = (x: unknown): string => (typeof x === 'string' ? x.trim() : Array.isArray(x) ? x.filter((y) => typeof y === 'string').join('; ') : '')

let contatore = 0
export const nuovoId = (prefisso = 'amb') => `${prefisso}-${Date.now().toString(36)}-${(++contatore).toString(36)}`

const TIPO_MISURA: Record<string, string> = { personale: 'P', ambientale: 'A', puntuale: 'A' }

/** Una misura dell'app (polveri, gas, carbonio elementare) come riga di un ambiente. */
export function misuraAmbiente(m: MisuraCampagna, tipo: TipoDvrChimico): MisuraAmbiente | null {
  if (!CAMPAGNE_PER_TIPO[tipo].includes(m.campagna.tipo_campionamento)) return null
  const d = m.misura.dati
  const valori: Record<string, number | null> = {}
  for (const ag of AGENTI_PREDEFINITI[tipo]) {
    if (!ag.campo) continue
    const v = num(d[ag.campo])
    if (v !== null) valori[ag.id] = v
  }
  if (!Object.keys(valori).length) return null
  const durata = num(d.durata_prelievo)
  return {
    id: nuovoId('mis'),
    misuraId: m.misura.id,
    fronte: testo(d.fronte),
    data: m.campagna.data_ora ? new Date(m.campagna.data_ora).toLocaleDateString('it-IT') : '',
    tipo: TIPO_MISURA[testo(d.tipo_misura) || testo(d.tipo_prelievo)] ?? '',
    macchine: testo(d.macchine_nomi),
    note: (m.misura.note ?? '').trim(),
    temperatura: num(d.temperatura),
    velocita: num(d.velocita_aria),
    tempo: testo(d.tempo_prelievo) || (durata !== null ? `${durata} min` : ''),
    pompa: num(d.portata_q),
    valori,
  }
}

/**
 * Aggiunge agli ambienti le misure delle campagne non ancora importate, raggruppandole per fase e
 * postazione (un ambiente nuovo per ogni coppia che non c'è ancora).
 */
export function importaMisure(ambienti: AmbienteChimico[], misure: MisuraCampagna[], tipo: TipoDvrChimico): AmbienteChimico[] {
  const gia = new Set(ambienti.flatMap((a) => a.misure.map((m) => m.misuraId).filter(Boolean)))
  const out = ambienti.map((a) => ({ ...a, misure: [...a.misure] }))
  const chiave = (fase: string, postazione: string) => `${fase.trim().toLocaleLowerCase('it-IT')}|${postazione.trim().toLocaleLowerCase('it-IT')}`
  for (const m of misure) {
    if (gia.has(m.misura.id)) continue
    const riga = misuraAmbiente(m, tipo)
    if (!riga) continue
    const fase = testo(m.misura.dati.fase_nome) || 'Fase non indicata'
    const postazione = testo(m.misura.dati.postazione_nome) || '-'
    let amb = out.find((a) => chiave(a.fase, a.postazione) === chiave(fase, postazione))
    if (!amb) {
      amb = { id: nuovoId(), fase, postazione, misure: [] }
      out.push(amb)
    }
    amb.misure.push(riga)
  }
  return out.sort((a, b) => a.fase.localeCompare(b.fase, 'it') || a.postazione.localeCompare(b.postazione, 'it'))
}

export function contenutiChimico(x: Pick<Ingresso, 'documento'>): ContenutiChimico {
  return x.documento.contenuti?.chimico ?? { ambienti: [] }
}

/** Righe della matrice dei tempi di una mansione come periodi della giornata tipo. */
export function periodiDaTempi(righe: RigaTempi[]): PeriodoChimico[] {
  return [...righe]
    .sort((a, b) => a.ordine - b.ordine)
    .map((r) => ({
      minuti: r.minuti,
      fase: r.fase,
      postazione: r.postazione,
      ambiente: r.valori.ambiente ?? null,
      concentrazioni: r.valori.concentrazioni,
    }))
}

export function datiChimicoDaDatabase(x: Ingresso, tipo: TipoDvrChimico): { dati: DatiDvrChimico } {
  const c = contenutiChimico(x)
  const mansioni = [...x.documentoMansioni]
    .sort((a, b) => a.ordine - b.ordine)
    .map((dm) => {
      const m = x.mansioni.find((y) => y.id === dm.mansione_id)
      return { id: dm.mansione_id, nome: m?.nome ?? '(mansione eliminata)', attivita: m?.attivita ?? undefined }
    })
  const ambitiDoc = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
  const { cantiere_id: _c, ...anagrafica } = x.anagrafica
  void _c
  return {
    dati: {
      tipo,
      anagrafica,
      documento: {
        periodoRiferimento: x.documento.periodo_riferimento ?? '',
        revisione: x.documento.revisione,
        integrazione: x.documento.integrazione,
        dataEmissioneTesto: meseAnno(x.documento.data_emissione),
        anno: (x.documento.data_emissione ? new Date(x.documento.data_emissione) : new Date()).getFullYear(),
        primaValutazione: x.documento.revisione === 0 && !x.documento.documento_precedente_id,
        revisioni: x.revisioni,
      },
      ambiti: (ambitiDoc.length ? ambitiDoc : x.ambiti).map((a) => ({ nome: a.nome, tipo: a.tipo })),
      mansioni,
      macchine: x.macchine.map((m) => ({ tipologia: m.tipologia, marca_modello: m.marca_modello, alimentazione: m.alimentazione })),
      agenti: c.agenti,
      ambienti: c.ambienti,
      tempi: mansioni.map((m) => ({ mansioneId: m.id, periodi: periodiDaTempi(x.tempi.filter((t) => t.mansione_id === m.id)) })),
      testi: { ...c.testi, ciclo: (x.documento.contenuti?.ciclo ?? undefined) as BloccoTesto[] | undefined },
    },
  }
}
