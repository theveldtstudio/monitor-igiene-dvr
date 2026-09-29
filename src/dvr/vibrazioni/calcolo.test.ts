import { describe, expect, it } from 'vitest'
import { calcolaA8, fasciaVibrazioni, mediaPiuDeviazione, valoriPerCalcolo, valutaVibrazioni, type MisuraVibrazione } from './calcolo'
import { valutaDvrVibrazioni } from './valutazione'
import { MANSIONI_VIB_XENIA, RILIEVI_VIB_XENIA } from './__fixtures__/xenia2026'

describe('A(8) e fasce', () => {
  it('8 ore a 0,5 m/s² danno A(8) = 0,5', () => {
    expect(calcolaA8([{ minuti: 480, a: 0.5 }])).toBeCloseTo(0.5, 10)
  })
  it('2 ore a 1 m/s² danno A(8) = 0,5', () => {
    expect(calcolaA8([{ minuti: 120, a: 1 }, { minuti: 360, a: 0 }])).toBeCloseTo(0.5, 10)
  })
  it('le soglie vanno superate: 0,50 resta sotto il valore d’azione', () => {
    expect(fasciaVibrazioni('wbv', 0.5)).toBe(1)
    expect(fasciaVibrazioni('wbv', 0.51)).toBe(2)
    expect(fasciaVibrazioni('wbv', 1.01)).toBe(3)
    expect(fasciaVibrazioni('hav', 2.5)).toBe(1)
    expect(fasciaVibrazioni('hav', 2.51)).toBe(2)
    expect(fasciaVibrazioni('hav', 5.2)).toBe(3)
  })
  it('solo valori convenzionali = esposizione trascurabile', () => {
    const r = valutaVibrazioni('hav', [
      { minuti: 465, fase: 'Operazioni a terra', a: 0.01, origine: 'convenzionale' },
      { minuti: 15, fase: 'Pausa fisiologica', a: 0.01, origine: 'convenzionale' },
    ])
    expect(r.fascia).toBe(0)
  })
  it('segnala il superamento del limite su periodi brevi', () => {
    const r = valutaVibrazioni('hav', [{ minuti: 480, fase: 'Demolizione', a: 21, origine: 'misura' }])
    expect(r.avvisi.map((a) => a.codice)).toEqual(expect.arrayContaining(['limite_breve', 'limite_superato']))
  })
})

describe('DVR Vibrazioni Xenia 2026: il motore riproduce le TAV', () => {
  for (const m of MANSIONI_VIB_XENIA) {
    for (const tipo of ['wbv', 'hav'] as const) {
      const atteso = m.documento[tipo]
      if (!atteso) continue
      it(`${tipo.toUpperCase()} – ${m.nome}`, () => {
        const r = valutaVibrazioni(tipo, m[tipo])
        expect(r.minutiTotali).toBe(480)
        expect(r.a8Arrotondato).toBe(atteso.a8)
        expect(r.esposizione).toBe(atteso.esposizione)
      })
    }
  }
})

describe('valori per il calcolo (media + deviazione standard, impugnatura peggiore)', () => {
  const misure: MisuraVibrazione[] = RILIEVI_VIB_XENIA.map((r, i) => ({
    id: String(i),
    tipo: r.tipo,
    macchina: r.macchina,
    fase: r.fase,
    dettaglio: r.dettaglio,
    a: r.a,
    codice: r.codice,
  }))
  const valori = valoriPerCalcolo(misure)
  const trova = (macchina: string, dettaglio: string) => valori.find((v) => v.macchina.startsWith(macchina) && v.dettaglio === dettaglio)

  it('riproduce la tabella dei valori medi WBV del DVR', () => {
    expect(trova('MSV', 'alto')?.valore).toBe(0.64)
    expect(trova('MSV', 'alto')?.n).toBe(3)
    expect(trova('Sollevatore KALMAR', 'alto')?.valore).toBe(0.81)
    expect(trova('Sollevatore Manitou', 'alto')?.valore).toBe(0.2)
    expect(trova('Sollevatore KALMAR', 'basso')?.valore).toBe(0.06)
  })
  it('HAV: l’avvitatore usa l’impugnatura peggiore (4,86 m/s²)', () => {
    const avv = valori.find((v) => v.tipo === 'hav')!
    expect(avv.valore).toBe(4.86)
    expect(avv.dettaglio).toBe('DX/SX')
  })
  it('media + deviazione standard di popolazione', () => {
    expect(mediaPiuDeviazione([0.65, 0.59, 0.61])).toBeCloseTo(0.6416, 3)
  })
})

describe('valutazione completa Xenia', () => {
  const v = valutaDvrVibrazioni(
    MANSIONI_VIB_XENIA.map((m, i) => ({ id: String(i), nome: m.nome, wbv: m.wbv, hav: m.hav })),
  )
  it('corpo intero: Operatore MSV e Addetto Forklift oltre il valore d’azione', () => {
    expect(v.perFascia.wbv[2].sort()).toEqual(['Addetto Forklift', 'Operatore MSV'])
    expect(v.perFascia.wbv[3]).toEqual([])
  })
  it('mano-braccio: Meccanico ed Elettricista sotto 2,5 m/s², nessuno oltre', () => {
    expect(v.perFascia.hav[1].length).toBe(2)
    expect(v.perFascia.hav[2]).toEqual([])
  })
  it('segnala la mansione senza TAV mano-braccio (Caposquadra TBM)', () => {
    expect(v.avvisi.some((a) => a.mansione === 'Caposquadra TBM' && a.codice === 'nessun_periodo')).toBe(true)
  })
})
