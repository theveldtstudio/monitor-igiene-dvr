/**
 * Dal database al monitoraggio delle acque: punti, misure e testi nei contenuti del documento
 * (`contenuti.acqua`); le misure delle campagne "monitoraggio acqua" si importano raggruppate per punto.
 */
import type { MisuraRumore as MisuraCampagna } from '../api'
import { baseDaIngresso, numero, nuovoId, testo } from '../comune/base'
import type { Ingresso } from '../comune/ingresso'
import type { BloccoTesto } from '../rumore/testiPredefiniti'
import type { DatiDvrAcqua } from './documento'
import type { TestiAcqua } from './testi'
import type { Destinazione, MisuraAcqua, PuntoAcqua } from './valutazione'

export const TIPI_CAMPAGNA_ACQUA = ['monitoraggio_acqua']

export interface ContenutiAcqua {
  punti: PuntoAcqua[]
  misure: MisuraAcqua[]
  testi?: TestiAcqua
}

/** Destinazione probabile dal nome del punto (il tecnico la corregge). */
export function destinazioneDaNome(nome: string): Destinazione {
  const n = nome.toLocaleLowerCase('it-IT')
  if (/potabil|rubinett|consumo|lavab|docc|mensa|serbatoio acqua/.test(n)) return 'consumo_umano'
  if (/fogna/.test(n)) return 'scarico_fognatura'
  if (/scaric|uscita|recettore|torrente|fiume|rio\b/.test(n)) return 'scarico_superficiale'
  return 'monitoraggio'
}

export function importaMisureAcqua(c: ContenutiAcqua, misure: MisuraCampagna[]): ContenutiAcqua {
  const gia = new Set(c.misure.map((m) => m.misuraId).filter(Boolean))
  const punti = [...c.punti]
  const nuove: MisuraAcqua[] = []
  for (const m of misure) {
    if (!TIPI_CAMPAGNA_ACQUA.includes(m.campagna.tipo_campionamento) || gia.has(m.misura.id)) continue
    const d = m.misura.dati
    const nome = testo(d.punto_monitoraggio) || 'Punto non indicato'
    let p = punti.find((x) => x.nome.trim().toLocaleLowerCase('it-IT') === nome.toLocaleLowerCase('it-IT'))
    if (!p) {
      p = { id: nuovoId('pt'), nome, destinazione: destinazioneDaNome(nome) }
      punti.push(p)
    }
    nuove.push({
      id: nuovoId('acq'),
      puntoId: p.id,
      data: m.campagna.data_ora ? new Date(m.campagna.data_ora).toLocaleDateString('it-IT') : '',
      ph: numero(d.ph),
      conducibilita: numero(d.conducibilita),
      tAcqua: numero(d.t_acqua),
      tAmbiente: numero(d.t_ambiente),
      o2Perc: numero(d.o2_perc),
      o2MgL: numero(d.o2_mg_l),
      note: (m.misura.note ?? '').trim() || undefined,
      misuraId: m.misura.id,
    })
  }
  return { ...c, punti, misure: [...c.misure, ...nuove] }
}

export function contenutiAcqua(x: Pick<Ingresso, 'documento'>): ContenutiAcqua {
  return x.documento.contenuti?.acqua ?? { punti: [], misure: [] }
}

export function datiAcquaDaDatabase(x: Ingresso): { dati: DatiDvrAcqua } {
  const c = contenutiAcqua(x)
  const { mansioni: _m, ...base } = baseDaIngresso(x)
  void _m
  return {
    dati: {
      ...base,
      punti: c.punti,
      misure: c.misure,
      testi: { ...c.testi, ciclo: (x.documento.contenuti?.ciclo ?? undefined) as BloccoTesto[] | undefined },
    },
  }
}
