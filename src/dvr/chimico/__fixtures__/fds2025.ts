/**
 * Dati del DVR Fumi di saldatura Castagnola (II semestre 2025): ambienti dalle tabelle 7 e 8
 * (fattori Regione Piemonte) e giornata tipo dalle TAV dell'allegato 1. Estratti dal documento.
 */
import type { AmbienteChimico, PeriodoChimico } from '../valutazione'

export const AMBIENTI_FDS: AmbienteChimico[] = [
  {
    id: 'f1',
    fase: 'Saldatura con elettrodo SFA-AWS A5.18 (ER70S-6)',
    postazione: 'Su operatore',
    mansioniEsposte: 'Saldatore',
    misure: [
      {
        id: 'f1m1',
        tipo: 'P',
        valori: { polveri_resp: 0.24, polveri_inal: 1.21, ferro: 0.073, rame_resp: 0.001, rame_inal: 0.002, silice: 0.01, mn_resp: 0.011, mn_inal: 0.031, no2: 0.2, co: 5, no: 0.1, co2: 0.1 },
      },
    ],
  },
  {
    id: 'f2',
    fase: 'Saldatura con elettrodo SFA-AWS A5.18 (ER70S-6)',
    postazione: 'A circa 5 m dalla saldatura',
    mansioniEsposte: 'Capo meccanico\nMeccanico',
    misure: [
      {
        id: 'f2m1',
        tipo: 'A',
        valori: { polveri_resp: 0.79, polveri_inal: 0.25, ferro: 0.002, rame_resp: 0.001, rame_inal: 0.175, silice: 0.006, mn_resp: 0.016, mn_inal: 0.005, no2: 0.02, co: 1, no: 0.1, co2: 0.1 },
      },
    ],
  },
  {
    id: 'f3',
    fase: 'Attività varie in officina',
    postazione: 'In assenza di attività di saldatura',
    mansioniEsposte: 'Tutte le mansioni dell’officina',
    misure: [
      {
        id: 'f3m1',
        tipo: 'A',
        valori: { polveri_resp: 0.05, polveri_inal: 0.06, ferro: 0.007, rame_resp: 0.001, rame_inal: 0.001, silice: 0.003, mn_resp: 0.001, mn_inal: 0.001, no2: 0.02, co: 1, no: 0.1, co2: 0.1 },
      },
    ],
  },
]

const PAUSA: PeriodoChimico = {
  minuti: 15,
  fase: 'Pausa fisiologica',
  concentrazioni: { polveri_resp: 0.01, polveri_inal: 0.01, ferro: 0.001, rame_resp: 0.001, rame_inal: 0.001, silice: 0.005, mn_resp: 0.001, mn_inal: 0.001, no2: 0.1, co: 1, no: 0.1, co2: 0.1 },
}

export const MANSIONI_FDS = [
  { id: 's', nome: 'Saldatore', attivita: 'Effettua principalmente le attività di saldatura; quando non sono previste saldature supporta gli altri meccanici.' },
  { id: 'm', nome: 'Meccanico / Capo meccanico', attivita: 'Opera principalmente in officina per la riparazione dei mezzi di cantiere.' },
]

export const TEMPI_FDS: { mansioneId: string; periodi: PeriodoChimico[] }[] = [
  {
    mansioneId: 's',
    periodi: [
      { minuti: 120, fase: 'Saldatura', postazione: 'Su operatore', ambiente: 'f1' },
      { minuti: 345, fase: 'Attività varie in officina', postazione: 'In assenza di saldatura', ambiente: 'f3' },
      PAUSA,
    ],
  },
  {
    mansioneId: 'm',
    periodi: [
      { minuti: 120, fase: 'Saldatura (esposizione indiretta)', postazione: 'A circa 5 m', ambiente: 'f2' },
      { minuti: 345, fase: 'Attività varie in officina', postazione: 'In assenza di saldatura', ambiente: 'f3' },
      PAUSA,
    ],
  },
]
