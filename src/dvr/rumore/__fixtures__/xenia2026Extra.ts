/** Dati accessori del DVR Rumore Xenia 2026 (tabelle 2, 3, attenuazioni DPI, tarature, Allegato 2). */

export const MANSIONI_XENIA = [
  {
    "tav": "CAPOSQUADRA TBM",
    "nome": "Caposquadra TBM",
    "attivita": "Esegue attività di coordinamento dell’intera squadra di lavoratori che opera in galleria",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "CAPO TURNO",
    "nome": "Capo Turno",
    "attivita": "Esegue attività di direzione, coordinamento e gestione delle operazioni in galleria. È abilitato alla guida dei mezzi d’opera.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE MSV",
    "nome": "Operatore MSV",
    "attivita": "Operatore addetto alla guida di mezzi speciali (MSV) per il trasporto dei conci prefabbricati dal piazzale esterno all’interno della galleria.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE ASTRONAVE/AIUTO OPERATORE ASTRONAVE",
    "nome": "Operatore astronave/Aiuto operatore astronave",
    "attivita": "Operatore addetto all’utilizzo dell’astronave e al controllo durante l’attività di movimentazione dei conci. I conci vengono trasferiti dal MSV all’astronave, che li trasporta verso l’erettorista.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE TBM – ERETTORISTA/AIUTO ERETTORISTA",
    "nome": "Operatore TBM – Erettorista/Aiuto erettorista",
    "attivita": "Figura specializzata nella posa dei conci prefabbricati che costituiscono il rivestimento definitivo della galleria. Guida l’erettore, macchina che solleva i conci e li posiziona nella loro sede prestabilita. Durante lo scavo può aiutare gli altri operatori in lavorazioni nelle zone retrostanti",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE TBM – AIUTO MONTAGGIO ANELLI",
    "nome": "Operatore TBM – Aiuto montaggio anelli",
    "attivita": "Esegue attività di supporto all’erettorista durante la fase di posizionamento dei conci.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE TBM – MECCANICO TBM/AIUTO MECCANICO TBM",
    "nome": "Operatore TBM – Meccanico TBM/Aiuto meccanico TBM",
    "attivita": "Operatore addetto alle manutenzioni o riparazioni meccaniche da effettuarsi all’interno della fresa. Si occupa anche dei reintegri degli oli e dei grassi necessari al corretto funzionamento di tutti i componenti della fresa",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE TBM – ELETTRICISTA TBM/AIUTO ELETTRICISTA TBM",
    "nome": "Operatore TBM – Elettricista TBM/Aiuto elettricista TBM",
    "attivita": "Operatore addetto alle manutenzioni o riparazioni elettriche da effettuarsi all’interno della fresa. Si occupa anche delle nuove installazioni di punti luce, allungamento utenze elettriche.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE TBM - SALDATORE",
    "nome": "Operatore TBM – Saldatore",
    "attivita": "Operatore addetto alle attività di saldatura/taglio di parti metalliche.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE TBM – ADDETTO INIEZIONI MALTA/POMPISTA/ADDETTO GETTO INVERT",
    "nome": "Operatore TBM – Addetto iniezioni malta/Pompista/Addetto getto invert",
    "attivita": "Operatore addetto alla posa della malta cementizia iniettata a tergo del rivestimento definitivo (conci prefabbricati)",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "OPERATORE TBM – ADDETTO FONDOSCUDO",
    "nome": "Operatore TBM – Addetto fondoscudo",
    "attivita": "Effettua la pulizia dello scudo utilizzando una lancia con acqua ad alta pressione",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "CAPO PIAZZALE TBM",
    "nome": "Capo piazzale TBM",
    "attivita": "Figura specializzata nella gestione di tutte le operazioni svolte nel piazzale della fresa. Coordina la squadra di operai per gli approvvigionamenti necessari al corretto funzionamento della fresa",
    "vibrazioni": false,
    "ototossiche": false
  },
  {
    "tav": "SALDATORE – AIUTANTE SALDATORE",
    "nome": "Saldatore – Aiutante saldatore",
    "attivita": "Operatore addetto alle attività di saldatura/taglio di parti metalliche.",
    "vibrazioni": false,
    "ototossiche": true
  },
  {
    "tav": "ADDETTO PIAZZALE TBM",
    "nome": "Addetto piazzale TBM",
    "attivita": "Svolge attività ordinarie di piazzale: sistemazione materiali, spostamento/movimentazione materiali di cantiere, ecc.",
    "vibrazioni": false,
    "ototossiche": false
  },
  {
    "tav": "ADDETTO FORKLIFT",
    "nome": "Addetto Forklift",
    "attivita": "Operatore specializzato nella guida di mezzi meccanici per effettuare lo scarico dei conci prefabbricati dal mezzo speciale che li trasporta al piazzale adiacente alla fresa.",
    "vibrazioni": true,
    "ototossiche": false
  },
  {
    "tav": "ADDETTO MULETTO",
    "nome": "Addetto muletto",
    "attivita": "Operatore addetto agli apparati di sollevamento utilizzati per la movimentazione di materiali stoccati sul piazzale, in approvvigionamento alla galleria.",
    "vibrazioni": true,
    "ototossiche": false
  },
  {
    "tav": "CAPO MAGAZZINO TBM/ADDETTO MAGAZZINO",
    "nome": "Capo magazzino TBM/Addetto magazzino",
    "attivita": "Figura preposta alla gestione e supervisione del magazzino. Il magazziniere non è mai a contatto diretto con le attività di galleria.",
    "vibrazioni": false,
    "ototossiche": false
  },
  {
    "tav": "OPERATORE TBM – IMPIANTISTA",
    "nome": "Operatore TBM – Impiantista",
    "attivita": "Operatore addetto all’allungamento delle tubazioni idrauliche ed elettriche. Quando non effettua il suo compito principale può aiutare gli altri operatori in lavorazioni nelle zone retrostanti.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "ADDETTO RIPRISTINI/MURATORE",
    "nome": "Addetto ripristini/Muratore",
    "attivita": "Si occupa del ripristino dei conci. Quando non è in TBM svolge operazioni ordinarie in esterno, sul piazzale.",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "AIUTANTE ESTERNO (MANOVALE)",
    "nome": "Aiutante esterno (manovale)",
    "attivita": "Svolge attività ordinarie di piazzale: sistemazione materiali, spostamento/movimentazione materiali di cantiere, ecc.",
    "vibrazioni": false,
    "ototossiche": false
  },
  {
    "tav": "GRUISTA",
    "nome": "Gruista",
    "attivita": "Opera principalmente all’interno della cabina della gru per la movimentazione dei materiali di cantiere.",
    "vibrazioni": true,
    "ototossiche": false
  },
  {
    "tav": "IMPIEGATO TECNICO",
    "nome": "Impiegato tecnico",
    "attivita": "Gli impiegati tecnici svolgono parzialmente le loro attività in cantiere, attraverso sopralluoghi o attività di controllo, in parte in ufficio",
    "vibrazioni": true,
    "ototossiche": true
  },
  {
    "tav": "CAPO CANTIERE",
    "nome": "Capo Cantiere",
    "attivita": "Esegue il coordinamento delle squadre di lavoratori che opera in galleria e sul piazzale.",
    "vibrazioni": false,
    "ototossiche": true
  }
]

export const MACCHINE_XENIA = [
  {
    "tipologia": "TBM 1",
    "marcaModello": "TBM01",
    "alimentazione": "/"
  },
  {
    "tipologia": "Mini-pala",
    "marcaModello": "Bobcat 5510",
    "alimentazione": "Gommato"
  },
  {
    "tipologia": "Sollevatore",
    "marcaModello": "Manitou MT184",
    "alimentazione": "Gommato"
  },
  {
    "tipologia": "Sollevatore",
    "marcaModello": "KALMAR DLG410",
    "alimentazione": "Gommato"
  },
  {
    "tipologia": "MSV",
    "marcaModello": "NDF New Dafang",
    "alimentazione": "Gommato"
  }
]

export const OTTAVE_XENIA = [
  [
    {
      "frequenza": 125,
      "media": 38.1,
      "deviazione": 5.6
    },
    {
      "frequenza": 250,
      "media": 37.3,
      "deviazione": 4.7
    },
    {
      "frequenza": 500,
      "media": 42.7,
      "deviazione": 4.9
    },
    {
      "frequenza": 1000,
      "media": 41.2,
      "deviazione": 5.4
    },
    {
      "frequenza": 2000,
      "media": 39.1,
      "deviazione": 2.7
    },
    {
      "frequenza": 4000,
      "media": 45.3,
      "deviazione": 4.5
    },
    {
      "frequenza": 8000,
      "media": 48.1,
      "deviazione": 4.4
    }
  ],
  [
    {
      "frequenza": 125,
      "media": 26.7,
      "deviazione": 4.1
    },
    {
      "frequenza": 250,
      "media": 23.8,
      "deviazione": 3.8
    },
    {
      "frequenza": 500,
      "media": 24.3,
      "deviazione": 4.0
    },
    {
      "frequenza": 1000,
      "media": 26.4,
      "deviazione": 3.8
    },
    {
      "frequenza": 2000,
      "media": 34.1,
      "deviazione": 4.6
    },
    {
      "frequenza": 4000,
      "media": 41.9,
      "deviazione": 4.4
    },
    {
      "frequenza": 8000,
      "media": 44.3,
      "deviazione": 4.3
    }
  ],
  [
    {
      "frequenza": 125,
      "media": 16.3,
      "deviazione": 5.0
    },
    {
      "frequenza": 250,
      "media": 18.8,
      "deviazione": 3.8
    },
    {
      "frequenza": 500,
      "media": 22.0,
      "deviazione": 3.8
    },
    {
      "frequenza": 1000,
      "media": 26.6,
      "deviazione": 3.4
    },
    {
      "frequenza": 2000,
      "media": 30.6,
      "deviazione": 46.0
    },
    {
      "frequenza": 4000,
      "media": 38.9,
      "deviazione": 3.9
    },
    {
      "frequenza": 8000,
      "media": 4.8,
      "deviazione": 4.7
    }
  ]
]

export const TARATURE_XENIA = [
  {
    "componente": "Fonometro",
    "costruttore": "Larson Davis",
    "modello": "L&D 824",
    "matricola": "2743",
    "certificato": "LAT 146 19484",
    "data_taratura": "2025-03-14"
  },
  {
    "componente": "Microfono",
    "costruttore": "PCB Piezotronics",
    "modello": "L&D 2541",
    "matricola": "8768",
    "certificato": "LAT 146 19484",
    "data_taratura": "2025-03-14"
  },
  {
    "componente": "Preamplificatore",
    "costruttore": "Larson Davis",
    "modello": "L&D PRM 902",
    "matricola": "5704",
    "certificato": "LAT 146 19484",
    "data_taratura": "2025-03-14"
  },
  {
    "componente": "Calibratore",
    "costruttore": "Larson Davis",
    "modello": "L&D CAL200",
    "matricola": "3727",
    "certificato": "LAT 146 19486",
    "data_taratura": "2025-03-14"
  },
  {
    "componente": "Fonometro",
    "costruttore": "Larson Davis",
    "modello": "L&D 824",
    "matricola": "0499",
    "certificato": "LAT 146 19284",
    "data_taratura": "2025-02-13"
  },
  {
    "componente": "Microfono",
    "costruttore": "PCB Piezotronics",
    "modello": "L&D 2541",
    "matricola": "5875",
    "certificato": "LAT 146 19284",
    "data_taratura": "2025-02-13"
  },
  {
    "componente": "Preamplificatore",
    "costruttore": "Larson Davis",
    "modello": "L&D PRM 902",
    "matricola": "0867",
    "certificato": "LAT 146 19284",
    "data_taratura": "2025-02-13"
  },
  {
    "componente": "Calibratore",
    "costruttore": "Larson Davis",
    "modello": "L&D CAL200",
    "matricola": "2070",
    "certificato": "LAT 146 19285",
    "data_taratura": "2025-02-13"
  }
]

export const RILIEVI_XENIA = [
  {
    "codice": "1",
    "fase": "Gestione impianto calce esterno",
    "postazione": "In prossimità delle pompe",
    "laeq": 86.2,
    "lceq": 90.5,
    "lpeak": 106.6,
    "macchine": "Impianto calce",
    "note": "\\"
  },
  {
    "codice": "2",
    "fase": "Gestione impianto calce esterno",
    "postazione": "In prossimità del miscelatore",
    "laeq": 78.8,
    "lceq": 88.5,
    "lpeak": 102.1,
    "macchine": "Impianto calce",
    "note": "\\"
  },
  {
    "codice": "3",
    "fase": "Gestione magazzino",
    "postazione": "Interno magazzino",
    "laeq": 55.9,
    "lceq": 69.8,
    "lpeak": 91.2,
    "macchine": "\\",
    "note": "Porta aperta e transito mezzi"
  },
  {
    "codice": "4",
    "fase": "Attività ordinaria di officina",
    "postazione": "Interno officina",
    "laeq": 66.5,
    "lceq": 75.3,
    "lpeak": 95.3,
    "macchine": "\\",
    "note": ""
  },
  {
    "codice": "5",
    "fase": "Gestione impianto di ingrassaggio",
    "postazione": "In prossimità della lavorazione",
    "laeq": 88.8,
    "lceq": 91.5,
    "lpeak": 113.5,
    "macchine": "Impianto di ingrassaggio; TBM01; Impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "6",
    "fase": "Avanzamento TBM",
    "postazione": "Zona limitrofe a coclea",
    "laeq": 83.6,
    "lceq": 89.3,
    "lpeak": 111.3,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "Stessa postazione ma senza sfiato"
  },
  {
    "codice": "7",
    "fase": "Pilotaggio TBM",
    "postazione": "Interno cabina d'operazione",
    "laeq": 75.1,
    "lceq": 78.1,
    "lpeak": 90.5,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "Voci del personale di sottofondo"
  },
  {
    "codice": "8",
    "fase": "Manutenzione ordinaria",
    "postazione": "Banco elettricisti",
    "laeq": 90.2,
    "lceq": 93.2,
    "lpeak": 114.4,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "9",
    "fase": "Controllo/Ispezione nastro trasportatore",
    "postazione": "In prossimità della lavorazione",
    "laeq": 83.8,
    "lceq": 91.1,
    "lpeak": 107.8,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "10",
    "fase": "Ripristino piste di cantiere",
    "postazione": "Iterno cabina mini-pala",
    "laeq": 79.7,
    "lceq": 84.6,
    "lpeak": 104.6,
    "macchine": "Mini-pala Bobcat 5510",
    "note": "\\"
  },
  {
    "codice": "11",
    "fase": "Attività ordinarie in TBM",
    "postazione": "Primo piano TBM",
    "laeq": 83.2,
    "lceq": 92.4,
    "lpeak": 102.3,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "12",
    "fase": "Trasporto conci",
    "postazione": "Interno cabina MSV",
    "laeq": 83.0,
    "lceq": 92.8,
    "lpeak": 104.7,
    "macchine": "NDF New Dafang",
    "note": "\\"
  },
  {
    "codice": "13",
    "fase": "Gestione impianto malta interno",
    "postazione": "In prossimità della lavorazione",
    "laeq": 84.2,
    "lceq": 91.4,
    "lpeak": 110.8,
    "macchine": "Impianto malta; TBM1; Impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "14",
    "fase": "Pulizia fondoscudo",
    "postazione": "In prossimità della lavorazione",
    "laeq": 87.7,
    "lceq": 97.8,
    "lpeak": 114.8,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "15",
    "fase": "Attività ordinaria sul piazzale",
    "postazione": "A terra",
    "laeq": 78.2,
    "lceq": 84.2,
    "lpeak": 91.0,
    "macchine": "Vari mezzi",
    "note": "\\"
  },
  {
    "codice": "16",
    "fase": "Movimentazione conci",
    "postazione": "Interno cabina Forklift",
    "laeq": 74.2,
    "lceq": 80.2,
    "lpeak": 88.3,
    "macchine": "KALMAR DLG410",
    "note": "\\"
  },
  {
    "codice": "17",
    "fase": "Movimentazione materiali",
    "postazione": "Interno cabina sollevatore",
    "laeq": 73.4,
    "lceq": 79.7,
    "lpeak": 84.6,
    "macchine": "Manitou MT184",
    "note": "\\"
  },
  {
    "codice": "18",
    "fase": "Montaggio anello",
    "postazione": "Zona superiore erettore",
    "laeq": 85.6,
    "lceq": 95.2,
    "lpeak": 108.2,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "19",
    "fase": "Montaggio anello",
    "postazione": "Zona inferiore erettore",
    "laeq": 87.3,
    "lceq": 97.2,
    "lpeak": 107.5,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "20",
    "fase": "Movimentazione materiali",
    "postazione": "Interno cabina mini-pala",
    "laeq": 85.7,
    "lceq": 96.8,
    "lpeak": 107.2,
    "macchine": "Mini-pala Bobcat 5510",
    "note": "\\"
  },
  {
    "codice": "21",
    "fase": "Manutenzione ordinaria",
    "postazione": "Banco meccanico",
    "laeq": 87.5,
    "lceq": 90.4,
    "lpeak": 112.7,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  },
  {
    "codice": "22",
    "fase": "Interventi di manutenzione",
    "postazione": "In prossimità della lavorazione",
    "laeq": 81.5,
    "lceq": 93.5,
    "lpeak": 104.7,
    "macchine": "TBM01; impianto di ventilazione",
    "note": "\\"
  }
]

export const IMPULSIVI_XENIA = [
  {
    "zona": "Zona limitrofe alla coclea",
    "componente": "Sfiato pneumatico",
    "lpeak": 121.9
  }
]

