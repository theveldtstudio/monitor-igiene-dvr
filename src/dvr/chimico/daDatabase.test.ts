import { describe, expect, it } from 'vitest'
import type { MisuraRumore, RigaTempi } from '../api'
import { importaMisure, periodiDaTempi } from './daDatabase'

const misura = (tipo: string, n: number, dati: Record<string, unknown>): MisuraRumore => ({
  misura: { id: `m${n}`, numero: n, dati, note: '' } as unknown as MisuraRumore['misura'],
  campagna: { id: 'c', tipo_campionamento: tipo, data_ora: '2026-09-10T08:00:00Z' } as MisuraRumore['campagna'],
  codice: String(n),
})

describe('DVR chimici dal database', () => {
  const misure = [
    misura('polveri', 1, { fase_nome: 'Scavo', postazione_nome: 'A terra', conc_polveri: 1.8, conc_silice: 0.016, tipo_misura: 'personale', portata_q: 2.75 }),
    misura('gas', 2, { fase_nome: 'scavo ', postazione_nome: 'a terra', no2: 1.39, co: 1, o2: 20.9 }),
    misura('carbonio_ec', 3, { fase_nome: 'Scavo', postazione_nome: 'A terra', conc_ec: 0.044 }),
    misura('gas', 4, { fase_nome: 'Smarino', co: 2 }),
    misura('rumore', 5, { fase_nome: 'Scavo', laeq: 90 }),
  ]

  it('misure raggruppate per fase e postazione, solo le campagne del tipo di DVR', () => {
    const amb = importaMisure([], misure, 'chimico')
    expect(amb.map((a) => [a.fase, a.postazione, a.misure.length])).toEqual([
      ['Scavo', 'A terra', 2],
      ['Smarino', '-', 1],
    ])
    expect(amb[0].misure[0]).toMatchObject({ misuraId: 'm1', tipo: 'P', pompa: 2.75, valori: { polveri_resp: 1.8 } })
    expect(amb[0].misure[1].valori).toEqual({ no2: 1.39, co: 1, o2: 20.9 })
    const canc = importaMisure([], misure, 'cancerogeno')
    expect(canc[0].misure.map((m) => m.valori)).toEqual([{ polveri_resp: 1.8, silice: 0.016 }, { ec: 0.044 }])
  })

  it('una seconda importazione aggiunge solo le misure nuove', () => {
    const una = importaMisure([], misure.slice(0, 1), 'chimico')
    const due = importaMisure(una, misure, 'chimico')
    expect(due[0].id).toBe(una[0].id)
    expect(due.flatMap((a) => a.misure.map((m) => m.misuraId))).toEqual(['m1', 'm2', 'm4'])
  })

  it('matrice dei tempi → periodi con ambiente o concentrazioni a mano', () => {
    const riga = (ordine: number, valori: RigaTempi['valori']) => ({ id: String(ordine), documento_id: 'd', mansione_id: 'x', ordine, minuti: 100, fase: 'F', postazione: null, macchine: null, origine: 'misura', misura_id: null, valori, nota: null }) as RigaTempi
    expect(periodiDaTempi([riga(1, { concentrazioni: { co: 1 } }), riga(0, { ambiente: 'a1' })])).toEqual([
      { minuti: 100, fase: 'F', postazione: null, ambiente: 'a1', concentrazioni: undefined },
      { minuti: 100, fase: 'F', postazione: null, ambiente: null, concentrazioni: { co: 1 } },
    ])
  })
})
