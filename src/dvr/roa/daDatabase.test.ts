import { describe, expect, it } from 'vitest'
import type { MisuraRumore } from '../api'
import { sorgentiDaMisure } from './daDatabase'
import { giustificabile } from './valutazione'

const misura = (tipo: string, n: number, dati: Record<string, unknown>): MisuraRumore => ({
  misura: { id: `m${n}`, numero: n, dati, note: '' } as unknown as MisuraRumore['misura'],
  campagna: { id: 'c', tipo_campionamento: tipo } as MisuraRumore['campagna'],
  codice: String(n),
})

describe('DVR ROA dal database', () => {
  it('misure ROA → sorgenti da completare', () => {
    const s = sorgentiDaMisure([
      misura('roa', 1, { sorgente: 'Saldatrice a filo', banda: 'UV-C', fase_nome: 'Saldatura in officina', distanza: 0.5, irradianza_e: 0.12 }),
      misura('roa', 2, { sorgente: 'Stazione totale', banda: 'Laser', fase_nome: 'Rilievi topografici' }),
      misura('roa', 3, { banda: 'Visibile' }),
      misura('rumore', 4, { sorgente: 'Martello' }),
    ])
    expect(s.map((x) => [x.tipo, x.descrizione, x.saldatura])).toEqual([
      ['macchina', 'Saldatrice a filo', true],
      ['laser', 'Stazione totale', false],
    ])
    expect(s[0]).toMatchObject({ attivita: 'Saldatura in officina', distanza: '0,5 m', misuraId: 'm1', spettro: 'ultravioletti' })
    expect(s[0].motivazioneMisure).toContain('irradianza efficace 0,12 W/m²')
    expect(giustificabile(s[0])).toBe(false)
    expect(giustificabile(s[1])).toBe(false)
  })
})
