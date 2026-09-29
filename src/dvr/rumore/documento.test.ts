import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import type { DpiUdito } from './dpi'
import { datiTemplateRumore, type DatiDvrRumore } from './documento'
import { TAV_XENIA } from './__fixtures__/xenia2026'
import {
  IMPULSIVI_XENIA,
  MACCHINE_XENIA,
  MANSIONI_XENIA,
  OTTAVE_XENIA,
  RILIEVI_XENIA,
  TARATURE_XENIA,
} from './__fixtures__/xenia2026Extra'

const DPI: DpiUdito[] = [
  { nome: 'Inserti antirumore Coverguard 30215', tipo: 'inserti', h: 38, m: 37, l: 35, beta: 0.5, ottave: OTTAVE_XENIA[0] },
  { nome: 'Inserti SIR Onda FC1230', tipo: 'archetto', h: 30, m: 24, l: 22, beta: 0.5, ottave: OTTAVE_XENIA[1] },
  { nome: 'Inserti Portwest EP16', tipo: 'archetto', h: 27.7, m: 25.4, l: 19.6, beta: 0.5, ottave: OTTAVE_XENIA[2] },
]

export const DATI_XENIA: DatiDvrRumore = {
  anagrafica: {
    comune: 'Battipaglia',
    provincia: 'Salerno',
    opera: 'Linea Ferroviaria AV Salerno-Reggio Calabria, Lotto 1A Battipaglia-Romagnano',
    denominazione: 'TBM1',
    impresa: 'Consorzio Xenia',
    datore_lavoro: 'Ing. Salvatore Francesco Caruso',
    rspp: 'Carmine D’Auria',
    medico_competente: 'Dott. Dante Luigi Cioffi',
    rls: ['Patrizio Pellegrino', 'Vittorio Mario Bruno Parisi', 'Antonio Granato'],
    gruppo_lavoro: ['Fabio Catano', 'Paola Ciuffreda', 'Marco Rossi', 'Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: 'Paola Ciuffreda',
    approvato: 'Fabio Catano',
  },
  documento: {
    periodoRiferimento: 'Maggio – Giugno 2026',
    revisione: 0,
    dataEmissioneTesto: 'Luglio 2026',
    anno: 2026,
    revisioni: [
      { revisione: 0, integrazione: null, data: 'Luglio 2026', descrizione: 'Prima Emissione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' },
    ],
  },
  ambiti: [
    { nome: 'Galleria TBM1', tipo: 'galleria_tbm' },
    { nome: 'Piazzale esterno', tipo: 'piazzale' },
  ],
  mansioni: MANSIONI_XENIA.map((m, i) => ({
    id: String(i),
    nome: m.nome,
    attivita: m.attivita,
    periodi: TAV_XENIA.find((t) => t.nome === m.tav)!.periodi,
    vibrazioni: m.vibrazioni,
    ototossiche: m.ototossiche,
  })),
  macchine: MACCHINE_XENIA,
  dpi: DPI,
  tarature: TARATURE_XENIA,
  rilievi: RILIEVI_XENIA,
  impulsivi: IMPULSIVI_XENIA,
  segnali: [
    { fase: 'Ripristino piste di cantiere', sorgente: 'del cicalino di retromarcia della mini-pala Bobcat 5510', ambiente: 71.2, segnale: 87.3 },
    { fase: 'Movimentazione conci', sorgente: 'del cicalino di retromarcia del forklift Kalmar DLG 410', ambiente: 78.2, segnale: 100.7 },
    { fase: 'Movimentazione materiali (zona imbocco TBM)', sorgente: 'del cicalino di retromarcia del sollevatore Manitou', ambiente: 74.2, segnale: 90.7 },
  ],
}

const TEMPLATE = resolve(__dirname, '../../../public/templates/dvr/rumore.docx')

function testoDocumento(docx: Uint8Array): string {
  const xml = new PizZip(docx).file('word/document.xml')!.asText()
  return xml.replace(/<w:p[ >]/g, '\n$&').replace(/<[^>]+>/g, '')
}

describe('DVR Rumore: generazione Word', () => {
  const { dati, valutazione } = datiTemplateRumore(DATI_XENIA)
  const docx = generaDocx(readFileSync(TEMPLATE), dati)
  const testo = testoDocumento(docx)
  if (process.env.DVR_OUT) writeFileSync(process.env.DVR_OUT, docx)

  it('non restano tag non sostituiti', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.]+\}/)
  })
  it('una TAV per mansione, con LEX e incertezza calcolati', () => {
    expect(testo.match(/TAV\. \d+ – /g)).toHaveLength(23)
    expect(testo).toContain('TAV. 1 – CAPOSQUADRA TBM')
    expect(testo).toContain('84,3 ± 0,7')
  })
  it('le mansioni sopra 85 dB(A) sono elencate in 3ª fascia', () => {
    const terza = testo.slice(testo.indexOf('3ª fascia – LEX'))
    expect(terza).toContain('OPERATORE TBM – MECCANICO TBM/AIUTO MECCANICO TBM')
    expect(valutazione.perFascia[3]).toHaveLength(2)
  })
  it('dati di cantiere al posto giusto, niente residui del modello', () => {
    expect(testo).toContain('COMUNE DI BATTIPAGLIA')
    expect(testo).toContain('Patrizio Pellegrino')
    expect(testo).not.toContain('IEC 651')
    expect(testo).not.toContain('laboratorio SIT')
    expect(testo).not.toContain('Nessuna mansione appartiene a questa fascia.')
  })
})
