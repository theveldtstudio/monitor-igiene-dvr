/**
 * Dal database al DVR Agenti biologici: agenti potenziali, misure SAS e testi nei contenuti del
 * documento (`contenuti.biologico`); le misure delle campagne biologico SAS si importano.
 */
import type { MisuraRumore as MisuraCampagna } from '../api'
import { baseDaIngresso, numero, nuovoId, testo } from '../comune/base'
import type { Ingresso } from '../comune/ingresso'
import type { BloccoTesto } from '../rumore/testiPredefiniti'
import type { DatiDvrBiologico } from './documento'
import type { TestiBiologico } from './testi'
import type { AgenteBiologico, MisuraSas } from './valutazione'

export const TIPI_CAMPAGNA_BIOLOGICO = ['biologico_sas']

export interface ContenutiBiologico {
  agenti: AgenteBiologico[]
  misure: MisuraSas[]
  testi?: TestiBiologico
}

/** Misure SAS delle campagne non ancora importate. */
export function importaMisureSas(c: ContenutiBiologico, misure: MisuraCampagna[]): ContenutiBiologico {
  const gia = new Set(c.misure.map((m) => m.misuraId).filter(Boolean))
  const nuove: MisuraSas[] = misure
    .filter((m) => TIPI_CAMPAGNA_BIOLOGICO.includes(m.campagna.tipo_campionamento) && !gia.has(m.misura.id))
    .map((m) => {
      const d = m.misura.dati
      const sotto = ['conta_22', 'conta_36', 'muffe_lieviti'].filter((k) => d[`${k}_sotto_soglia`] === true)
      return {
        id: nuovoId('sas'),
        postazione: testo(d.postazione_nome) || 'Postazione non indicata',
        fase: testo(d.fase_nome),
        data: m.campagna.data_ora ? new Date(m.campagna.data_ora).toLocaleDateString('it-IT') : '',
        volume: numero(d.volume_aspirato),
        conta22: numero(d.conta_22),
        conta36: numero(d.conta_36),
        muffe: numero(d.muffe_lieviti),
        note: [sotto.length ? 'Valori sotto il limite di rilevabilità (usato il limite)' : '', (m.misura.note ?? '').trim()].filter(Boolean).join('. ') || undefined,
        misuraId: m.misura.id,
      }
    })
  return { ...c, misure: [...c.misure, ...nuove] }
}

export function contenutiBiologico(x: Pick<Ingresso, 'documento'>): ContenutiBiologico {
  return x.documento.contenuti?.biologico ?? { agenti: [], misure: [] }
}

export function datiBiologicoDaDatabase(x: Ingresso): { dati: DatiDvrBiologico } {
  const c = contenutiBiologico(x)
  return {
    dati: {
      ...baseDaIngresso(x),
      agenti: c.agenti,
      misure: c.misure,
      testi: { ...c.testi, ciclo: (x.documento.contenuti?.ciclo ?? undefined) as BloccoTesto[] | undefined },
    },
  }
}
