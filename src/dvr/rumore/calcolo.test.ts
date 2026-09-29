import { describe, expect, it } from 'vitest'
import { calcolaLex, fasciaDaLex, fasciaDaPicco, valutaMansione, type PeriodoEsposizione } from './calcolo'
import { attenuazioneReale, livelloProtezione, verificaFase, type DpiUdito } from './dpi'
import { valutaDvrRumore } from './valutazione'
import { TABELLA13_XENIA, TAV_XENIA } from './__fixtures__/xenia2026'

const periodo = (minuti: number, laeq: number, extra: Partial<PeriodoEsposizione> = {}): PeriodoEsposizione => ({
  minuti,
  laeq,
  fase: 'Fase',
  postazione: 'Postazione',
  origine: 'misura',
  ...extra,
})

const COVERGUARD: DpiUdito = { nome: 'Coverguard 30215', tipo: 'inserti', h: 38, m: 37, l: 35, beta: 0.5 }
const SIR_ONDA: DpiUdito = { nome: 'SIR Onda FC1230', tipo: 'archetto', h: 30, m: 24, l: 22, beta: 0.5 }
const PORTWEST: DpiUdito = { nome: 'Portwest EP16', tipo: 'archetto', h: 27.7, m: 25.4, l: 19.6, beta: 0.5 }

/** TAV in cui il valore del documento non torna con i periodi elencati (vedi analisi). */
const TAV_CON_DISCREPANZA = new Set(['OPERATORE TBM – IMPIANTISTA', 'IMPIEGATO TECNICO', 'CAPO CANTIERE'])

describe('LEX,8h', () => {
  it('8 ore a livello costante danno lo stesso livello', () => {
    expect(calcolaLex([periodo(480, 85)])).toBeCloseTo(85, 6)
  })
  it('dimezzare il tempo riduce di 3 dB', () => {
    expect(calcolaLex([periodo(240, 88), periodo(240, 0.0001)])).toBeCloseTo(85, 1)
  })
})

describe('fasce art. 189', () => {
  it('soglie inclusive: 80,0 e 85,0 entrano nella fascia superiore', () => {
    expect(fasciaDaLex(79.9)).toBe(1)
    expect(fasciaDaLex(80.0)).toBe(2)
    expect(fasciaDaLex(84.96)).toBe(3) // arrotondato 85,0
    expect(fasciaDaLex(85.4)).toBe(3)
    expect(fasciaDaPicco(134.9)).toBe(1)
    expect(fasciaDaPicco(135)).toBe(2)
    expect(fasciaDaPicco(137.2)).toBe(3)
  })
  it('il picco può alzare la fascia', () => {
    const r = valutaMansione([periodo(480, 78, { lpeak: 136 })])
    expect(r.fasciaLex).toBe(1)
    expect(r.fascia).toBe(2)
  })
})

describe('controlli', () => {
  it('segnala una giornata che non somma 480 minuti', () => {
    const r = valutaMansione([periodo(470, 80)])
    expect(r.avvisi.map((a) => a.codice)).toContain('minuti_diversi_da_480')
  })
  it('segnala i dati di campagne precedenti', () => {
    const r = valutaMansione([periodo(480, 80, { origine: 'storico' })])
    expect(r.avvisi.map((a) => a.codice)).toContain('dati_storici')
  })
  it('segnala il caso al confine con l\'incertezza', () => {
    const r = valutaMansione([periodo(480, 84.2)])
    expect(r.avvisi.map((a) => a.codice)).toContain('vicino_al_confine')
    const cautelativo = valutaMansione([periodo(480, 84.2)], { criterio: 'valore_piu_incertezza' })
    expect(cautelativo.fascia).toBe(3)
  })
})

describe('DVR Rumore Xenia 2026: il motore riproduce le TAV', () => {
  for (const tav of TAV_XENIA) {
    it(tav.tav, () => {
      const r = valutaMansione(tav.periodi)
      expect(r.minutiTotali).toBe(480)
      expect(r.incertezza).toBe(tav.documento.incertezza)
      expect(r.piccoMax).toBe(tav.documento.picco)
      if (TAV_CON_DISCREPANZA.has(tav.nome)) {
        expect(r.lexArrotondato).not.toBe(tav.documento.lex)
      } else {
        expect(r.lexArrotondato).toBe(tav.documento.lex)
      }
    })
  }
})

describe('DPI metodo HML (Tabelle 7-9 del DVR Xenia)', () => {
  it('attenuazione reale con β = 0,5', () => {
    expect(attenuazioneReale(COVERGUARD)).toEqual({ h: 19, m: 18.5, l: 17.5 })
  })
  const casi: [number, number, number, number, number][] = [
    // LAeq, LCeq, Coverguard, SIR Onda, Portwest
    [86.2, 90.5, 68.0, 74.5, 74.3],
    [88.8, 91.5, 70.4, 76.9, 76.4],
    [83.6, 89.3, 65.6, 72.1, 72.2],
    [90.2, 93.2, 71.8, 78.3, 77.9],
    [87.7, 97.8, 70.2, 76.7, 77.9],
    [85.7, 96.8, 68.3, 74.8, 76.3],
  ]
  for (const [la, lc, cg, sir, pw] of casi) {
    it(`${la} dB(A) / ${lc} dB(C)`, () => {
      expect(verificaFase(COVERGUARD, { laeq: la, lceq: lc }).livelloConDpi).toBe(cg)
      expect(verificaFase(SIR_ONDA, { laeq: la, lceq: lc }).livelloConDpi).toBe(sir)
      expect(verificaFase(PORTWEST, { laeq: la, lceq: lc }).livelloConDpi).toBe(pw)
    })
  }
  it('livelli di protezione UNI 9432 prospetto C.5', () => {
    expect(livelloProtezione(80.1)).toBe('insufficiente')
    expect(livelloProtezione(78)).toBe('accettabile')
    expect(livelloProtezione(72)).toBe('buona')
    expect(livelloProtezione(66)).toBe('accettabile')
    expect(livelloProtezione(64.9)).toBe('troppo_alta')
  })
})

describe('valutazione completa Xenia', () => {
  const v = valutaDvrRumore({
    mansioni: TAV_XENIA.map((t, i) => ({
      id: String(i),
      nome: t.nome,
      periodi: t.periodi,
      vibrazioni: false,
      ototossiche: false,
    })),
    dpi: [COVERGUARD, SIR_ONDA, PORTWEST],
  })
  it('le mansioni sopra 85 dB(A) finiscono in 3ª fascia', () => {
    expect(v.perFascia[3]).toEqual(
      expect.arrayContaining(['OPERATORE TBM – MECCANICO TBM/AIUTO MECCANICO TBM']),
    )
    expect(v.perFascia[3].some((n) => n.includes('INIEZIONI MALTA'))).toBe(true)
  })
  it('con i DPI il valore limite di 87 dB(A) è rispettato', () => {
    expect(v.limiteRispettatoConDpi).toBe(true)
    expect(v.verificheDpi[1].tuttiAdeguati).toBe(true)
    expect(v.verificheDpi[2].tuttiAdeguati).toBe(true)
  })
  it('Coverguard: iperprotezione solo dove manca LCeq (stima con la sola M)', () => {
    const nonAdeguate = v.verificheDpi[0].righe.filter((r) => !r.verifica.adeguato)
    expect(nonAdeguate).toHaveLength(1)
    expect(nonAdeguate[0].verifica.stimaSemplificata).toBe(true)
    expect(nonAdeguate[0].verifica.protezione).toBe('troppo_alta')
  })
  it('segnala la stessa postazione con livelli diversi tra mansioni', () => {
    const incoerenti = v.avvisi.filter((a) => a.codice === 'livelli_incoerenti').map((a) => a.messaggio)
    expect(incoerenti.some((m) => m.includes('banco elettricisti') && m.includes('90.2'))).toBe(true)
  })
  it('la Tabella 13 del documento ha Meccanico ed Elettricista scambiati', () => {
    const mecc = v.esiti.find((e) => e.mansione.nome.includes('MECCANICO'))!
    expect(mecc.lexArrotondato).toBe(85.4)
    expect(TABELLA13_XENIA['Operatore TBM – Meccanico TBM/Aiuto meccanico TBM'].lex).toBe(83.2)
  })
})

describe('controlli sui dati dei DPI', () => {
  it('trova i due refusi della scheda Portwest EP16 nel DVR Xenia', async () => {
    const { controllaDpi } = await import('./dpi')
    const { OTTAVE_XENIA } = await import('./__fixtures__/xenia2026Extra')
    const avvisi = controllaDpi({ ...PORTWEST, ottave: OTTAVE_XENIA[2] })
    expect(avvisi.some((a) => a.includes('2000 Hz'))).toBe(true)
    expect(avvisi.some((a) => a.includes('8000 Hz'))).toBe(true)
    expect(controllaDpi({ ...COVERGUARD, ottave: OTTAVE_XENIA[0] })).toEqual([])
  })
})
