import { describe, expect, it } from 'vitest'
import { arrotonda } from '../comune/numeri'
import { categoriaComfort, classeIreq, dle, effettoWci, ireq, limiteWbgt, pmv, ppd, radianteDaGlobo, wbgtInterno, wci } from './indici'

const r1 = (x: number) => arrotonda(x, 1)

describe('PMV e PPD (UNI EN ISO 7730)', () => {
  it('esempio della norma: 22 °C, 60%, 0,1 m/s, 1,2 met, 0,5 clo → PMV ≈ -0,75', () => {
    // ISO 7730 allegato D, caso 1 (tabella D.1): PMV -0,75, PPD 17
    const p = pmv({ ta: 22, tr: 22, va: 0.1, ur: 60, met: 1.2, clo: 0.5 })
    expect(p).toBeCloseTo(-0.75, 1)
    expect(ppd(p)).toBeCloseTo(17, 0)
  })

  // DVR Microclima invernale galleria Castagnola (gen. 2025): 1,5 clo, globo da 50 mm
  const galleria: [string, number, number, number, number, number, number][] = [
    // rilievo, ta, va, ur, tg, met, PMV del modello
    ['MCR01', 23.5, 0.33, 65.6, 25.4, 2.2, 1.8],
    ['MCR02', 24.0, 0.39, 65.5, 25.5, 1.4, 1.3],
    ['MCR03', 24.3, 0.18, 65.6, 25.5, 1.4, 1.4],
    ['MCR03', 24.3, 0.18, 65.6, 25.5, 2.4, 2.0],
    ['MCR04', 25.3, 0.31, 65.1, 25.7, 2.4, 2.0],
    ['MCR04', 25.3, 0.31, 65.1, 25.7, 1.4, 1.4],
    ['MCR05', 26.1, 0.2, 65.6, 25.9, 2.8, 2.4],
    ['MCR06', 26.5, 0.24, 65.9, 26.1, 1.4, 1.5],
    ['MCR08', 25.3, 0.35, 65.1, 25.1, 2.8, 2.3],
    ['MCR09', 25.2, 0.31, 65.6, 25.7, 2.4, 2.0],
  ]
  galleria.forEach(([r, ta, va, ur, tg, met, atteso]) => {
    it(`galleria ${r} ${met} met → PMV ${atteso}`, () => {
      const tr = radianteDaGlobo(tg, ta, va, 0.05)
      expect(r1(pmv({ ta, tr, va, ur, met, clo: 1.5 }))).toBe(atteso)
    })
  })

  it('esterno estivo (dati meteo medi, 0,5 clo): giugno e luglio come il DVR CTG 2025 (entro 0,06)', () => {
    const vicino = (ottenuti: number[], attesi: number[]) => ottenuti.forEach((x, i) => expect(Math.abs(x - attesi[i])).toBeLessThanOrEqual(0.06))
    vicino([1.4, 1.8, 2.2, 2.4, 2.8].map((met) => pmv({ ta: 23.1, tr: 29.1, va: 0.8, ur: 72.4, met, clo: 0.5 })), [-0.3, 0.4, 0.8, 1.1, 1.5])
    vicino([1.4, 1.8, 2.2, 2.4, 2.8].map((met) => pmv({ ta: 26.5, tr: 33.2, va: 1.1, ur: 71.4, met, clo: 0.5 })), [0.8, 1.3, 1.7, 1.9, 2.3])
  })

  it('categorie A–D sul PMV arrotondato', () => {
    expect([0.1, -0.2, 0.4, 0.6, 0.7, -1.1].map(categoriaComfort)).toEqual(['A', 'B', 'B', 'C', 'D', 'D'])
  })
})

describe('WBGT (UNI EN ISO 7243)', () => {
  it('WBGTi = 0,7 Tuvn + 0,3 Tg', () => {
    expect(r1(wbgtInterno(25.8, 30.1))).toBe(27.1)
    expect(r1(wbgtInterno(29.3, 32.2))).toBe(30.2)
  })
  it('limiti per classe metabolica (acclimatati / non acclimatati)', () => {
    expect([1.0, 1.4, 2.2, 2.4, 2.8, 4.0, 5.0].map((m) => limiteWbgt(m))).toEqual([33, 30, 30, 28, 28, 25, 23])
    expect(limiteWbgt(2.4, false)).toBe(26)
  })
})

describe('Ambienti freddi', () => {
  it('WCI: 3 °C e 7,2 m/s → 1047; -2 °C → 1221', () => {
    expect(Math.round(wci(3, 7.2))).toBe(1047)
    expect(Math.round(wci(-2, 7.2))).toBe(1221)
    expect(effettoWci(1047).effetto).toBe('Sensazione di freddo intenso')
    expect(effettoWci(1221).intervallo).toBe('1200-1400')
  })

  // DVR Microclima invernale opere esterne Xenia 2026: giornate peggiori, vestiario 1,5 clo
  const casi: [number, number, number, number, number, number][] = [
    // ta, ur, va, met, IREQmin, IREQneu (modello)
    [3, 82, 7.2, 1.4, 2.4, 2.8],
    [3, 82, 7.2, 2.0, 1.6, 1.9],
    [3, 82, 7.2, 2.8, 1.0, 1.3],
    [-2, 53, 7.2, 1.4, 2.9, 3.3],
    [-2, 53, 7.2, 2.2, 1.7, 2.0],
    [3, 70, 8.1, 2.4, 1.3, 1.6],
  ]
  casi.forEach(([ta, ur, va, met, mn, ne]) => {
    it(`IREQ ${ta} °C, ${va} m/s, ${met} met ≈ ${mn} / ${ne} clo (entro 0,15)`, () => {
      const r = ireq({ ta, tr: ta, ur, va, met })
      expect(Math.abs(r.min - mn)).toBeLessThanOrEqual(0.15)
      expect(Math.abs(r.neu - ne)).toBeLessThanOrEqual(0.15)
    })
  })

  it('DLE e classi: il moviere a 1,4 met non è protetto da 1,5 clo', () => {
    const p = { ta: 3, tr: 3, ur: 82, va: 7.2, met: 1.4 }
    const r = ireq(p)
    expect(classeIreq(1.5, r)).toBe('C')
    expect(dle(p, 1.5)).toBeCloseTo(0.9, 0)
    expect(classeIreq(1.5, ireq({ ...p, met: 2.8 }))).toBe('A')
    expect(dle({ ...p, met: 2.8 }, 1.5)).toBe(Infinity)
  })
})
