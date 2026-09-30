import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import { MANSIONI_CEM, MISURE_CEM, SORGENTI_CEM } from './__fixtures__/cantiere'
import { datiTemplateCem, frequenzaTesto, num, type DatiDvrCem } from './documento'

const BASE: Omit<DatiDvrCem, 'sorgenti' | 'misure'> = {
  anagrafica: {
    comune: 'Fraconalto',
    provincia: 'Alessandria',
    opera: 'Tratta AV/AC Terzo Valico dei Giovi',
    denominazione: 'Castagnola',
    impresa: 'Consorzio Tunnel Giovi (CTG)',
    datore_lavoro: 'Ing. Dario Vizzino',
    rspp: 'Per. Ind. Matteo Parolin',
    medico_competente: 'Dr. Andrea Lombroni',
    rls: ['Mirko Gencarelli'],
    gruppo_lavoro: ['Fabio Catano', 'Paola Ciuffreda', 'Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: 'Paola Ciuffreda',
    approvato: 'Fabio Catano',
  },
  documento: {
    periodoRiferimento: 'Ottobre 2026',
    revisione: 0,
    dataEmissioneTesto: 'Ottobre 2026',
    anno: 2026,
    revisioni: [{ revisione: 0, integrazione: null, data: 'Ottobre 2026', descrizione: 'Prima emissione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' }],
  },
  ambiti: [
    { nome: 'Galleria di linea', tipo: 'galleria_tradizionale' },
    { nome: 'Piazzale', tipo: 'piazzale' },
    { nome: 'Officina', tipo: 'officina' },
  ],
  mansioni: MANSIONI_CEM,
}

const TEMPLATE = resolve(__dirname, '../../../public/templates/dvr/cem.docx')
const testoDocx = (xml: string) =>
  xml
    .replace(/<w:sdt>.*?<\/w:sdt>/gs, '')
    .replace(/<w:p[ >]/g, '\n$&')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

function genera(d: DatiDvrCem, nome: string) {
  const { dati, valutazione } = datiTemplateCem(d)
  const docx = generaDocx(readFileSync(TEMPLATE), dati)
  if (process.env.DVR_OUT) writeFileSync(`${process.env.DVR_OUT}/cem_${nome}.docx`, docx)
  const zip = new PizZip(docx)
  const xml = zip.file('word/document.xml')!.asText()
  const piedi = Object.keys(zip.files).filter((f) => /word\/footer\d+\.xml/.test(f)).map((f) => zip.file(f)!.asText()).join(' ')
  return { dati, valutazione, xml, testo: testoDocx(xml), piedi }
}

describe('formattazione', () => {
  it('numeri e frequenze', () => {
    expect([num(1450), num(0.05), num(3.1), num(12000), num(0.0277)]).toEqual(['1.450', '0,05', '3,1', '12.000', '0,0277'])
    expect([frequenzaTesto(50), frequenzaTesto(446e6), frequenzaTesto(2.4e9), frequenzaTesto(0)]).toEqual(['50 Hz', '446 MHz', '2,4 GHz', 'statico'])
  })
})

describe('DVR Campi elettromagnetici: generazione Word', () => {
  const { dati, valutazione, xml, testo, piedi } = genera({ ...BASE, sorgenti: SORGENTI_CEM, misure: MISURE_CEM }, 'cantiere')

  it('nessun tag né marcatore rimasto, niente testi ROA', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
    expect(testo).not.toMatch(/radiazioni ottiche|ROA|luminanza|UNI EN 169|fotosensibilizzanti/i)
    expect(piedi).toContain('CAMPI ELETTROMAGNETICI')
    expect(piedi).not.toMatch(/RADIAZIONI OTTICHE/)
    expect(dati.nomeFile).toBe('DVR_CEM_Consorzio_Tunnel_Giovi_CTG_2026_Castagnola_rev00.docx')
  })
  it('esiti delle sorgenti e distanze di rispetto', () => {
    const esiti = Object.fromEntries(valutazione.sorgenti.map((s) => [s.sorgente.id, s.esito]))
    expect(esiti).toEqual({ s1: 'popolazione', s2: 'popolazione', s3: 'popolazione', s4: 'lavoratori', s5: 'lavoratori', s6: 'popolazione' })
    const saldatrice = valutazione.sorgenti.find((s) => s.sorgente.id === 's4')!
    expect(saldatrice.distanzaRispetto).toBe(1)
    expect(dati.zone.find((z) => z.sorgente.startsWith('Cabina'))).toMatchObject({ zona: 'Zona 1', distanza: '1,5 m' })
  })
  it('mansioni, conclusioni e piano', () => {
    expect(dati.esitiMansioni.map((m) => m.esito)).toEqual(['Entro i VA inferiori', 'Entro i VA inferiori', 'Entro i livelli per la popolazione', 'Entro i livelli per la popolazione'])
    expect(dati.conclusioni.join(' ')).toContain('le mansioni che lavorano in zona 1 o 2 sono: Fabbro saldatore e Elettricista')
    const piano = dati.piano.flatMap((p) => p.sotto).join(' ')
    expect(piano).toContain('Saldatura: tenere i cavi di alimentazione e di massa vicini')
    expect(piano).toContain('inneschi elettrici')
    expect(piano).not.toContain('sorveglianza sanitaria')
    expect(testo).toContain('Mano sul cavo di massa (arti)')
    expect(testo).toContain('A 50 Hz (rete elettrica) i valori di azione sono: campo elettrico 10.000 V/m')
  })
  it('solo sorgenti giustificabili: niente misure né zone 1', () => {
    const r = genera({ ...BASE, sorgenti: SORGENTI_CEM.slice(0, 3), misure: [] }, 'giustificabili')
    expect(r.testo).toContain('Tutte le sorgenti censite sono giustificabili')
    expect(r.testo).toContain('Non sono state eseguite misure in campo')
    expect(r.dati.conclusioni.at(-1)).toContain('il rischio da campi elettromagnetici è trascurabile')
  })
})
