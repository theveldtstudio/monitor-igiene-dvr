/** I testi predefiniti cambiano con gli ambiti: galleria tradizionale, TBM, opere all'aperto. */
import { describe, expect, it } from 'vitest'
import { testiPredefiniti } from '../chimico/testi'
import { testiOperazioni } from '../posture/documento'
import { sorgentiWbv } from '../vibrazioni/documento'
import { contestoAmbiti } from './ambiti'

const testo = (xs: (string | { testo: string; sotto?: string[] })[]) => xs.map((x) => (typeof x === 'string' ? x : [x.testo, ...(x.sotto ?? [])].join(' '))).join(' ')

describe('Testi secondo gli ambiti', () => {
  it('contesto', () => {
    expect(contestoAmbiti(['galleria_tbm', 'piazzale'])).toMatchObject({ tbm: true, tradizionale: false, galleria: true, esterno: true, viadotto: false })
    expect(contestoAmbiti(['viadotto'])).toMatchObject({ galleria: false, esterno: true, viadotto: true })
  })

  it('chimico e cancerogeno: scavo tradizionale, TBM, viadotto', () => {
    const trad = testiPredefiniti('chimico', ['galleria_tradizionale'])
    const tbm = testiPredefiniti('chimico', ['galleria_tbm'])
    const via = testiPredefiniti('chimico', ['viadotto'])
    expect(testo(trad.misure)).toContain('dopo la volata')
    expect(testo(trad.misure)).not.toContain('TBM')
    expect(testo(tbm.misure)).toContain('camera di scavo della TBM')
    expect(testo(tbm.misure)).not.toMatch(/volata|martello/)
    expect(testo(tbm.piano)).toContain('depolverazione della TBM')
    expect(testo(via.misure)).not.toMatch(/galleria|TBM|volata/)
    expect(testo(via.misure)).toContain('perforazioni per pali')
    expect(testo(via.campionamento)).toContain('lavorazioni all’aperto')
    expect(testo(testiPredefiniti('cancerogeno', ['galleria_tbm']).piano)).toContain('testa di scavo e dei nastri')
    expect(testo(testiPredefiniti('cancerogeno', ['galleria_tradizionale']).piano)).toContain('scavo, smarino e spritz')
    expect(testo(testiPredefiniti('amianto', ['galleria_tbm']).misure)).toContain('nastro chiuso')
  })

  it('posture: operazioni ordinarie', () => {
    expect(testiOperazioni(['galleria_tradizionale']).operazioniOrdinarie).toContain('centine')
    expect(testiOperazioni(['galleria_tbm', 'officina'])).toMatchObject({ inLuogo: 'sulla TBM e in galleria' })
    expect(testiOperazioni(['galleria_tbm']).operazioniOrdinarie).toContain('cambio degli utensili')
    expect(testiOperazioni(['viadotto'])).toMatchObject({ inLuogo: 'in cantiere' })
    expect(testiOperazioni(['viadotto']).operazioniOrdinarie).toContain('casseri')
  })

  it('vibrazioni: sorgenti al corpo intero', () => {
    expect(sorgentiWbv(['galleria_tbm']).join(' ')).toContain('piattaforme e sui pavimenti metallici della macchina')
    expect(sorgentiWbv(['galleria_tradizionale']).join(' ')).toContain('jumbo di perforazione')
    expect(sorgentiWbv(['viadotto']).join(' ')).toContain('Rulli compattatori')
    expect(sorgentiWbv(['uffici'])).toHaveLength(2)
  })
})
