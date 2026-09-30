import { describe, expect, it } from 'vitest'
import type { MisuraRumore } from '../api'
import { categoriaDaNome, importaMisure } from './daDatabase'

const misura = (tipo: string, n: number, dati: Record<string, unknown>, note = ''): MisuraRumore => ({
  misura: { id: `m${n}`, numero: n, dati, note } as unknown as MisuraRumore['misura'],
  campagna: { id: 'c', tipo_campionamento: tipo } as MisuraRumore['campagna'],
  codice: String(n),
})

describe('DVR CEM dal database', () => {
  it('categoria probabile dal nome', () => {
    expect(categoriaDaNome('Saldatrice a filo')).toBe('saldatura')
    expect(categoriaDaNome('Cabina MT/BT')).toBe('trasformatore')
    expect(categoriaDaNome('Gruppo elettrogeno 200 kVA')).toBe('generatori')
    expect(categoriaDaNome('Radio portatile')).toBe('telefonia')
    expect(categoriaDaNome('Smerigliatrice angolare')).toBe('utensili')
    expect(categoriaDaNome('PC ufficio')).toBe('ufficio')
    expect(categoriaDaNome('Oggetto misterioso')).toBe('altro')
  })

  it('misure CEM → sorgenti e misure, senza doppioni', () => {
    const misure = [
      misura('cem', 1, { sorgente: 'Saldatrice a filo', frequenza: 50, unita_frequenza: 'Hz', distanza: 0.2, campo_e: 12, induzione_b: 85, postazione_nome: 'Officina' }),
      misura('cem', 2, { sorgente: 'saldatrice a filo', frequenza: 50, unita_frequenza: 'Hz', distanza: 1, induzione_b: 6 }),
      misura('cem', 3, { sorgente: 'Radio portatile', frequenza: 446, unita_frequenza: 'MHz', distanza: 0.1, campo_e: 20, fase_nome: 'Comunicazioni' }),
      misura('rumore', 4, { sorgente: 'Martello' }),
    ]
    const c = importaMisure({ sorgenti: [], misure: [] }, misure)
    expect(c.sorgenti.map((s) => [s.categoria, s.descrizione, s.frequenza])).toEqual([
      ['saldatura', 'Saldatrice a filo', 50],
      ['telefonia', 'Radio portatile', 446e6],
    ])
    expect(c.misure).toHaveLength(3)
    expect(c.misure[0]).toMatchObject({ sorgenteId: c.sorgenti[0].id, postazione: 'Officina', distanza: 0.2, e: 12, b: 85, frequenza: null, misuraId: 'm1' })
    expect(c.misure[1].sorgenteId).toBe(c.sorgenti[0].id)
    expect(c.misure[2]).toMatchObject({ sorgenteId: c.sorgenti[1].id, postazione: 'Comunicazioni', e: 20, b: null })
    // una seconda importazione non duplica nulla
    const di_nuovo = importaMisure(c, misure)
    expect(di_nuovo.misure).toHaveLength(3)
    expect(di_nuovo.sorgenti).toHaveLength(2)
  })
})
