/**
 * Valutazione degli agenti chimici come nei DVR modello Castagnola:
 * - classificazione del rischio per ambiente di lavoro con il modello della Regione Piemonte
 *   ("rischio misurato"): E dal rapporto C/TLV e dal numero di misure, D dalla durata, M dalla
 *   gravità; P = f(D, E) dalla matrice, IR = P × M, classi 1–10 irrilevante … 76–100 molto alto;
 * - esposizione per mansione: media ponderata sulle 8 ore (UNI EN 689) delle concentrazioni
 *   degli ambienti in cui la mansione lavora, confrontata con TLV-TWA / VLEP.
 */
import { arrotonda } from '../comune/numeri'
import type { AgenteChimico } from './agenti'

export interface MisuraAmbiente {
  id: string
  /** fronte / area in cui è stata fatta la misura (es. GN14K, Piazzale) */
  fronte?: string
  /** avanzamento % del fronte (solo informativo, come nel DVR modello) */
  avanzamento?: number | null
  data?: string
  /** A = misura d'area, P = personale */
  tipo?: string
  macchine?: string
  note?: string
  temperatura?: number | null
  velocita?: number | null
  tempo?: string
  pompa?: number | null
  /** concentrazioni per agente (id → valore); null = non misurato */
  valori: Record<string, number | null>
  /** dato di una campagna precedente */
  storico?: boolean
  misuraId?: string
}

export interface AmbienteChimico {
  id: string
  fase: string
  postazione: string
  misure: MisuraAmbiente[]
  /** fattore durata 1–4 scelto dal tecnico; se vuoto si ricava dai minuti della matrice dei tempi */
  durata?: number | null
  /** testo della colonna "Mansioni maggiormente esposte" */
  mansioniEsposte?: string
}

export type ClassePiemonte = 'irrilevante' | 'modesto' | 'medio' | 'alto' | 'molto alto'

export const CLASSI_PIEMONTE: { classe: ClassePiemonte; da: number; a: number; misure: string }[] = [
  { classe: 'irrilevante', da: 1, a: 10, misure: 'Non necessarie (risultano comunque necessarie le misure generali di prevenzione del rischio – art. 224 D.Lgs. 81/08)' },
  { classe: 'modesto', da: 11, a: 25, misure: 'Necessarie' },
  { classe: 'medio', da: 26, a: 50, misure: 'Necessarie' },
  { classe: 'alto', da: 51, a: 75, misure: 'Necessarie' },
  { classe: 'molto alto', da: 76, a: 100, misure: 'Necessarie' },
]

/** Matrice P = f(E, D) delle linee guida (righe E = 0,5 … 5; colonne D = 1 … 4). */
export const MATRICE_P: Record<string, [number, number, number, number]> = {
  '0.5': [1, 2, 2, 2],
  '1': [2, 3, 3, 4],
  '1.5': [3, 5, 5, 6],
  '2': [4, 6, 7, 8],
  '2.5': [6, 8, 9, 10],
  '3': [7, 9, 10, 12],
  '3.5': [8, 11, 12, 14],
  '4': [9, 12, 14, 16],
  '4.5': [10, 14, 15, 18],
  '5': [11, 15, 17, 20],
}

/**
 * Fattore di esposizione dal rapporto percentuale C/TLV e dal numero di misure:
 * con 1–2 misure <1% 0,5 · ≤5% 1 · ≤10% 2 · ≤25% 3 · ≤50% 4 · oltre 5;
 * con più di 2 misure <5% 0,5 · ≤10% 1 · ≤25% 2 · ≤50% 3 · ≤75% 4 · oltre 5.
 */
export function fattoreEsposizione(percentuale: number, nMisure: number): number {
  const soglie = nMisure > 2 ? [5, 10, 25, 50, 75] : [1, 5, 10, 25, 50]
  const p = arrotonda(percentuale, 1)
  if (p < soglie[0]) return 0.5
  const e = [1, 2, 3, 4]
  for (let i = 1; i < soglie.length; i++) if (p <= soglie[i]) return e[i - 1]
  return 5
}

/** Fattore durata dalla percentuale dell'orario di lavoro: ≤10% 1, ≤25% 2, ≤50% 3, oltre 4. */
export function fattoreDurata(minuti: number, turno = 480): number {
  const p = (minuti / turno) * 100
  if (p <= 10) return 1
  if (p <= 25) return 2
  if (p <= 50) return 3
  return 4
}

export const fattoreP = (e: number, d: number) => MATRICE_P[String(e)]?.[Math.min(4, Math.max(1, d)) - 1] ?? NaN

export function classePiemonte(ir: number): ClassePiemonte {
  return (CLASSI_PIEMONTE.find((c) => ir <= c.a) ?? CLASSI_PIEMONTE[CLASSI_PIEMONTE.length - 1]).classe
}

const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length

/** Concentrazione dell'ambiente per l'agente: media delle misure (anche storiche) con un valore. */
export function concentrazione(a: AmbienteChimico, agente: string): { valore: number | null; n: number; storico: boolean } {
  const conValore = a.misure.filter((m) => m.valori[agente] != null && Number.isFinite(m.valori[agente]!))
  if (!conValore.length) return { valore: null, n: 0, storico: false }
  return { valore: media(conValore.map((m) => m.valori[agente]!)), n: conValore.length, storico: conValore.every((m) => m.storico) }
}

export interface IndiceAgente {
  agente: AgenteChimico
  concentrazione: number
  percentuale: number
  e: number
  d: number
  m: number
  p: number
  ir: number
  classe: ClassePiemonte
}

export interface EsitoAmbiente {
  ambiente: AmbienteChimico
  /** fattore durata usato */
  durata: number
  concentrazioni: Record<string, { valore: number | null; n: number; storico: boolean }>
  indici: IndiceAgente[]
  classeMax: ClassePiemonte | null
}

/** Righe della matrice dei tempi di una mansione. */
export interface PeriodoChimico {
  minuti: number
  fase: string
  postazione?: string | null
  /** ambiente di cui si usano le concentrazioni */
  ambiente?: string | null
  /** concentrazioni scritte a mano (pause, dati storici, attività senza misura) */
  concentrazioni?: Record<string, number | null>
}

export interface EsposizioneMansione {
  mansione: { id: string; nome: string }
  periodi: (PeriodoChimico & { valori: Record<string, number | null> })[]
  minuti: number
  twa: Record<string, number | null>
  /** agenti oltre il limite (o sotto il minimo per l'O₂) */
  superamenti: string[]
}

export interface AvvisoChimico {
  livello: 'errore' | 'attenzione'
  messaggio: string
}

export interface ValutazioneChimica {
  ambienti: EsitoAmbiente[]
  mansioni: EsposizioneMansione[]
  avvisi: AvvisoChimico[]
}

const ORDINE_CLASSI: ClassePiemonte[] = CLASSI_PIEMONTE.map((c) => c.classe)

export function valutaChimico(
  agenti: AgenteChimico[],
  ambienti: AmbienteChimico[],
  tempi: { mansione: { id: string; nome: string }; periodi: PeriodoChimico[] }[],
  opzioni: { piemonte?: boolean } = {},
): ValutazioneChimica {
  const piemonte = opzioni.piemonte ?? true
  const avvisi: AvvisoChimico[] = []
  const perId = new Map(ambienti.map((a) => [a.id, a]))

  // durata dalla matrice dei tempi: il periodo più lungo in cui una mansione lavora nell'ambiente
  const minutiMax = new Map<string, number>()
  for (const t of tempi) for (const p of t.periodi) if (p.ambiente) minutiMax.set(p.ambiente, Math.max(minutiMax.get(p.ambiente) ?? 0, p.minuti))

  const esitiAmbienti: EsitoAmbiente[] = ambienti.map((a) => {
    const durata = a.durata ?? (minutiMax.has(a.id) ? fattoreDurata(minutiMax.get(a.id)!) : 4)
    if (piemonte && a.durata == null && !minutiMax.has(a.id)) {
      avvisi.push({ livello: 'attenzione', messaggio: `${a.fase} – ${a.postazione}: nessuna mansione nella matrice dei tempi, fattore durata 4 (cautelativo).` })
    }
    const concentrazioni = Object.fromEntries(agenti.map((ag) => [ag.id, concentrazione(a, ag.id)]))
    const indici: IndiceAgente[] = []
    if (piemonte) {
      for (const ag of agenti) {
        const c = concentrazioni[ag.id]
        if (c.valore == null || !ag.tlv || !ag.gravita) continue
        const percentuale = (c.valore / ag.tlv) * 100
        const e = fattoreEsposizione(percentuale, c.n)
        const p = fattoreP(e, durata)
        const ir = p * ag.gravita
        indici.push({ agente: ag, concentrazione: c.valore, percentuale, e, d: durata, m: ag.gravita, p, ir, classe: classePiemonte(ir) })
      }
    }
    const classeMax = indici.length ? indici.map((i) => i.classe).reduce((x, y) => (ORDINE_CLASSI.indexOf(y) > ORDINE_CLASSI.indexOf(x) ? y : x)) : null
    if (!a.misure.length) avvisi.push({ livello: 'errore', messaggio: `${a.fase} – ${a.postazione}: nessuna misura.` })
    return { ambiente: a, durata, concentrazioni, indici, classeMax }
  })

  const mansioni: EsposizioneMansione[] = tempi.map(({ mansione, periodi }) => {
    const righe = periodi.map((p) => {
      const amb = p.ambiente ? perId.get(p.ambiente) : undefined
      if (p.ambiente && !amb) avvisi.push({ livello: 'errore', messaggio: `${mansione.nome}: “${p.fase}” usa un ambiente che non esiste più.` })
      const valori = Object.fromEntries(
        agenti.map((ag) => {
          const manuale = p.concentrazioni?.[ag.id]
          if (manuale != null) return [ag.id, manuale]
          return [ag.id, amb ? concentrazione(amb, ag.id).valore : null]
        }),
      ) as Record<string, number | null>
      return { ...p, valori }
    })
    const minuti = righe.reduce((s, r) => s + r.minuti, 0)
    if (righe.length && minuti !== 480) avvisi.push({ livello: 'attenzione', messaggio: `${mansione.nome}: la giornata tipo somma ${minuti} minuti invece di 480.` })
    const mancanti: string[] = []
    const twa = Object.fromEntries(
      agenti.map((ag) => {
        const conValore = righe.filter((r) => r.valori[ag.id] != null)
        if (!conValore.length) return [ag.id, null]
        if (conValore.length < righe.length) mancanti.push(ag.sigla)
        if (ag.minimo != null) return [ag.id, Math.min(...conValore.map((r) => r.valori[ag.id]!))]
        return [ag.id, conValore.reduce((s, r) => s + r.minuti * r.valori[ag.id]!, 0) / 480]
      }),
    ) as Record<string, number | null>
    if (mancanti.length) {
      const senza = righe.filter((r) => agenti.some((ag) => r.valori[ag.id] == null)).map((r) => r.fase)
      avvisi.push({ livello: 'attenzione', messaggio: `${mansione.nome}: mancano le concentrazioni di ${mancanti.join(', ')} in ${[...new Set(senza)].join(', ')} (quei minuti non sono conteggiati).` })
    }
    const superamenti = agenti
      .filter((ag) => {
        const v = twa[ag.id]
        if (v == null) return false
        if (ag.minimo != null) return v < ag.minimo
        return ag.tlv != null && v > ag.tlv
      })
      .map((ag) => ag.id)
    return { mansione, periodi: righe, minuti, twa, superamenti }
  })

  return { ambienti: esitiAmbienti, mansioni, avvisi }
}

export const indiceClasse = (c: ClassePiemonte) => ORDINE_CLASSI.indexOf(c)
