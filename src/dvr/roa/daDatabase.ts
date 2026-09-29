/**
 * Dal database al DVR ROA: sorgenti, rilievi di illuminamento, DPI per saldatura e testi nei
 * contenuti del documento (`contenuti.roa`); le misure ROA delle campagne si importano come sorgenti.
 */
import type { MisuraRumore as MisuraCampagna } from '../api'
import type { Ingresso } from '../comune/ingresso'
import type { BloccoTesto } from '../rumore/testiPredefiniti'
import { meseAnno } from '../rumore/daDatabase'
import type { DatiDvrRoa, TestiRoa } from './documento'
import type { DpiSaldatura, RilievoLuminanza, SorgenteRoa, TipoSorgente } from './valutazione'

export const TIPI_CAMPAGNA_ROA = ['roa']

export interface ContenutiRoa {
  sorgenti: SorgenteRoa[]
  rilievi: RilievoLuminanza[]
  dpi: DpiSaldatura[]
  testi?: Omit<TestiRoa, 'ciclo'>
}

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const testo = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')

let contatore = 0
export const nuovoId = (prefisso = 'src') => `${prefisso}-${Date.now().toString(36)}-${(++contatore).toString(36)}`

const TIPO_DA_BANDA: Record<string, TipoSorgente> = { Laser: 'laser', Visibile: 'lampada', 'IR-A': 'lampada', 'IR-B': 'lampada', 'IR-C': 'lampada' }

/** Una sorgente per misura ROA: tipo dalla banda (UV → macchina, visibile/IR → lampada, laser). */
export function sorgentiDaMisure(misure: MisuraCampagna[]): SorgenteRoa[] {
  const out: SorgenteRoa[] = []
  for (const m of misure) {
    if (!TIPI_CAMPAGNA_ROA.includes(m.campagna.tipo_campionamento)) continue
    const d = m.misura.dati
    const descrizione = testo(d.sorgente) || (m.misura.note ?? '').split('\n')[0].trim()
    if (!descrizione) continue
    const banda = testo(d.banda)
    const tipo = TIPO_DA_BANDA[banda] ?? 'macchina'
    const distanza = num(d.distanza)
    const misurati = [
      banda && `banda ${banda}`,
      num(d.irradianza_e) !== null && `irradianza efficace ${String(d.irradianza_e).replace('.', ',')} W/m²`,
      num(d.radianza_l) !== null && `radianza ${String(d.radianza_l).replace('.', ',')} W/(m²·sr)`,
      testo(d.limite_riferimento) && `limite ${testo(d.limite_riferimento)}`,
      num(d.indice_esposizione) !== null && `indice di esposizione ${String(d.indice_esposizione).replace('.', ',')}`,
    ].filter(Boolean)
    out.push({
      id: nuovoId(),
      misuraId: m.misura.id,
      tipo,
      descrizione,
      attivita: testo(d.fase_nome),
      utilizzo: [testo(d.postazione_nome), distanza !== null ? `distanza ${String(distanza).replace('.', ',')} m` : ''].filter(Boolean).join('; ') || '/',
      funzionamento: '/',
      classe: '',
      saldatura: /UV/.test(banda) || /sald|taglio|cannello|plasma/i.test(descrizione),
      spettro: banda === 'Laser' ? 'Raggio laser' : /UV/.test(banda) ? 'ultravioletti' : banda ? (banda === 'Visibile' ? 'Luce visibile' : 'infrarossi') : '',
      distanza: distanza !== null ? `${String(distanza).replace('.', ',')} m` : '',
      tempo: testo(d.tempo_esposizione) || (num(d.tempo_esposizione) !== null ? String(d.tempo_esposizione) : ''),
      motivazioneMisure: misurati.length ? `Misura in campo: ${misurati.join(', ')}.` : '',
      misure: misurati.length > 1,
    })
  }
  return out
}

export function contenutiRoa(x: Pick<Ingresso, 'documento'>): ContenutiRoa {
  return x.documento.contenuti?.roa ?? { sorgenti: [], rilievi: [], dpi: [] }
}

export function datiRoaDaDatabase(x: Ingresso): { dati: DatiDvrRoa } {
  const c = contenutiRoa(x)
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
      rilievi: c.rilievi,
      dpi: c.dpi,
      testi: { ...c.testi, ciclo: (x.documento.contenuti?.ciclo ?? undefined) as BloccoTesto[] | undefined },
    },
  }
}
