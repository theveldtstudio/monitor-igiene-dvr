import { describe, expect, it } from 'vitest'
import { DPI_CASTAGNOLA, RILIEVI_CASTAGNOLA, SORGENTI_CASTAGNOLA } from './__fixtures__/castagnola2026'
import { gradiDisponibili, graduazioniRichieste, verificaDpi } from './en169'
import { giustificabile, lvArrotondata, valutaRoa } from './valutazione'

describe('UNI EN 169', () => {
  it('graduazioni per corrente e portata', () => {
    expect(graduazioniRichieste('elettrodi', 40, 100).richieste.map((r) => r.n)).toEqual([10, 11])
    expect(graduazioniRichieste('elettrodi', 30, 30).richieste.map((r) => r.n)).toEqual([9])
    expect(graduazioniRichieste('mag', 80, 170).richieste.map((r) => r.n)).toEqual([11, 12])
    expect(graduazioniRichieste('tig', 3, 50)).toMatchObject({ fuoriTabella: true })
    expect(graduazioniRichieste('ossitaglio', 1800, 3150).richieste.map((r) => r.n)).toEqual([5, 6])
  })
  it('filtri in dotazione e adeguatezza (pari o un grado più scuro)', () => {
    expect(gradiDisponibili('10-11; 9-13')).toEqual([9, 10, 11, 12, 13])
    expect(gradiDisponibili('DIN 5')).toEqual([5])
    expect(verificaDpi([{ da: 0, a: 1, n: 10 }], [11])).toEqual({ adeguato: true, mancanti: [] })
    expect(verificaDpi([{ da: 0, a: 1, n: 10 }], [9])).toEqual({ adeguato: false, mancanti: [10] })
  })
})

describe('DVR ROA Castagnola 2026', () => {
  const v = valutaRoa(SORGENTI_CASTAGNOLA, RILIEVI_CASTAGNOLA, DPI_CASTAGNOLA)
  it('giustificazione delle sorgenti come nelle tabelle 9–11', () => {
    const esito = Object.fromEntries(SORGENTI_CASTAGNOLA.map((s) => [s.id, giustificabile(s)]))
    expect(esito).toEqual({ s1: false, s2: false, s3: false, l1: true, l2: true, l3: true, l4: false, l5: false, l6: true, l7: false, l8: true, z1: true, z2: true, z3: false, z4: false, z5: false, z6: false })
  })
  it('luminanza dei fari a paramento (tabella 16: il modello tronca a 1263)', () => {
    expect(lvArrotondata(v.rilievi[0].lv)).toBe(1264)
    expect(v.rilievi[0].rispetta).toBe(true)
  })
  it('DPI: saldature adeguate; ossitaglio fino a 3150 l/h richiede il n° 6 (il modello dà adeguati gli occhiali DIN 5)', () => {
    expect(v.dpi.map((d) => d.adeguato)).toEqual([true, true, false])
    expect(v.dpi[2].mancanti).toEqual([6])
    expect(v.dpi[1].richieste.map((r) => r.n)).toEqual([10, 11])
  })
})
