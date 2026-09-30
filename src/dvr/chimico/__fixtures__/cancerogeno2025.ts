/**
 * Dati del DVR Agenti cancerogeni Castagnola (II semestre 2025): ambienti con le misure (tabella 6) e
 * TAV per mansione (allegato 2). Estratti dal documento: non modificare a mano.
 */
import type { AmbienteChimico, PeriodoChimico } from "../valutazione";

export const AMBIENTI_CANC: (AmbienteChimico & { medie: (number | null)[] })[] =
  [
    {
      id: "c1",
      fase: "Armatura calotta",
      postazione: "-",
      misure: [
        {
          id: "c1m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 1.61,
            silice: 0.152,
            ec: 0.01,
          },
        },
        {
          id: "c1m2",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.8,
            silice: 0.039,
            ec: 0.022,
          },
        },
        {
          id: "c1m3",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.5,
            silice: 0.027,
            ec: 0.039,
          },
        },
        {
          id: "c1m4",
          fronte: "GN14K - bypass",
          avanzamento: 67.0,
          valori: {
            polveri_resp: null,
            silice: null,
            ec: 0.039,
          },
        },
      ],
      medie: [0.97, 0.072, 0.027],
    },
    {
      id: "c2",
      fase: "Attività ordinaria di officina",
      postazione: "-",
      misure: [
        {
          id: "c2m1",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.04,
            silice: 0.01,
            ec: 0.004,
          },
        },
        {
          id: "c2m2",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.14,
            silice: 0.01,
            ec: 0.004,
          },
        },
      ],
      medie: [0.09, 0.055, 0.004],
    },
    {
      id: "c3",
      fase: "Attività ordinaria di piazzale",
      postazione: "-",
      misure: [
        {
          id: "c3m1",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.39,
            silice: 0.042,
            ec: 0.018,
          },
        },
        {
          id: "c3m2",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.17,
            silice: 0.053,
            ec: 0.004,
          },
        },
        {
          id: "c3m3",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: null,
            silice: null,
            ec: 0.006,
          },
        },
      ],
      medie: [0.28, 0.047, 0.009],
    },
    {
      id: "c4",
      fase: "Attività ordinaria di galleria",
      postazione: "-",
      misure: [
        {
          id: "c4m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.32,
            silice: 0.012,
            ec: 0.02,
          },
        },
        {
          id: "c4m2",
          fronte: "Camerone",
          avanzamento: null,
          valori: {
            polveri_resp: 0.52,
            silice: 0.073,
            ec: 0.022,
          },
        },
      ],
      medie: [0.42, 0.042, 0.021],
    },
    {
      id: "c5",
      fase: "Bagnature piste di cantiere",
      postazione: "Interno cabina autobotte",
      misure: [
        {
          id: "c5m1",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.36,
            silice: 0.015,
            ec: 0.005,
          },
        },
      ],
      medie: [0.36, 0.015, 0.005],
    },
    {
      id: "c6",
      fase: "Carpenteria",
      postazione: "-",
      misure: [
        {
          id: "c6m1",
          fronte: "GN15K",
          avanzamento: 33.0,
          valori: {
            polveri_resp: 0.65,
            silice: 0.01,
            ec: 0.028,
          },
        },
        {
          id: "c6m2",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.92,
            silice: 0.014,
            ec: 0.011,
          },
        },
        {
          id: "c6m3",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 1.06,
            silice: 0.026,
            ec: 0.037,
          },
        },
        {
          id: "c6m4",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.28,
            silice: 0.016,
            ec: 0.012,
          },
        },
        {
          id: "c6m5",
          fronte: "GN15K",
          avanzamento: 33.0,
          valori: {
            polveri_resp: 0.04,
            silice: 0.01,
            ec: 0.019,
          },
        },
        {
          id: "c6m6",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 1.05,
            silice: 0.095,
            ec: 0.01,
          },
        },
      ],
      medie: [0.73, 0.041, 0.019],
    },
    {
      id: "c7",
      fase: "Consolidamento del fronte",
      postazione: "A terra",
      misure: [
        {
          id: "c7m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.61,
            silice: 0.012,
            ec: 0.022,
          },
        },
      ],
      medie: [0.61, 0.012, 0.022],
    },
    {
      id: "c8",
      fase: "Gestione impianto depurazione acque",
      postazione: "Interno cabina",
      misure: [
        {
          id: "c8m1",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.33,
            silice: 0.015,
            ec: 0.005,
          },
        },
        {
          id: "c8m2",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.06,
            silice: 0.01,
            ec: 0.004,
          },
        },
        {
          id: "c8m3",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.38,
            silice: 0.01,
            ec: 0.005,
          },
        },
        {
          id: "c8m4",
          fronte: "-",
          avanzamento: null,
          valori: {
            polveri_resp: 0.14,
            silice: 0.01,
            ec: 0.004,
          },
        },
      ],
      medie: [0.23, 0.011, 0.004],
    },
    {
      id: "c9",
      fase: "Getto arco rovescio",
      postazione: "-",
      misure: [
        {
          id: "c9m1",
          fronte: "GN14K-bypass",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.56,
            silice: 0.01,
            ec: 0.034,
          },
        },
        {
          id: "c9m2",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.08,
            silice: 0.023,
            ec: 0.021,
          },
        },
      ],
      medie: [0.32, 0.016, 0.027],
    },
    {
      id: "c10",
      fase: "Impermeabilizzazione calotta",
      postazione: "-",
      misure: [
        {
          id: "c10m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 1.06,
            silice: 0.13,
            ec: 0.023,
          },
        },
      ],
      medie: [1.06, 0.13, 0.023],
    },
    {
      id: "c11",
      fase: "Manutenzione mezzi in galleria",
      postazione: "-",
      misure: [
        {
          id: "c11m1",
          fronte: "Camerone",
          avanzamento: null,
          valori: {
            polveri_resp: 0.42,
            silice: 0.008,
            ec: 0.026,
          },
        },
        {
          id: "c11m2",
          fronte: "Camerone",
          avanzamento: null,
          valori: {
            polveri_resp: 0.55,
            silice: 0.045,
            ec: 0.022,
          },
        },
      ],
      medie: [0.48, 0.03, 0.024],
    },
    {
      id: "c12",
      fase: "Manutenzione mezzi in officina",
      postazione: "-",
      misure: [
        {
          id: "c12m1",
          fronte: "Officina meccanica",
          avanzamento: null,
          valori: {
            polveri_resp: 0.08,
            silice: 0.01,
            ec: 0.004,
          },
        },
        {
          id: "c12m2",
          fronte: "Officina meccanica",
          avanzamento: null,
          valori: {
            polveri_resp: 0.7,
            silice: 0.018,
            ec: 0.012,
          },
        },
      ],
      medie: [0.39, 0.014, 0.008],
    },
    {
      id: "c13",
      fase: "Movimentazione materiali",
      postazione: "Interno cabina sollevatore",
      misure: [
        {
          id: "c13m1",
          fronte: "Bypass GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 1.27,
            silice: 0.018,
            ec: 0.039,
          },
        },
      ],
      medie: [1.27, 0.018, 0.039],
    },
    {
      id: "c14",
      fase: "Posa centina",
      postazione: "A terra",
      misure: [
        {
          id: "c14m1",
          fronte: "GN14M",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.42,
            silice: 0.014,
            ec: 0.006,
          },
        },
        {
          id: "c14m2",
          fronte: "GN14M",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.55,
            silice: 0.008,
            ec: 0.01,
          },
        },
        {
          id: "c14m3",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.18,
            silice: 0.034,
            ec: 0.017,
          },
        },
      ],
      medie: [0.33, 0.031, 0.01],
    },
    {
      id: "c15",
      fase: "Posa centina",
      postazione: "Interno cabina sollevatore",
      misure: [
        {
          id: "c15m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.16,
            silice: 0.069,
            ec: 0.008,
          },
        },
        {
          id: "c15m2",
          fronte: "GN14M",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.14,
            silice: 0.009,
            ec: 0.021,
          },
        },
      ],
      medie: [0.15, 0.039, 0.014],
    },
    {
      id: "c16",
      fase: "Posa centina",
      postazione: "Interno cabina escavatore",
      misure: [
        {
          id: "c16m1",
          fronte: "GN14M",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.58,
            silice: 0.009,
            ec: 0.005,
          },
        },
      ],
      medie: [0.58, 0.009, 0.005],
    },
    {
      id: "c17",
      fase: "Pre-spritz/Spritz",
      postazione: "-",
      misure: [
        {
          id: "c17m1",
          fronte: "GN15K",
          avanzamento: 33.0,
          valori: {
            polveri_resp: 0.22,
            silice: 0.03,
            ec: 0.006,
          },
        },
      ],
      medie: [0.22, 0.03, 0.006],
    },
    {
      id: "c18",
      fase: "Scavo",
      postazione: "A terra",
      misure: [
        {
          id: "c18m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.68,
            silice: 0.018,
            ec: 0.021,
          },
        },
        {
          id: "c18m2",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 2.91,
            silice: 0.021,
            ec: 0.096,
          },
        },
        {
          id: "c18m3",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.1,
            silice: 0.01,
            ec: 0.014,
          },
        },
      ],
      medie: [1.23, 0.016, 0.044],
    },
    {
      id: "c19",
      fase: "Scavo",
      postazione: "Interno cabina escavatore",
      misure: [
        {
          id: "c19m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.7,
            silice: 0.015,
            ec: 0.02,
          },
        },
        {
          id: "c19m2",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.3,
            silice: 0.016,
            ec: 0.015,
          },
        },
        {
          id: "c19m3",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.2,
            silice: 0.01,
            ec: 0.005,
          },
        },
      ],
      medie: [0.4, 0.014, 0.013],
    },
    {
      id: "c20",
      fase: "Smarino",
      postazione: "A terra",
      misure: [
        {
          id: "c20m1",
          fronte: "GN15K",
          avanzamento: 33.0,
          valori: {
            polveri_resp: 0.63,
            silice: 0.01,
            ec: 0.014,
          },
        },
        {
          id: "c20m2",
          fronte: "GN15K",
          avanzamento: 33.0,
          valori: {
            polveri_resp: 0.2,
            silice: 0.01,
            ec: 0.004,
          },
        },
        {
          id: "c20m3",
          fronte: "GN15K",
          avanzamento: 33.0,
          valori: {
            polveri_resp: 0.52,
            silice: 0.015,
            ec: 0.023,
          },
        },
        {
          id: "c20m4",
          fronte: "GN15K",
          avanzamento: 33.0,
          valori: {
            polveri_resp: 0.28,
            silice: 0.01,
            ec: 0.014,
          },
        },
      ],
      medie: [0.41, 0.011, 0.014],
    },
    {
      id: "c21",
      fase: "Smarino",
      postazione: "Interno cabina pala",
      misure: [
        {
          id: "c21m1",
          fronte: "GN14K",
          avanzamento: 67.0,
          valori: {
            polveri_resp: 0.29,
            silice: 0.027,
            ec: 0.005,
          },
        },
        {
          id: "c21m2",
          fronte: "Camerone",
          avanzamento: null,
          valori: {
            polveri_resp: 0.24,
            silice: 0.02,
            ec: 0.018,
          },
        },
        {
          id: "c21m3",
          fronte: "Camerone",
          avanzamento: null,
          valori: {
            polveri_resp: 0.09,
            silice: 0.015,
            ec: 0.003,
          },
        },
      ],
      medie: [0.21, 0.021, 0.009],
    },
  ];

export const TAV_CANC: {
  nome: string;
  periodi: PeriodoChimico[];
  totale: Record<string, number | null>;
}[] = [
  {
    nome: "CAPOSQUADRA/MINATORE",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 35,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.024,
    },
  },
  {
    nome: "Autista/Minatore/Gruista",
    periodi: [
      {
        fase: "Consolidamento del fronte*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Scavo",
        minuti: 55,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 30,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 20,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione materiali",
        minuti: 60,
        concentrazioni: {
          ec: 0.039,
          silice: 0.018,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 35,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
      },
    ],
    totale: {
      ec: 0.018,
      silice: 0.02,
    },
  },
  {
    nome: "OPERATORE MACCHINE",
    periodi: [
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 15,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 10,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Movimentzione inerti *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 130,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.009,
      silice: 0.023,
    },
  },
  {
    nome: "JUMBISTA/MINATORE",
    periodi: [
      {
        fase: "Perforazione del fronte*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "Interno cabina Jumbo",
      },
      {
        fase: "Sistemazione del fronte per la volata*",
        minuti: 40,
        concentrazioni: {
          ec: 0.004,
          silice: 0.043,
        },
        postazione: "In prossimità della lavorazione",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 25,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.014,
      silice: 0.022,
    },
  },
  {
    nome: "Autista/Minatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 10,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Consolidamento del fronte*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 30,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 10,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.015,
      silice: 0.02,
    },
  },
  {
    nome: "Lancista/Autista/Minatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 20,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Consolidamento del fronte*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 20,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 10,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.021,
    },
  },
  {
    nome: "Lancista/Mulettista",
    periodi: [
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno piattaforma PLE",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 20,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentzione inerti *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 195,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 30,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.009,
      silice: 0.032,
    },
  },
  {
    nome: "Escavatorista/Palista",
    periodi: [
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino piste di cantiere*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Interno cabina pala",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 180,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.009,
      silice: 0.026,
    },
  },
  {
    nome: "Escavatorista/Palista/Mulettista",
    periodi: [
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Smarino",
        minuti: 30,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 30,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 180,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino piste di cantiere*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.014,
          silice: 0.039,
        },
        postazione: "Interno cabina sollevatore",
      },
    ],
    totale: {
      ec: 0.01,
      silice: 0.027,
    },
  },
  {
    nome: "Autista/Minatore/Mulettista",
    periodi: [
      {
        fase: "Consolidamento del fronte*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.014,
          silice: 0.039,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 30,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 20,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.023,
    },
  },
  {
    nome: "Minatore/Caposquadra/Lancista",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 30,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 25,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 10,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.02,
    },
  },
  {
    nome: "Escavatorista/Palista/Lancista",
    periodi: [
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 25,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 185,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.014,
      silice: 0.026,
    },
  },
  {
    nome: "Lancista/Autista/Mulettista",
    periodi: [
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Consolidamento del fronte*",
        minuti: 35,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.014,
          silice: 0.039,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 30,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentzione inerti *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 120,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.028,
    },
  },
  {
    nome: "Aiuto Lancista/Minatore",
    periodi: [
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Consolidamento del fronte",
        minuti: 30,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 85,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 25,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 20,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 10,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.022,
    },
  },
  {
    nome: "Lancista/Autista",
    periodi: [
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Consolidamento del fronte",
        minuti: 25,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 30,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 220,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.009,
      silice: 0.033,
    },
  },
  {
    nome: "Jumbista/Minatore/Palista/Mulettista/Camionista",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 30,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 20,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Perforazione del fronte*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "Interno cabina Jumbo",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 25,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 20,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.014,
      silice: 0.02,
    },
  },
  {
    nome: "Fochino/Minatore/Gruista",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 30,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 20,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 20,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.014,
          silice: 0.039,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Volata + Sfumo*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.039,
        },
        postazione: "In galleria",
      },
      {
        fase: "Sistemazione del fronte per la volata*",
        minuti: 40,
        concentrazioni: {
          ec: 0.004,
          silice: 0.043,
        },
        postazione: "In prossimità della lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.025,
    },
  },
  {
    nome: "Escavatorista/Autista/Mulettista/Palista",
    periodi: [
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 25,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Consolidamento del fronte*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 30,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 110,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.011,
      silice: 0.021,
    },
  },
  {
    nome: "Escavatorista/Palista/Caposquadra",
    periodi: [
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 40,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 200,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.014,
      silice: 0.026,
    },
  },
  {
    nome: "Minatore/Escavatorista/Palista/Autista",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 25,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Consolidamento del fronte*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.009,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 10,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.01,
      silice: 0.019,
    },
  },
  {
    nome: "Palista/Autista/Minatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 30,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Consolidamento del fronte*",
        minuti: 25,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno cabina autobetoniera",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 15,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 25,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.022,
    },
  },
  {
    nome: "Fochino/Minatore/Mulettista/Autista",
    periodi: [
      {
        fase: "Volata + Sfumo*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.039,
        },
        postazione: "In galleria",
      },
      {
        fase: "Sistemazione del fronte per la volata*",
        minuti: 40,
        concentrazioni: {
          ec: 0.004,
          silice: 0.043,
        },
        postazione: "In prossimità della lavorazione",
      },
      {
        fase: "Consolidamento del fronte",
        minuti: 20,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 60,
        concentrazioni: {
          ec: 0.014,
          silice: 0.039,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 65,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.028,
    },
  },
  {
    nome: "Autista/Minatore/Mulettista/Pompista",
    periodi: [
      {
        fase: "Trasporto smarino*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "interno cabina autocarro",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 35,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.015,
      silice: 0.022,
    },
  },
  {
    nome: "Aiuto Lancista",
    periodi: [
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 260,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.033,
    },
  },
  {
    nome: "Minatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 25,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 75,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Trasporto smarino*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 10,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.021,
    },
  },
  {
    nome: "Lancista/Autista/Palista",
    periodi: [
      {
        fase: "Pre-spritz/Spritz",
        minuti: 85,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 70,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 80,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 25,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Trasporto smarino*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "interno cabina autocarro",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 40,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.02,
    },
  },
  {
    nome: "Disgaggiatore/Perforatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 60,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 60,
        concentrazioni: {
          ec: 0.013,
          silice: 0.014,
        },
        postazione: "interno cabina escavatore",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 20,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 60,
        concentrazioni: {
          ec: 0.009,
          silice: 0.021,
        },
        postazione: "interno cabina pala",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 195,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.026,
    },
  },
  {
    nome: "Impiantista",
    periodi: [
      {
        fase: "Allungamento tubi servizi*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "A terra",
      },
      {
        fase: "Attività ordinaria in officina fabbri",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.055,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 270,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Riparazione impianti elettrici*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.06,
        },
        postazione: "/",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.042,
    },
  },
  {
    nome: "Assistente Perforatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 360,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 45,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.019,
      silice: 0.015,
    },
  },
  {
    nome: "Responsabile Consolidamenti",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 360,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 45,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.019,
      silice: 0.015,
    },
  },
  {
    nome: "Topografo",
    periodi: [
      {
        fase: "Attività di ufficio",
        minuti: 420,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Scavo",
        minuti: 15,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 15,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 15,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.006,
      silice: 0.006,
    },
  },
  {
    nome: "Impiantista/Perforatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 300,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Allungamento tubi servizi*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "A terra",
      },
      {
        fase: "Attività ordinaria in officina fabbri",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.055,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 30,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Riparazione impianti elettrici*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.06,
        },
        postazione: "/",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.02,
    },
  },
  {
    nome: "Caposquadra/Carpentiere/Mulettista",
    periodi: [
      {
        fase: "Armatura arco rovescio*",
        minuti: 90,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 90,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Impermeabilizzazione calotta",
        minuti: 45,
        concentrazioni: {
          ec: 0.023,
          silice: 0.13,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Carpenteria",
        minuti: 120,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Movimentazione materiali",
        minuti: 30,
        concentrazioni: {
          ec: 0.039,
          silice: 0.018,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 30,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.017,
      silice: 0.038,
    },
  },
  {
    nome: "Carpentiere/Mulettista",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 120,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Impermeabilizzazione calotta",
        minuti: 15,
        concentrazioni: {
          ec: 0.023,
          silice: 0.13,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione materiali",
        minuti: 30,
        concentrazioni: {
          ec: 0.039,
          silice: 0.018,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 45,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 60,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.018,
      silice: 0.039,
    },
  },
  {
    nome: "Carpentiere/Caposquadra",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 180,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Impermeabilizzazione calotta",
        minuti: 30,
        concentrazioni: {
          ec: 0.023,
          silice: 0.13,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 30,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.044,
    },
  },
  {
    nome: "Carpentiere PLE",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 120,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 40,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno piattaforma PLE",
      },
      {
        fase: "Impermeabilizzazione calotta",
        minuti: 60,
        concentrazioni: {
          ec: 0.023,
          silice: 0.13,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 35,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.048,
    },
  },
  {
    nome: "Carpentiere",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 180,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno piattaforma PLE",
      },
      {
        fase: "Impermeabilizzazione calotta",
        minuti: 15,
        concentrazioni: {
          ec: 0.023,
          silice: 0.13,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 30,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.016,
      silice: 0.04,
    },
  },
  {
    nome: "Ferraiolo",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 60,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 120,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 120,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 60,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.015,
      silice: 0.042,
    },
  },
  {
    nome: "Perforatore",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 360,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 45,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.019,
      silice: 0.015,
    },
  },
  {
    nome: "Carpentiere/Ripristini/Mulettista/PLE",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 120,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 45,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno piattaforma PLE",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Movimentazione materiali",
        minuti: 30,
        concentrazioni: {
          ec: 0.039,
          silice: 0.018,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Movimentzione inerti *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.015,
      silice: 0.032,
    },
  },
  {
    nome: "Carpenterie/Ripristini/Mulettista",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 120,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 60,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno piattaforma PLE",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Movimentazione materiali",
        minuti: 30,
        concentrazioni: {
          ec: 0.039,
          silice: 0.018,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 30,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Movimentzione inerti *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 30,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.015,
      silice: 0.033,
    },
  },
  {
    nome: "Carpentiere/Ferraiolo",
    periodi: [
      {
        fase: "Carpenteria",
        minuti: 120,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 120,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 120,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno piattaforma PLE",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 15,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto calotta*",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.025,
        },
        postazione: "A 20m dal fronte",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.015,
      silice: 0.042,
    },
  },
  {
    nome: "Addetto ripristini non conformità",
    periodi: [
      {
        fase: "Ripristino non conformità*",
        minuti: 180,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "Interno piattaforma PLE",
      },
      {
        fase: "Ripristino non conformità*",
        minuti: 120,
        concentrazioni: {
          ec: 0.004,
          silice: 0.012,
        },
        postazione: "A terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 150,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.021,
          silice: 0.042,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.005,
      silice: 0.014,
    },
  },
  {
    nome: "Assistente di cantiere",
    periodi: [
      {
        fase: "Conduzione navetta esterno galleria*",
        minuti: 180,
        concentrazioni: {
          ec: 0.004,
          silice: 0.06,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Conduzione navetta in galleria*",
        minuti: 180,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Bagnature piste di cantiere",
        minuti: 60,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 15,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.004,
      silice: 0.057,
    },
  },
  {
    nome: "Tecnico di cantiere – ASPP",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 10,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Carpenteria",
        minuti: 10,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 10,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 10,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 10,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività di ufficio",
        minuti: 345,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.012,
    },
  },
  {
    nome: "Direttore di cantiere",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 10,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Carpenteria",
        minuti: 10,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 10,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 10,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 10,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività di ufficio",
        minuti: 345,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.012,
    },
  },
  {
    nome: "Responsabile ambiente",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 10,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Carpenteria",
        minuti: 10,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 10,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 10,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 10,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività di ufficio",
        minuti: 345,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.012,
    },
  },
  {
    nome: "Tecnico di cantiere",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 10,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Carpenteria",
        minuti: 10,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 10,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 10,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 10,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività di ufficio",
        minuti: 345,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.012,
    },
  },
  {
    nome: "Responsabile Impianti",
    periodi: [
      {
        fase: "Allungamento tubi servizi*",
        minuti: 90,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "A terra",
      },
      {
        fase: "Manutenzione mezzi in galleria",
        minuti: 30,
        concentrazioni: {
          ec: 0.024,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività ordinaria in officina fabbri",
        minuti: 120,
        concentrazioni: {
          ec: 0.004,
          silice: 0.055,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 90,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 135,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.035,
    },
  },
  {
    nome: "Ispettore ambiente",
    periodi: [
      {
        fase: "Consolidamento del fronte",
        minuti: 10,
        concentrazioni: {
          ec: 0.022,
          silice: 0.012,
        },
        postazione: "a terra",
      },
      {
        fase: "Getto arco rovescio",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura arco rovescio*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.038,
        },
        postazione: "a terra",
      },
      {
        fase: "Armatura calotta",
        minuti: 10,
        concentrazioni: {
          ec: 0.027,
          silice: 0.072,
        },
        postazione: "a terra",
      },
      {
        fase: "Carpenteria",
        minuti: 10,
        concentrazioni: {
          ec: 0.019,
          silice: 0.041,
        },
        postazione: "a terra",
      },
      {
        fase: "Scavo",
        minuti: 10,
        concentrazioni: {
          ec: 0.044,
          silice: 0.016,
        },
        postazione: "a terra",
      },
      {
        fase: "Smarino",
        minuti: 10,
        concentrazioni: {
          ec: 0.014,
          silice: 0.011,
        },
        postazione: "a terra",
      },
      {
        fase: "Posa centina",
        minuti: 10,
        concentrazioni: {
          ec: 0.01,
          silice: 0.031,
        },
        postazione: "a terra",
      },
      {
        fase: "Pre-spritz/Spritz",
        minuti: 10,
        concentrazioni: {
          ec: 0.006,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Sistemazione del fronte per la volata*",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.043,
        },
        postazione: "In prossimità della lavorazione",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 10,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività di ufficio",
        minuti: 345,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.007,
      silice: 0.011,
    },
  },
  {
    nome: "Addetto piazzale/Gruista",
    periodi: [
      {
        fase: "Movimentazione di materiale *",
        minuti: 120,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Movimentzione inerti *",
        minuti: 90,
        concentrazioni: {
          ec: 0.004,
          silice: 0.01,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Movimentazione materiali",
        minuti: 90,
        concentrazioni: {
          ec: 0.039,
          silice: 0.018,
        },
        postazione: "Interno cabina sollevatore",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 165,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.012,
      silice: 0.026,
    },
  },
  {
    nome: "Addetto rifornimento gasolio",
    periodi: [
      {
        fase: "Bagnature piste di cantiere",
        minuti: 90,
        concentrazioni: {
          ec: 0.005,
          silice: 0.015,
        },
        postazione: "interno cabina autobotte",
      },
      {
        fase: "Distribuzione gasolio*",
        minuti: 180,
        concentrazioni: {
          ec: 0.004,
          silice: 0.019,
        },
        postazione: "Interno cabina cisterna",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 135,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.006,
      silice: 0.025,
    },
  },
  {
    nome: "Addetto squadra sicurezza",
    periodi: [
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 30,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Attività di ufficio",
        minuti: 315,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.004,
      silice: 0.019,
    },
  },
  {
    nome: "Addetto Impianto Depurazione Acqua",
    periodi: [
      {
        fase: "Gestione impianto di depurazione acque",
        minuti: 360,
        concentrazioni: {
          ec: 0.004,
          silice: 0.011,
        },
        postazione: "interno cabina",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 105,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.005,
      silice: 0.019,
    },
  },
  {
    nome: "Responsabile Ufficio Attrezzature",
    periodi: [
      {
        fase: "Attività di ufficio",
        minuti: 465,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.004,
      silice: 0.005,
    },
  },
  {
    nome: "Autista Navetta",
    periodi: [
      {
        fase: "Conduzione navetta in galleria*",
        minuti: 180,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Conduzione navetta esterno galleria*",
        minuti: 180,
        concentrazioni: {
          ec: 0.004,
          silice: 0.06,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 105,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.005,
      silice: 0.063,
    },
  },
  {
    nome: "Autista Servizi Generali",
    periodi: [
      {
        fase: "Conduzione navetta in galleria*",
        minuti: 90,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Conduzione navetta esterno galleria*",
        minuti: 90,
        concentrazioni: {
          ec: 0.004,
          silice: 0.06,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 120,
        concentrazioni: {
          ec: 0.004,
          silice: 0.018,
        },
        postazione: "Lungo la galleria",
      },
      {
        fase: "Verifica apprestamenti di sicurezza*",
        minuti: 120,
        concentrazioni: {
          ec: 0.004,
          silice: 0.08,
        },
        postazione: "Piazzale esterno",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 45,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.004,
      silice: 0.055,
    },
  },
  {
    nome: "Fabbro Saldatore",
    periodi: [
      {
        fase: "Allungamento tubi servizi*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "A terra",
      },
      {
        fase: "Attività ordinaria in officina fabbri",
        minuti: 325,
        concentrazioni: {
          ec: 0.004,
          silice: 0.055,
        },
        postazione: "a terra",
      },
      {
        fase: "Manutenzione mezzi in galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.024,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Manutenzione mezzi in officina",
        minuti: 15,
        concentrazioni: {
          ec: 0.008,
          silice: 0.014,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 20,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.005,
      silice: 0.044,
    },
  },
  {
    nome: "Capo officina Meccanico",
    periodi: [
      {
        fase: "Allungamento tubi servizi*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "A terra",
      },
      {
        fase: "Attività ordinaria in officina fabbri",
        minuti: 325,
        concentrazioni: {
          ec: 0.004,
          silice: 0.055,
        },
        postazione: "a terra",
      },
      {
        fase: "Manutenzione mezzi in galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.024,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Manutenzione mezzi in officina",
        minuti: 15,
        concentrazioni: {
          ec: 0.008,
          silice: 0.014,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 20,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.005,
      silice: 0.044,
    },
  },
  {
    nome: "Meccanico",
    periodi: [
      {
        fase: "Allungamento tubi servizi*",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.014,
        },
        postazione: "A terra",
      },
      {
        fase: "Attività ordinaria in officina fabbri",
        minuti: 325,
        concentrazioni: {
          ec: 0.004,
          silice: 0.055,
        },
        postazione: "a terra",
      },
      {
        fase: "Manutenzione mezzi in galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.024,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Manutenzione mezzi in officina",
        minuti: 15,
        concentrazioni: {
          ec: 0.008,
          silice: 0.014,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 30,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 20,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.005,
      silice: 0.044,
    },
  },
  {
    nome: "Elettricista",
    periodi: [
      {
        fase: "Manutenzione mezzi in galleria",
        minuti: 15,
        concentrazioni: {
          ec: 0.024,
          silice: 0.03,
        },
        postazione: "a terra",
      },
      {
        fase: "Manutenzione mezzi in officina",
        minuti: 15,
        concentrazioni: {
          ec: 0.008,
          silice: 0.014,
        },
        postazione: "a terra",
      },
      {
        fase: "Movimentazione di materiale *",
        minuti: 60,
        concentrazioni: {
          ec: 0.004,
          silice: 0.017,
        },
        postazione: "in prossimità lavorazione",
      },
      {
        fase: "Riparazione impianti elettrici*",
        minuti: 320,
        concentrazioni: {
          ec: 0.004,
          silice: 0.06,
        },
        postazione: "/",
      },
      {
        fase: "Attività ordinaria di piazzale",
        minuti: 55,
        concentrazioni: {
          ec: 0.009,
          silice: 0.047,
        },
        postazione: "a terra",
      },
      {
        fase: "Pausa fisiologica",
        minuti: 15,
        concentrazioni: {
          ec: 0.004,
          silice: 0.005,
        },
        postazione: "0",
      },
    ],
    totale: {
      ec: 0.005,
      silice: 0.049,
    },
  },
];
