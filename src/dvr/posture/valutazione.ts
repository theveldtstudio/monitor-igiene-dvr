/**
 * Valutazione completa del DVR Posture: indice per mansione, elenchi per fascia, classi delle
 * posture del catalogo delle attività e controlli di coerenza tra catalogo e giornate tipo.
 */
import {
  classeOwas,
  valutaMansionePosture,
  type AvvisoPosture,
  type ClasseOwas,
  type CodiceOwas,
  type EsitoMansionePosture,
  type FasciaPosture,
  type GiornataPosture,
} from './calcolo'

/** Attività del catalogo (capitoli 5 e 6): una o più posture osservate, con codice OWAS. */
export interface AttivitaCatalogo {
  /** tabella in cui compare, es. "Consolidamento del fronte" */
  gruppo: string
  fase: string
  attivita: string
  /** descrizione sintetica della postura richiesta per svolgere l'attività */
  descrizione: string
  /** colonna "Rischio ergonomico" del capitolo 5 (predefinito: Posture incongrue) */
  rischio?: string
  /** mansioni maggiormente coinvolte, testo libero */
  mansioni: string
  posture: CodiceOwas[]
}

export interface MansionePosture {
  id: string
  nome: string
  attivita?: string
  giornate: GiornataPosture[]
}

export interface EsitoMansioneDvrPosture {
  mansione: MansionePosture
  esito: EsitoMansionePosture
}

export interface AvvisoDvrPosture extends AvvisoPosture {
  mansione?: string
}

export interface ValutazioneDvrPosture {
  esiti: EsitoMansioneDvrPosture[]
  perFascia: Record<FasciaPosture, string[]>
  /** classe di ogni postura del catalogo, nello stesso ordine */
  classiCatalogo: ClasseOwas[][]
  avvisi: AvvisoDvrPosture[]
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

export function valutaDvrPosture(mansioni: MansionePosture[], catalogo: AttivitaCatalogo[] = []): ValutazioneDvrPosture {
  const avvisi: AvvisoDvrPosture[] = []
  const conteggio = new Map<string, number>()
  mansioni.forEach((m) => conteggio.set(norm(m.nome), (conteggio.get(norm(m.nome)) ?? 0) + 1))
  for (const [nome, n] of conteggio) {
    if (n > 1) avvisi.push({ livello: 'errore', codice: 'mansione_duplicata', messaggio: `Mansione ripetuta ${n} volte: ${nome}.` })
  }

  const classiCatalogo = catalogo.map((a) => a.posture.map(classeOwas))
  const classiPerAttivita = new Map<string, Set<number>>()
  catalogo.forEach((a, i) => {
    if (!a.posture.length) {
      avvisi.push({
        livello: 'attenzione',
        codice: 'attivita_senza_posture',
        messaggio: `L’attività “${a.attivita}” (${a.fase}) non ha posture codificate: non compare nella classificazione del capitolo 6.`,
      })
    }
    const k = `${norm(a.fase)}|${norm(a.attivita)}`
    const s = classiPerAttivita.get(k) ?? new Set<number>()
    classiCatalogo[i].forEach((c) => s.add(c))
    classiPerAttivita.set(k, s)
  })

  const esiti = mansioni.map((m) => {
    const esito = valutaMansionePosture(m.giornate)
    esito.avvisi.forEach((a) => avvisi.push({ ...a, mansione: m.nome }))
    for (const g of m.giornate) {
      for (const r of g.righe) {
        if (r.classe === 'ripartita') continue
        const classi = classiPerAttivita.get(`${norm(r.fase)}|${norm(r.attivita)}`)
        if (classi && classi.size && !classi.has(r.classe)) {
          avvisi.push({
            livello: 'attenzione',
            codice: 'classe_fuori_catalogo',
            mansione: m.nome,
            messaggio: `“${r.attivita}” (${g.titolo}) è in classe ${r.classe}, ma nel catalogo le sue posture sono in classe ${[...classi].sort().join(', ')}.`,
          })
        }
      }
    }
    return { mansione: m, esito }
  })

  const perFascia: Record<FasciaPosture, string[]> = { 0: [], 1: [], 2: [], 3: [] }
  esiti.filter((e) => e.esito.peggiore).forEach((e) => perFascia[e.esito.fascia].push(e.mansione.nome))
  return { esiti, perFascia, classiCatalogo, avvisi }
}
