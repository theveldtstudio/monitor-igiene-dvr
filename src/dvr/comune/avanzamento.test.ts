import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { datiAvanzamento, FASI_AVANZAMENTO, type Avanzamento } from './avanzamento'
import { generaDocx } from './generaDocx'

/** Tempi del DVR Posture Castagnola 2025 (tabella 1) e produzione Gennaio – Dicembre 2025. */
const CASTAGNOLA: Avanzamento = {
  fasi: FASI_AVANZAMENTO.map((fase, i) => ({ fase, esplosivo: [40, 35, 20, 50, 130, 110, 40][i], martellone: [null, null, null, 180, 135, 180, 75][i] })),
  produzione: [
    { metodo: 'martellone', metri: 1053.4, giorni: 285 },
    { metodo: 'esplosivo', metri: 210.6, giorni: 67 },
  ],
  periodo: 'Gennaio – Dicembre 2025',
}

const CARTELLA = resolve(__dirname, '../../../public/templates/dvr')

describe('Tempi per metro lineare di avanzamento', () => {
  it('dati del template', () => {
    const d = datiAvanzamento(CASTAGNOLA)
    expect(d.conAvanzamento).toBe(true)
    expect(d.avanzamentoTesto).toContain('per ciascuna tipologia di avanzamento')
    expect(d.avanzamento[0]).toEqual({ fase: 'Perforazione', esplosivo: '40', martellone: '/' })
    expect(d.avanzamento.at(-1)).toEqual({ fase: 'Totale per metro lineare', esplosivo: '425', martellone: '570' })
    expect(d.produzioneTesto).toBe('In particolare, nel periodo Gennaio – Dicembre 2025 sono stati effettuati:')
    expect(d.produzione).toEqual(['1.053,4 m di avanzamento con martellone in 285 giorni (3,7 m al giorno);', '210,6 m di avanzamento con esplosivo in 67 giorni (3,1 m al giorno).'])
    const soloMartellone = datiAvanzamento({ fasi: [{ fase: 'Scavo', esplosivo: null, martellone: 180 }], produzione: [] }, 'Luglio 2026')
    expect(soloMartellone.avanzamentoTesto).toContain('con martellone')
    expect(soloMartellone.conProduzione).toBe(false)
    expect(datiAvanzamento({ fasi: [{ fase: 'Scavo', esplosivo: null, martellone: null }], produzione: [] }).conAvanzamento).toBe(false)
    expect(datiAvanzamento(null).conAvanzamento).toBe(false)
  })

  it('tutti i template hanno il blocco dopo il ciclo di lavoro', () => {
    const files = readdirSync(CARTELLA).filter((f) => f.endsWith('.docx'))
    expect(files.length).toBe(14)
    for (const f of files) {
      const docx = generaDocx(readFileSync(resolve(CARTELLA, f)), { cicloBlocchi: [{ testo: 'CICLO', punti: [] }], ...datiAvanzamento(CASTAGNOLA) })
      const testo = new PizZip(docx).file('word/document.xml')!.asText().replace(/<[^>]+>/g, ' ')
      expect(testo, f).toMatch(/CICLO[\s\S]*per ciascuna tipologia di avanzamento[\s\S]*Posa centina[\s\S]*Totale per metro lineare[\s\S]*1\.053,4 m di avanzamento con martellone/)
      const senza = new PizZip(generaDocx(readFileSync(resolve(CARTELLA, f)), {})).file('word/document.xml')!.asText()
      expect(senza, f).not.toContain('metro lineare di avanzamento')
    }
  })
})
