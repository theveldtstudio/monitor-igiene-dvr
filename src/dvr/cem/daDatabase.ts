/**
 * Dal database al DVR Campi elettromagnetici: sorgenti, misure e testi nei contenuti del documento
 * (`contenuti.cem`); le misure CEM delle campagne si importano come misure (e, se serve, sorgenti).
 */
import type { MisuraRumore as MisuraCampagna } from '../api'
import type { Ingresso } from '../comune/ingresso'
import type { BloccoTesto } from '../rumore/testiPredefiniti'
import { meseAnno } from '../rumore/daDatabase'
import type { DatiDvrCem } from './documento'
import type { TestiCem } from './testi'
import { CATEGORIE, type CategoriaSorgente, type MisuraCem, type SorgenteCem } from './valutazione'

export const TIPI_CAMPAGNA_CEM = ['cem']

export interface ContenutiCem {
  sorgenti: SorgenteCem[]
  misure: MisuraCem[]
  testi?: TestiCem
}

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const testo = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')

let contatore = 0
export const nuovoId = (prefisso = 'src') => `${prefisso}-${Date.now().toString(36)}-${(++contatore).toString(36)}`

const MOLTIPLICATORI: Record<string, number> = { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9 }

/** Categoria probabile dal nome della sorgente (il tecnico la corregge). */
export function categoriaDaNome(nome: string): CategoriaSorgente {
  const n = nome.toLocaleLowerCase('it-IT')
  if (/sald/.test(n)) return 'saldatura'
  if (/induzion/.test(n)) return 'induzione'
  if (/cabin|trasformat|quadr|linea|mt\/bt/.test(n)) return 'trasformatore'
  if (/generator|gruppo elettrogeno/.test(n)) return 'generatori'
  if (/magnet/.test(n)) return 'magneti'
  if (/antenn|ponte radio|stazione radio|trasmettitor/.test(n)) return 'rf'
  if (/radar/.test(n)) return 'radar'
  if (/radio|telefon|cellular|walkie|wi-?fi|bluetooth/.test(n)) return 'telefonia'
  if (/motor|tbm|fresa|pompa|nastro|ventilat|compressor/.test(n)) return 'motori'
  if (/\bpc\b|computer|stampant|monitor|ufficio/.test(n)) return 'ufficio'
  if (/trapan|smerigliatric|flessibil|avvitator|utensil|mola/.test(n)) return 'utensili'
  if (/carica ?batteri/.test(n)) return 'caricabatterie'
  return 'altro'
}

/**
 * Misure CEM delle campagne non ancora importate: una misura per rilievo, collegata alla sorgente
 * con lo stesso nome (se non c'è, la sorgente si crea con la categoria probabile).
 */
export function importaMisure(c: ContenutiCem, misure: MisuraCampagna[]): ContenutiCem {
  const gia = new Set(c.misure.map((m) => m.misuraId).filter(Boolean))
  const sorgenti = [...c.sorgenti]
  const nuove: MisuraCem[] = []
  for (const m of misure) {
    if (!TIPI_CAMPAGNA_CEM.includes(m.campagna.tipo_campionamento) || gia.has(m.misura.id)) continue
    const d = m.misura.dati
    const nome = testo(d.sorgente) || (m.misura.note ?? '').split('\n')[0].trim() || 'Sorgente non indicata'
    const f = num(d.frequenza)
    const frequenza = f != null ? f * (MOLTIPLICATORI[testo(d.unita_frequenza)] ?? 1) : null
    let s = sorgenti.find((x) => x.descrizione.trim().toLocaleLowerCase('it-IT') === nome.toLocaleLowerCase('it-IT'))
    if (!s) {
      const categoria = categoriaDaNome(nome)
      s = { id: nuovoId(), categoria, descrizione: nome, frequenza: frequenza ?? CATEGORIE[categoria].frequenza ?? null, attivita: testo(d.fase_nome), postazione: testo(d.postazione_nome), misuraId: m.misura.id }
      sorgenti.push(s)
    }
    nuove.push({
      id: nuovoId('mis'),
      sorgenteId: s.id,
      postazione: testo(d.postazione_nome) || testo(d.fase_nome),
      distanza: num(d.distanza),
      frequenza: frequenza != null && frequenza !== s.frequenza ? frequenza : null,
      e: num(d.campo_e),
      b: num(d.induzione_b),
      h: num(d.campo_h),
      nota: (m.misura.note ?? '').trim() || undefined,
      misuraId: m.misura.id,
    })
  }
  return { ...c, sorgenti, misure: [...c.misure, ...nuove] }
}

export function contenutiCem(x: Pick<Ingresso, 'documento'>): ContenutiCem {
  return x.documento.contenuti?.cem ?? { sorgenti: [], misure: [] }
}

export function datiCemDaDatabase(x: Ingresso): { dati: DatiDvrCem } {
  const c = contenutiCem(x)
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
      sorgenti: c.sorgenti,
      misure: c.misure,
      testi: { ...c.testi, ciclo: (x.documento.contenuti?.ciclo ?? undefined) as BloccoTesto[] | undefined },
    },
  }
}
