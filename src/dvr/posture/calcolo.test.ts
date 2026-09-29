import { describe, expect, it } from 'vitest'
import { calcolaClasseOwas } from '../../data/owasLookup'
import { TAV_CASTAGNOLA } from './__fixtures__/castagnola2025'
import { classeOwas, fasciaPosture, valutaGiornata, valutaMansionePosture, type ClasseOwas, type GiornataPosture } from './calcolo'

const giornate = (t: (typeof TAV_CASTAGNOLA)[number]): GiornataPosture[] =>
  t.giornate.map((g) => ({
    titolo: g.titolo,
    righe: g.righe.map(([fase, attivita, minuti, classe]) => ({ fase, attivita, minuti, classe: classe as ClasseOwas })),
  }))

// TAV del modello i cui riepiloghi non corrispondono alle tabelle delle attività (durate modificate
// senza aggiornare le frequenze): indici 1-based della TAV.
const RIEPILOGHI_NON_AGGIORNATI = new Set([1, 2, 3, 5, 6, 7, 9, 10, 12, 13, 16, 17, 23])
// Tabella 17 del modello diversa dal massimo della TAV (Perforatore: copiato dalla riga sopra).
const TABELLA17_DIVERSA = new Set([3, 7, 13, 16, 39])

describe('indice OWAS per giornata', () => {
  it('formula I = Σ frequenza × classe × 100', () => {
    const e = valutaGiornata({
      titolo: 'Getto murette',
      righe: [
        { fase: 'Getto', attivita: 'Getto del cls', minuti: 320, classe: 1 },
        { fase: 'Getto', attivita: 'Vibratura cls', minuti: 115, classe: 2 },
        { fase: 'Pause tecniche', attivita: 'Tempi di attesa', minuti: 30, classe: 1 },
        { fase: 'Pausa fisiologica', attivita: '/', minuti: 15, classe: 1 },
      ],
    })
    expect(e.minutiTotali).toBe(480)
    expect(e.frequenze).toEqual([76, 24, 0, 0])
    expect(e.indice).toBe(124)
    expect(e.fascia).toBe(1)
  })

  it('le operazioni ordinarie ripartite valgono come quattro righe uguali, una per classe', () => {
    const base = [{ fase: 'Scavo', attivita: 'Assistenza', minuti: 300, classe: 1 as const }]
    const ripartita = valutaGiornata({ titolo: 'a', righe: [...base, { fase: 'Op. ordinarie', attivita: 'Varie', minuti: 180, classe: 'ripartita' }] })
    const esplicita = valutaGiornata({
      titolo: 'b',
      righe: [...base, ...([1, 2, 3, 4] as const).map((c) => ({ fase: 'Op. ordinarie', attivita: 'Varie', minuti: 45, classe: c }))],
    })
    expect(ripartita.indice).toBe(esplicita.indice)
    expect(ripartita.frequenze).toEqual(esplicita.frequenze)
  })

  it('fasce del prospetto: 100 assente, 101–200 lieve, 201–300 medio, oltre elevato', () => {
    expect(fasciaPosture(100)).toBe(0)
    expect(fasciaPosture(100.1)).toBe(1)
    expect(fasciaPosture(200)).toBe(1)
    expect(fasciaPosture(200.1)).toBe(2)
    expect(fasciaPosture(300)).toBe(2)
    expect(fasciaPosture(300.1)).toBe(3)
    expect(fasciaPosture(400)).toBe(3)
  })
})

describe('DVR Posture Castagnola 2025 – Allegato 1', () => {
  it('61 TAV, 150 giornate', () => {
    expect(TAV_CASTAGNOLA).toHaveLength(61)
    expect(TAV_CASTAGNOLA.reduce((s, t) => s + t.giornate.length, 0)).toBe(150)
  })

  TAV_CASTAGNOLA.forEach((t, i) => {
    const n = i + 1
    it(`TAV ${n} ${t.nome}`, () => {
      const esito = valutaMansionePosture(giornate(t))
      const calcolati = esito.giornate.map((g) => g.indice)
      if (!RIEPILOGHI_NON_AGGIORNATI.has(n)) {
        // il modello riporta gli indici arrotondati a mano (anche all'unità): tolleranza 0,6
        const a = [...calcolati].sort((x, y) => x - y)
        const b = [...t.riepilogo].sort((x, y) => x - y)
        expect(a).toHaveLength(b.length)
        a.forEach((x, k) => expect(Math.abs(x - b[k])).toBeLessThanOrEqual(0.6))
      }
      if (t.tabella17 !== null && !TABELLA17_DIVERSA.has(n)) {
        expect(Math.abs(esito.peggiore!.indice - t.tabella17)).toBeLessThanOrEqual(0.6)
      }
      // la classificazione del modello resta la stessa (assente o lieve) anche con i valori corretti
      expect(esito.fascia).toBe(t.tabella17 === 100 ? 0 : 1)
    })
  })

  it('le differenze del modello non cambiano la fascia', () => {
    const perforatore = valutaMansionePosture(giornate(TAV_CASTAGNOLA[38]))
    expect(perforatore.peggiore!.indice).toBe(142.7) // la Tabella 17 riporta 190,5
    const lancistaMulettista = valutaMansionePosture(giornate(TAV_CASTAGNOLA[6]))
    expect(lancistaMulettista.peggiore!.indice).toBe(181.3) // la Tabella 17 riporta 176
  })
})

describe('classi OWAS', () => {
  it('classe dal codice a 4 cifre (tabella standard)', () => {
    expect(classeOwas({ schiena: 1, braccia: 1, gambe: 2, carico: 1 })).toBe(1)
    expect(classeOwas({ schiena: 4, braccia: 1, gambe: 2, carico: 1 })).toBe(2)
    expect(classeOwas({ schiena: 3, braccia: 1, gambe: 5, carico: 1 })).toBe(4)
    expect(classeOwas({ schiena: 2, braccia: 3, gambe: 6, carico: 1 })).toBe(4)
  })

  it('tabella completa: 252 combinazioni, classi 1–4, carico più pesante mai meno gravoso', () => {
    let n = 0
    for (const s of [1, 2, 3, 4] as const)
      for (const b of [1, 2, 3] as const)
        for (const g of [1, 2, 3, 4, 5, 6, 7] as const) {
          const c = ([1, 2, 3] as const).map((p) => calcolaClasseOwas(s, b, g, p))
          c.forEach((x) => expect([1, 2, 3, 4]).toContain(x))
          expect(c[1]).toBeGreaterThanOrEqual(c[0])
          expect(c[2]).toBeGreaterThanOrEqual(c[1])
          n += 3
        }
    expect(n).toBe(252)
  })
})
