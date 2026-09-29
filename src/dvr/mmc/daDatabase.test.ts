import { describe, expect, it } from 'vitest'
import type { MisuraRumore } from '../api'
import { attivitaDaMisure, frequenzaAlMinuto } from './daDatabase'

const misura = (tipo: string, n: number, dati: Record<string, unknown>, note = ''): MisuraRumore => ({
  misura: { id: `m${n}`, numero: n, dati, note } as unknown as MisuraRumore['misura'],
  campagna: { id: 'c', tipo_campionamento: tipo } as MisuraRumore['campagna'],
  codice: String(n),
})

describe('DVR MMC dal database', () => {
  it('frequenza in atti al minuto', () => {
    expect(frequenzaAlMinuto(30, 'atti/ora')).toBe(0.5)
    expect(frequenzaAlMinuto(48, 'atti/turno')).toBe(0.1)
    expect(frequenzaAlMinuto(2, 'atti/min')).toBe(2)
  })

  it('misure MMC e OCRA → attività da completare', () => {
    const a = attivitaDaMisure([
      misura('mmc', 1, { carico: 15, altezza_mani: 25, distanza_verticale: 50, distanza_peso_corpo: 30, dislocazione_angolare: 0, frequenza_gesti: 12, frequenza_unita: 'atti/ora', giudizio_presa: 'Discreta' }, 'Sollevamento tubazioni'),
      misura('mmc', 2, { carico: 20, distanza_trasporto: 15, altezza_mani: 80, frequenza_gesti: 2, frequenza_unita: 'atti/ora' }),
      misura('mmc', 3, { spinta: 18, forza_mantenimento: 9, altezza_mani: 95, distanza_trasporto: 7.5 }),
      misura('movimenti_ripetitivi_ocra', 4, { punteggio_reale: 9.2, arto_valutato: 'DX', minuti_compito: 60, denominazione: 'Avvitatura' }),
      misura('mmc', 5, { note: 'vuota' }),
    ])
    expect(a.map((x) => x.metodo)).toEqual(['niosh', 'snook', 'snook', 'ocra'])
    expect(a[0]).toMatchObject({ titolo: 'Sollevamento tubazioni', misuraId: 'm1' })
    expect(a[0].compiti![0]).toMatchObject({ frequenza: 0.2, presa: 'medio', durata: 'lunga' })
    expect(a[1].snook).toMatchObject({ azione: 'trasporto', valore: 20, intervallo: 1800 })
    expect(a[2].snook).toMatchObject({ azione: 'spinta', valore: 18, mantenimento: 9 })
    expect(a[3].ocra).toEqual({ dx: 9.2, sx: null, minuti: 60 })
  })
})
