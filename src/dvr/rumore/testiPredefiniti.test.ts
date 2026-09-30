import { describe, expect, it } from 'vitest'
import { cicloPredefinito, luoghiLavoro, zonizzazionePredefinita } from './testiPredefiniti'

describe('testi predefiniti secondo gli ambiti', () => {
  it('ciclo di lavoro: un blocco per tipo di ambito, nell’ordine delle lavorazioni', () => {
    expect(cicloPredefinito(['officina', 'galleria_tradizionale', 'piazzale']).map((b) => b.testo.slice(0, 20))).toEqual([
      'La galleria è realiz',
      'Sul piazzale di cant',
      'Nell’officina di can',
    ])
    expect(cicloPredefinito(['viadotto', 'opere_esterne']).map((b) => b.testo.slice(0, 20))).toEqual(['Le lavorazioni per l', 'Le opere in esterno '])
    expect(cicloPredefinito([])).toEqual([])
  })
  it('luoghi di lavoro e zonizzazione', () => {
    expect(luoghiLavoro(['piazzale', 'galleria_tbm', 'officina'])).toBe('sulla TBM, sul piazzale e in officina')
    expect(luoghiLavoro(['viadotto'])).toBe('sui viadotti')
    expect(luoghiLavoro([])).toBe('nelle aree di cantiere')
    expect(zonizzazionePredefinita(['piazzale', 'galleria_tradizionale'])).toContain('distanza dal fronte')
    expect(zonizzazionePredefinita(['viadotto'])).toContain('all’aperto')
    expect(zonizzazionePredefinita(['uffici'])).toBeNull()
  })
})
