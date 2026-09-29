import { describe, expect, it } from 'vitest'
import type { MisuraRumore, RigaTempi } from '../api'
import { catalogoDaMisure, giornateDaTempi, misureOwas, righeDaMisure } from './daDatabase'

const campagna = { id: 'c1', tipo_campionamento: 'posture_owas' } as MisuraRumore['campagna']
const misura = (numero: number, dati: Record<string, unknown>, note = ''): MisuraRumore => ({
  misura: { id: `m${numero}`, numero, dati, note } as unknown as MisuraRumore['misura'],
  campagna,
  codice: String(numero),
})

const MISURE = [
  misura(1, { mansione: 'Carpentiere', attivita: 'Armatura murette', durata: 120, schiena: 2, braccia: 1, gambe: 4, carico: 1, classe: 3 }),
  misura(2, { mansione: 'Carpentiere', attivita: 'Armatura murette', durata: 60, schiena: 4, braccia: 1, gambe: 2, carico: 1, classe: 3 }),
  misura(3, { mansione: 'Ferraiolo', attivita: 'armatura  murette', durata: 30, schiena: 2, braccia: 1, gambe: 4, carico: 1 }),
  misura(4, { mansione: 'Ferraiolo', attivita: 'Senza codice' }),
]

describe('DVR Posture dal database', () => {
  it('misure OWAS: classe ricalcolata dal codice, misure senza codice escluse', () => {
    const m = misureOwas(MISURE)
    expect(m).toHaveLength(3)
    expect(m[0].classe).toBe(3)
    // la classe salvata (3, tabella vecchia) non conta: 4_1_2_1 è classe 2
    expect(m[1].classe).toBe(2)
  })

  it('catalogo dalle misure: una attività con le posture diverse e le mansioni', () => {
    const c = catalogoDaMisure(misureOwas(MISURE))
    expect(c).toHaveLength(1)
    expect(c[0].posture).toHaveLength(2)
    expect(c[0].mansioni).toBe('Carpentiere / Ferraiolo')
  })

  it('righe di giornata dalle misure della mansione', () => {
    const r = righeDaMisure(misureOwas(MISURE), 'carpentiere')
    expect(r.map((x) => [x.minuti, x.classe])).toEqual([[120, 3], [60, 2]])
  })

  it('matrice dei tempi → giornate, righe collegate a misure con la classe ricalcolata', () => {
    const owas = new Map(misureOwas(MISURE).map((m) => [m.misuraId, m]))
    const riga = (ordine: number, p: Partial<RigaTempi>): RigaTempi => ({
      id: String(ordine), documento_id: 'd', mansione_id: 'x', ordine, minuti: 60, fase: 'Fase', postazione: null, macchine: null,
      origine: 'convenzionale', misura_id: null, valori: {}, nota: null, ...p,
    })
    const { giornate, scartate } = giornateDaTempi(
      [
        riga(0, { valori: { giornata: 'Murette', attivita: 'Armatura', classe: 2 } }),
        riga(1, { valori: { giornata: 'Murette', classe: 0 }, minuti: 120 }),
        riga(2, { valori: { giornata: 'Getto', classe: 3 }, misura_id: 'm2', origine: 'misura' }),
        riga(3, { valori: { giornata: 'Getto' } }),
      ],
      owas,
    )
    expect(giornate.map((g) => g.titolo)).toEqual(['Murette', 'Getto'])
    expect(giornate[0].righe.map((r) => r.classe)).toEqual([2, 'ripartita'])
    expect(giornate[1].righe[0].classe).toBe(2)
    expect(scartate).toHaveLength(1)
  })
})
