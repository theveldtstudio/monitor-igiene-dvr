import { describe, expect, it } from 'vitest'
import { arrotonda } from '../comune/numeri'
import { ESTERNO_ESTATE, ESTERNO_INVERNO, GALLERIA_ESTATE, GALLERIA_INVERNO, MESI_ESTATE_CTG, MESI_INVERNO_XENIA, PICCO_ESTATE_CTG } from './__fixtures__/modelli'
import { valutaMicroclima } from './valutazione'

const r1 = (x: number) => arrotonda(x, 1)

describe('DVR Microclima – galleria inverno (Castagnola 2025, PMV/PPD)', () => {
  const v = valutaMicroclima({ scenario: 'galleria_inverno', clo: 1.5, diametroGlobo: 0.05 }, GALLERIA_INVERNO.lavorazioni, GALLERIA_INVERNO.rilievi, GALLERIA_INVERNO.mansioni)
  it('un esito per lavorazione, nessun errore', () => {
    expect(v.esiti).toHaveLength(14)
    expect(v.avvisi.filter((a) => a.livello === 'errore')).toEqual([])
  })
  it('PMV come le Tabelle 7 e 8 del modello (differenze note entro 0,1; manutenzione camerone: il modello scrive 2,0 ma il PPD 91,1 corrisponde a 2,4)', () => {
    const pmv = v.esiti.map((e) => r1(e.comfort!.pmv))
    const modello = [1.8, 1.3, 1.9, 1.4, 2.0, 2.0, 1.4, 2.4, 2.0, 1.5, 2.0, 2.3, 2.0, 2.3]
    pmv.forEach((x, i) => {
      if (i === 10) expect(Math.abs(x - 2.4)).toBeLessThanOrEqual(0.1 + 1e-9)
      else expect(Math.abs(x - modello[i])).toBeLessThanOrEqual(0.1 + 1e-9)
    })
  })
  it('tutte le lavorazioni in categoria D (discomfort) e temperature 23,5–26,5 °C', () => {
    expect(new Set(v.esiti.map((e) => e.comfort!.categoria))).toEqual(new Set(['D']))
    expect(v.temperature).toMatchObject({ min: 23.5, max: 26.5 })
  })
})

describe('DVR Microclima – galleria estate (Castagnola 2025, WBGTi)', () => {
  const v = valutaMicroclima({ scenario: 'galleria_estate', clo: 0.5 }, GALLERIA_ESTATE.lavorazioni, GALLERIA_ESTATE.rilievi, GALLERIA_ESTATE.mansioni)
  it('WBGTi e limiti per classe metabolica', () => {
    const r = v.esiti.map((e) => [e.lavorazione.fase, e.lavorazione.met, e.wbgt!.valore, e.wbgt!.limite, e.wbgt!.superato])
    expect(r).toEqual([
      ['Consolidamento del fronte', 2.2, 29.7, 30, false],
      ['Scavo', 1.8, 27.1, 30, false],
      ['Scavo', 2.2, 27.1, 30, false],
      // il modello usa per lo smarino la Tuvn della posa centina (23,7 invece di 25,2)
      ['Smarino', 1.8, 27.2, 30, false],
      ['Smarino', 2.2, 27.2, 30, false],
      ['Posa centina', 1.8, 25.6, 30, false],
      ['Posa centina', 2.8, 25.6, 28, false],
      ['Armatura calotta', 2.8, 29.5, 28, true],
      ['Carpenteria in cassaforma', 2.8, 25.4, 28, false],
      // manutenzione mezzi: nel modello manca il limite; a 2,4 met vale 28 °C → superato
      ['Manutenzione mezzi', 2.4, 30.2, 28, true],
      ['Impermeabilizzazione calotta', 2.8, 28.6, 28, true],
    ])
  })
})

describe('DVR Microclima – esterno estate (CTG 2025)', () => {
  const v = valutaMicroclima(
    { scenario: 'esterno_estate', clo: 0.5, meteo: { mesi: MESI_ESTATE_CTG, picco: PICCO_ESTATE_CTG } },
    ESTERNO_ESTATE.lavorazioni,
    [],
    ESTERNO_ESTATE.mansioni,
  )
  it('WBGTe nella giornata di picco = 31,4 °C, oltre il limite per tutte le lavorazioni', () => {
    expect(v.piccoWbgt).toBe(31.4)
    expect(v.esiti.every((e) => e.picco!.superato)).toBe(true)
    expect(v.esiti.every((e) => e.livello === 2)).toBe(true)
  })
  it('limite per 2,2 met = 30 °C (il modello scrive 28: 2,2 met = 128 W/m², classe fino a 130)', () => {
    expect(v.esiti.find((e) => e.lavorazione.met === 2.2)!.picco!.limite).toBe(30)
  })
  it('PMV per mese', () => {
    const autista = v.esiti[0].mesi!.map((m) => r1(m.comfort.pmv))
    expect(autista).toEqual([0.8, 1.6, 1.5])
  })
})

describe('DVR Microclima – esterno inverno (Xenia 2026)', () => {
  const v = valutaMicroclima({ scenario: 'esterno_inverno', clo: 1.5, meteo: { mesi: MESI_INVERNO_XENIA } }, ESTERNO_INVERNO.lavorazioni, [], ESTERNO_INVERNO.mansioni)
  it('WCI delle giornate peggiori', () => {
    expect(v.wci.map((w) => w.valore)).toEqual([1047, 1221, 1072])
    expect(v.wci[1].effetto).toBe('Limite del rischio di congelamento rapido')
  })
  it('IREQ: il moviere (1,4 met) è in classe C in tutti i mesi, carpentieri (2,8 met) mai in C', () => {
    const moviere = v.esiti.find((e) => e.lavorazione.met === 1.4)!
    expect(moviere.mesi!.map((m) => m.freddo!.classe)).toEqual(['C', 'C', 'C'])
    const carp = v.esiti.find((e) => e.lavorazione.met === 2.8)!
    expect(carp.mesi!.every((m) => m.freddo!.classe !== 'C')).toBe(true)
  })
  it('con il WCI oltre 1200 a gennaio tutte le mansioni esposte sono a rischio', () => {
    expect(v.perMansione.every((m) => m.livello === 2)).toBe(true)
  })
})
