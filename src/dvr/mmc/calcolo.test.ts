import { describe, expect, it } from 'vitest'
import { ATTIVITA_MMC_XENIA, MANSIONI_MMC_XENIA } from './__fixtures__/xenia2026'
import { fattoreAltezza, fattoreDislocazione, fattoreDistanza, fattoreAsimmetria, fattoreFrequenza, valutaNiosh, valutaNioshComposto, fasciaNiosh } from './niosh'
import { indiceOcraEquivalente, valutaOcra } from './ocra'
import { fasciaSnook, valutaSnook } from './snook'
import { valutaAttivita, valutaDvrMmc } from './valutazione'

describe('NIOSH – fattori', () => {
  it('nei punti della tabella del DVR valgono i valori della tabella', () => {
    expect([0, 25, 50, 75, 100, 125, 150].map(fattoreAltezza)).toEqual([0.77, 0.85, 0.93, 1, 0.93, 0.85, 0.78])
    expect([25, 30, 40, 50, 70, 100, 170].map(fattoreDislocazione)).toEqual([1, 0.97, 0.93, 0.91, 0.88, 0.87, 0.86])
    expect([25, 30, 40, 50, 55, 60].map(fattoreDistanza)).toEqual([1, 0.83, 0.63, 0.5, 0.45, 0.42])
    expect([0, 30, 60, 90, 120, 135].map(fattoreAsimmetria)).toEqual([1, 0.9, 0.81, 0.71, 0.62, 0.57])
  })
  it('fuori tabella: formule della norma e limiti', () => {
    expect(fattoreAltezza(180)).toBe(0)
    expect(fattoreAltezza(90)).toBe(0.96)
    expect(fattoreDislocazione(10)).toBe(1)
    expect(fattoreDislocazione(200)).toBe(0)
    expect(fattoreDistanza(45)).toBe(0.56)
    expect(fattoreDistanza(70)).toBe(0)
    expect(fattoreAsimmetria(45)).toBe(0.86)
    expect(fattoreAsimmetria(150)).toBe(0)
  })
  it('frequenza: tabella per durata, interpolazione lineare', () => {
    expect(fattoreFrequenza(0.04, 'breve')).toBe(1)
    expect(fattoreFrequenza(0.04, 'lunga')).toBe(0.85)
    expect(fattoreFrequenza(4, 'media')).toBe(0.72)
    expect(fattoreFrequenza(5, 'breve')).toBe(0.8)
    expect(fattoreFrequenza(16, 'breve')).toBe(0)
  })
  it('fasce: ≤ 0,85 verde, fino a 0,99 gialla, da 1 rossa', () => {
    expect([0.85, 0.86, 0.99, 1].map(fasciaNiosh)).toEqual([0, 1, 1, 2])
  })
  it('sollevamento in due persone: peso diviso e fattore 0,85', () => {
    const r = valutaNiosh({ peso: 20, persone: 2, altezza: 0, dislocazione: 100, distanza: 25, asimmetria: 30, frequenza: 0.2, durata: 'breve', presa: 'buono' })
    expect(r.peso).toBe(10)
    expect(r.adulti.plr).toBe(12.8)
    expect(r.anziani.plr).toBe(10.2)
  })
  it('indice composto: con frequenze basse coincide con il compito più gravoso', () => {
    const c = valutaNioshComposto([
      { peso: 4, altezza: 100, dislocazione: 25, distanza: 25, asimmetria: 30, frequenza: 0.1, durata: 'breve', presa: 'buono' },
      { peso: 4, altezza: 0, dislocazione: 100, distanza: 30, asimmetria: 0, frequenza: 0.1, durata: 'breve', presa: 'buono' },
    ])
    expect(c.adulti.isc).toBe(0.29)
    expect(c.anziani.isc).toBe(0.36)
  })
  it('indice composto: con frequenze alte aumenta rispetto al compito peggiore', () => {
    const t = { peso: 8, altezza: 75, dislocazione: 25, distanza: 25, asimmetria: 0, durata: 'lunga' as const, presa: 'buono' as const }
    const c = valutaNioshComposto([{ ...t, frequenza: 2 }, { ...t, frequenza: 2 }])
    const singolo = valutaNiosh({ ...t, frequenza: 2 }).adulti.is
    expect(c.adulti.isc).toBeGreaterThan(singolo)
  })
})

describe('Snook e Ciriello', () => {
  it('trasporto 80 cm, 15 m: 1 ogni 8 h → 26 kg, 1 ogni 30 min → 22 kg', () => {
    expect(valutaSnook({ azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 8 * 3600, valore: 15 })).toMatchObject({ limite: 26, indice: 0.58, fascia: 0 })
    expect(valutaSnook({ azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 1800, valore: 15 })).toMatchObject({ limite: 22, indice: 0.68 })
  })
  it('frequenza fuori colonna: si usa la colonna più frequente (a favore di sicurezza)', () => {
    const r = valutaSnook({ azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 3600, valore: 20 })
    expect(r.intervalloTabella).toBe(1800)
    expect(r.indice).toBe(0.91)
  })
  it('spinta: peggiore tra forza iniziale e di mantenimento', () => {
    const r = valutaSnook({ azione: 'spinta', altezza: 95, distanza: 7.5, intervallo: 60, valore: 15, mantenimento: 10 })
    expect(r.limite).toBe(23)
    expect(r.limiteMantenimento).toBe(13)
    expect(r.indice).toBe(0.77)
  })
  it('fasce: 0,75 verde, fino a 1,25 gialla, oltre rossa, oltre 3 viola', () => {
    expect([0.75, 0.76, 1.25, 1.26, 3, 3.1].map(fasciaSnook)).toEqual([0, 1, 1, 2, 2, 3])
  })
})

describe('OCRA', () => {
  it('fasce della check list e indice equivalente', () => {
    expect(indiceOcraEquivalente(7.5)).toBe(2.2)
    expect(indiceOcraEquivalente(11)).toBe(3.5)
    expect(indiceOcraEquivalente(22.5)).toBe(9)
    expect(valutaOcra({ sx: 0, dx: 7.5 }).fascia).toBe(1)
    expect(valutaOcra({ sx: 12, dx: 7.5 }).fascia).toBe(3)
  })
})

// Differenze note del modello (arrotondamenti a mano o fasce diverse)
const DIVERSI: Record<string, number[]> = {
  a1: [0.2, 0.25], // 3,8 / 19,3 = 0,197 → 0,20 (modello 0,19)
  a3b: [0.85, 1.06], // 10 / 11,8 → 0,85 (modello 0,86); 10 / 9,45 → 1,06 (modello 1,07)
  a11: [0.81, 1.01], // 15 / 18,5 = 0,81 (modello 0,80)
  a13: [0.93, 1.17], // PLR 25×0,85×0,91×0,83 = 16,05 → 16,1 e 15 / 16,1 = 0,93 (modello PLR 16,0 e 0,94)
  a18: [0.93, 1.17], // come a13
  a16: [0.6, 0.75], // 10 / 16,8 = 0,595 → 0,60 (modello 0,59)
  a20: [0.91], // 1 ogni 60 min: colonna 30 min, 22 kg (il modello interpola 24 kg → 0,83)
}

describe('DVR MMC Xenia 2026', () => {
  ATTIVITA_MMC_XENIA.forEach((a) => {
    it(a.titolo, () => {
      const { esito } = valutaAttivita(a)
      expect(esito).not.toBeNull()
      const atteso = DIVERSI[a.id] ?? a.modello
      if (a.metodo === 'niosh') expect([esito!.niosh!.adulti.is, esito!.niosh!.anziani.is]).toEqual(atteso)
      if (a.metodo === 'niosh_composto') expect([esito!.composto!.adulti.isc, esito!.composto!.anziani.isc]).toEqual(atteso)
      if (a.metodo === 'snook') expect([esito!.snook!.indice]).toEqual(atteso)
      if (a.metodo === 'ocra') expect([esito!.ocra!.sx!.punteggio, esito!.ocra!.dx!.punteggio]).toEqual(atteso)
    })
  })

  it('riepilogo per mansione: non esposte, livelli massimi', () => {
    const v = valutaDvrMmc(MANSIONI_MMC_XENIA, ATTIVITA_MMC_XENIA)
    const nonEsposte = v.perMansione.filter((m) => m.esiti.length === 0).map((m) => m.mansione.nome)
    expect(nonEsposte).toEqual(['Capo Turno', 'Capo Cantiere', 'Caposquadra TBM', 'Aiuto montaggio anelli', 'Operatore MSV', 'Impiegato tecnico', 'Operatore TBM – Addetto fondoscudo', 'Capo piazzale TBM', 'Addetto Forklift', 'Gruista'])
    const livello = (nome: string) => v.perMansione.find((m) => m.mansione.nome === nome)!.livello
    expect(livello('Operatore TBM – Impiantista')).toEqual({ adulti: 1, anziani: 2 })
    // montaggio plafoniere di emergenza: 0,85 per gli adulti resta in fascia verde (il modello, con 0,86, in gialla)
    expect(livello('Operatore TBM – Elettricista TBM/Aiuto elettricista TBM')).toEqual({ adulti: 0, anziani: 2 })
    // secchio di malta: 0,88 per gli over 45 è fascia gialla (il modello scrive "trascurabile")
    expect(livello('Addetto ripristini/Muratore')).toEqual({ adulti: 0, anziani: 1 })
    expect(livello('Capo magazzino TBM/Addetto magazzino')).toEqual({ adulti: 0, anziani: 2 })
  })
})
