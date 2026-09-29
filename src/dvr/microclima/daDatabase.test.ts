import { describe, expect, it } from 'vitest'
import type { MisuraRumore } from '../api'
import { contenutiMicroclima, daMisureMicroclima } from './daDatabase'
import { pianoDaTesto, pianoInTesto, pianoPredefinito } from './testi'

const misura = (tipo: string, n: number, dati: Record<string, unknown>): MisuraRumore => ({
  misura: { id: `m${n}`, numero: n, dati, note: '' } as unknown as MisuraRumore['misura'],
  campagna: { id: 'c', tipo_campionamento: tipo, data_ora: '2024-12-20T08:00:00Z' } as MisuraRumore['campagna'],
  codice: String(n),
})

describe('DVR Microclima dal database', () => {
  it('misure microclima → rilievi e lavorazioni proposte', () => {
    const { rilievi, lavorazioni } = daMisureMicroclima(
      [
        misura('microclima', 1, { fase_nome: 'Scavo', postazione_nome: 'Fronte', ta: 24, tg: 25.5, tnw: 22.9, ur: 65.5, va: 0.39, attivita_metabolica: 'moderata' }),
        misura('microclima', 2, { fase_nome: 'Incompleta', ta: 24 }),
        misura('rumore', 3, { ta: 24, tg: 25, ur: 60, va: 0.2 }),
      ],
      3,
    )
    expect(rilievi).toHaveLength(1)
    expect(rilievi[0]).toMatchObject({ codice: 'MCR03', data: '20/12/2024', fase: 'Scavo', postazione: 'Fronte', tnw: 22.9, misuraId: 'm1' })
    expect(lavorazioni[0]).toMatchObject({ fase: 'Scavo', met: 2.8, rilievo: rilievi[0].id, mansioni: [] })
  })

  it('scenario proposto da ambiti e data di emissione', () => {
    const doc = (data: string) => ({ contenuti: {}, ambiti_ids: [], data_emissione: data }) as never
    const galleria = [{ id: 'a', tipo: 'galleria_tradizionale' }] as never
    expect(contenutiMicroclima({ ambiti: galleria, documento: doc('2025-01-15') }).parametri).toEqual({ scenario: 'galleria_inverno', clo: 1.5 })
    expect(contenutiMicroclima({ ambiti: [], documento: doc('2025-07-15') }).parametri).toEqual({ scenario: 'esterno_estate', clo: 0.5 })
  })

  it('piano: testo ↔ voci con sotto-elenco', () => {
    const p = pianoPredefinito('galleria_estate')
    expect(pianoDaTesto(pianoInTesto(p))).toEqual(p.map((v) => (v.sotto ? v : { testo: v.testo })))
    expect(pianoDaTesto('prima\n- a\n- b\n\nseconda')).toEqual([{ testo: 'prima', sotto: ['a', 'b'] }, { testo: 'seconda' }])
  })
})
