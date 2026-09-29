/**
 * Dal database al DVR Posture: giornate tipo dalla matrice dei tempi (dvr_tempi), catalogo delle
 * attività dai contenuti del documento, misure OWAS di campo come fonte di righe e posture.
 * Funzioni pure, testabili senza database.
 */
import type { MisuraRumore as MisuraCampagna, RigaTempi } from '../api'
import type { Ingresso } from '../comune/ingresso'
import { meseAnno } from '../rumore/daDatabase'
import { classeOwas, DESCRIZIONI_OWAS, type ClasseRiga, type CodiceOwas, type GiornataPosture, type RigaGiornata } from './calcolo'
import type { DatiDvrPosture } from './documento'
import type { AttivitaCatalogo } from './valutazione'

export const TIPI_CAMPAGNA_POSTURE = ['posture_owas', 'owas']

export const GIORNATA_PREDEFINITA = 'Giornata tipo'
export const GIORNATA_RILIEVI = 'Rilievi OWAS in campo'

export interface MisuraOwas {
  misuraId: string
  numero: number
  mansione: string
  attivita: string
  minuti: number | null
  codice: CodiceOwas
  classe: ReturnType<typeof classeOwas>
  note: string
}

const intero = (x: unknown, min: number, max: number): number | null =>
  typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max ? x : null

/** Misure OWAS delle campagne scelte, con la classe ricalcolata dal codice (tabella standard). */
export function misureOwas(misure: MisuraCampagna[]): MisuraOwas[] {
  const out: MisuraOwas[] = []
  for (const { misura, campagna } of misure) {
    if (!TIPI_CAMPAGNA_POSTURE.includes(campagna.tipo_campionamento)) continue
    const d = misura.dati
    const schiena = intero(d.schiena, 1, 4)
    const braccia = intero(d.braccia, 1, 3)
    const gambe = intero(d.gambe, 1, 7)
    const carico = intero(d.carico, 1, 3)
    if (schiena === null || braccia === null || gambe === null || carico === null) continue
    const codice = { schiena, braccia, gambe, carico } as CodiceOwas
    out.push({
      misuraId: misura.id,
      numero: misura.numero,
      mansione: typeof d.mansione === 'string' ? d.mansione.trim() : '',
      attivita: typeof d.attivita === 'string' && d.attivita.trim() ? d.attivita.trim() : `Postura rilevata n° ${misura.numero}`,
      minuti: typeof d.durata === 'number' && d.durata > 0 ? d.durata : null,
      codice,
      classe: classeOwas(codice),
      note: misura.note ?? '',
    })
  }
  return out
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

export const descriviPostura = (c: CodiceOwas) =>
  `Schiena ${DESCRIZIONI_OWAS.schiena[c.schiena]}, braccia ${DESCRIZIONI_OWAS.braccia[c.braccia]}, ${DESCRIZIONI_OWAS.gambe[c.gambe]}, carico ${DESCRIZIONI_OWAS.carico[c.carico]} kg.`

/**
 * Catalogo proposto dalle misure OWAS: un'attività per descrizione, con tutte le posture diverse
 * osservate e le mansioni che la svolgono.
 */
export function catalogoDaMisure(misure: MisuraOwas[], gruppo = 'Attività rilevate in campo'): AttivitaCatalogo[] {
  const perAttivita = new Map<string, AttivitaCatalogo>()
  for (const m of misure) {
    const k = norm(m.attivita)
    let a = perAttivita.get(k)
    if (!a) {
      a = { gruppo, fase: m.attivita, attivita: m.attivita, descrizione: m.note || descriviPostura(m.codice), mansioni: '', posture: [] }
      perAttivita.set(k, a)
    }
    if (!a.posture.some((p) => p.schiena === m.codice.schiena && p.braccia === m.codice.braccia && p.gambe === m.codice.gambe && p.carico === m.codice.carico)) {
      a.posture.push(m.codice)
    }
    const mansioni = a.mansioni ? a.mansioni.split(' / ') : []
    if (m.mansione && !mansioni.some((x) => norm(x) === norm(m.mansione))) a.mansioni = [...mansioni, m.mansione].join(' / ')
  }
  return [...perAttivita.values()]
}

/** Righe di giornata dalle misure OWAS della mansione (una riga per misura con durata). */
export function righeDaMisure(misure: MisuraOwas[], mansione: string): RigaGiornata[] {
  return misure
    .filter((m) => norm(m.mansione) === norm(mansione) && m.minuti)
    .map((m) => ({ fase: m.attivita, attivita: m.note || m.attivita, minuti: m.minuti!, classe: m.classe, origine: 'misura' as const, riferimento: m.misuraId }))
}

/** Riga della matrice dei tempi → riga di giornata; la classe di una misura collegata si ricalcola dal codice. */
export function rigaDaTempi(r: RigaTempi, misure: Map<string, MisuraOwas>): { giornata: string; riga: RigaGiornata } | null {
  const giornata = r.valori.giornata?.trim() || GIORNATA_PREDEFINITA
  const collegata = r.misura_id ? misure.get(r.misura_id) : undefined
  const c = r.valori.classe
  const classe: ClasseRiga | null = collegata ? collegata.classe : c === 0 ? 'ripartita' : c === 1 || c === 2 || c === 3 || c === 4 ? c : null
  if (classe === null || !(r.minuti > 0)) return null
  return {
    giornata,
    riga: { fase: r.fase, attivita: r.valori.attivita ?? '', minuti: r.minuti, classe, origine: r.origine, riferimento: r.misura_id ?? undefined },
  }
}

export function giornateDaTempi(righe: RigaTempi[], misure: Map<string, MisuraOwas>) {
  const giornate: GiornataPosture[] = []
  const scartate: RigaTempi[] = []
  for (const r of [...righe].sort((a, b) => a.ordine - b.ordine)) {
    const x = rigaDaTempi(r, misure)
    if (!x) {
      scartate.push(r)
      continue
    }
    let g = giornate.find((y) => y.titolo === x.giornata)
    if (!g) giornate.push((g = { titolo: x.giornata, righe: [] }))
    g.righe.push(x.riga)
  }
  return { giornate, scartate }
}

export function datiPostureDaDatabase(x: Ingresso): { dati: DatiDvrPosture; righeScartate: { mansione: string; fase: string; motivo: string }[] } {
  const c = x.documento.contenuti ?? {}
  const owas = new Map(misureOwas(x.misure).map((m) => [m.misuraId, m]))
  const righeScartate: { mansione: string; fase: string; motivo: string }[] = []
  const mansioni = [...x.documentoMansioni]
    .sort((a, b) => a.ordine - b.ordine)
    .map((dm) => {
      const m = x.mansioni.find((y) => y.id === dm.mansione_id)
      const nome = m?.nome ?? '(mansione eliminata)'
      const { giornate, scartate } = giornateDaTempi(
        x.tempi.filter((t) => t.mansione_id === dm.mansione_id),
        owas,
      )
      scartate.forEach((r) => righeScartate.push({ mansione: nome, fase: r.fase, motivo: 'manca la classe di rischio o la durata' }))
      return { id: dm.mansione_id, nome, attivita: m?.attivita ?? undefined, giornate }
    })
  const ambitiDoc = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
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
      catalogo: c.catalogoPosture ?? [],
      testi: { ciclo: c.ciclo ?? undefined },
    },
  }
}
