import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import type { MisuraRumore } from '../api'
import { generaDocx } from '../comune/generaDocx'
import { destinazioneDaNome, importaMisureAcqua } from './daDatabase'
import { datiTemplateAcqua, type DatiDvrAcqua } from './documento'
import { esitoParametro, limitiPunto, valutaAcqua, type MisuraAcqua } from './valutazione'

const M = (id: string, puntoId: string, ph: number | null, conducibilita: number | null, o2MgL: number | null = null): MisuraAcqua => ({ id, puntoId, data: '10/09/2026', ph, conducibilita, tAcqua: 14.2, tAmbiente: 18, o2Perc: 90, o2MgL })

export function datiAcqua(): DatiDvrAcqua {
  return {
    anagrafica: {
      comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Tratta AV/AC Terzo Valico dei Giovi', denominazione: 'Castagnola',
      impresa: 'Consorzio Tunnel Giovi (CTG)', datore_lavoro: 'Ing. Dario Vizzino', rspp: '', medico_competente: '', rls: [], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '',
    },
    documento: { periodoRiferimento: 'Settembre 2026', revisione: 0, integrazione: null, dataEmissioneTesto: 'Ottobre 2026', anno: 2026, primaValutazione: true, revisioni: [] },
    ambiti: [{ nome: 'Galleria di linea', tipo: 'galleria_tradizionale' }],
    punti: [
      { id: 'sc', nome: 'Uscita vasca di decantazione', destinazione: 'scarico_superficiale' },
      { id: 'pot', nome: 'Rubinetto spogliatoi', destinazione: 'consumo_umano' },
      { id: 'gal', nome: 'Acque di galleria', destinazione: 'monitoraggio' },
      { id: 'aut', nome: 'Scarico autorizzato', destinazione: 'scarico_superficiale', limiti: { phMax: 9, tMax: 30 } },
    ],
    misure: [M('1', 'sc', 8.1, 1200), M('2', 'sc', 10.2, 1850), M('3', 'pot', 7.4, 450), M('4', 'gal', 11.5, 2900), M('5', 'aut', 9.2, 900)],
  }
}

describe('Monitoraggio delle acque', () => {
  it('limiti per destinazione e modificati', () => {
    const l = limitiPunto({ id: 'x', nome: 'x', destinazione: 'consumo_umano' })
    expect(l).toEqual({ phMin: 6.5, phMax: 9.5, conducibilitaMax: 2500, tMax: null, o2Min: null })
    expect(esitoParametro('ph', 6.4, l)).toBe('non conforme')
    expect(esitoParametro('ph', 9.5, l)).toBe('conforme')
    expect(esitoParametro('conducibilita', 2600, l)).toBe('non conforme')
    expect(esitoParametro('o2MgL', 3, l)).toBe('senza limite')
    expect(esitoParametro('ph', null, l)).toBeNull()
    expect(limitiPunto({ id: 'x', nome: 'x', destinazione: 'scarico_superficiale', limiti: { phMax: 9 } }).phMax).toBe(9)
  })

  it('esiti per punto', () => {
    const d = datiAcqua()
    const v = valutaAcqua(d.punti, d.misure)
    expect(v.punti.map((p) => [p.punto.id, p.esito, p.nonConformi])).toEqual([
      ['sc', 'non conforme', ['ph']],
      ['pot', 'conforme', []],
      ['gal', 'senza limite', []],
      ['aut', 'non conforme', ['ph']],
    ])
    expect(v.punti[0].intervalli.ph).toEqual({ min: 8.1, max: 10.2, n: 2 })
  })

  it('Word senza tag', () => {
    const { dati } = datiTemplateAcqua(datiAcqua())
    const docx = generaDocx(readFileSync(resolve(__dirname, '../../../public/templates/dvr/acqua.docx')), dati)
    if (process.env.DVR_OUT) writeFileSync(`${process.env.DVR_OUT}/acqua_prova.docx`, docx)
    const zip = new PizZip(docx)
    const xml = zip.file('word/document.xml')!.asText()
    const testo = xml.replace(/<[^>]+>/g, ' ')
    expect(dati.nomeFile).toBe('DVR_Acqua_Consorzio_Tunnel_Giovi_CTG_2026_Castagnola_rev00.docx')
    expect(dati.conclusioni.join(' ')).toContain('in Uscita vasca di decantazione (scarico in acque superficiali) non sono rispettati i limiti per pH 8,1–10,2 (limite 5,5 – 9,5)')
    expect(dati.conclusioni.join(' ')).toContain('in Acque di galleria i valori sono riportati come indicatori')
    expect(testo).toContain('Rubinetto spogliatoi')
    expect(testo).toContain('D.Lgs. 18/2023')
    expect(testo).toContain('≤ 2500')
    const piedi = Object.keys(zip.files).filter((f) => /footer\d+\.xml$/.test(f)).map((f) => zip.file(f)!.asText()).join(' ')
    expect(piedi).toContain('MONITORAGGIO DELLE ACQUE')
    expect(xml).not.toMatch(/\{[#/^]?[A-Za-z_.0-9]+\}/)
  })

  it('importa le misure raggruppate per punto', () => {
    const m = (n: number, dati: Record<string, unknown>): MisuraRumore => ({
      misura: { id: `m${n}`, numero: n, dati, note: '' } as unknown as MisuraRumore['misura'],
      campagna: { id: 'c', tipo_campionamento: 'monitoraggio_acqua', data_ora: '2026-09-10T08:00:00Z' } as MisuraRumore['campagna'],
      codice: String(n),
    })
    const c = importaMisureAcqua({ punti: [], misure: [] }, [
      m(1, { punto_monitoraggio: 'Scarico vasca', ph: 8.2, conducibilita: 1100, t_acqua: 15, t_ambiente: 20, o2_perc: 88, o2_mg_l: 8.9 }),
      m(2, { punto_monitoraggio: 'scarico vasca', ph: 8.4 }),
      m(3, { punto_monitoraggio: 'Lavabo mensa', ph: 7.5 }),
    ])
    expect(c.punti.map((p) => [p.nome, p.destinazione])).toEqual([['Scarico vasca', 'scarico_superficiale'], ['Lavabo mensa', 'consumo_umano']])
    expect(c.misure.map((x) => x.puntoId)).toEqual([c.punti[0].id, c.punti[0].id, c.punti[1].id])
    expect(c.misure[0]).toMatchObject({ ph: 8.2, conducibilita: 1100, tAcqua: 15, tAmbiente: 20, o2Perc: 88, o2MgL: 8.9, misuraId: 'm1' })
    expect(importaMisureAcqua(c, [m(1, {})]).misure).toHaveLength(3)
    expect(destinazioneDaNome('Venute al fronte')).toBe('monitoraggio')
  })
})
