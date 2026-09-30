import { describe, expect, it } from 'vitest'
import { pianoPredefinito } from './testi'
import { distanzaRispetto, livelliPopolazione, valoriAzione, valutaCem, valutaMisura, vaTermici, type SorgenteCem } from './valutazione'

describe('valori di azione (allegato XXXVI, D.Lgs. 159/2016)', () => {
  it('50 Hz: E 10 / 20 kV/m, B 1000 / 6000 µT, arti 18000 µT', () => {
    const va = valoriAzione(50)
    expect(va.e.inf).toBeCloseTo(1.0e4)
    expect(va.e.sup).toBeCloseTo(2.0e4)
    expect(va.b.inf).toBeCloseTo(1.0e3)
    expect(va.b.sup).toBeCloseTo(6.0e3)
    expect(va.b.arti).toBeCloseTo(1.8e4)
  })
  it('continuità ai bordi delle fasce', () => {
    expect(valoriAzione(7.99999).b.inf).toBeCloseTo(valoriAzione(8).b.inf!, 0)
    expect(valoriAzione(24.999).b.inf).toBeCloseTo(1000, 0)
    expect(valoriAzione(1639.9).e.sup).toBeCloseTo(610, 0)
    expect(valoriAzione(2999.9).b.inf).toBeCloseTo(100, 0)
  })
  it('radiofrequenze: VA termici (27 MHz 61 V/m e 0,2 µT; 900 MHz 90 V/m; 2,4 GHz 140 V/m)', () => {
    expect(valoriAzione(27e6).e).toEqual({ inf: 61, sup: 61 })
    expect(valoriAzione(27e6).b.inf).toBeCloseTo(0.2)
    expect(vaTermici(9e8).e).toBeCloseTo(90, 0)
    expect(vaTermici(2.4e9).e).toBe(140)
    // tra 100 kHz e 10 MHz vale il più restrittivo tra effetti termici e non termici
    expect(valoriAzione(5e5).b.inf).toBeCloseTo(4)
    expect(valoriAzione(5e5).e.inf).toBeCloseTo(170)
  })
  it('popolazione (1999/519/CE): 50 Hz 5000 V/m e 100 µT; 900 MHz 41 V/m; statico 0,5 mT', () => {
    expect(livelliPopolazione(50).e).toBeCloseTo(5000)
    expect(livelliPopolazione(50).b).toBeCloseTo(100)
    expect(livelliPopolazione(9e8).e).toBeCloseTo(41.25)
    expect(livelliPopolazione(0).b).toBe(500)
  })
})

describe('esiti e zone', () => {
  const saldatrice: SorgenteCem = { id: 's1', categoria: 'saldatura', descrizione: 'Saldatrice ad arco', frequenza: 50, attivita: 'Saldatura', mansioni: ['m1'] }
  const pc: SorgenteCem = { id: 's2', categoria: 'ufficio', descrizione: 'PC', frequenza: 50, attivita: 'Ufficio', mansioni: ['m2'] }
  it('classi secondo i rapporti con popolazione e VA', () => {
    const m = (b: number) => valutaMisura({ id: 'x', sorgenteId: 's1', postazione: '', distanza: 0.2, e: null, b }, saldatrice)
    expect(m(50).esito).toBe('popolazione')
    expect(m(500).esito).toBe('lavoratori')
    expect(m(2000).esito).toBe('vaInferiori')
    expect(m(7000).esito).toBe('vaSuperiori')
    // H in A/m se manca B
    expect(valutaMisura({ id: 'x', sorgenteId: 's1', postazione: '', distanza: 1, e: null, b: null, h: 100 }, saldatrice).b).toBeCloseTo(125.66)
  })
  it('esposizione degli arti: B confrontata con i VA per gli arti (18 mT a 50 Hz)', () => {
    const m = valutaMisura({ id: 'x', sorgenteId: 's1', postazione: 'Mano sul cavo', distanza: 0, e: null, b: 5000, arti: true }, saldatrice)
    expect(m.indiceInf).toBeCloseTo(5000 / 18000)
    expect(m.esito).toBe('lavoratori')
  })
  it('piano: misure specifiche e sorveglianza sanitaria oltre i VA', () => {
    const v = valutaCem([saldatrice], [{ id: 'a', sorgenteId: 's1', postazione: 'Tronco', distanza: 0.2, e: null, b: 2500 }])
    const sotto = pianoPredefinito(v).flatMap((p) => p.sotto ?? [])
    expect(sotto.some((x) => x.includes('sorveglianza sanitaria'))).toBe(true)
    expect(sotto.some((x) => x.startsWith('Saldatura:'))).toBe(true)
  })
  it('distanza di rispetto per i lavoratori sensibili', () => {
    const ms = [
      [0.1, 800],
      [0.5, 150],
      [1, 60],
      [2, 10],
    ].map(([d, b], i) => valutaMisura({ id: String(i), sorgenteId: 's1', postazione: '', distanza: d, e: null, b }, saldatrice))
    expect(distanzaRispetto(ms)).toBe(1)
  })
  it('sorgenti giustificabili conformi a priori, mansioni con l’esito peggiore', () => {
    const v = valutaCem([saldatrice, pc], [{ id: 'a', sorgenteId: 's1', postazione: 'Banco', distanza: 0.3, e: 20, b: 350 }], [
      { id: 'm1', nome: 'Saldatore' },
      { id: 'm2', nome: 'Impiegato' },
    ])
    expect(v.sorgenti.map((s) => [s.giustificabile, s.esito])).toEqual([
      [false, 'lavoratori'],
      [true, 'popolazione'],
    ])
    expect(v.mansioni.map((m) => m.esito)).toEqual(['lavoratori', 'popolazione'])
  })
  it('avvisi per sorgenti da valutare senza misure', () => {
    const v = valutaCem([{ ...saldatrice, id: 'z' }], [])
    expect(v.avvisi[0].messaggio).toContain('non giustificabile e senza misure')
  })
})
