/**
 * Dal database al DVR Vibrazioni: misure WBV/HAV dell'app → rilievi e valori per il calcolo,
 * matrice dei tempi → periodi per mansione. Funzioni pure, testabili senza database.
 */
import type { MisuraRumore as MisuraCampagna, RigaTempi } from '../api'
import type { Ingresso } from '../comune/ingresso'
import { meseAnno } from '../rumore/daDatabase'
import { chiaveValore, valoriPerCalcolo, type PeriodoVibrazione, type TipoVibrazione, type ValorePerCalcolo } from './calcolo'
import type { DatiDvrVibrazioni, RilievoVibrazione } from './documento'

export const TIPI_CAMPAGNA_VIBRAZIONI: Record<string, TipoVibrazione> = {
  'vibrazioni-wbv': 'wbv',
  'vibrazioni-hav': 'hav',
  vibrazioni_wbv: 'wbv',
  vibrazioni_hav: 'hav',
}

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const str = (x: unknown): string => (typeof x === 'string' ? x.trim() : Array.isArray(x) ? x.join('; ') : '')
const IMPUGNATURE: Record<string, string> = { dx: 'DX', sx: 'SX', anteriore: 'Anteriore', posteriore: 'Posteriore' }

/** Misure di vibrazione delle campagne scelte, con codici VCI1… (corpo intero) e VMB1… (mano-braccio). */
export function rilieviVibrazioni(misure: MisuraCampagna[]): (RilievoVibrazione & { misuraId: string })[] {
  let nWbv = 0
  let nHav = 0
  const out: (RilievoVibrazione & { misuraId: string })[] = []
  for (const { misura, campagna } of misure) {
    const tipo = TIPI_CAMPAGNA_VIBRAZIONI[campagna.tipo_campionamento]
    if (!tipo) continue
    const d = misura.dati
    if (tipo === 'wbv') {
      const a = num(d.aw_max)
      if (a === null) continue
      out.push({
        id: misura.id,
        misuraId: misura.id,
        tipo,
        codice: `VCI${++nWbv}`,
        macchina: str(d.macchina_nome) || '/',
        fase: str(d.fase_nome) || '/',
        dettaglio: str(d.regime),
        a,
        matricola: str(d.targa) || null,
        posizione: str(d.posizione_operatore) || null,
        trazione: str(d.trazione) || null,
        utensile: str(d.utensile) || null,
        asse: str(d.aw_max_asse).toUpperCase() || null,
        temperatura: str(d.temperatura) || null,
        note: misura.note || null,
      })
    } else {
      const a = num(d.aw_sum)
      if (a === null) continue
      const imp = str(d.impugnatura)
      out.push({
        id: misura.id,
        misuraId: misura.id,
        tipo,
        codice: `VMB${++nHav}`,
        macchina: str(d.utensile) || '/',
        fase: str(d.fase_nome) || '/',
        dettaglio: imp === 'altro' ? str(d.impugnatura_altro) : (IMPUGNATURE[imp] ?? imp),
        a,
        matricola: str(d.matricola) || null,
        alimentazione: str(d.alimentazione) || null,
        accessorio: str(d.accessorio) || null,
        temperatura: str(d.temperatura) || null,
        note: misura.note || null,
      })
    }
  }
  return out
}

export function periodoVibDaRiga(r: RigaTempi, valori: Map<string, ValorePerCalcolo>): { tipo: TipoVibrazione; periodo: PeriodoVibrazione } | null {
  const tipo = r.valori.tipo
  if (tipo !== 'wbv' && tipo !== 'hav') return null
  if (r.origine === 'misura') {
    const v = r.valori.gruppo ? valori.get(r.valori.gruppo) : undefined
    if (!v) return null
    return {
      tipo,
      periodo: { minuti: r.minuti, fase: v.fase, macchina: v.macchina, dettaglio: v.dettaglio, a: v.valore, origine: 'misura', riferimento: v.codici.join(', ') },
    }
  }
  const a = num(r.valori.a)
  if (a === null) return null
  return {
    tipo,
    periodo: { minuti: r.minuti, fase: r.fase, macchina: r.macchine ?? '', dettaglio: r.valori.dettaglio ?? '', a, origine: r.origine },
  }
}

export function mappaValori(rilievi: RilievoVibrazione[]): Map<string, ValorePerCalcolo> {
  return new Map(valoriPerCalcolo(rilievi).map((v) => [v.chiave, v]))
}

export { chiaveValore }

export function datiVibrazioniDaDatabase(x: Ingresso): { dati: DatiDvrVibrazioni; righeScartate: { mansione: string; fase: string; motivo: string }[] } {
  const c = x.documento.contenuti ?? {}
  const rilievi = rilieviVibrazioni(x.misure)
  const valori = mappaValori(rilievi)
  const righeScartate: { mansione: string; fase: string; motivo: string }[] = []

  const mansioni = [...x.documentoMansioni]
    .sort((a, b) => a.ordine - b.ordine)
    .map((dm) => {
      const m = x.mansioni.find((y) => y.id === dm.mansione_id)
      const nome = m?.nome ?? '(mansione eliminata)'
      const wbv: PeriodoVibrazione[] = []
      const hav: PeriodoVibrazione[] = []
      x.tempi
        .filter((t) => t.mansione_id === dm.mansione_id)
        .sort((a, b) => a.ordine - b.ordine)
        .forEach((t) => {
          const p = periodoVibDaRiga(t, valori)
          if (!p) {
            righeScartate.push({
              mansione: nome,
              fase: t.fase,
              motivo: t.origine === 'misura' ? 'il gruppo di misure collegato non esiste più nelle campagne scelte' : 'manca l’accelerazione',
            })
            return
          }
          ;(p.tipo === 'wbv' ? wbv : hav).push(p.periodo)
        })
      return { id: dm.mansione_id, nome, attivita: m?.attivita ?? undefined, wbv, hav }
    })

  const ambitiDoc = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
  const tarature = c.tarature_ids ? x.tarature.filter((t) => c.tarature_ids!.includes(t.id)) : x.tarature
  const { cantiere_id: _c, ...anagrafica } = x.anagrafica
  void _c

  return {
    righeScartate,
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
        rapportoWbv: c.rapportoWbv ?? null,
        rapportoHav: c.rapportoHav ?? null,
      },
      ambiti: (ambitiDoc.length ? ambitiDoc : x.ambiti).map((a) => ({ nome: a.nome, tipo: a.tipo })),
      mansioni,
      macchine: x.macchine.map((m) => ({ tipologia: m.tipologia, marcaModello: m.marca_modello, alimentazione: m.alimentazione })),
      tarature: tarature.map(({ id: _i, strumento_id: _s, ...t }) => {
        void _i
        void _s
        return t
      }),
      rilievi,
      testi: { ciclo: c.ciclo ?? undefined },
      opzioni: x.documento.parametri as DatiDvrVibrazioni['opzioni'],
    },
  }
}
