/**
 * Valutazione del rischio da radiazioni ottiche artificiali (D.Lgs. 81/08, Titolo VIII Capo V),
 * come nel DVR ROA Castagnola: censimento delle sorgenti, giustificazione secondo la classificazione
 * (UNI EN 12198 macchine, CEI EN 62471 lampade, CEI EN 60825-1 laser), analisi delle sorgenti non
 * giustificabili, luminanza dalle misure di illuminamento (Lv = Ev/ω ≤ 10.000 cd/m²) e verifica dei
 * filtri per saldatura (UNI EN 169).
 */
import { arrotonda } from '../comune/numeri'
import { gradiDisponibili, graduazioniRichieste, PROCESSI_EN169, verificaDpi, type GraduazioneRichiesta, type ProcessoEn169 } from './en169'

export type TipoSorgente = 'macchina' | 'lampada' | 'laser'

export const TIPI_SORGENTE: Record<TipoSorgente, { nome: string; plurale: string; norma: string; etichettaClasse: string; classi: string[] }> = {
  macchina: { nome: 'macchina', plurale: 'MACCHINE', norma: 'UNI EN 12198', etichettaClasse: 'Categoria', classi: ['0', '1', '2'] },
  lampada: { nome: 'lampada', plurale: 'LAMPADE', norma: 'CEI EN 62471', etichettaClasse: 'Gruppo', classi: ['Esente', 'RG1', 'RG2', 'RG3'] },
  laser: { nome: 'laser', plurale: 'LASER', norma: 'CEI EN 60825-1', etichettaClasse: 'Classe', classi: ['1', '1M', '2', '2M', '3R', '3B', '4'] },
}

export interface SorgenteRoa {
  id: string
  tipo: TipoSorgente
  descrizione: string
  /** laser: parte dell'apparecchio (es. "Distanziometro (senza prisma)") */
  componente?: string
  attivita: string
  funzionamento?: string
  utilizzo?: string
  /** categoria / gruppo / classe; vuoto se non reperita */
  classe?: string
  /** saldatura o taglio: non giustificabile a prescindere dalla classificazione */
  saldatura?: boolean
  /** scelta del tecnico che sostituisce quella automatica */
  giustificabile?: boolean | null
  motivazione?: string
  // analisi delle sorgenti non giustificabili (capitolo 7.2)
  /** descrizione nella tabella di analisi (se diversa, es. "Laser del distanziometro della stazione totale …") */
  descrizioneAnalisi?: string
  spettro?: string
  distanza?: string
  tempo?: string
  espostiDiretti?: string
  espostiIndebiti?: string
  /** si possono/devono eseguire misure (di illuminamento o dirette) */
  misure?: boolean
  motivazioneMisure?: string
  /** mansioni esposte direttamente (riepilogo per mansione) */
  mansioni?: string[]
  /** misura dell'app da cui è stata importata */
  misuraId?: string
}

export interface RilievoLuminanza {
  id: string
  sorgente: string
  /** illuminamento [lux] */
  ev: number
  /** distanza sorgente – testa fotometrica [cm] (solo per il documento) */
  distanza?: number | null
  /** angolo solido sotteso dalla sorgente [sr] */
  omega: number
}

export interface DpiSaldatura {
  id: string
  processo: ProcessoEn169
  /** campo di utilizzo: corrente [A] o portata [l/h] */
  min: number
  max: number
  /** numeri di graduazione in dotazione, es. "10-11; 9-13" */
  dotazione: string
  /** DPI (es. "maschere Würth WSH III DIN 10-11") */
  descrizione?: string
  condizioni?: string
  /** processo come scritto nel documento, se diverso dal nome della norma */
  etichetta?: string
}

export const LIMITE_LUMINANZA = 10_000

/** Giustificabile secondo la norma della sorgente (categoria 0, gruppo esente, laser classe 1 o 2). */
export function giustificabileDaClasse(s: Pick<SorgenteRoa, 'tipo' | 'classe' | 'saldatura'>): boolean {
  if (s.saldatura) return false
  const c = (s.classe ?? '').trim().toUpperCase()
  if (s.tipo === 'macchina') return c === '0'
  if (s.tipo === 'lampada') return c === 'ESENTE'
  return c === '1' || c === '2'
}

export const giustificabile = (s: SorgenteRoa) => s.giustificabile ?? giustificabileDaClasse(s)

export const luminanza = (r: Pick<RilievoLuminanza, 'ev' | 'omega'>) => (r.omega > 0 ? r.ev / r.omega : Infinity)

export interface EsitoDpi {
  dpi: DpiSaldatura
  richieste: GraduazioneRichiesta[]
  fuoriTabella: boolean
  disponibili: number[]
  adeguato: boolean
  mancanti: number[]
}

export interface AvvisoRoa {
  livello: 'errore' | 'attenzione'
  messaggio: string
}

export interface ValutazioneRoa {
  giustificabili: SorgenteRoa[]
  nonGiustificabili: SorgenteRoa[]
  rilievi: (RilievoLuminanza & { lv: number; rispetta: boolean })[]
  dpi: EsitoDpi[]
  /** mansioni esposte direttamente a sorgenti non giustificabili */
  perMansione: { id: string; nome: string; sorgenti: SorgenteRoa[] }[]
  avvisi: AvvisoRoa[]
}

export function valutaRoa(sorgenti: SorgenteRoa[], rilievi: RilievoLuminanza[], dpi: DpiSaldatura[], mansioni: { id: string; nome: string }[] = []): ValutazioneRoa {
  const avvisi: AvvisoRoa[] = []
  for (const s of sorgenti) {
    if (!s.descrizione.trim()) avvisi.push({ livello: 'errore', messaggio: 'Una sorgente non ha la descrizione.' })
    if (s.giustificabile != null && s.giustificabile !== giustificabileDaClasse(s)) {
      avvisi.push({
        livello: 'attenzione',
        messaggio: `“${s.descrizione}”: ${s.giustificabile ? 'giustificabile' : 'non giustificabile'} per scelta del tecnico (dalla classificazione risulterebbe ${giustificabileDaClasse(s) ? 'giustificabile' : 'non giustificabile'}).`,
      })
    }
  }
  const nonGiustificabili = sorgenti.filter((s) => !giustificabile(s))
  for (const s of nonGiustificabili) {
    if (s.misure && !rilievi.length && s.tipo !== 'laser') {
      avvisi.push({ livello: 'attenzione', messaggio: `“${s.descrizione}”: indicate misure da eseguire ma non ci sono rilievi di illuminamento.` })
    }
  }
  const r = rilievi.map((x) => {
    const lv = luminanza(x)
    if (!(x.omega > 0)) avvisi.push({ livello: 'errore', messaggio: `Rilievo “${x.sorgente}”: manca l’angolo solido ω.` })
    return { ...x, lv, rispetta: lv <= LIMITE_LUMINANZA }
  })
  const d = dpi.map((x) => {
    const { richieste, fuoriTabella } = graduazioniRichieste(x.processo, x.min, x.max)
    const disponibili = gradiDisponibili(x.dotazione)
    const v = verificaDpi(richieste, disponibili)
    if (fuoriTabella) {
      avvisi.push({ livello: 'attenzione', messaggio: `${x.etichetta || PROCESSI_EN169[x.processo].nome}: parte del campo ${x.min}–${x.max} ${PROCESSI_EN169[x.processo].unita} è fuori dal prospetto della UNI EN 169.` })
    }
    if (!v.adeguato) {
      avvisi.push({
        livello: 'errore',
        messaggio: `${x.etichetta || PROCESSI_EN169[x.processo].nome}: filtri in dotazione (${x.dotazione || '—'}) non adeguati${v.mancanti.length ? `, manca il n° ${v.mancanti.join(', ')}` : ''}.`,
      })
    }
    return { dpi: x, richieste, fuoriTabella, disponibili, ...v }
  })
  const perMansione = mansioni
    .map((m) => ({ ...m, sorgenti: nonGiustificabili.filter((s) => s.mansioni?.includes(m.id)) }))
  return { giustificabili: sorgenti.filter(giustificabile), nonGiustificabili, rilievi: r, dpi: d, perMansione, avvisi }
}

export const lvArrotondata = (lv: number) => (Number.isFinite(lv) ? arrotonda(lv, 0) : lv)
