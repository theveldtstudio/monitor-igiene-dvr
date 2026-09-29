import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import { datiTemplateMicroclima, type DatiDvrMicroclima } from './documento'
import { ESTERNO_ESTATE, ESTERNO_INVERNO, GALLERIA_ESTATE, GALLERIA_INVERNO, MESI_ESTATE_CTG, MESI_INVERNO_XENIA, PICCO_ESTATE_CTG } from './__fixtures__/modelli'
import type { ParametriMicroclima } from './valutazione'

const BASE: Omit<DatiDvrMicroclima, 'mansioni' | 'parametri' | 'lavorazioni' | 'rilievi'> = {
  anagrafica: {
    comune: 'Fraconalto',
    provincia: 'Alessandria',
    opera: 'Tratta AV/AC Terzo Valico dei Giovi',
    denominazione: 'Castagnola',
    impresa: 'Consorzio Tunnel Giovi (CTG)',
    datore_lavoro: 'Ing. Dario Vizzino',
    rspp: 'Per. Ind. Matteo Parolin',
    medico_competente: 'Dott. Andrea Lombroni',
    rls: ['Marco Gencarelli'],
    gruppo_lavoro: ['Fabio Catano', 'Paola Ciuffreda', 'Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: 'Paola Ciuffreda',
    approvato: 'Fabio Catano',
  },
  documento: {
    periodoRiferimento: 'Dicembre 2024 – Febbraio 2025',
    revisione: 0,
    dataEmissioneTesto: 'Gennaio 2025',
    anno: 2025,
    revisioni: [{ revisione: 0, integrazione: null, data: 'Gennaio 2025', descrizione: 'Prima emissione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' }],
  },
  ambiti: [{ nome: 'Galleria di linea', tipo: 'galleria_tradizionale' }],
}

const SCENARI: Record<string, { dati: DatiDvrMicroclima; attesi: RegExp[]; assenti: RegExp[] }> = {
  galleria_inverno: {
    dati: { ...BASE, ...GALLERIA_INVERNO, parametri: { scenario: 'galleria_inverno', clo: 1.5, diametroGlobo: 0.05 } },
    attesi: [/Valori di PMV e PPD/, /Carpenteria in cassaforma/, /PPD < 10%/, /Ventilazione in galleria/, /MCR10/, /Biancheria/],
    assenti: [/Calcolo del WBGTe/, /IREQmin \(clo\)/, /Categoria/],
  },
  galleria_estate: {
    dati: { ...BASE, ...GALLERIA_ESTATE, parametri: { scenario: 'galleria_estate', clo: 0.5 } },
    attesi: [/Calcolo del WBGTi/, /Confronto del WBGTi/, /WBGT limite per soggetti acclimatati/, /resistenza termica pari a 0,50 clo/],
    assenti: [/Valori di PMV e PPD/, /Biancheria/],
  },
  esterno_estate: {
    dati: {
      ...BASE,
      ...ESTERNO_ESTATE,
      parametri: { scenario: 'esterno_estate', clo: 0.5, meteo: { fonte: 'www.ilmeteo.it', stazione: 'Campomorone (GE)', periodo: '2023–2025', mesi: MESI_ESTATE_CTG, picco: PICCO_ESTATE_CTG } },
    },
    attesi: [/medie del mese di Luglio/, /WBGTe = 31,4 °C/, /11 agosto 2025/, /Campomorone/, /Alto comfort/, /DATI METEOCLIMATICI DI RIFERIMENTO/],
    assenti: [/Ventilazione in galleria/, /IREQmin \(clo\)/, /Risultati delle misure eseguite/],
  },
  esterno_inverno: {
    dati: { ...BASE, ...ESTERNO_INVERNO, parametri: { scenario: 'esterno_inverno', clo: 1.5, meteo: { periodo: '2023–2026', mesi: MESI_INVERNO_XENIA } } },
    attesi: [/IREQmin \(clo\)/, /Icl < IREQmin/, /1221/, /Limite del rischio di congelamento rapido/, /Gennaio: temperatura -2,0 °C/],
    assenti: [/Calcolo del WBGTe/, /Ventilazione in galleria/],
  },
}

const TEMPLATE = resolve(__dirname, '../../../public/templates/dvr/microclima.docx')
const xmlDocx = (docx: Uint8Array) => new PizZip(docx).file('word/document.xml')!.asText()
/** Testo del corpo senza l'indice (che Word rigenera all'apertura). */
const testoDocx = (xml: string) =>
  xml
    .replace(/<w:sdt>.*?<\/w:sdt>/gs, '')
    .replace(/<w:p[ >]/g, '\n$&')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

describe.each(Object.entries(SCENARI))('DVR Microclima %s: generazione Word', (nome, { dati: d, attesi, assenti }) => {
  const { dati } = datiTemplateMicroclima(d)
  const docx = generaDocx(readFileSync(TEMPLATE), dati)
  const xml = xmlDocx(docx)
  const testo = testoDocx(xml)
  if (process.env.DVR_OUT) writeFileSync(`${process.env.DVR_OUT}/microclima_${nome}.docx`, docx)

  it('nessun tag né marcatore rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
  })
  it('contenuti dello scenario', () => {
    for (const r of attesi) expect(testo).toMatch(r)
    for (const r of assenti) expect(testo).not.toMatch(r)
  })
  it('didascalie numerate senza salti', () => {
    const n = [...testo.matchAll(/^Tabella (\d+)\./gm)].map((m) => Number(m[1]))
    expect(n).toEqual(n.map((_, i) => i + 1))
  })
})

describe('DVR Microclima: parametri', () => {
  it('limite WBGT dei non acclimatati', () => {
    const p: ParametriMicroclima = { scenario: 'galleria_estate', clo: 0.5, acclimatati: false }
    const { dati } = datiTemplateMicroclima({ ...BASE, ...GALLERIA_ESTATE, parametri: p })
    expect(dati.notaWbgt).toContain('non acclimatati')
    expect(dati.wbgtRighe[0].limite).toBe('29')
  })
})
