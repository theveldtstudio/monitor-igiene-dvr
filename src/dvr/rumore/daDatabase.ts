/**
 * Converte i dati salvati (tabelle dvr_* e misure dell'app) nell'ingresso del motore e del template.
 * Funzione pura: niente accesso al database, così si testa facilmente.
 */
import type { MisuraRumore, ContenutiRumore, DocumentoDvr, DocumentoMansione, RigaDpi, RigaTempi } from '../api'
import type { AmbitoDvr, AnagraficaDvr, MacchinaDvr, MansioneDvr, RevisioneDvr, TaraturaDvr } from '../comune/tipi'
import type { PeriodoEsposizione } from './calcolo'
import type { DpiUdito } from './dpi'
import type { DatiDvrRumore, RilievoRumore } from './documento'

const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export function meseAnno(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date()
  return `${MESI[d.getMonth()]} ${d.getFullYear()}`
}

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const testo = (x: unknown): string => (typeof x === 'string' ? x : Array.isArray(x) ? x.filter((y) => typeof y === 'string').join('; ') : '')

/** Livelli e descrizione di una misura di rumore dell'app (campi scritti da MisuraRumoreModal). */
export function rilievoDaMisura(m: MisuraRumore): RilievoRumore | null {
  const d = m.misura.dati
  const laeq = num(d.leq_dba)
  if (laeq === null) return null
  return {
    codice: m.codice,
    fase: testo(d.fase_nome) || '/',
    postazione: testo(d.postazione_nome) || '/',
    tempoMinuti: num(d.durata_minuti),
    laeq,
    lceq: num(d.leq_dbc),
    lpeak: num(d.lpeak_dbc),
    macchine: testo(d.macchine_nomi) || null,
    note: m.misura.note || null,
  }
}

export function periodoDaRiga(r: RigaTempi, rilievi: Map<string, RilievoRumore>): PeriodoEsposizione | null {
  if (r.origine === 'misura') {
    const ril = r.misura_id ? rilievi.get(r.misura_id) : undefined
    if (!ril) return null
    return {
      minuti: r.minuti,
      fase: r.fase || ril.fase,
      postazione: r.postazione || ril.postazione,
      macchine: r.macchine ?? ril.macchine ?? undefined,
      laeq: ril.laeq,
      lceq: ril.lceq,
      lpeak: ril.lpeak,
      origine: 'misura',
      riferimento: ril.codice,
    }
  }
  const laeq = num(r.valori.laeq)
  if (laeq === null) return null
  return {
    minuti: r.minuti,
    fase: r.fase,
    postazione: r.postazione ?? '',
    macchine: r.macchine ?? undefined,
    laeq,
    lceq: num(r.valori.lceq),
    lpeak: num(r.valori.lpeak),
    origine: r.origine,
    riferimento: null,
  }
}

export function dpiDaRiga(r: RigaDpi): DpiUdito {
  return { ...r.dati, nome: r.nome }
}

export interface IngressoDaDatabase {
  anagrafica: AnagraficaDvr
  documento: DocumentoDvr
  revisioni: RevisioneDvr[]
  ambiti: AmbitoDvr[]
  mansioni: MansioneDvr[]
  documentoMansioni: DocumentoMansione[]
  tempi: RigaTempi[]
  misure: MisuraRumore[]
  macchine: MacchinaDvr[]
  dpi: RigaDpi[]
  tarature: TaraturaDvr[]
}

export interface EsitoConversione {
  dati: DatiDvrRumore
  /** Righe della matrice che non si possono usare (misura cancellata, livello mancante). */
  righeScartate: { mansione: string; fase: string; motivo: string }[]
}

export function datiDaDatabase(x: IngressoDaDatabase): EsitoConversione {
  const c: ContenutiRumore = x.documento.contenuti ?? {}
  const rilievi = x.misure.map(rilievoDaMisura).filter((r): r is RilievoRumore => r !== null)
  const perMisura = new Map<string, RilievoRumore>()
  x.misure.forEach((m) => {
    const r = rilievoDaMisura(m)
    if (r) perMisura.set(m.misura.id, r)
  })
  const righeScartate: EsitoConversione['righeScartate'] = []

  const mansioni = [...x.documentoMansioni]
    .sort((a, b) => a.ordine - b.ordine)
    .map((dm) => {
      const m = x.mansioni.find((y) => y.id === dm.mansione_id)
      const nome = m?.nome ?? '(mansione eliminata)'
      const periodi = x.tempi
        .filter((t) => t.mansione_id === dm.mansione_id)
        .sort((a, b) => a.ordine - b.ordine)
        .map((t) => {
          const p = periodoDaRiga(t, perMisura)
          if (!p) {
            righeScartate.push({
              mansione: nome,
              fase: t.fase,
              motivo: t.origine === 'misura' ? 'la misura collegata non esiste più o non ha LAeq' : 'manca il livello LAeq',
            })
          }
          return p
        })
        .filter((p): p is PeriodoEsposizione => p !== null)
      return {
        id: dm.mansione_id,
        nome,
        attivita: m?.attivita ?? undefined,
        periodi,
        vibrazioni: Boolean(dm.dati?.vibrazioni),
        ototossiche: Boolean(dm.dati?.ototossiche),
      }
    })

  const ambitiDoc = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
  const dpiScelti = c.dpi_ids ? x.dpi.filter((d) => c.dpi_ids!.includes(d.id)) : x.dpi.filter((d) => d.attivo)
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
      },
      ambiti: (ambitiDoc.length ? ambitiDoc : x.ambiti).map((a) => ({ nome: a.nome, tipo: a.tipo })),
      mansioni,
      macchine: x.macchine.map((m) => ({ tipologia: m.tipologia, marcaModello: m.marca_modello, alimentazione: m.alimentazione })),
      dpi: dpiScelti.map(dpiDaRiga),
      tarature: tarature.map(({ id: _i, strumento_id: _s, ...t }) => {
        void _i
        void _s
        return t
      }),
      rilievi,
      impulsivi: c.impulsivi ?? [],
      segnali: c.segnali ?? [],
      testi: {
        ciclo: c.ciclo ?? undefined,
        zonizzazione: c.zonizzazione,
        pianoIntro: c.pianoIntro,
        pianoPunti: c.pianoPunti,
      },
      opzioni: x.documento.parametri as DatiDvrRumore['opzioni'],
    },
  }
}
