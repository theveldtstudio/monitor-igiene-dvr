/**
 * Valutazione dell'esposizione ai campi elettromagnetici (D.Lgs. 81/08, Titolo VIII Capo IV, allegato
 * XXXVI come sostituito dal D.Lgs. 159/2016 – direttiva 2013/35/UE; procedura CEI EN 50499):
 * - giustificazione delle sorgenti (CEI EN 50499, tabelle 1 e 2);
 * - confronto delle misure con i valori di azione (VA) inferiori e superiori per i lavoratori e con i
 *   livelli di riferimento per la popolazione della raccomandazione 1999/519/CE, che valgono per i
 *   lavoratori particolarmente sensibili (portatori di dispositivi medici impiantati, gravidanza…);
 * - classificazione delle aree in zone 0, 1 e 2.
 * Frequenze in Hz, campo elettrico E in V/m (rms), induzione magnetica B in µT (rms).
 */

export const MU0_UT_PER_AM = 1.2566 // B [µT] = µ0 · H [A/m]

export interface ValoriAzione {
  /** VA inferiori (E: prevenzione delle scariche; B: effetti sensoriali) */
  inf: number | null
  sup: number | null
  /** VA per l'esposizione degli arti (solo B, effetti non termici) */
  arti?: number | null
}

const min = (...xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null)
  return v.length ? Math.min(...v) : null
}

/** VA per il campo elettrico, effetti non termici (1 Hz – 10 MHz), allegato XXXVI parte II tab. B1. */
export function vaEnonTermici(f: number): ValoriAzione {
  if (f < 1 || f >= 1e7) return { inf: null, sup: null }
  const inf = f < 25 ? 2.0e4 : f < 3000 ? 5.0e5 / f : 1.7e2
  const sup = f < 50 ? 2.0e4 : f < 1640 ? 1.0e6 / f : 6.1e2
  return { inf, sup }
}

/** VA per l'induzione magnetica, effetti non termici (1 Hz – 10 MHz), parte II tab. B2. */
export function vaBnonTermici(f: number): ValoriAzione {
  if (f < 1 || f >= 1e7) return { inf: null, sup: null, arti: null }
  const inf = f < 8 ? 2.0e5 / (f * f) : f < 25 ? 2.5e4 / f : f < 300 ? 1.0e3 : f < 3000 ? 3.0e5 / f : 1.0e2
  const sup = f < 3000 ? 3.0e5 / f : 1.0e2
  const arti = f < 3000 ? 9.0e5 / f : 3.0e2
  return { inf, sup, arti }
}

/** VA per effetti termici (100 kHz – 300 GHz), parte III tab. B1: E [V/m] e B [µT]. */
export function vaTermici(f: number): { e: number | null; b: number | null } {
  if (f < 1e5 || f > 3e11) return { e: null, b: null }
  if (f < 1e6) return { e: 6.1e2, b: 2.0e6 / f }
  if (f < 1e7) return { e: 6.1e8 / f, b: 2.0e6 / f }
  if (f < 4e8) return { e: 61, b: 0.2 }
  if (f < 2e9) return { e: 3e-3 * Math.sqrt(f), b: 1.0e-5 * Math.sqrt(f) }
  return { e: 1.4e2, b: 4.5e-1 }
}

/** Campi statici (f < 1 Hz): VA per l'induzione magnetica statica, parte II tab. B4 (µT). */
export const VA_STATICI = { dispositiviImpiantati: 500, attrazione: 3000 }

/** VA complessivi per E e B alla frequenza f (effetti non termici e termici insieme: vale il più restrittivo). */
export function valoriAzione(f: number): { e: ValoriAzione; b: ValoriAzione } {
  if (f < 1) return { e: { inf: null, sup: null }, b: { inf: VA_STATICI.attrazione, sup: VA_STATICI.attrazione, arti: null } }
  const eN = vaEnonTermici(f)
  const bN = vaBnonTermici(f)
  const t = vaTermici(f)
  return {
    e: { inf: min(eN.inf, t.e), sup: min(eN.sup, t.e) },
    b: { inf: min(bN.inf, t.b), sup: min(bN.sup, t.b), arti: bN.arti ?? null },
  }
}

/**
 * Livelli di riferimento per la popolazione (raccomandazione 1999/519/CE, allegato III tab. 2), usati
 * per i lavoratori particolarmente sensibili. Per i campi statici si usa 0,5 mT (VA per l'interferenza
 * con i dispositivi medici impiantati attivi), più restrittivo dei 40 mT della raccomandazione.
 */
export function livelliPopolazione(f: number): { e: number | null; b: number | null } {
  if (f < 1) return { e: null, b: VA_STATICI.dispositiviImpiantati }
  if (f < 8) return { e: 1.0e4, b: 4.0e4 / (f * f) }
  if (f < 25) return { e: 1.0e4, b: 5.0e3 / f }
  if (f < 800) return { e: 2.5e5 / f, b: 5.0e3 / f }
  if (f < 3000) return { e: 2.5e5 / f, b: 6.25 }
  if (f < 1.5e5) return { e: 87, b: 6.25 }
  if (f < 1e6) return { e: 87, b: 0.92e6 / f }
  if (f < 1e7) return { e: 87 / Math.sqrt(f / 1e6), b: 0.92e6 / f }
  if (f < 4e8) return { e: 28, b: 0.092 }
  if (f < 2e9) return { e: 1.375 * Math.sqrt(f / 1e6), b: 0.0046 * Math.sqrt(f / 1e6) }
  return { e: 61, b: 0.2 }
}

// ---------------------------------------------------------------- sorgenti

export type CategoriaSorgente =
  | 'ufficio'
  | 'utensili'
  | 'elettrodomestici'
  | 'illuminazione'
  | 'caricabatterie'
  | 'telefonia'
  | 'rete_bt'
  | 'strumenti'
  | 'saldatura'
  | 'induzione'
  | 'trasformatore'
  | 'motori'
  | 'generatori'
  | 'magneti'
  | 'rf'
  | 'radar'
  | 'altro'

/** Categorie di sorgenti: giustificabili (CEI EN 50499 tab. 1) o da valutare nello specifico (tab. 2). */
export const CATEGORIE: Record<CategoriaSorgente, { nome: string; giustificabile: boolean; riferimento: string; frequenza?: number }> = {
  ufficio: { nome: 'Attrezzature da ufficio e informatiche', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1 – apparecchiature informatiche', frequenza: 50 },
  utensili: { nome: 'Utensili elettrici portatili', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1 – EN 62841 / EN 60745', frequenza: 50 },
  elettrodomestici: { nome: 'Apparecchi elettrici per uso domestico e similare', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1 – EN 62233', frequenza: 50 },
  illuminazione: { nome: 'Apparecchi di illuminazione (non a radiofrequenza)', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1', frequenza: 50 },
  caricabatterie: { nome: 'Caricabatterie', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1 – EN 60335-2-29', frequenza: 50 },
  telefonia: { nome: 'Telefoni cellulari, radio portatili e dispositivi senza fili marcati CE', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1 – EN 50360, EN 50566' },
  rete_bt: { nome: 'Impianti elettrici a 50 Hz entro i criteri della tabella 1 (≤ 100 A per fase, cavi isolati)', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1', frequenza: 50 },
  strumenti: { nome: 'Strumenti di misura e controllo', giustificabile: true, riferimento: 'CEI EN 50499 tab. 1', frequenza: 50 },
  saldatura: { nome: 'Saldatura ad arco e a resistenza', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2', frequenza: 50 },
  induzione: { nome: 'Riscaldamento a induzione', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2' },
  trasformatore: { nome: 'Cabine di trasformazione, trasformatori e quadri di potenza (> 100 A per fase)', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2 – reti a 50 Hz fuori dai criteri della tab. 1', frequenza: 50 },
  motori: { nome: 'Motori, azionamenti e impianti di grande potenza (TBM, pompe, nastri, ventilatori)', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2 – correnti elevate', frequenza: 50 },
  generatori: { nome: 'Gruppi elettrogeni', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2 – correnti elevate', frequenza: 50 },
  magneti: { nome: 'Magneti permanenti, elettromagneti e sollevatori magnetici', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2', frequenza: 0 },
  rf: { nome: 'Trasmettitori a radiofrequenza (ponti radio, antenne, stazioni base)', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2' },
  radar: { nome: 'Radar', giustificabile: false, riferimento: 'CEI EN 50499 tab. 2' },
  altro: { nome: 'Altra sorgente', giustificabile: false, riferimento: 'valutazione specifica' },
}

export interface SorgenteCem {
  id: string
  categoria: CategoriaSorgente
  descrizione: string
  /** frequenza di lavoro (Hz); 0 = campo statico */
  frequenza: number | null
  attivita: string
  postazione?: string
  /** mansioni che lavorano vicino alla sorgente */
  mansioni?: string[]
  /** scelta del tecnico; se vuota vale la categoria */
  giustificabile?: boolean | null
  motivazione?: string
  misuraId?: string
}

export interface MisuraCem {
  id: string
  sorgenteId: string
  postazione: string
  /** distanza dalla sorgente (m) */
  distanza: number | null
  /** frequenza (Hz); vuota = quella della sorgente */
  frequenza?: number | null
  e: number | null
  b: number | null
  /** campo magnetico H (A/m), usato se B manca */
  h?: number | null
  /** esposizione localizzata degli arti (es. mano sul cavo di saldatura): B si confronta con i VA per gli arti */
  arti?: boolean
  nota?: string
  misuraId?: string
}

export type Zona = 0 | 1 | 2

export type EsitoMisura = 'popolazione' | 'lavoratori' | 'vaInferiori' | 'vaSuperiori'

export const ESITI: Record<EsitoMisura, { zona: Zona; breve: string; testo: string }> = {
  popolazione: {
    zona: 0,
    breve: 'Entro i livelli per la popolazione',
    testo: 'livelli inferiori ai livelli di riferimento per la popolazione (1999/519/CE): nessuna restrizione, anche per i lavoratori particolarmente sensibili',
  },
  lavoratori: {
    zona: 1,
    breve: 'Entro i VA inferiori',
    testo: 'superati i livelli di riferimento per la popolazione ma rispettati i valori di azione inferiori: area interdetta ai lavoratori particolarmente sensibili',
  },
  vaInferiori: {
    zona: 1,
    breve: 'Oltre i VA inferiori, entro i VA superiori',
    testo: 'superati i valori di azione inferiori ma rispettati quelli superiori: misure specifiche (art. 210 D.Lgs. 81/08) e informazione dei lavoratori',
  },
  vaSuperiori: {
    zona: 2,
    breve: 'Oltre i VA superiori',
    testo: 'superati i valori di azione superiori: accesso limitato ai lavoratori autorizzati, verifica dei valori limite di esposizione e misure di riduzione',
  },
}

const ORDINE_ESITI: EsitoMisura[] = ['popolazione', 'lavoratori', 'vaInferiori', 'vaSuperiori']
export const peggiore = (xs: EsitoMisura[]): EsitoMisura | null => (xs.length ? xs.reduce((a, b) => (ORDINE_ESITI.indexOf(b) > ORDINE_ESITI.indexOf(a) ? b : a)) : null)

const rapporto = (x: number | null, limite: number | null) => (x != null && limite != null && limite > 0 ? x / limite : null)
const massimo = (...xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null)
  return v.length ? Math.max(...v) : null
}

export interface ValutazioneMisura {
  misura: MisuraCem
  sorgente: SorgenteCem | undefined
  frequenza: number | null
  b: number | null
  va: { e: ValoriAzione; b: ValoriAzione } | null
  popolazione: { e: number | null; b: number | null } | null
  /** rapporti misura / limite (1 = al limite) */
  indicePopolazione: number | null
  indiceInf: number | null
  indiceSup: number | null
  esito: EsitoMisura | null
}

export function valutaMisura(m: MisuraCem, s?: SorgenteCem): ValutazioneMisura {
  const f = m.frequenza ?? s?.frequenza ?? null
  const b = m.b ?? (m.h != null ? m.h * MU0_UT_PER_AM : null)
  if (f == null || (m.e == null && b == null)) {
    return { misura: m, sorgente: s, frequenza: f, b, va: null, popolazione: null, indicePopolazione: null, indiceInf: null, indiceSup: null, esito: null }
  }
  const base = valoriAzione(f)
  const va = m.arti && base.b.arti != null ? { e: base.e, b: { inf: base.b.arti, sup: base.b.arti, arti: base.b.arti } } : base
  const pop = livelliPopolazione(f)
  const indicePopolazione = massimo(rapporto(m.e, pop.e), rapporto(b, pop.b))
  const indiceInf = massimo(rapporto(m.e, va.e.inf), rapporto(b, va.b.inf))
  const indiceSup = massimo(rapporto(m.e, va.e.sup), rapporto(b, va.b.sup))
  const esito: EsitoMisura | null =
    indiceSup != null && indiceSup > 1
      ? 'vaSuperiori'
      : indiceInf != null && indiceInf > 1
        ? 'vaInferiori'
        : indicePopolazione != null && indicePopolazione > 1
          ? 'lavoratori'
          : indicePopolazione != null || indiceInf != null
            ? 'popolazione'
            : null
  return { misura: m, sorgente: s, frequenza: f, b, va, popolazione: pop, indicePopolazione, indiceInf, indiceSup, esito }
}

export const giustificabile = (s: SorgenteCem) => s.giustificabile ?? CATEGORIE[s.categoria].giustificabile

export interface ValutazioneSorgente {
  sorgente: SorgenteCem
  giustificabile: boolean
  misure: ValutazioneMisura[]
  /** esito peggiore delle misure; per le giustificabili "popolazione" (conformi a priori) */
  esito: EsitoMisura | null
  /** distanza oltre la quale tutte le misure rispettano i livelli per la popolazione (m) */
  distanzaRispetto: number | null
}

/** Distanza minima dalla quale in poi tutte le misure sono entro i livelli per la popolazione. */
export function distanzaRispetto(ms: ValutazioneMisura[]): number | null {
  const conDistanza = ms.filter((m) => m.misura.distanza != null && m.indicePopolazione != null).sort((a, b) => a.misura.distanza! - b.misura.distanza!)
  if (!conDistanza.some((m) => m.indicePopolazione! > 1)) return null
  let d: number | null = null
  for (let i = conDistanza.length - 1; i >= 0; i--) {
    if (conDistanza[i].indicePopolazione! > 1) break
    d = conDistanza[i].misura.distanza
  }
  return d
}

export interface AvvisoCem {
  livello: 'errore' | 'attenzione'
  messaggio: string
}

export interface ValutazioneCem {
  sorgenti: ValutazioneSorgente[]
  misure: ValutazioneMisura[]
  mansioni: { mansione: { id: string; nome: string }; sorgenti: ValutazioneSorgente[]; esito: EsitoMisura | null }[]
  avvisi: AvvisoCem[]
}

export function valutaCem(sorgenti: SorgenteCem[], misure: MisuraCem[], mansioni: { id: string; nome: string }[] = []): ValutazioneCem {
  const avvisi: AvvisoCem[] = []
  const perId = new Map(sorgenti.map((s) => [s.id, s]))
  const vm = misure.map((m) => valutaMisura(m, perId.get(m.sorgenteId)))
  vm.forEach((m, i) => {
    if (!m.sorgente) avvisi.push({ livello: 'errore', messaggio: `Misura ${i + 1} (${m.misura.postazione || 'senza postazione'}): manca la sorgente.` })
    else if (m.frequenza == null) avvisi.push({ livello: 'errore', messaggio: `Misura ${i + 1} (${m.sorgente.descrizione}): manca la frequenza.` })
    else if (!m.esito) avvisi.push({ livello: 'attenzione', messaggio: `Misura ${i + 1} (${m.sorgente.descrizione}): mancano E e B.` })
  })
  const vs: ValutazioneSorgente[] = sorgenti.map((s) => {
    const g = giustificabile(s)
    const proprie = vm.filter((m) => m.misura.sorgenteId === s.id)
    const esiti = proprie.map((m) => m.esito).filter((x): x is EsitoMisura => x != null)
    const esito = peggiore(esiti) ?? (g ? 'popolazione' : null)
    if (!g && !esiti.length && !s.motivazione?.trim()) {
      avvisi.push({ livello: 'attenzione', messaggio: `${s.descrizione || 'Sorgente senza nome'}: non giustificabile e senza misure né motivazione (dati del fabbricante o di letteratura).` })
    }
    if (s.giustificabile === true && !CATEGORIE[s.categoria].giustificabile) {
      avvisi.push({ livello: 'attenzione', messaggio: `${s.descrizione}: considerata giustificabile anche se la categoria richiede una valutazione specifica.` })
    }
    return { sorgente: s, giustificabile: g, misure: proprie, esito, distanzaRispetto: distanzaRispetto(proprie) }
  })
  const perMansione = mansioni.map((m) => {
    const proprie = vs.filter((x) => x.sorgente.mansioni?.includes(m.id))
    return { mansione: m, sorgenti: proprie, esito: peggiore(proprie.map((x) => x.esito).filter((x): x is EsitoMisura => x != null)) ?? (proprie.length ? null : 'popolazione') }
  })
  return { sorgenti: vs, misure: vm, mansioni: perMansione, avvisi }
}
