/**
 * Motore del DVR Posture incongrue (metodo OWAS).
 *
 * Ogni mansione ha una o più giornate tipo; ogni giornata è un elenco di attività con durata e
 * classe di rischio OWAS (1–4). L'indice della giornata è
 *     I = (a·1 + b·2 + c·3 + d·4) · 100
 * con a, b, c, d frazioni del tempo passato in classe 1, 2, 3, 4 (100 = nessun rischio, 400 = massimo).
 * Alla mansione si assegna la giornata più gravosa. Le "operazioni ordinarie" non classificabili
 * si ripartiscono in parti uguali sulle quattro classi.
 */
import { calcolaClasseOwas, type BracciaCode, type CaricoCode, type ClasseRischio, type GambeCode, type SchienaCode } from '../../data/owasLookup'
import { arrotonda } from '../comune/numeri'

export type ClasseOwas = ClasseRischio
/** 'ripartita' = durata distribuita in parti uguali sulle quattro classi. */
export type ClasseRiga = ClasseOwas | 'ripartita'

export interface CodiceOwas {
  schiena: SchienaCode
  braccia: BracciaCode
  gambe: GambeCode
  carico: CaricoCode
}

export interface RigaGiornata {
  fase: string
  attivita: string
  minuti: number
  classe: ClasseRiga
  origine?: 'misura' | 'storico' | 'convenzionale'
  riferimento?: string
}

export interface GiornataPosture {
  titolo: string
  righe: RigaGiornata[]
}

/** 0 assente, 1 lieve, 2 medio, 3 elevato */
export type FasciaPosture = 0 | 1 | 2 | 3

export const FASCE_POSTURE: Record<FasciaPosture, { tipo: string; intervento: string; intervallo: string }> = {
  0: { tipo: 'Assente', intervento: 'Nessuno', intervallo: '100' },
  1: { tipo: 'Lieve', intervento: 'Consigliato', intervallo: '101-200' },
  2: { tipo: 'Medio', intervento: 'Necessario in tempi brevi', intervallo: '201-300' },
  3: { tipo: 'Elevato', intervento: 'Necessario immediatamente', intervallo: '301-400' },
}

export interface AvvisoPosture {
  livello: 'errore' | 'attenzione'
  codice: string
  messaggio: string
}

export interface EsitoGiornata {
  titolo: string
  minutiTotali: number
  /** minuti in classe 1..4 (indice 0..3) */
  minutiPerClasse: [number, number, number, number]
  /** frequenze % in classe 1..4, a 1 decimale */
  frequenze: [number, number, number, number]
  /** indice OWAS a 1 decimale */
  indice: number
  fascia: FasciaPosture
}

export interface EsitoMansionePosture {
  giornate: EsitoGiornata[]
  /** giornata più gravosa (indice massimo); null se la mansione non ha attività */
  peggiore: EsitoGiornata | null
  fascia: FasciaPosture
  avvisi: AvvisoPosture[]
}

export const classeOwas = (c: CodiceOwas): ClasseOwas => calcolaClasseOwas(c.schiena, c.braccia, c.gambe, c.carico)

/** Soglie del prospetto di classificazione: 100 assente, fino a 200 lieve, fino a 300 medio, oltre elevato. */
export function fasciaPosture(indice: number): FasciaPosture {
  if (indice <= 100) return 0
  if (indice <= 200) return 1
  if (indice <= 300) return 2
  return 3
}

export function valutaGiornata(g: GiornataPosture): EsitoGiornata {
  const m: [number, number, number, number] = [0, 0, 0, 0]
  for (const r of g.righe) {
    if (!(r.minuti > 0)) continue
    if (r.classe === 'ripartita') for (let i = 0; i < 4; i++) m[i] += r.minuti / 4
    else m[r.classe - 1] += r.minuti
  }
  const tot = m[0] + m[1] + m[2] + m[3]
  const frazioni = m.map((x) => (tot > 0 ? x / tot : 0))
  const indiceEsatto = tot > 0 ? frazioni.reduce((s, f, i) => s + f * (i + 1), 0) * 100 : 0
  const indice = arrotonda(indiceEsatto, 1)
  return {
    titolo: g.titolo,
    minutiTotali: tot,
    minutiPerClasse: m,
    frequenze: frazioni.map((f) => arrotonda(f * 100, 1)) as [number, number, number, number],
    indice,
    fascia: fasciaPosture(indice),
  }
}

export function valutaMansionePosture(giornate: GiornataPosture[]): EsitoMansionePosture {
  const avvisi: AvvisoPosture[] = []
  const valide = giornate.filter((g) => g.righe.some((r) => r.minuti > 0))
  giornate
    .filter((g) => !valide.includes(g))
    .forEach((g) => avvisi.push({ livello: 'attenzione', codice: 'giornata_vuota', messaggio: `La giornata “${g.titolo}” non ha attività con durata.` }))
  const esiti = valide.map(valutaGiornata)
  for (const e of esiti) {
    if (Math.abs(e.minutiTotali - 480) > 0.01) {
      avvisi.push({
        livello: 'attenzione',
        codice: 'durata_giornata',
        messaggio: `La giornata “${e.titolo}” dura ${arrotonda(e.minutiTotali, 1)} minuti invece di 480: le frequenze sono calcolate sul totale indicato.`,
      })
    }
  }
  if (!esiti.length) {
    avvisi.push({ livello: 'errore', codice: 'mansione_senza_attivita', messaggio: 'Nessuna attività con durata: la mansione non è valutabile.' })
    return { giornate: [], peggiore: null, fascia: 0, avvisi }
  }
  const peggiore = esiti.reduce((a, b) => (b.indice > a.indice ? b : a))
  return { giornate: esiti, peggiore, fascia: peggiore.fascia, avvisi }
}

// ---------------------------------------------------------------- descrizioni dei codici OWAS

export const DESCRIZIONI_OWAS = {
  schiena: { 1: 'dritta', 2: 'curva', 3: 'in torsione', 4: 'curva e in torsione' },
  braccia: {
    1: 'sotto il livello delle spalle',
    2: 'una sopra il livello delle spalle',
    3: 'sopra il livello delle spalle',
  },
  gambe: {
    1: 'seduto',
    2: 'in piedi, gambe distese',
    3: 'in piedi su una gamba distesa',
    4: 'in piedi, gambe piegate',
    5: 'in piedi su una gamba piegata',
    6: 'in ginocchio su una o due gambe',
    7: 'in cammino',
  },
  carico: { 1: '< 10', 2: '10 – 20', 3: '> 20' },
} as const
