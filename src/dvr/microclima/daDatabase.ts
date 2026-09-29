/**
 * Dal database al DVR Microclima: scenario, lavorazioni, rilievi e testi nei contenuti del documento
 * (`contenuti.microclima`); le misure delle campagne microclima si importano come rilievi.
 */
import type { MisuraRumore as MisuraCampagna } from '../api'
import type { BloccoTesto } from '../rumore/testiPredefiniti'
import type { Ingresso } from '../comune/ingresso'
import { eGalleria } from '../comune/tipi'
import { meseAnno } from '../rumore/daDatabase'
import type { DatiDvrMicroclima } from './documento'
import { CLO_PREDEFINITO, type CapoVestiario, type VocePiano } from './testi'
import type { LavorazioneMicroclima, ParametriMicroclima, RilievoMicroclima, ScenarioMicroclima } from './valutazione'

export const TIPI_CAMPAGNA_MICROCLIMA = ['microclima']

/** Contenuti del DVR Microclima salvati nel documento. */
export interface ContenutiMicroclima {
  parametri: ParametriMicroclima
  lavorazioni: LavorazioneMicroclima[]
  rilievi: RilievoMicroclima[]
  vestiario?: CapoVestiario[]
  periodoOsservazione?: string
  misure?: string[]
  piano?: VocePiano[]
}

/** Dispendio metabolico indicativo delle classi di attività della misura (UNI EN ISO 8996, valori medi). */
export const MET_ATTIVITA: Record<string, number> = {
  'riposo seduto': 1.1,
  leggera: 1.7,
  moderata: 2.8,
  pesante: 4.0,
  'molto pesante': 5.0,
}

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const testo = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')

let contatore = 0
export const nuovoId = (prefisso = 'lav') => `${prefisso}-${Date.now().toString(36)}-${(++contatore).toString(36)}`

const dataIt = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Rilievi dalle misure microclima (servono almeno Ta, Tg, UR e Va) e una lavorazione proposta per
 * rilievo, con il dispendio metabolico dalla classe di attività registrata.
 * @param primoCodice numero del primo codice MCR (per accodare ai rilievi già presenti)
 */
export function daMisureMicroclima(misure: MisuraCampagna[], primoCodice = 1): { rilievi: RilievoMicroclima[]; lavorazioni: LavorazioneMicroclima[] } {
  const rilievi: RilievoMicroclima[] = []
  const lavorazioni: LavorazioneMicroclima[] = []
  for (const m of misure) {
    if (!TIPI_CAMPAGNA_MICROCLIMA.includes(m.campagna.tipo_campionamento)) continue
    const d = m.misura.dati
    const ta = num(d.ta)
    const tg = num(d.tg)
    const ur = num(d.ur)
    const va = num(d.va)
    if (ta === null || tg === null || ur === null || va === null) continue
    const fase = testo(d.fase_nome) || (m.misura.note ?? '').split('\n')[0].trim() || `Rilievo n° ${m.misura.numero}`
    const r: RilievoMicroclima = {
      id: nuovoId('ril'),
      misuraId: m.misura.id,
      codice: `MCR${String(primoCodice + rilievi.length).padStart(2, '0')}`,
      data: dataIt(m.campagna.data_ora),
      fase,
      postazione: testo(d.postazione_nome) || 'In prossimità della lavorazione',
      ta,
      tg,
      tnw: num(d.tnw),
      ur,
      va,
      trugiada: null,
    }
    rilievi.push(r)
    lavorazioni.push({ id: nuovoId('lav'), fase, mansioni: [], met: MET_ATTIVITA[testo(d.attivita_metabolica)] ?? 0, rilievo: r.id })
  }
  return { rilievi, lavorazioni }
}

/** Scenario proposto per un documento nuovo: galleria se tra gli ambiti c'è una galleria, stagione dal mese. */
export function scenarioPredefinito(x: Pick<Ingresso, 'ambiti' | 'documento'>): ScenarioMicroclima {
  const ambiti = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
  const galleria = (ambiti.length ? ambiti : x.ambiti).some((a) => eGalleria(a.tipo))
  const mese = (x.documento.data_emissione ? new Date(x.documento.data_emissione) : new Date()).getMonth()
  const estate = mese >= 4 && mese <= 8
  return galleria ? (estate ? 'galleria_estate' : 'galleria_inverno') : estate ? 'esterno_estate' : 'esterno_inverno'
}

export function contenutiMicroclima(x: Pick<Ingresso, 'ambiti' | 'documento'>): ContenutiMicroclima {
  const c = x.documento.contenuti?.microclima
  if (c) return c
  const scenario = scenarioPredefinito(x)
  return { parametri: { scenario, clo: CLO_PREDEFINITO(scenario) }, lavorazioni: [], rilievi: [] }
}

export function datiMicroclimaDaDatabase(x: Ingresso): { dati: DatiDvrMicroclima } {
  const c = contenutiMicroclima(x)
  const mansioni = [...x.documentoMansioni]
    .sort((a, b) => a.ordine - b.ordine)
    .map((dm) => {
      const m = x.mansioni.find((y) => y.id === dm.mansione_id)
      return { id: dm.mansione_id, nome: m?.nome ?? '(mansione eliminata)', attivita: m?.attivita ?? undefined }
    })
  const ambitiDoc = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
  const { cantiere_id: _c, ...anagrafica } = x.anagrafica
  void _c
  const ciclo = (x.documento.contenuti?.ciclo ?? undefined) as BloccoTesto[] | undefined
  return {
    dati: {
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
      parametri: c.parametri,
      lavorazioni: c.lavorazioni,
      rilievi: c.rilievi,
      vestiario: c.vestiario,
      periodoOsservazione: c.periodoOsservazione,
      testi: { ciclo, misure: c.misure, piano: c.piano },
    },
  }
}
