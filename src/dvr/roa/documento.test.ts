import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import { DPI_CASTAGNOLA, RILIEVI_CASTAGNOLA, SORGENTI_CASTAGNOLA } from './__fixtures__/castagnola2026'
import { datiTemplateRoa, type DatiDvrRoa } from './documento'

const BASE: Omit<DatiDvrRoa, 'sorgenti' | 'rilievi' | 'dpi'> = {
  anagrafica: {
    comune: 'Fraconalto',
    provincia: 'Alessandria',
    opera: 'Tratta AV/AC Terzo Valico dei Giovi',
    denominazione: 'Castagnola',
    impresa: 'Consorzio Tunnel Giovi (CTG)',
    datore_lavoro: 'Ing. Nicola Servidei',
    rspp: 'Per. Ind. Matteo Parolin',
    medico_competente: 'Dr. Andrea Lombroni',
    rls: ['Marco Gencarelli'],
    gruppo_lavoro: ['Fabio Catano', 'Paola Ciuffreda', 'Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: 'Paola Ciuffreda',
    approvato: 'Fabio Catano',
  },
  documento: {
    periodoRiferimento: 'Settembre 2026',
    revisione: 0,
    dataEmissioneTesto: 'Settembre 2026',
    anno: 2026,
    revisioni: [{ revisione: 0, integrazione: null, data: 'Settembre 2026', descrizione: 'Prima emissione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' }],
  },
  ambiti: [{ nome: 'Galleria di linea', tipo: 'galleria_tradizionale' }],
  mansioni: [
    { id: 'm1', nome: 'Saldatore', attivita: 'Saldature in officina' },
    { id: 'm2', nome: 'Topografo', attivita: 'Rilievi topografici' },
  ],
}

const TEMPLATE = resolve(__dirname, '../../../public/templates/dvr/roa.docx')
const testoDocx = (xml: string) =>
  xml
    .replace(/<w:sdt>.*?<\/w:sdt>/gs, '')
    .replace(/<w:p[ >]/g, '\n$&')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

function genera(d: DatiDvrRoa, nome: string) {
  const { dati } = datiTemplateRoa(d)
  const docx = generaDocx(readFileSync(TEMPLATE), dati)
  if (process.env.DVR_OUT) writeFileSync(`${process.env.DVR_OUT}/roa_${nome}.docx`, docx)
  const xml = new PizZip(docx).file('word/document.xml')!.asText()
  return { dati, xml, testo: testoDocx(xml) }
}

describe('DVR ROA: generazione Word (Castagnola 2026)', () => {
  const { dati, xml, testo } = genera({ ...BASE, sorgenti: SORGENTI_CASTAGNOLA, rilievi: RILIEVI_CASTAGNOLA, dpi: DPI_CASTAGNOLA }, 'castagnola')

  it('nessun tag né marcatore rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
  })
  it('sorgenti, giustificazioni e analisi', () => {
    expect(testo).toContain('Saldatrice ESAB MIG L405W')
    expect(testo).toContain('Fari FL PFM 165 W 4000 K SYM 100 BK')
    expect(testo).toContain('Laser classe 3R')
    expect(testo).toContain('Laser del distanziometro della stazione totale Leica MS60')
    expect(testo).not.toMatch(/Cravasco|Pavimental|60285/)
  })
  it('luminanza e DPI', () => {
    expect(testo).toContain('\n1.264\n')
    expect(testo).toContain('Portata di ossigeno: 2.000 ÷ 3.150 l/h')
    expect(testo).toContain('Manca il filtro n° 6')
  })
  it('conclusioni e piano dal calcolo', () => {
    expect(dati.conclusioni[0]).toContain('saldatura MIG/MAG a filo continuo eseguita in officina')
    expect(dati.precisazioni[0]).toContain('non sono adeguati per taglio con cannello ossiacetilenico')
    expect(dati.piano.map((p) => p.testo)).toContain('Fornire ai lavoratori filtri con numero di graduazione 6 da utilizzare durante taglio con cannello ossiacetilenico.')
  })
})

describe('DVR ROA: cantiere senza saldature né misure', () => {
  const { testo } = genera({ ...BASE, sorgenti: SORGENTI_CASTAGNOLA.filter((s) => s.tipo === 'lampada' && s.classe === 'Esente'), rilievi: [], dpi: [] }, 'minimo')
  it('sezioni vuote sostituite dal testo', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
    expect(testo).toContain('Tutte le sorgenti censite sono giustificabili')
    expect(testo).toContain('non ci sono DPI per saldatura da verificare')
    expect(testo).not.toContain('Lv = Ev/ω')
    expect(testo).not.toContain('Sorgenti ROA coerenti: laser')
  })
})
