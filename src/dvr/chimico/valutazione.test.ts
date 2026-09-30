import { describe, expect, it } from 'vitest'
import { arrotonda } from '../comune/numeri'
import { AGENTI_PREDEFINITI } from './agenti'
import { AMBIENTI_CASTAGNOLA, IR_MODELLO, TAV_CASTAGNOLA } from './__fixtures__/castagnola2026'
import { classePiemonte, concentrazione, fattoreDurata, fattoreEsposizione, fattoreP, valutaChimico } from './valutazione'

const AGENTI = AGENTI_PREDEFINITI.chimico

describe('modello Regione Piemonte', () => {
  it('fattore di esposizione (tabelle dei DVR Chimico e Fumi di saldatura)', () => {
    // FdS, una misura
    expect([8, 12, 1, 0.5, 10, 22, 26, 2.5, 17.5, 40, 25, 5, 20].map((p) => fattoreEsposizione(p, 1))).toEqual([2, 3, 1, 0.5, 2, 3, 4, 1, 3, 4, 3, 1, 3])
    // Chimico, armatura calotta: tre misure
    expect([32.3, 91.7, 18.3, 20, 132].map((p) => fattoreEsposizione(p, 3))).toEqual([3, 5, 2, 2, 5])
  })
  it('durata, matrice P e classi', () => {
    expect([30, 120, 121, 240, 241].map((m) => fattoreDurata(m))).toEqual([1, 2, 3, 3, 4])
    expect(fattoreP(5, 3) * 5).toBe(85)
    expect(fattoreP(3, 3) * 1).toBe(10)
    expect([10, 11, 25, 26, 51, 76].map(classePiemonte)).toEqual(['irrilevante', 'modesto', 'modesto', 'medio', 'alto', 'molto alto'])
  })
})

describe('DVR Chimico Castagnola 2026', () => {
  it('concentrazioni medie degli ambienti come la tabella 6 (tranne 18 medie sbagliate nel modello)', () => {
    const ordine = ['polveri_resp', 'no', 'co', 'co2', 'h2s', 'no2']
    let uguali = 0
    const diverse: string[] = []
    for (const a of AMBIENTI_CASTAGNOLA) {
      ordine.forEach((ag, i) => {
        const c = concentrazione(a, ag).valore
        const m = a.medie[i]
        if (m == null || c == null) return
        if (Math.abs(c - m) > 0.051) diverse.push(`${a.fase} / ${a.postazione} ${ag}`)
        else uguali++
      })
    }
    expect(uguali).toBeGreaterThan(160)
    // es. smarino in cabina pala: misura 0,09 mg/m³, media scritta 0,9; attività ordinaria in galleria:
    // NO 2,2 / 1,1 / 0,2 ppm, media scritta 0,28
    expect(diverse).toHaveLength(18)
    expect(diverse).toContain('Smarino / Interno cabina pala polveri_resp')
  })

  it('TWA per mansione come l’allegato 2 (60 TAV)', () => {
    const v = valutaChimico(
      AGENTI,
      [],
      TAV_CASTAGNOLA.map((t) => ({ mansione: { id: t.tav, nome: t.nome }, periodi: t.periodi })),
      { piemonte: false },
    )
    let confronti = 0
    const scarti: string[] = []
    v.mansioni.forEach((m, i) => {
      const atteso = TAV_CASTAGNOLA[i].totale
      for (const ag of ['polveri_resp', 'no2', 'no', 'co']) {
        const x = m.twa[ag]
        const y = atteso[ag]
        if (x == null || y == null) continue
        confronti++
        const dec = AGENTI.find((a) => a.id === ag)!.decimali
        if (Math.abs(arrotonda(x, dec) - y) > 1.01 * 10 ** -dec) scarti.push(`${m.mansione.id} ${ag}: ${arrotonda(x, dec)} vs ${y}`)
      }
    })
    expect(confronti).toBeGreaterThan(200)
    // TAV 4 (Jumbista/Minatore): i totali di NO₂, NO e CO non sono la media ponderata delle sue righe
    expect(scarti).toEqual(['TAV. 4 MANSIONE: no2: 0.39 vs 0.65', 'TAV. 4 MANSIONE: no: 1.6 vs 2.02', 'TAV. 4 MANSIONE: co: 1.6 vs 1.45'])
  })

  it('indici del modello Piemonte: i fattori coerenti con le tabelle coincidono', () => {
    const v = valutaChimico(AGENTI, AMBIENTI_CASTAGNOLA.map((a) => ({ ...a, durata: IR_MODELLO.find((x) => x.titolo === `${a.fase} / ${a.postazione}`)?.D ?? null })), [])
    let uguali = 0
    let diversi = 0
    for (const e of v.ambienti) {
      const mod = IR_MODELLO.find((x) => x.titolo === `${e.ambiente.fase} / ${e.ambiente.postazione}`)
      if (!mod) continue
      for (const i of e.indici) {
        if (mod.IR[i.agente.id] == null) continue
        if (i.ir === mod.IR[i.agente.id]) uguali++
        else diversi++
      }
    }
    // il DVR modello ha fattori E incoerenti con le sue stesse soglie in molte celle (es. H₂S al 2% con E = 5)
    expect(uguali).toBeGreaterThan(100)
    expect(diversi).toBeLessThan(uguali)
  })
})
