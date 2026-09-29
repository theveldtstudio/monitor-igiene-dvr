/**
 * Indici microclimatici.
 * - PMV/PPD (UNI EN ISO 7730) per gli ambienti moderati;
 * - temperatura media radiante dal globotermometro (UNI EN ISO 7726, convezione forzata);
 * - WBGT (UNI EN ISO 7243) e valori limite per classe metabolica, per gli ambienti caldi;
 * - IREQmin, IREQneu e durata limite di esposizione DLE (UNI EN ISO 11079), per gli ambienti freddi;
 * - WCI (wind chill index, ACGIH) per il raffreddamento delle parti del corpo esposte.
 */
import { arrotonda } from '../comune/numeri'

export const W_M2_PER_MET = 58.15
export const M2K_W_PER_CLO = 0.155

// ---------------------------------------------------------------- PMV / PPD

export interface ParametriComfort {
  /** temperatura dell'aria [°C] */
  ta: number
  /** temperatura media radiante [°C] */
  tr: number
  /** velocità dell'aria [m/s] */
  va: number
  /** umidità relativa [%] */
  ur: number
  /** dispendio metabolico [met] */
  met: number
  /** isolamento termico del vestiario [clo] */
  clo: number
}

/** Voto medio previsto, algoritmo dell'allegato D della UNI EN ISO 7730. */
export function pmv({ ta, tr, va, ur, met, clo }: ParametriComfort): number {
  const pa = ur * 10 * Math.exp(16.6536 - 4030.183 / (ta + 235))
  const icl = M2K_W_PER_CLO * clo
  const m = met * W_M2_PER_MET
  const mw = m
  const fcl = icl <= 0.078 ? 1 + 1.29 * icl : 1.05 + 0.645 * icl
  const hcf = 12.1 * Math.sqrt(va)
  const taa = ta + 273
  const tra = tr + 273
  const tcla = taa + (35.5 - ta) / (3.5 * icl + 0.1)
  const p1 = icl * fcl
  const p2 = p1 * 3.96
  const p3 = p1 * 100
  const p4 = p1 * taa
  const p5 = 308.7 - 0.028 * mw + p2 * (tra / 100) ** 4
  let xn = tcla / 100
  let xf = tcla / 50
  let hc = hcf
  let n = 0
  while (Math.abs(xn - xf) > 0.00015) {
    xf = (xf + xn) / 2
    const hcn = 2.38 * Math.abs(100 * xf - taa) ** 0.25
    hc = Math.max(hcf, hcn)
    xn = (p5 + p4 * hc - p2 * xf ** 4) / (100 + p3 * hc)
    if (++n > 150) return NaN
  }
  const tcl = 100 * xn - 273
  const hl1 = 3.05 * 0.001 * (5733 - 6.99 * mw - pa)
  const hl2 = mw > W_M2_PER_MET ? 0.42 * (mw - W_M2_PER_MET) : 0
  const hl3 = 1.7 * 0.00001 * m * (5867 - pa)
  const hl4 = 0.0014 * m * (34 - ta)
  const hl5 = 3.96 * fcl * (xn ** 4 - (tra / 100) ** 4)
  const hl6 = fcl * hc * (tcl - ta)
  const ts = 0.303 * Math.exp(-0.036 * m) + 0.028
  return ts * (mw - hl1 - hl2 - hl3 - hl4 - hl5 - hl6)
}

/** Percentuale prevista di insoddisfatti. */
export const ppd = (p: number) => 100 - 95 * Math.exp(-0.03353 * p ** 4 - 0.2179 * p ** 2)

/** Categorie di ambiente della UNI EN ISO 7730 (A migliore, D disconfort). */
export type CategoriaComfort = 'A' | 'B' | 'C' | 'D'
export const CATEGORIE_COMFORT: Record<CategoriaComfort, { nome: string; pmv: string; ppd: string }> = {
  A: { nome: 'Alto comfort', pmv: '-0,2 < PMV < +0,2', ppd: 'PPD < 6%' },
  B: { nome: 'Comfort moderato', pmv: '-0,5 < PMV < +0,5', ppd: 'PPD < 10%' },
  C: { nome: 'Comfort accettabile', pmv: '-0,7 < PMV < +0,7', ppd: 'PPD < 15%' },
  D: { nome: 'Discomfort', pmv: 'PMV ≤ -0,7 o PMV ≥ +0,7', ppd: 'PPD ≥ 15%' },
}

/** Categoria dal PMV arrotondato a 0,1 (come riportato nel documento). */
export function categoriaComfort(p: number): CategoriaComfort {
  const a = Math.abs(arrotonda(p, 1))
  if (a < 0.2) return 'A'
  if (a < 0.5) return 'B'
  if (a < 0.7) return 'C'
  return 'D'
}

/**
 * Temperatura media radiante dal globotermometro (convezione forzata).
 * @param diametro diametro del globo [m]: 0,15 il globo della norma, 0,05 i globi piccoli
 */
export function radianteDaGlobo(tg: number, ta: number, va: number, diametro = 0.15, emissivita = 0.95): number {
  const k = (1.1e8 * Math.max(va, 0) ** 0.6) / (emissivita * diametro ** 0.4)
  return ((tg + 273) ** 4 + k * (tg - ta)) ** 0.25 - 273
}

// ---------------------------------------------------------------- WBGT

export const wbgtInterno = (tnw: number, tg: number) => 0.7 * tnw + 0.3 * tg
export const wbgtEsterno = (tnw: number, tg: number, ta: number) => 0.7 * tnw + 0.2 * tg + 0.1 * ta

/**
 * Valore limite WBGT per classe metabolica (UNI EN 27243, prospetto riportato nel DVR):
 * classi per metabolismo fino a 65, 130, 200, 260 W/m² e oltre (≈ 1,1 – 2,2 – 3,4 – 4,5 met).
 * Per le classi 3 e 4 si usa il valore con movimento dell'aria non percettibile (più cautelativo).
 */
export const TABELLA_WBGT = [
  { finoA: 65, acclimatati: 33, nonAcclimatati: 32 },
  { finoA: 130, acclimatati: 30, nonAcclimatati: 29 },
  { finoA: 200, acclimatati: 28, nonAcclimatati: 26 },
  { finoA: 260, acclimatati: 25, nonAcclimatati: 22 },
  { finoA: Infinity, acclimatati: 23, nonAcclimatati: 18 }, // il DVR modello riporta 25: la norma dà 23 (aria ferma)
] as const

export function limiteWbgt(met: number, acclimatati = true): number {
  const m = met * W_M2_PER_MET
  const riga = TABELLA_WBGT.find((r) => m <= r.finoA + 1e-9)!
  return acclimatati ? riga.acclimatati : riga.nonAcclimatati
}

// ---------------------------------------------------------------- IREQ (UNI EN ISO 11079)

const psat = (t: number) => 0.1333 * Math.exp(18.6686 - 4030.183 / (t + 235)) // kPa

export interface ParametriFreddo {
  ta: number
  tr: number
  va: number
  ur: number
  met: number
  /** permeabilità all'aria del vestiario [l/(m²·s)], predefinita 8 */
  permeabilita?: number
  /** velocità di cammino [m/s], predefinita 0 */
  cammino?: number
}

function condizioniFreddo(p: ParametriFreddo, tipo: 'min' | 'neu') {
  const M = p.met * W_M2_PER_MET
  const perm = p.permeabilita ?? 8
  const w = p.cammino ?? 0
  const pa = (p.ur / 100) * psat(p.ta)
  const tex = 29 + 0.2 * p.ta
  const pex = psat(tex)
  const ia = 0.092 * Math.exp(-0.15 * p.va - 0.22 * w) - 0.0045
  const tsk = tipo === 'min' ? 33.34 - 0.0354 * M : 35.7 - 0.0285 * M
  const bagnatura = tipo === 'min' ? 0.06 : 0.001 * M
  const psks = psat(tsk)
  const hres = 1.73e-2 * M * (pex - pa) + 1.4e-3 * M * (tex - p.ta)
  const correzione = 0.54 * Math.exp(0.075 * Math.log(perm) - 0.15 * p.va - 0.22 * w) - 0.06 * Math.log(perm) + 0.5
  const risultante = (I: number, fcl: number) => (I + 0.085 / fcl) * correzione - ia / fcl
  const hr = (tcl: number) => {
    const d = tcl - p.tr
    return Math.abs(d) < 1e-9 ? 5.67e-8 * 0.95 * 0.77 * 4 * (273 + p.tr) ** 3 : (5.67e-8 * 0.95 * 0.77 * ((273 + tcl) ** 4 - (273 + p.tr) ** 4)) / d
  }
  return { M, pa, ia, tsk, bagnatura, psks, hres, risultante, hr }
}

/** Isolamento del vestiario richiesto [clo]: minimo (IREQmin) e di neutralità (IREQneu). */
export function ireq(p: ParametriFreddo): { min: number; neu: number } {
  const calcola = (tipo: 'min' | 'neu') => {
    const c = condizioniFreddo(p, tipo)
    let I = 0.5
    let passo = 0.5
    let tcl = 0
    let R = 0
    let C = 0
    for (let n = 0; n < 200; n++) {
      const fcl = 1 + 1.197 * I
      const rt = (0.06 / 0.38) * (c.ia + c.risultante(I, fcl))
      const E = (c.bagnatura * (c.psks - c.pa)) / rt
      tcl = c.tsk - I * (c.M - c.hres - E)
      const hr = c.hr(tcl)
      const hc = 1 / c.ia - hr
      R = fcl * hr * (tcl - p.tr)
      C = fcl * hc * (tcl - p.ta)
      const bilancio = c.M - c.hres - E - R - C
      if (Math.abs(bilancio) <= 0.01) break
      if (bilancio > 0) {
        I -= passo
        passo /= 2
      } else I += passo
    }
    return (c.tsk - tcl) / (R + C) / M2K_W_PER_CLO
  }
  return { min: calcola('min'), neu: calcola('neu') }
}

/**
 * Durata limite di esposizione [ore] con il vestiario disponibile (isolamento di base, clo):
 * DLE = Qlim / S con Qlim = 40 Wh/m² e S la perdita di calore non compensata.
 * Restituisce Infinity se il vestiario basta (nessun accumulo negativo).
 */
export function dle(p: ParametriFreddo, clo: number, tipo: 'min' | 'neu' = 'min'): number {
  const c = condizioniFreddo(p, tipo)
  const I = clo * M2K_W_PER_CLO
  const fcl = 1 + 1.197 * I
  const rt = (0.06 / 0.38) * (c.ia + c.risultante(I, fcl))
  const E = (c.bagnatura * (c.psks - c.pa)) / rt
  let tcl = p.ta
  let hr = c.hr(tcl)
  let hc = 1 / c.ia - hr
  for (let n = 0; n < 300; n++) {
    hr = c.hr(tcl)
    hc = 1 / c.ia - hr
    const nuovo = (c.tsk / I + fcl * (hr * p.tr + hc * p.ta)) / (1 / I + fcl * (hr + hc))
    if (Math.abs(nuovo - tcl) < 1e-7) break
    tcl = (tcl + nuovo) / 2
  }
  const S = c.M - c.hres - E - fcl * hr * (tcl - p.tr) - fcl * hc * (tcl - p.ta)
  return S < 0 ? 40 / -S : Infinity
}

export type ClasseIreq = 'A' | 'B' | 'C'
export const CLASSI_IREQ: Record<ClasseIreq, { confronto: string; rischio: string; misure: string }> = {
  A: { confronto: 'Icl ≥ IREQneu', rischio: 'Livello accettabile (neutralità)', misure: 'Non necessarie' },
  B: { confronto: 'IREQmin ≤ Icl < IREQneu', rischio: 'Rischio limitato nel tempo', misure: 'Rispettare la DLE e le pause' },
  C: { confronto: 'Icl < IREQmin', rischio: 'Rischio inaccettabile', misure: 'Interrompere o modificare le condizioni' },
}

export function classeIreq(clo: number, r: { min: number; neu: number }): ClasseIreq {
  if (clo >= arrotonda(r.neu, 1)) return 'A'
  if (clo >= arrotonda(r.min, 1)) return 'B'
  return 'C'
}

// ---------------------------------------------------------------- WCI

/** Wind chill index [kcal/(h·m²)]. */
export const wci = (ta: number, va: number) => 1.16 * (10.45 + 10 * Math.sqrt(va) - va) * (33 - ta)

export const EFFETTI_WCI = [
  { da: 0, effetto: 'Raffreddamento non significativo delle parti esposte' },
  { da: 400, effetto: 'Sensazione di freddo con brividi continui' },
  { da: 800, effetto: 'Sensazione di freddo con difficoltà di movimento' },
  { da: 1000, effetto: 'Sensazione di freddo intenso' },
  { da: 1200, effetto: 'Limite del rischio di congelamento rapido' },
  { da: 1400, effetto: 'Congelamento dopo 20 min di esposizione' },
  { da: 1600, effetto: 'Congelamento dopo 15 min di esposizione' },
  { da: 1800, effetto: 'Congelamento dopo 10 min di esposizione' },
  { da: 2000, effetto: 'Congelamento dopo 8 min di esposizione' },
  { da: 2200, effetto: 'Congelamento dopo 4 min di esposizione' },
  { da: 2400, effetto: 'Congelamento dopo 1 min di esposizione' },
] as const

export function effettoWci(valore: number) {
  let k = 0
  EFFETTI_WCI.forEach((e, i) => {
    if (valore >= e.da) k = i
  })
  const successivo = EFFETTI_WCI[k + 1]
  return { effetto: EFFETTI_WCI[k].effetto, intervallo: successivo ? `${EFFETTI_WCI[k].da}-${successivo.da}` : `≥ ${EFFETTI_WCI[k].da}` }
}
