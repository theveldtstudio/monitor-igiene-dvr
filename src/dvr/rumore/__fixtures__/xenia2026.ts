/**
 * Dati del DVR Rumore Xenia 2026 (TBM1), estratti dal documento emesso: TAV dell'Allegato 1,
 * rilievi dell'Allegato 2 (per LCeq) e Tabella 13. Servono a verificare il motore di calcolo.
 */
import type { PeriodoEsposizione } from '../calcolo'

export interface TavXenia {
  tav: string
  nome: string
  periodi: PeriodoEsposizione[]
  documento: { lex: number; incertezza: number; picco: number }
}

export const TAV_XENIA: TavXenia[] = [
  {
    "tav": "TAV.1 CAPOSQUADRA TBM",
    "nome": "CAPOSQUADRA TBM",
    "periodi": [
      {
        "minuti": 30,
        "fase": "Gestione impianto di ingrassaggio",
        "postazione": "In prossimità della lavorazione",
        "macchine": "Impianto di ingrassaggio; TBM01; Impianto di ventilazione",
        "laeq": 88.8,
        "lceq": 91.5,
        "lpeak": 113.5,
        "origine": "misura",
        "riferimento": "5"
      },
      {
        "minuti": 30,
        "fase": "Avanzamento TBM",
        "postazione": "Zona limitrofe a coclea",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.6,
        "lceq": 89.3,
        "lpeak": 111.3,
        "origine": "misura",
        "riferimento": "6"
      },
      {
        "minuti": 30,
        "fase": "Controllo/Ispezione nastro trasportatore",
        "postazione": "In prossimità della lavorazione",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.8,
        "lceq": 91.1,
        "lpeak": 107.8,
        "origine": "misura",
        "riferimento": "9"
      },
      {
        "minuti": 30,
        "fase": "Gestione impianto malta interno",
        "postazione": "In prossimità della lavorazione",
        "macchine": "Impianto malta; TBM1; Impianto di ventilazione",
        "laeq": 84.2,
        "lceq": 91.4,
        "lpeak": 110.8,
        "origine": "misura",
        "riferimento": "13"
      },
      {
        "minuti": 30,
        "fase": "Pulizia fondoscudo",
        "postazione": "In prossimità della lavorazione",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.7,
        "lceq": 97.8,
        "lpeak": 114.8,
        "origine": "misura",
        "riferimento": "14"
      },
      {
        "minuti": 30,
        "fase": "Controllo posizionamento conci",
        "postazione": "Zona superiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 85.6,
        "lceq": 95.2,
        "lpeak": 108.2,
        "origine": "misura",
        "riferimento": "18"
      },
      {
        "minuti": 30,
        "fase": "Controllo posizionamento conci",
        "postazione": "Zona inferiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.3,
        "lceq": 97.2,
        "lpeak": 107.5,
        "origine": "misura",
        "riferimento": "19"
      },
      {
        "minuti": 195,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 60,
        "fase": "Attività d'ufficio",
        "postazione": "/",
        "macchine": "/",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "/",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 84.3,
      "incertezza": 0.7,
      "picco": 114.8
    }
  },
  {
    "tav": "TAV. 2 CAPO TURNO",
    "nome": "CAPO TURNO",
    "periodi": [
      {
        "minuti": 30,
        "fase": "Gestione impianto di ingrassaggio",
        "postazione": "In prossimità della lavorazione",
        "macchine": "Impianto di ingrassaggio; TBM01; Impianto di ventilazione",
        "laeq": 88.8,
        "lceq": 91.5,
        "lpeak": 113.5,
        "origine": "misura",
        "riferimento": "5"
      },
      {
        "minuti": 30,
        "fase": "Avanzamento TBM",
        "postazione": "Zona limitrofe a coclea",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.6,
        "lceq": 89.3,
        "lpeak": 111.3,
        "origine": "misura",
        "riferimento": "6"
      },
      {
        "minuti": 30,
        "fase": "Controllo/Ispezione nastro trasportatore",
        "postazione": "In prossimità della lavorazione",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.8,
        "lceq": 91.1,
        "lpeak": 107.8,
        "origine": "misura",
        "riferimento": "9"
      },
      {
        "minuti": 30,
        "fase": "Gestione impianto malta interno",
        "postazione": "In prossimità della lavorazione",
        "macchine": "Impianto malta; TBM1; Impianto di ventilazione",
        "laeq": 84.2,
        "lceq": 91.4,
        "lpeak": 110.8,
        "origine": "misura",
        "riferimento": "13"
      },
      {
        "minuti": 30,
        "fase": "Pulizia fondoscudo",
        "postazione": "In prossimità della lavorazione",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.7,
        "lceq": 97.8,
        "lpeak": 114.8,
        "origine": "misura",
        "riferimento": "14"
      },
      {
        "minuti": 30,
        "fase": "Controllo posizionamento conci",
        "postazione": "Zona superiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 85.6,
        "lceq": 95.2,
        "lpeak": 108.2,
        "origine": "misura",
        "riferimento": "18"
      },
      {
        "minuti": 30,
        "fase": "Controllo posizionamento conci",
        "postazione": "Zona inferiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.3,
        "lceq": 97.2,
        "lpeak": 107.5,
        "origine": "misura",
        "riferimento": "19"
      },
      {
        "minuti": 255,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "/",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 84.7,
      "incertezza": 0.7,
      "picco": 114.8
    }
  },
  {
    "tav": "TAV.3 OPERATORE MSV",
    "nome": "OPERATORE MSV",
    "periodi": [
      {
        "minuti": 400,
        "fase": "Trasporto conci",
        "postazione": "Interno cabina MSV",
        "macchine": "NDF New Dafang",
        "laeq": 83.0,
        "lceq": 92.8,
        "lpeak": 104.7,
        "origine": "misura",
        "riferimento": "12"
      },
      {
        "minuti": 65,
        "fase": "Attività ordinaria sul piazzale",
        "postazione": "A terra",
        "macchine": "Vari mezzi",
        "laeq": 78.2,
        "lceq": 84.2,
        "lpeak": 91.0,
        "origine": "misura",
        "riferimento": "15"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "/",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 82.4,
      "incertezza": 1.3,
      "picco": 104.7
    }
  },
  {
    "tav": "TAV. 4 OPERATORE ASTRONAVE/AIUTO OPERATORE ASTRONAVE",
    "nome": "OPERATORE ASTRONAVE/AIUTO OPERATORE ASTRONAVE",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Pilotaggio TBM",
        "postazione": "Interno cabina d'operazione",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 75.1,
        "lceq": 78.1,
        "lpeak": 90.5,
        "origine": "misura",
        "riferimento": "7"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "/",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 75.0,
      "incertezza": 1.3,
      "picco": 90.5
    }
  },
  {
    "tav": "TAV.5 OPERATORE TBM – ERETTORISTA/AIUTO ERETTORISTA",
    "nome": "OPERATORE TBM – ERETTORISTA/AIUTO ERETTORISTA",
    "periodi": [
      {
        "minuti": 30,
        "fase": "Montaggio anello",
        "postazione": "Zona superiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 85.6,
        "lceq": 95.2,
        "lpeak": 108.2,
        "origine": "misura",
        "riferimento": "18"
      },
      {
        "minuti": 30,
        "fase": "Montaggio anello",
        "postazione": "Zona inferiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.3,
        "lceq": 97.2,
        "lpeak": 107.5,
        "origine": "misura",
        "riferimento": "19"
      },
      {
        "minuti": 20,
        "fase": "Avanzamento TBM",
        "postazione": "Zona limitrofe a coclea",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.6,
        "lceq": 89.3,
        "lpeak": 111.3,
        "origine": "misura",
        "riferimento": "6"
      },
      {
        "minuti": 385,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "/",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 83.7,
      "incertezza": 1.0,
      "picco": 111.3
    }
  },
  {
    "tav": "TAV.6 OPERATORE TBM – AIUTO MONTAGGIO ANELLI",
    "nome": "OPERATORE TBM – AIUTO MONTAGGIO ANELLI",
    "periodi": [
      {
        "minuti": 30,
        "fase": "Montaggio anello",
        "postazione": "Zona superiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 85.6,
        "lceq": 95.2,
        "lpeak": 108.2,
        "origine": "misura",
        "riferimento": "18"
      },
      {
        "minuti": 30,
        "fase": "Montaggio anello",
        "postazione": "Zona inferiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.3,
        "lceq": 97.2,
        "lpeak": 107.5,
        "origine": "misura",
        "riferimento": "19"
      },
      {
        "minuti": 20,
        "fase": "Avanzamento TBM",
        "postazione": "Zona limitrofe a coclea",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.6,
        "lceq": 89.3,
        "lpeak": 111.3,
        "origine": "misura",
        "riferimento": "6"
      },
      {
        "minuti": 385,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "/",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 83.7,
      "incertezza": 1.0,
      "picco": 111.3
    }
  },
  {
    "tav": "TAV.7 OPERATORE TBM – MECCANICO TBM/AIUTO MECCANICO TBM",
    "nome": "OPERATORE TBM – MECCANICO TBM/AIUTO MECCANICO TBM",
    "periodi": [
      {
        "minuti": 120,
        "fase": "Gestione impianto di ingrassaggio",
        "postazione": "In prossimità della lavorazione",
        "macchine": "Impianto di ingrassaggio; TBM01; Impianto di ventilazione",
        "laeq": 88.8,
        "lceq": 91.5,
        "lpeak": 113.5,
        "origine": "misura",
        "riferimento": "5"
      },
      {
        "minuti": 120,
        "fase": "Manutenzione ordinaria",
        "postazione": "Banco meccanico",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.5,
        "lceq": null,
        "lpeak": 112.7,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 85.4,
      "incertezza": 0.9,
      "picco": 113.5
    }
  },
  {
    "tav": "TAV. 8 OPERATORE TBM – ELETTRICISTA TBM/AIUTO ELETTRICISTA TBM",
    "nome": "OPERATORE TBM – ELETTRICISTA TBM/AIUTO ELETTRICISTA TBM",
    "periodi": [
      {
        "minuti": 120,
        "fase": "Manutenzione ordinaria",
        "postazione": "Banco elettricisti",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 84.2,
        "lceq": null,
        "lpeak": 114.4,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 120,
        "fase": "Interventi di manutenzione",
        "postazione": "In prossimità della lavorazione",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 82.5,
        "lceq": null,
        "lpeak": 101.4,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 83.2,
      "incertezza": 0.9,
      "picco": 114.4
    }
  },
  {
    "tav": "TAV.9 OPERATORE TBM - SALDATORE",
    "nome": "OPERATORE TBM - SALDATORE",
    "periodi": [
      {
        "minuti": 240,
        "fase": "Attività ordinaria di officina",
        "postazione": "Interno officina",
        "macchine": "\\",
        "laeq": 66.5,
        "lceq": 75.3,
        "lpeak": 95.3,
        "origine": "misura",
        "riferimento": "4"
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 80.0,
      "incertezza": 1.3,
      "picco": 102.3
    }
  },
  {
    "tav": "TAV.10 OPERATORE TBM – ADDETTO INIEZIONI MALTA/POMPISTA/ADDETTO GETTO INVERT",
    "nome": "OPERATORE TBM – ADDETTO INIEZIONI MALTA/POMPISTA/ADDETTO GETTO INVERT",
    "periodi": [
      {
        "minuti": 120,
        "fase": "Iniezione malta cementizia",
        "postazione": "In prossimità della lavorazione",
        "macchine": "TBM01; Autobetoniera; impianto di ventilazione",
        "laeq": 88.4,
        "lceq": null,
        "lpeak": 110.2,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 120,
        "fase": "Gestione impianto malta interno",
        "postazione": "In prossimità della lavorazione",
        "macchine": "Impianto malta; TBM1; Impianto di ventilazione",
        "laeq": 84.2,
        "lceq": 91.4,
        "lpeak": 110.8,
        "origine": "misura",
        "riferimento": "13"
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 85.3,
      "incertezza": 0.9,
      "picco": 110.8
    }
  },
  {
    "tav": "TAV.11 OPERATORE TBM – ADDETTO FONDOSCUDO",
    "nome": "OPERATORE TBM – ADDETTO FONDOSCUDO",
    "periodi": [
      {
        "minuti": 120,
        "fase": "Pulizia fondoscudo",
        "postazione": "In prossimità della lavorazione",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.7,
        "lceq": 97.8,
        "lpeak": 114.8,
        "origine": "misura",
        "riferimento": "14"
      },
      {
        "minuti": 345,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 84.7,
      "incertezza": 1.0,
      "picco": 114.8
    }
  },
  {
    "tav": "TAV.12 CAPO PIAZZALE TBM",
    "nome": "CAPO PIAZZALE TBM",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Attività ordinaria sul piazzale",
        "postazione": "A terra",
        "macchine": "Vari mezzi",
        "laeq": 78.2,
        "lceq": 84.2,
        "lpeak": 91.0,
        "origine": "misura",
        "riferimento": "15"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 78.1,
      "incertezza": 1.3,
      "picco": 91.0
    }
  },
  {
    "tav": "TAV. 13 – SALDATORE – AIUTANTE SALDATORE",
    "nome": "SALDATORE – AIUTANTE SALDATORE",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Attività ordinaria di officina",
        "postazione": "Interno officina",
        "macchine": "\\",
        "laeq": 66.5,
        "lceq": 75.3,
        "lpeak": 95.3,
        "origine": "misura",
        "riferimento": "4"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 66.5,
      "incertezza": 1.3,
      "picco": 95.3
    }
  },
  {
    "tav": "TAV.14 ADDETTO PIAZZALE TBM",
    "nome": "ADDETTO PIAZZALE TBM",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Attività ordinaria sul piazzale",
        "postazione": "A terra",
        "macchine": "Vari mezzi",
        "laeq": 78.2,
        "lceq": 84.2,
        "lpeak": 91.0,
        "origine": "misura",
        "riferimento": "15"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 78.1,
      "incertezza": 1.3,
      "picco": 91.0
    }
  },
  {
    "tav": "TAV.15 ADDETTO FORKLIFT",
    "nome": "ADDETTO FORKLIFT",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Movimentazione conci",
        "postazione": "Interno cabina Forklift",
        "macchine": "KALMAR DLG410",
        "laeq": 74.2,
        "lceq": 80.2,
        "lpeak": 88.3,
        "origine": "misura",
        "riferimento": "16"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 74.1,
      "incertezza": 1.3,
      "picco": 88.3
    }
  },
  {
    "tav": "TAV.16 ADDETTO MULETTO",
    "nome": "ADDETTO MULETTO",
    "periodi": [
      {
        "minuti": 220,
        "fase": "Movimentazione materiali",
        "postazione": "Interno cabina sollevatore",
        "macchine": "Manitou MT184",
        "laeq": 73.4,
        "lceq": 79.7,
        "lpeak": 84.6,
        "origine": "misura",
        "riferimento": "17"
      },
      {
        "minuti": 110,
        "fase": "Movimentazione materiali",
        "postazione": "Interno cabina mini-pala",
        "macchine": "Mini-pala Bobcat 5510",
        "laeq": 85.7,
        "lceq": 96.8,
        "lpeak": 107.2,
        "origine": "misura",
        "riferimento": "20"
      },
      {
        "minuti": 110,
        "fase": "Ripristino piste di cantiere",
        "postazione": "Iterno cabina mini-pala",
        "macchine": "Mini-pala Bobcat 5510",
        "laeq": 79.7,
        "lceq": 84.6,
        "lpeak": 104.6,
        "origine": "misura",
        "riferimento": "10"
      },
      {
        "minuti": 25,
        "fase": "Attività ordinaria sul piazzale",
        "postazione": "A terra",
        "macchine": "Vari mezzi",
        "laeq": 78.2,
        "lceq": 84.2,
        "lpeak": 91.0,
        "origine": "misura",
        "riferimento": "15"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 80.8,
      "incertezza": 1.0,
      "picco": 107.2
    }
  },
  {
    "tav": "TAV.17 CAPO MAGAZZINO TBM/ADDETTO MAGAZZINO",
    "nome": "CAPO MAGAZZINO TBM/ADDETTO MAGAZZINO",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Gestione magazzino",
        "postazione": "Interno magazzino",
        "macchine": "\\",
        "laeq": 55.9,
        "lceq": 69.8,
        "lpeak": 91.2,
        "origine": "misura",
        "riferimento": "3"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 56.8,
      "incertezza": 1.1,
      "picco": 91.2
    }
  },
  {
    "tav": "TAV.18 OPERATORE TBM – IMPIANTISTA",
    "nome": "OPERATORE TBM – IMPIANTISTA",
    "periodi": [
      {
        "minuti": 120,
        "fase": "Attività ordinarie in TBM",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.2,
        "lceq": 92.4,
        "lpeak": 102.3,
        "origine": "misura",
        "riferimento": "11"
      },
      {
        "minuti": 165,
        "fase": "Allungamento tubi di servizi",
        "postazione": "Primo piano TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 83.9,
        "lceq": null,
        "lpeak": 100.1,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 30,
        "fase": "Manutenzione ordinaria",
        "postazione": "Banco elettricisti",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 90.2,
        "lceq": 93.2,
        "lpeak": 114.4,
        "origine": "misura",
        "riferimento": "8"
      },
      {
        "minuti": 30,
        "fase": "Manutenzione ordinaria",
        "postazione": "Banco meccanico",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.5,
        "lceq": 90.4,
        "lpeak": 112.7,
        "origine": "misura",
        "riferimento": "21"
      },
      {
        "minuti": 120,
        "fase": "Attività ordinaria di officina",
        "postazione": "Interno officina",
        "macchine": "\\",
        "laeq": 66.5,
        "lceq": 75.3,
        "lpeak": 95.3,
        "origine": "misura",
        "riferimento": "4"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 83.5,
      "incertezza": 0.8,
      "picco": 114.4
    }
  },
  {
    "tav": "TAV.19 ADDETTO RIPRISTINI/MURATORE",
    "nome": "ADDETTO RIPRISTINI/MURATORE",
    "periodi": [
      {
        "minuti": 120,
        "fase": "Montaggio anello",
        "postazione": "Zona superiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 85.6,
        "lceq": 95.2,
        "lpeak": 108.2,
        "origine": "misura",
        "riferimento": "18"
      },
      {
        "minuti": 120,
        "fase": "Montaggio anello",
        "postazione": "Zona inferiore erettore",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 87.3,
        "lceq": 97.2,
        "lpeak": 107.5,
        "origine": "misura",
        "riferimento": "19"
      },
      {
        "minuti": 225,
        "fase": "Attività ordinaria sul piazzale",
        "postazione": "A terra",
        "macchine": "Vari mezzi",
        "laeq": 78.2,
        "lceq": 84.2,
        "lpeak": 91.0,
        "origine": "misura",
        "riferimento": "15"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 84.1,
      "incertezza": 0.9,
      "picco": 108.2
    }
  },
  {
    "tav": "TAV.20 – AIUTANTE ESTERNO (MANOVALE)",
    "nome": "AIUTANTE ESTERNO (MANOVALE)",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Attività ordinaria sul piazzale",
        "postazione": "A terra",
        "macchine": "Vari mezzi",
        "laeq": 78.2,
        "lceq": 84.2,
        "lpeak": 91.0,
        "origine": "misura",
        "riferimento": "15"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 78.1,
      "incertezza": 1.3,
      "picco": 91.0
    }
  },
  {
    "tav": "TAV.21 – GRUISTA",
    "nome": "GRUISTA",
    "periodi": [
      {
        "minuti": 465,
        "fase": "Movimentazione materiali*",
        "postazione": "Interno cabina grù",
        "macchine": "Grù",
        "laeq": 70.5,
        "lceq": null,
        "lpeak": 92.4,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 70.4,
      "incertezza": 1.3,
      "picco": 92.4
    }
  },
  {
    "tav": "TAV. 22 – IMPIEGATO TECNICO",
    "nome": "IMPIEGATO TECNICO",
    "periodi": [
      {
        "minuti": 45,
        "fase": "Sopralluoghi in TBM",
        "postazione": "Media dei valori attività in TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 85.5,
        "lceq": null,
        "lpeak": 108.7,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 45,
        "fase": "Sopralluoghi sul piazzale",
        "postazione": "Media dei valori attività sul piazzale",
        "macchine": "Vari mezzi",
        "laeq": 73.1,
        "lceq": null,
        "lpeak": 97.2,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 375,
        "fase": "Attività d'ufficio",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 75.7,
      "incertezza": 1.2,
      "picco": 108.7
    }
  },
  {
    "tav": "TAV.23 CAPO CANTIERE",
    "nome": "CAPO CANTIERE",
    "periodi": [
      {
        "minuti": 45,
        "fase": "Sopralluoghi in TBM",
        "postazione": "Media dei valori attività in TBM",
        "macchine": "TBM01; impianto di ventilazione",
        "laeq": 85.5,
        "lceq": null,
        "lpeak": 108.7,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 45,
        "fase": "Sopralluoghi sul piazzale",
        "postazione": "Media dei valori attività sul piazzale",
        "macchine": "Vari mezzi",
        "laeq": 73.1,
        "lceq": null,
        "lpeak": 97.2,
        "origine": "storico",
        "riferimento": null
      },
      {
        "minuti": 375,
        "fase": "Attività d'ufficio",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": null,
        "origine": "convenzionale",
        "riferimento": null
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "postazione": "/",
        "macchine": "\\",
        "laeq": 65.0,
        "lceq": null,
        "lpeak": 65.0,
        "origine": "convenzionale",
        "riferimento": null
      }
    ],
    "documento": {
      "lex": 75.7,
      "incertezza": 1.2,
      "picco": 108.7
    }
  }
]

export const TABELLA13_XENIA: Record<string, { lex: number; incertezza: number; picco: number; vibrazioni: boolean; ototossiche: boolean }> = {
  "Capo Turno": {
    "lex": 84.7,
    "incertezza": 0.7,
    "picco": 114.8,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Capo Cantiere": {
    "lex": 75.7,
    "incertezza": 1.2,
    "picco": 108.7,
    "vibrazioni": false,
    "ototossiche": true
  },
  "Caposquadra TBM": {
    "lex": 84.3,
    "incertezza": 0.7,
    "picco": 114.8,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore TBM – Erettorista/Aiuto erettorista": {
    "lex": 83.7,
    "incertezza": 1.0,
    "picco": 111.3,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore TBM – Impiantista": {
    "lex": 83.5,
    "incertezza": 0.8,
    "picco": 114.4,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore TBM – Addetto iniezioni malta/Pompista/Addetto getto invert": {
    "lex": 85.3,
    "incertezza": 0.9,
    "picco": 110.8,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore astronave/Aiuto operatore astronave": {
    "lex": 75.0,
    "incertezza": 1.3,
    "picco": 90.5,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore TBM – Aiuto montaggio anelli": {
    "lex": 83.7,
    "incertezza": 1.0,
    "picco": 111.3,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore MSV": {
    "lex": 82.4,
    "incertezza": 1.3,
    "picco": 104.7,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore TBM – Elettricista TBM/Aiuto elettricista TBM": {
    "lex": 85.4,
    "incertezza": 0.9,
    "picco": 113.5,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Operatore TBM – Meccanico TBM/Aiuto meccanico TBM": {
    "lex": 83.2,
    "incertezza": 0.9,
    "picco": 114.4,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Impiegato tecnico": {
    "lex": 75.7,
    "incertezza": 1.2,
    "picco": 108.7,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Capo piazzale TBM": {
    "lex": 78.1,
    "incertezza": 1.3,
    "picco": 91.0,
    "vibrazioni": false,
    "ototossiche": false
  },
  "Operatore TBM – Saldatore": {
    "lex": 80.0,
    "incertezza": 1.3,
    "picco": 102.3,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Saldatore – Aiutante saldatore": {
    "lex": 66.5,
    "incertezza": 1.3,
    "picco": 95.3,
    "vibrazioni": false,
    "ototossiche": true
  },
  "Gruista": {
    "lex": 70.4,
    "incertezza": 1.3,
    "picco": 92.4,
    "vibrazioni": true,
    "ototossiche": false
  },
  "Addetto Forklift": {
    "lex": 74.1,
    "incertezza": 1.3,
    "picco": 88.3,
    "vibrazioni": true,
    "ototossiche": false
  },
  "Addetto muletto": {
    "lex": 80.8,
    "incertezza": 1.0,
    "picco": 107.2,
    "vibrazioni": true,
    "ototossiche": false
  },
  "Capo magazzino TBM/Addetto magazzino": {
    "lex": 56.8,
    "incertezza": 1.1,
    "picco": 91.2,
    "vibrazioni": false,
    "ototossiche": false
  },
  "Addetto ripristini/Muratore": {
    "lex": 84.1,
    "incertezza": 0.9,
    "picco": 108.2,
    "vibrazioni": true,
    "ototossiche": true
  },
  "Aiutante esterno (manovale)": {
    "lex": 78.1,
    "incertezza": 1.3,
    "picco": 91.0,
    "vibrazioni": false,
    "ototossiche": false
  },
  "Addetto piazzale TBM": {
    "lex": 78.1,
    "incertezza": 1.3,
    "picco": 91.0,
    "vibrazioni": false,
    "ototossiche": false
  },
  "Operatore TBM – Addetto fondoscudo": {
    "lex": 84.7,
    "incertezza": 1.0,
    "picco": 114.8,
    "vibrazioni": true,
    "ototossiche": true
  }
}
