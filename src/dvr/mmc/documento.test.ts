import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import { datiTemplateMmc, type DatiDvrMmc } from './documento'
import { ATTIVITA_MMC_XENIA, MANSIONI_MMC_XENIA } from './__fixtures__/xenia2026'

const DATI: DatiDvrMmc = {
  anagrafica: {
    comune: 'Battipaglia',
    provincia: 'Salerno',
    opera: 'Linea Ferroviaria AV Salerno-Reggio Calabria, Lotto 1A Battipaglia-Romagnano',
    denominazione: 'TBM1',
    impresa: 'Consorzio Xenia',
    datore_lavoro: 'Ing. Salvatore Francesco Caruso',
    rspp: 'Carmine D’Auria',
    medico_competente: 'Dott. Dante Luigi Cioffi',
    rls: ['Patrizio Pellegrino', 'Antonio Granato'],
    gruppo_lavoro: ['Fabio Catano', 'Paola Ciuffreda', 'Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: 'Paola Ciuffreda',
    approvato: 'Fabio Catano',
  },
  documento: {
    periodoRiferimento: 'Luglio 2026',
    revisione: 0,
    dataEmissioneTesto: 'Luglio 2026',
    anno: 2026,
    revisioni: [{ revisione: 0, integrazione: null, data: 'Luglio 2026', descrizione: 'Prima emissione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' }],
  },
  ambiti: [{ nome: 'Galleria TBM1', tipo: 'galleria_tbm' }],
  mansioni: MANSIONI_MMC_XENIA,
  attivita: ATTIVITA_MMC_XENIA.map((a) => ({
    ...a,
    descrizione: `Descrizione di ${a.titolo.toLowerCase()}.\n\nSeconda ipotesi di calcolo.`,
  })),
}

const TEMPLATE = resolve(__dirname, '../../../public/templates/dvr/mmc.docx')
const xmlDocx = (docx: Uint8Array) => new PizZip(docx).file('word/document.xml')!.asText()
const testoDocx = (xml: string) => xml.replace(/<w:p[ >]/g, '\n$&').replace(/<[^>]+>/g, '')

describe('DVR MMC: generazione Word', () => {
  const { dati } = datiTemplateMmc(DATI)
  const docx = generaDocx(readFileSync(TEMPLATE), dati)
  const xml = xmlDocx(docx)
  const testo = testoDocx(xml)
  if (process.env.DVR_OUT) writeFileSync(process.env.DVR_OUT, docx)

  it('nessun tag né marcatore rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
  })

  it('una sezione per attività con il blocco del metodo', () => {
    expect(testo.match(/^6\.\d+ /gm)).toHaveLength(20)
    expect(testo).toContain('6.20 Trasporto manuale di materiali edili sul piazzale')
    expect(testo.match(/INDICE DI SOLLEVAMENTO CALCOLATO PER:/g)).toHaveLength(12)
    expect(testo.match(/I\.S\.C\./g)).toHaveLength(4)
    expect(testo).toContain('Seconda ipotesi di calcolo.')
  })

  it('riepilogo: mansioni non esposte e indici', () => {
    expect(testo.match(/NON ESPOSTO/g)).toHaveLength(10)
    expect(testo).toContain('1,17')
    expect(testo).toContain('DX = 7,5 (OCRA 2,2)')
  })

  it('conclusioni coerenti con il calcolo', () => {
    expect(testo).toContain('10 mansioni non risultano esposte')
    expect(testo).toContain('Per i lavoratori giovani (sotto i 18 anni) e con più di 45 anni il rischio è presente per:')
  })
})
