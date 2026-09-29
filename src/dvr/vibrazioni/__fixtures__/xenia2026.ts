/** Dati del DVR Vibrazioni Xenia 2026 (TBM1): TAV WBV e HAV, rapporti di prova, valori medi. */
import type { PeriodoVibrazione } from '../calcolo'

export interface MansioneXeniaVib {
  nome: string
  attivita: string
  wbv: PeriodoVibrazione[]
  hav: PeriodoVibrazione[]
  documento: { wbv: { a8: number; esposizione: number } | null; hav: { a8: number; esposizione: number } | null }
}

export const MANSIONI_VIB_XENIA: MansioneXeniaVib[] = [
  {
    "nome": "Capo Turno",
    "attivita": "Esegue attività di direzione, coordinamento e gestione delle operazioni in galleria. È abilitato alla guida dei mezzi d’opera.",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.23,
        "esposizione": 0.27
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Caposquadra TBM",
    "attivita": "Esegue attività di coordinamento dell’intera squadra di lavoratori che opera in galleria",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [],
    "documento": {
      "wbv": {
        "a8": 0.23,
        "esposizione": 0.27
      },
      "hav": null
    }
  },
  {
    "nome": "Operatore TBM – Aiuto montaggio anelli",
    "attivita": "Figura specializzata nell’assistenza agli erettoristi. Quando non impiegato in tale lavorazione, svolge attività ordinarie in TBM.",
    "wbv": [
      {
        "minuti": 30,
        "fase": "Zona superiore erettore",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.32,
        "origine": "misura"
      },
      {
        "minuti": 30,
        "fase": "Zona inferiore erettore",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.34,
        "origine": "misura"
      },
      {
        "minuti": 20,
        "fase": "Avanzamento TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.25,
        "origine": "misura"
      },
      {
        "minuti": 385,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.24,
        "esposizione": 0.29
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore TBM – Erettorista/Aiuto erettorista",
    "attivita": "Figura specializzata nella posa dei conci prefabbricati che costituiscono il rivestimento definitivo della galleria. Guida l’erettore, macchina che solleva i conci e li posiziona nella loro sede prestabilita. Durante lo scavo può aiutare gli altri operatori in lavorazioni nelle zone retrostanti",
    "wbv": [
      {
        "minuti": 30,
        "fase": "Zona superiore erettore",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.32,
        "origine": "misura"
      },
      {
        "minuti": 30,
        "fase": "Zona inferiore erettore",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.34,
        "origine": "misura"
      },
      {
        "minuti": 20,
        "fase": "Avanzamento TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.25,
        "origine": "misura"
      },
      {
        "minuti": 385,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.24,
        "esposizione": 0.29
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore TBM – Impiantista",
    "attivita": "Operatore addetto all’allungamento delle tubazioni idrauliche ed elettriche. Quando non effettua il suo compito principale può aiutare gli altri operatori in lavorazioni nelle zone retrostanti.",
    "wbv": [
      {
        "minuti": 165,
        "fase": "Allungamento tubi di servizi",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.22,
        "origine": "misura"
      },
      {
        "minuti": 30,
        "fase": "Manutenzione - Banco meccanici",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.24,
        "origine": "misura"
      },
      {
        "minuti": 30,
        "fase": "Manutenzione - Banco elettricisti",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.31,
        "origine": "misura"
      },
      {
        "minuti": 120,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 120,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.2,
        "esposizione": 0.24
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore TBM – Addetto iniezioni malta/Pompista/Addetto getto invert",
    "attivita": "Operatore addetto alla posa della malta cementizia iniettata a tergo del rivestimento definitivo (conci prefabbricati)",
    "wbv": [
      {
        "minuti": 120,
        "fase": "Iniezione malta cementizia",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.28,
        "origine": "misura"
      },
      {
        "minuti": 120,
        "fase": "Gestione impianto malta interno",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.24,
        "origine": "misura"
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.24,
        "esposizione": 0.29
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore astronave/Aiuto operatore astronave",
    "attivita": "Operatore addetto all’utilizzo dell’astronave e al controllo durante l’attività di movimentazione dei conci. I conci vengono trasferiti dal MSV all’astronave, che li trasporta verso l’erettorista.",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Pilotaggio TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.22,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.22,
        "esposizione": 0.26
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore MSV",
    "attivita": "Operatore addetto alla guida di mezzi speciali (MSV) per il trasporto dei conci prefabbricati dal piazzale esterno all’interno della galleria.",
    "wbv": [
      {
        "minuti": 60,
        "fase": "Trasporto conci",
        "dettaglio": "basso",
        "macchina": "MSV NDF New Dafang",
        "a": 0.07,
        "origine": "misura"
      },
      {
        "minuti": 340,
        "fase": "Trasporto conci",
        "dettaglio": "alto",
        "macchina": "MSV NDF New Dafang",
        "a": 0.64,
        "origine": "misura"
      },
      {
        "minuti": 65,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.54,
        "esposizione": 0.65
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore TBM – Elettricista TBM/Aiuto elettricista TBM",
    "attivita": "Operatore addetto alle manutenzioni o riparazioni elettriche da effettuarsi all’interno della fresa. Si occupa anche delle nuove installazioni di punti luce, allungamento utenze elettriche.",
    "wbv": [
      {
        "minuti": 120,
        "fase": "Interventi di manutenzione in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.27,
        "origine": "misura"
      },
      {
        "minuti": 120,
        "fase": "Manutenzione - Banco elettricisti",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.31,
        "origine": "misura"
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 30,
        "fase": "Manutenzione",
        "dettaglio": "",
        "macchina": "Avvitatore",
        "a": 4.86,
        "origine": "misura"
      },
      {
        "minuti": 30,
        "fase": "Manutenzione",
        "dettaglio": "",
        "macchina": "Avvitatore",
        "a": 4.8,
        "origine": "misura"
      },
      {
        "minuti": 405,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.26,
        "esposizione": 0.31
      },
      "hav": {
        "a8": 1.71,
        "esposizione": 2.05
      }
    }
  },
  {
    "nome": "Operatore TBM – Meccanico TBM/Aiuto meccanico TBM",
    "attivita": "Operatore addetto alle manutenzioni o riparazioni meccaniche da effettuarsi all’interno della fresa. Si occupa anche dei reintegri degli oli e dei grassi necessari al corretto funzionamento di tutti i componenti della fresa",
    "wbv": [
      {
        "minuti": 120,
        "fase": "Manutenzione - Banco meccanici",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.24,
        "origine": "misura"
      },
      {
        "minuti": 120,
        "fase": "Gestione impianto ingrassaggio",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.24,
        "origine": "misura"
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 30,
        "fase": "Manutenzione",
        "dettaglio": "",
        "macchina": "Avvitatore",
        "a": 4.86,
        "origine": "misura"
      },
      {
        "minuti": 30,
        "fase": "Manutenzione",
        "dettaglio": "",
        "macchina": "Avvitatore",
        "a": 4.8,
        "origine": "misura"
      },
      {
        "minuti": 405,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.23,
        "esposizione": 0.28
      },
      "hav": {
        "a8": 1.71,
        "esposizione": 2.05
      }
    }
  },
  {
    "nome": "Impiegato tecnico",
    "attivita": "Gli impiegati tecnici svolgono parzialmente le loro attività in cantiere, attraverso sopralluoghi o attività di controllo, in parte in ufficio",
    "wbv": [
      {
        "minuti": 60,
        "fase": "Sopralluoghi in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.34,
        "origine": "misura"
      },
      {
        "minuti": 405,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.12,
        "esposizione": 0.14
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Capo piazzale TBM",
    "attivita": "Figura specializzata nella gestione di tutte le operazioni svolte nel piazzale della fresa. Coordina la squadra di operai per gli approvvigionamenti necessari al corretto funzionamento della fresa",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.01,
        "esposizione": 0.01
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Addetto Forklift",
    "attivita": "Operatore specializzato nella guida di mezzi meccanici per effettuare lo scarico dei conci prefabbricati dal mezzo speciale che li trasporta al piazzale adiacente alla fresa.",
    "wbv": [
      {
        "minuti": 65,
        "fase": "Movimentazione conci",
        "dettaglio": "basso",
        "macchina": "Sollevatore KALMAR DLG410",
        "a": 0.06,
        "origine": "misura"
      },
      {
        "minuti": 400,
        "fase": "Movimentazione conci",
        "dettaglio": "alto",
        "macchina": "Sollevatore KALMAR DLG410",
        "a": 0.81,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.74,
        "esposizione": 0.89
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore TBM – Saldatore",
    "attivita": "Operatore addetto alle attività di saldatura/taglio di parti metalliche in TBM",
    "wbv": [
      {
        "minuti": 240,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 225,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.16,
        "esposizione": 0.19
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Saldatore – Aiutante saldatore",
    "attivita": "Operatore addetto alle attività di saldatura/taglio di parti metalliche in officina.",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.01,
        "esposizione": 0.01
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Gruista",
    "attivita": "Opera principalmente all’interno della cabina della gru per la movimentazione dei materiali di cantiere.",
    "wbv": [
      {
        "minuti": 220,
        "fase": "Movimentazione materiali",
        "dettaglio": "basso",
        "macchina": "Gru",
        "a": 0.1,
        "origine": "storico"
      },
      {
        "minuti": 220,
        "fase": "Movimentazione materiali",
        "dettaglio": "alto",
        "macchina": "Gru",
        "a": 0.4,
        "origine": "storico"
      },
      {
        "minuti": 25,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.28,
        "esposizione": 0.33
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Addetto muletto",
    "attivita": "Operatore addetto agli apparati di sollevamento utilizzati per la movimentazione di materiali stoccati sul piazzale, in approvvigionamento alla galleria.",
    "wbv": [
      {
        "minuti": 30,
        "fase": "Movimentazione materiali",
        "dettaglio": "basso",
        "macchina": "Sollevatore Manitou MT184",
        "a": 0.09,
        "origine": "misura"
      },
      {
        "minuti": 190,
        "fase": "Movimentazione materiali",
        "dettaglio": "alto",
        "macchina": "Sollevatore Manitou MT184",
        "a": 0.2,
        "origine": "misura"
      },
      {
        "minuti": 30,
        "fase": "Ripristino piste di cantiere/Movimentazione materiali",
        "dettaglio": "basso",
        "macchina": "Mini-pala Bobcat",
        "a": 0.09,
        "origine": "misura"
      },
      {
        "minuti": 190,
        "fase": "Ripristino piste di cantiere/Movimentazione materiali",
        "dettaglio": "alto",
        "macchina": "Mini-pala Bobcat",
        "a": 0.35,
        "origine": "misura"
      },
      {
        "minuti": 25,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.26,
        "esposizione": 0.31
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Capo magazzino TBM/Addetto magazzino",
    "attivita": "Figura preposta alla gestione e supervisione del magazzino. Il magazziniere non è mai a contatto diretto con le attività di galleria.",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.01,
        "esposizione": 0.01
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Addetto ripristini/Muratore",
    "attivita": "Si occupa del ripristino dei conci. Quando non è in TBM svolge operazioni ordinarie in esterno, sul piazzale.",
    "wbv": [
      {
        "minuti": 120,
        "fase": "Zona superiore erettore",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.32,
        "origine": "misura"
      },
      {
        "minuti": 120,
        "fase": "Zona inferiore erettore",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.34,
        "origine": "misura"
      },
      {
        "minuti": 120,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 105,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.26,
        "esposizione": 0.31
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Aiutante esterno (manovale)",
    "attivita": "Svolge attività ordinarie di piazzale: sistemazione materiali, spostamento/movimentazione materiali di cantiere, ecc.",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.01,
        "esposizione": 0.01
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Addetto piazzale TBM",
    "attivita": "Svolge attività ordinarie di piazzale: sistemazione materiali, spostamento/movimentazione materiali di cantiere, ecc.",
    "wbv": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.01,
        "esposizione": 0.01
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Operatore TBM – Addetto fondoscudo",
    "attivita": "Effettua la pulizia dello scudo utilizzando una lancia con acqua ad alta pressione",
    "wbv": [
      {
        "minuti": 120,
        "fase": "Pulizia fondoscudo",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.31,
        "origine": "misura"
      },
      {
        "minuti": 345,
        "fase": "Attività ordinarie in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.23,
        "origine": "misura"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.25,
        "esposizione": 0.3
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  },
  {
    "nome": "Capo Cantiere",
    "attivita": "Esegue il coordinamento delle squadre di lavoratori che opera in galleria e sul piazzale.",
    "wbv": [
      {
        "minuti": 60,
        "fase": "Sopralluoghi in TBM",
        "dettaglio": "basso",
        "macchina": "TBM01",
        "a": 0.34,
        "origine": "misura"
      },
      {
        "minuti": 405,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "hav": [
      {
        "minuti": 465,
        "fase": "Operazioni a terra",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      },
      {
        "minuti": 15,
        "fase": "Pausa fisiologica",
        "dettaglio": "",
        "macchina": "",
        "a": 0.01,
        "origine": "convenzionale"
      }
    ],
    "documento": {
      "wbv": {
        "a8": 0.12,
        "esposizione": 0.14
      },
      "hav": {
        "a8": 0.01,
        "esposizione": 0.01
      }
    }
  }
]

export const RILIEVI_VIB_XENIA = [
  {
    "codice": "VCI1",
    "tipo": "wbv",
    "macchina": "TBM01",
    "posizione": "in piedi",
    "fase": "Movimentazione materiali",
    "dettaglio": "basso",
    "a": 0.42,
    "asse": "X",
    "note": "Ingresso TBM"
  },
  {
    "codice": "VCI2",
    "tipo": "wbv",
    "macchina": "TBM01",
    "posizione": "in piedi",
    "fase": "Gestione impianto ingrassaggio",
    "dettaglio": "basso",
    "a": 0.24,
    "asse": "X",
    "note": "Zona impianto di ingrassaggio"
  },
  {
    "codice": "VCI3",
    "tipo": "wbv",
    "macchina": "TBM01",
    "posizione": "in piedi",
    "fase": "Manutenzione",
    "dettaglio": "basso",
    "a": 0.45,
    "asse": "X",
    "note": "Banco meccanico"
  },
  {
    "codice": "VCI4",
    "tipo": "wbv",
    "macchina": "TBM01",
    "posizione": "in piedi",
    "fase": "Attività ordinarie in TBM",
    "dettaglio": "basso",
    "a": 0.23,
    "asse": "Z",
    "note": "Zona antistante coclea"
  },
  {
    "codice": "VCI5",
    "tipo": "wbv",
    "macchina": "TBM01",
    "posizione": "in piedi",
    "fase": "Pilotaggio TBM",
    "dettaglio": "basso",
    "a": 0.22,
    "asse": "X",
    "note": "Interno cabina d'operazione"
  },
  {
    "codice": "VCI6",
    "tipo": "wbv",
    "macchina": "TBM01",
    "posizione": "in piedi",
    "fase": "Manutenzione",
    "dettaglio": "basso",
    "a": 0.66,
    "asse": "Z",
    "note": "Banco elettricisti"
  },
  {
    "codice": "VCI7",
    "tipo": "wbv",
    "macchina": "TBM01",
    "posizione": "in piedi",
    "fase": "Pausa",
    "dettaglio": "basso",
    "a": 0.77,
    "asse": "X",
    "note": "Area relax"
  },
  {
    "codice": "VCI8",
    "tipo": "wbv",
    "macchina": "Sollevatore KALMAR DLG410",
    "posizione": "seduto",
    "fase": "Movimentazione conci",
    "dettaglio": "basso",
    "a": 0.06,
    "asse": "X",
    "note": "\\"
  },
  {
    "codice": "VCI9",
    "tipo": "wbv",
    "macchina": "Sollevatore KALMAR DLG410",
    "posizione": "seduto",
    "fase": "Movimentazione conci",
    "dettaglio": "alto",
    "a": 0.68,
    "asse": "Y",
    "note": "\\"
  },
  {
    "codice": "VCI10",
    "tipo": "wbv",
    "macchina": "Sollevatore KALMAR DLG410",
    "posizione": "seduto",
    "fase": "Movimentazione conci",
    "dettaglio": "alto",
    "a": 0.52,
    "asse": "Z",
    "note": "\\"
  },
  {
    "codice": "VCI11",
    "tipo": "wbv",
    "macchina": "Sollevatore KALMAR DLG410",
    "posizione": "seduto",
    "fase": "Movimentazione conci",
    "dettaglio": "alto",
    "a": 0.84,
    "asse": "Z",
    "note": "\\"
  },
  {
    "codice": "VCI12",
    "tipo": "wbv",
    "macchina": "Sollevatore Manitou MT184",
    "posizione": "seduto",
    "fase": "Movimentazione materiali",
    "dettaglio": "basso",
    "a": 0.09,
    "asse": "X",
    "note": "\\"
  },
  {
    "codice": "VCI13",
    "tipo": "wbv",
    "macchina": "Sollevatore Manitou MT184",
    "posizione": "seduto",
    "fase": "Movimentazione materiali",
    "dettaglio": "alto",
    "a": 0.15,
    "asse": "Y",
    "note": "\\"
  },
  {
    "codice": "VCI14",
    "tipo": "wbv",
    "macchina": "Sollevatore Manitou MT184",
    "posizione": "seduto",
    "fase": "Movimentazione materiali",
    "dettaglio": "alto",
    "a": 0.19,
    "asse": "X",
    "note": "\\"
  },
  {
    "codice": "VCI15",
    "tipo": "wbv",
    "macchina": "Sollevatore Manitou MT184",
    "posizione": "seduto",
    "fase": "Movimentazione materiali",
    "dettaglio": "alto",
    "a": 0.19,
    "asse": "Z",
    "note": "\\"
  },
  {
    "codice": "VCI16",
    "tipo": "wbv",
    "macchina": "MSV NDF New Dafang",
    "posizione": "seduto",
    "fase": "Trasporto conci",
    "dettaglio": "basso",
    "a": 0.07,
    "asse": "Y",
    "note": "\\"
  },
  {
    "codice": "VCI17",
    "tipo": "wbv",
    "macchina": "MSV NDF New Dafang",
    "posizione": "seduto",
    "fase": "Trasporto conci",
    "dettaglio": "alto",
    "a": 0.65,
    "asse": "Z",
    "note": "\\"
  },
  {
    "codice": "VCI18",
    "tipo": "wbv",
    "macchina": "MSV NDF New Dafang",
    "posizione": "seduto",
    "fase": "Trasporto conci",
    "dettaglio": "alto",
    "a": 0.59,
    "asse": "Z",
    "note": "\\"
  },
  {
    "codice": "VCI19",
    "tipo": "wbv",
    "macchina": "MSV NDF New Dafang",
    "posizione": "seduto",
    "fase": "Trasporto conci",
    "dettaglio": "alto",
    "a": 0.61,
    "asse": "Z",
    "note": "\\"
  },
  {
    "codice": "VMB1",
    "tipo": "hav",
    "macchina": "Avvitatore",
    "dettaglio": "DX",
    "alimentazione": "Elettrica",
    "fase": "Manutenzione",
    "a": 4.86
  },
  {
    "codice": "VMB2",
    "tipo": "hav",
    "macchina": "Avvitatore",
    "dettaglio": "SX",
    "alimentazione": "Elettrica",
    "fase": "Manutenzione",
    "a": 4.8
  }
] as const

export const VALORI_MEDI_WBV_XENIA = [
  {
    "macchina": "TBM01",
    "fase": "Movimentazione materiali (ingresso TBM)",
    "n": 1,
    "valore": 0.42
  },
  {
    "macchina": "TBM01",
    "fase": "Gestione impianto ingrassaggio",
    "n": 1,
    "valore": 0.24
  },
  {
    "macchina": "TBM01",
    "fase": "Manutenzione (banco meccanico)",
    "n": 1,
    "valore": 0.45
  },
  {
    "macchina": "TBM01",
    "fase": "Attività ordinarie in TBM (zona coclea)",
    "n": 1,
    "valore": 0.23
  },
  {
    "macchina": "TBM01",
    "fase": "Pilotaggio TBM (cabina)",
    "n": 1,
    "valore": 0.22
  },
  {
    "macchina": "TBM01",
    "fase": "Manutenzione (banco elettricisti)",
    "n": 1,
    "valore": 0.66
  },
  {
    "macchina": "TBM01",
    "fase": "Pausa (area relax)",
    "n": 1,
    "valore": 0.77
  },
  {
    "macchina": "Sollevatore KALMAR DLG410",
    "fase": "Movimentazione conci – Basso regime",
    "n": 1,
    "valore": 0.06
  },
  {
    "macchina": "Sollevatore KALMAR DLG410",
    "fase": "Movimentazione conci – Alto regime",
    "n": 3,
    "valore": 0.81
  },
  {
    "macchina": "Sollevatore Manitou MT184",
    "fase": "Movimentazione materiali – Basso regime",
    "n": 1,
    "valore": 0.09
  },
  {
    "macchina": "Sollevatore Manitou MT184",
    "fase": "Movimentazione materiali – Alto regime",
    "n": 3,
    "valore": 0.2
  },
  {
    "macchina": "MSV NDF New Dafang",
    "fase": "Trasporto conci – Basso regime",
    "n": 1,
    "valore": 0.07
  },
  {
    "macchina": "MSV NDF New Dafang",
    "fase": "Trasporto conci – Alto regime",
    "n": 3,
    "valore": 0.64
  }
]
