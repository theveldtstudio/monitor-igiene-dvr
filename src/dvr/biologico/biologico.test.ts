import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import type { MisuraRumore } from '../api'
import { generaDocx } from '../comune/generaDocx'
import { importaMisureSas } from './daDatabase'
import { datiTemplateBiologico, type DatiDvrBiologico } from './documento'
import { agentiPredefiniti } from './testi'
import { categoriaAria, classeRischio, valutaBiologico } from './valutazione'

const MANSIONI = [
  { id: 'min', nome: 'Minatore' },
  { id: 'imp', nome: 'Impiegato' },
]

export function datiBiologico(): DatiDvrBiologico {
  const agenti = agentiPredefiniti(['galleria_tradizionale', 'opere_esterne', 'campo_base'])
  agenti[1].mansioni = ['min'] // leptospira
  agenti[1].probabilita = 3
  return {
    anagrafica: {
      comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Tratta AV/AC Terzo Valico dei Giovi', denominazione: 'Castagnola',
      impresa: 'Consorzio Tunnel Giovi (CTG)', datore_lavoro: 'Ing. Dario Vizzino', rspp: 'Per. Ind. Matteo Parolin', medico_competente: 'Dr. Andrea Lombroni',
      rls: ['Mirko Gencarelli'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '',
    },
    documento: {
      periodoRiferimento: 'Settembre 2026', revisione: 0, integrazione: null, dataEmissioneTesto: 'Ottobre 2026', anno: 2026, primaValutazione: true,
      revisioni: [{ revisione: 0, integrazione: null, data: 'Ottobre 2026', descrizione: 'Prima emissione', redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    },
    ambiti: [{ nome: 'Galleria di linea', tipo: 'galleria_tradizionale' }, { nome: 'Campo base', tipo: 'campo_base' }],
    mansioni: MANSIONI,
    agenti,
    misure: [
      { id: 's1', postazione: 'Uffici', fase: 'Attività d’ufficio', conta22: 180, conta36: 40, muffe: 60 },
      { id: 's2', postazione: 'Galleria – fronte', fase: 'Scavo', conta22: 2400, conta36: 350, muffe: 900 },
    ],
  }
}

describe('DVR Agenti biologici', () => {
  it('classi di rischio e categorie ECA', () => {
    expect([1, 2, 3, 4, 6, 8, 9, 12, 16].map(classeRischio)).toEqual(['trascurabile', 'trascurabile', 'basso', 'basso', 'medio', 'medio', 'alto', 'alto', 'alto'])
    expect([10, 50, 99, 100, 499, 500, 1999, 2000].map((x) => categoriaAria(x, 'batteri'))).toEqual(['molto bassa', 'bassa', 'bassa', 'intermedia', 'intermedia', 'alta', 'alta', 'molto alta'])
    expect([24, 25, 100].map((x) => categoriaAria(x, 'funghi'))).toEqual(['molto bassa', 'bassa', 'intermedia'])
    expect(categoriaAria(null, 'funghi')).toBeNull()
  })

  it('valutazione per agente e per mansione', () => {
    const d = datiBiologico()
    const v = valutaBiologico(d.agenti, d.misure, d.mansioni)
    const lepto = v.agenti.find((e) => /Leptospira/.test(e.agente.nome))!
    expect([lepto.d, lepto.r, lepto.classe]).toEqual([2, 6, 'medio'])
    expect(v.agenti.find((e) => /zecch/.test(e.agente.nome))).toBeDefined()
    expect(v.mansioni.find((m) => m.mansione.id === 'min')!.classe).toBe('medio')
    expect(v.mansioni.find((m) => m.mansione.id === 'imp')!.agenti.some((e) => /Leptospira/.test(e.agente.nome))).toBe(false)
    expect(v.misure.map((m) => m.peggiore)).toEqual(['intermedia', 'molto alta'])
  })

  it('Word senza tag', () => {
    const { dati } = datiTemplateBiologico(datiBiologico())
    const docx = generaDocx(readFileSync(resolve(__dirname, '../../../public/templates/dvr/biologico.docx')), dati)
    if (process.env.DVR_OUT) writeFileSync(`${process.env.DVR_OUT}/biologico_prova.docx`, docx)
    const zip = new PizZip(docx)
    const xml = zip.file('word/document.xml')!.asText()
    const testo = xml.replace(/<[^>]+>/g, ' ')
    expect(dati.nomeFile).toBe('DVR_Biologico_Consorzio_Tunnel_Giovi_CTG_2026_Castagnola_rev00.docx')
    expect(testo).toContain('Titolo X')
    expect(testo).toContain('Leptospira interrogans')
    expect(testo).toContain('Galleria – fronte')
    expect(testo).toContain('2.400')
    expect(dati.conclusioni.join(' ')).toContain('la carica microbica dell’aria è alta in Galleria – fronte')
    expect(dati.conclusioni.join(' ')).toContain('le mansioni con rischio medio o alto sono: Minatore')
    const piedi = Object.keys(zip.files).filter((f) => /footer\d+\.xml$/.test(f)).map((f) => zip.file(f)!.asText()).join(' ')
    expect(piedi).toContain('AD AGENTI BIOLOGICI')
    expect(xml).not.toMatch(/\{[#/^]?[A-Za-z_.0-9]+\}/)
  })

  it('importa le misure SAS senza doppioni', () => {
    const m: MisuraRumore = {
      misura: { id: 'm1', numero: 1, dati: { postazione_nome: 'Mensa', fase_nome: 'Pranzo', conta_22: 120, conta_36: 30, muffe_lieviti: 10, muffe_lieviti_sotto_soglia: true, volume_aspirato: 500 }, note: '' } as unknown as MisuraRumore['misura'],
      campagna: { id: 'c', tipo_campionamento: 'biologico_sas', data_ora: '2026-09-10T08:00:00Z' } as MisuraRumore['campagna'],
      codice: '1',
    }
    const c = importaMisureSas({ agenti: [], misure: [] }, [m])
    expect(c.misure[0]).toMatchObject({ postazione: 'Mensa', fase: 'Pranzo', conta22: 120, conta36: 30, muffe: 10, volume: 500, misuraId: 'm1', note: 'Valori sotto il limite di rilevabilità (usato il limite)' })
    expect(importaMisureSas(c, [m]).misure).toHaveLength(1)
  })
})
