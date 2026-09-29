import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import { datiTemplateVibrazioni, type DatiDvrVibrazioni } from './documento'
import { MANSIONI_VIB_XENIA, RILIEVI_VIB_XENIA } from './__fixtures__/xenia2026'

const DATI: DatiDvrVibrazioni = {
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
    revisioni: [{ revisione: 0, integrazione: null, data: 'Luglio 2026', descrizione: 'Prima Emissione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' }],
    rapportoWbv: '26_1166',
    rapportoHav: '26_1167',
  },
  ambiti: [
    { nome: 'Galleria TBM1', tipo: 'galleria_tbm' },
    { nome: 'Piazzale esterno', tipo: 'piazzale' },
  ],
  mansioni: MANSIONI_VIB_XENIA.map((m, i) => ({ id: String(i), nome: m.nome, attivita: m.attivita, wbv: m.wbv, hav: m.hav })),
  macchine: [
    { tipologia: 'TBM 1', marcaModello: 'TBM01', alimentazione: '/' },
    { tipologia: 'Sollevatore', marcaModello: 'KALMAR DLG410', alimentazione: 'Gommato' },
  ],
  tarature: [
    { componente: 'Analizzatore', costruttore: 'Larson-Davis', modello: 'HVM 100', matricola: '00925', data_taratura: null, certificato: null },
    { componente: 'Accelerometro triassiale', costruttore: 'PCB Piezotronics', modello: 'SEN 020', matricola: 'P58587', data_taratura: null, certificato: null },
  ],
  rilievi: RILIEVI_VIB_XENIA.map((r, i) => ({
    id: String(i),
    tipo: r.tipo,
    macchina: r.macchina,
    fase: r.fase,
    dettaglio: r.dettaglio,
    a: r.a,
    codice: r.codice,
    posizione: 'posizione' in r ? r.posizione : null,
    asse: 'asse' in r ? r.asse : null,
    note: 'note' in r ? r.note : null,
    alimentazione: 'alimentazione' in r ? r.alimentazione : null,
  })),
}

const TEMPLATE = resolve(__dirname, '../../../public/templates/dvr/vibrazioni.docx')
const testoDocx = (docx: Uint8Array) =>
  new PizZip(docx).file('word/document.xml')!.asText().replace(/<w:p[ >]/g, '\n$&').replace(/<[^>]+>/g, '')

describe('DVR Vibrazioni: generazione Word', () => {
  const { dati, valutazione } = datiTemplateVibrazioni(DATI)
  const docx = generaDocx(readFileSync(TEMPLATE), dati)
  const testo = testoDocx(docx)
  if (process.env.DVR_OUT) writeFileSync(process.env.DVR_OUT, docx)

  it('nessun tag rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  })
  it('una TAV per mansione e per tipo, con A(8) ed esposizione', () => {
    expect(testo.match(/WBV - TAV \d+/g)).toHaveLength(23)
    expect(testo.match(/HAV - TAV \d+/g)).toHaveLength(22)
    expect(testo).toContain('0,89')
    expect(testo).toContain('2,05')
  })
  it('conclusioni calcolate', () => {
    expect(testo).toContain('Addetto Forklift (0,89 m/s²)')
    expect(testo).toContain('Operatore MSV (0,65 m/s²)')
    expect(valutazione.perFascia.wbv[2]).toHaveLength(2)
  })
  it('dati del cantiere e rapporti di prova', () => {
    expect(testo).toContain('COMUNE DI BATTIPAGLIA')
    expect(testo).toContain('26_1166')
    expect(testo).toContain('VCI17')
    expect(testo).not.toContain('per eccesso')
  })
})
