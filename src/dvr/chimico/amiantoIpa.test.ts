import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import type { MisuraRumore } from '../api'
import { generaDocx } from '../comune/generaDocx'
import { importaMisure } from './daDatabase'
import { datiTemplateChimico, type DatiDvrChimico } from './documento'

const BASE: Omit<DatiDvrChimico, 'tipo' | 'ambienti' | 'tempi' | 'mansioni'> = {
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
    gruppo_lavoro: ['Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: '',
    approvato: '',
  },
  documento: {
    periodoRiferimento: 'Luglio – Dicembre 2026',
    revisione: 0,
    integrazione: 1,
    dataEmissioneTesto: 'Gennaio 2027',
    anno: 2027,
    revisioni: [{ revisione: 0, integrazione: 1, data: 'Gennaio 2027', descrizione: 'Prima emissione', redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    primaValutazione: true,
  },
  ambiti: [{ nome: 'Galleria di linea', tipo: 'galleria_tradizionale' }],
  macchine: [],
}

const MANSIONI = [
  { id: 'min', nome: 'Minatore' },
  { id: 'esc', nome: 'Escavatorista' },
  { id: 'aut', nome: 'Autista' },
]

const testoDocx = (xml: string) => xml.replace(/<w:p[ >]/g, '\n$&').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')

function genera(d: DatiDvrChimico) {
  const { dati, valutazione } = datiTemplateChimico(d)
  const docx = generaDocx(readFileSync(resolve(__dirname, `../../../public/templates/dvr/${d.tipo}.docx`)), dati)
  if (process.env.DVR_OUT) writeFileSync(`${process.env.DVR_OUT}/${d.tipo}_prova.docx`, docx)
  const zip = new PizZip(docx)
  const xml = zip.file('word/document.xml')!.asText()
  const piedi = Object.keys(zip.files).filter((f) => /footer\d+\.xml$/.test(f)).map((f) => zip.file(f)!.asText()).join(' ')
  return { dati, valutazione, xml, testo: testoDocx(xml), piedi }
}

export function datiAmianto(): DatiDvrChimico {
  return {
    ...BASE,
    tipo: 'amianto',
    mansioni: MANSIONI,
    ambienti: [
      {
        id: 'fronte',
        fase: 'Scavo al fronte in pietre verdi',
        postazione: 'Fronte',
        misure: [
          { id: 'a1', tipo: 'A', valori: { fibre: 60, amianto: 30 } },
          { id: 'a2', tipo: 'P', valori: { fibre: 40, amianto: 14 } },
        ],
      },
      { id: 'smarino', fase: 'Smarino', postazione: 'Cabina pala', misure: [{ id: 'a3', tipo: 'A', valori: { fibre: 8, amianto: 2 } }] },
      { id: 'piazzale', fase: 'Trasporto', postazione: 'Piazzale', misure: [{ id: 'a4', tipo: 'A', valori: { fibre: 3, amianto: 0.5 } }] },
    ],
    tempi: [
      { mansioneId: 'min', periodi: [{ minuti: 360, fase: 'Scavo al fronte in pietre verdi', ambiente: 'fronte' }, { minuti: 120, fase: 'Pausa', concentrazioni: { fibre: 0, amianto: 0 } }] },
      { mansioneId: 'esc', periodi: [{ minuti: 120, fase: 'Scavo al fronte in pietre verdi', ambiente: 'fronte' }, { minuti: 360, fase: 'Smarino', ambiente: 'smarino' }] },
      { mansioneId: 'aut', periodi: [{ minuti: 480, fase: 'Trasporto', ambiente: 'piazzale' }] },
    ],
  }
}

export function datiIpa(): DatiDvrChimico {
  return {
    ...BASE,
    tipo: 'ipa',
    ambiti: [{ nome: 'Viadotto', tipo: 'viadotto' }],
    mansioni: MANSIONI.slice(0, 2),
    ambienti: [
      { id: 'asf', fase: 'Stesa del conglomerato bituminoso', postazione: 'Vibrofinitrice', misure: [{ id: 'i1', tipo: 'P', valori: { ipa_tot: 1850, bap: 12.4, bapeq: 25.1 } }] },
      { id: 'mezzi', fase: 'Movimento terra', postazione: 'Cabina escavatore', misure: [{ id: 'i2', tipo: 'A', valori: { ipa_tot: 95, bap: 0.4, bapeq: 0.9 } }] },
    ],
    tempi: [
      { mansioneId: 'min', periodi: [{ minuti: 480, fase: 'Stesa del conglomerato bituminoso', ambiente: 'asf' }] },
      { mansioneId: 'esc', periodi: [{ minuti: 480, fase: 'Movimento terra', ambiente: 'mezzi' }] },
    ],
  }
}

describe('DVR Amianto', () => {
  it('esposizioni sulle 8 ore, ESEDI ed esposti, Word senza tag', () => {
    const { valutazione: v, dati, testo, xml, piedi } = genera(datiAmianto())
    const twa = Object.fromEntries(v.mansioni.map((m) => [m.mansione.id, m.twa.amianto]))
    expect(twa.min).toBeCloseTo((22 * 360) / 480, 6) // media fronte 22 ff/L per 6 ore
    expect(twa.esc).toBeCloseTo((22 * 120 + 2 * 360) / 480, 6)
    expect(twa.aut).toBeCloseTo(0.5, 6)
    expect(v.mansioni.every((m) => m.superamenti.length === 0)).toBe(true)
    expect(dati.nomeFile).toBe('DVR_Amianto_Consorzio_Tunnel_Giovi_CTG_2027_Castagnola_rev00.docx')
    const concl = dati.conclusioniMansioni.join('\n')
    expect(concl).toContain('art. 251 D.Lgs. 81/08')
    expect(concl).toMatch(/Esposizione non superiore a 10 ff\/L.*Escavatorista \(7,0 ff\/L\).*Autista \(0,5 ff\/L\)/)
    expect(concl).toMatch(/superiore a 10 ff\/L ma entro il valore limite: Minatore \(16,5 ff\/L\)/)
    expect(testo).toContain('Titolo IX, capo III')
    expect(testo).toContain('0,1 fibre per centimetro cubo di aria (100 ff/L)')
    expect(testo).toContain('Scavo al fronte in pietre verdi')
    expect(testo).not.toMatch(/silice|carbonio elementare/i)
    expect(dati.conPolveri).toBe(true)
    expect(dati.allegatoPolveri).toHaveLength(4)
    expect(piedi).toContain('lavoratori all’amianto')
    expect(xml).not.toMatch(/\{[#/^]?[A-Za-z_.0-9]+\}/)
  })

  it('oltre il valore limite', () => {
    const d = datiAmianto()
    d.ambienti[0].misure = [{ id: 'x', valori: { fibre: 300, amianto: 180 } }]
    const { valutazione: v, dati } = genera(d)
    expect(v.mansioni.find((m) => m.mansione.id === 'min')!.superamenti).toEqual(['amianto'])
    expect(dati.conclusioniMansioni.join('\n')).toMatch(/Amianto \(limite 100 ff\/L\): superamento per Minatore \(135,0 ff\/L\)/)
  })

  it('importa le misure della campagna amianto con il limite di rilevabilità', () => {
    const misura = (n: number, dati: Record<string, unknown>): MisuraRumore => ({
      misura: { id: `m${n}`, numero: n, dati, note: '' } as unknown as MisuraRumore['misura'],
      campagna: { id: 'c', tipo_campionamento: 'amianto', data_ora: '2026-09-10T08:00:00Z' } as MisuraRumore['campagna'],
      codice: String(n),
    })
    const amb = importaMisure(
      [],
      [
        misura(1, { fase_nome: 'Scavo', postazione_nome: 'Fronte', tipo_misura: 'personale', conc_fibre_totali: 12.5, conc_amianto: 1.2, conc_amianto_sotto_soglia: true, codice_filtro: 'F12' }),
        misura(2, { fase_nome: 'Scavo', postazione_nome: 'Fronte', conc_fibre_totali: 20 }),
      ],
      'amianto',
    )
    expect(amb).toHaveLength(1)
    expect(amb[0].misure.map((m) => m.valori)).toEqual([{ fibre: 12.5, amianto: 1.2 }, { fibre: 20 }])
    expect(amb[0].misure[0]).toMatchObject({ tipo: 'P', note: 'Campione F12. Amianto sotto il limite di rilevabilità (usato il limite)' })
  })
})

describe('DVR IPA', () => {
  it('benzo[a]pirene rispetto al riferimento e al fondo, Word senza tag', () => {
    const { valutazione: v, dati, testo, xml, piedi } = genera(datiIpa())
    expect(v.mansioni.map((m) => m.twa.bap)).toEqual([12.4, 0.4])
    expect(v.mansioni.every((m) => m.superamenti.length === 0)).toBe(true)
    expect(dati.nomeFile).toBe('DVR_IPA_Consorzio_Tunnel_Giovi_CTG_2027_Castagnola_rev00.docx')
    const concl = dati.conclusioniMansioni.join('\n')
    expect(concl).toContain('superiore al valore obiettivo per l’aria ambiente (1 ng/m³, D.Lgs. 155/2010) per Minatore (12,40 ng/m³)')
    expect(concl).toContain('TRGS 910')
    expect(testo).toContain('Titolo IX, capo II')
    expect(testo).toContain('TRGS 910 tedesca (70 ng/m³')
    expect(testo).toContain('Stesa del conglomerato bituminoso')
    expect(testo).not.toMatch(/silice|carbonio elementare/i)
    expect(dati.allegatoPolveri.map((r) => r.c_bapeq)).toEqual(['25,10', '0,90'])
    expect(piedi).toContain('idrocarburi policiclici aromatici')
    expect(xml).not.toMatch(/\{[#/^]?[A-Za-z_.0-9]+\}/)
  })

  it('le misure IPA si importano anche senza risultati (arrivano dal laboratorio)', () => {
    const m: MisuraRumore = {
      misura: { id: 'm1', numero: 1, dati: { fase_nome: 'Asfaltatura', postazione_nome: 'Vibrofinitrice', codice_campione: 'IPA-07' }, note: '' } as unknown as MisuraRumore['misura'],
      campagna: { id: 'c', tipo_campionamento: 'ipa' } as MisuraRumore['campagna'],
      codice: '1',
    }
    const amb = importaMisure([], [m], 'ipa')
    expect(amb[0].misure[0]).toMatchObject({ valori: {}, note: 'Campione IPA-07', misuraId: 'm1' })
  })
})
