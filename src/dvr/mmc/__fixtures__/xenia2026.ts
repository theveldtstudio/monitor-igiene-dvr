/**
 * DVR MMC Xenia TBM1 2026 (luglio 2026): attività valutate e indici riportati nel modello.
 * Gli ingressi NIOSH sono i punti della tabella corrispondenti ai fattori usati nel modello.
 */
import type { CompitoNiosh } from '../niosh'
import type { AttivitaMmc } from '../valutazione'

export const MANSIONI_MMC_XENIA = [
  'Capo Turno',
  'Capo Cantiere',
  'Caposquadra TBM',
  'Aiuto montaggio anelli',
  'Operatore TBM – Erettorista/Aiuto erettorista',
  'Operatore TBM – Impiantista',
  'Operatore TBM – Addetto iniezioni malta/Pompista/Addetto getto invert',
  'Operatore astronave/Aiuto operatore astronave',
  'Operatore MSV',
  'Operatore TBM – Elettricista TBM/Aiuto elettricista TBM',
  'Operatore TBM – Meccanico TBM/Aiuto meccanico TBM',
  'Impiegato tecnico',
  'Operatore TBM – Addetto fondoscudo',
  'Capo piazzale TBM',
  'Addetto Forklift',
  'Operatore TBM – Saldatore',
  'Saldatore – Aiutante saldatore',
  'Gruista',
  'Addetto muletto',
  'Capo magazzino TBM/Addetto magazzino',
  'Addetto ripristini/Muratore',
  'Aiutante esterno (manovale)',
  'Addetto piazzale TBM',
].map((nome, i) => ({ id: `m${i + 1}`, nome }))

const n = (p: Partial<CompitoNiosh>): CompitoNiosh => ({
  peso: 0,
  altezza: 75,
  dislocazione: 25,
  distanza: 25,
  asimmetria: 0,
  frequenza: 0.2,
  durata: 'breve',
  presa: 'buono',
  ...p,
})

const ELETTRICISTA = 'm10'
const MECCANICO = 'm11'

/** Indici del modello: [adulti, giovani/anziani] o [indice] per Snook, [sx, dx] check list per OCRA. */
export const ATTIVITA_MMC_XENIA: (AttivitaMmc & { modello: number[] })[] = [
  { id: 'a1', titolo: 'Sollevamento comandi erettore', descrizione: '', mansioni: ['m5'], metodo: 'niosh', compiti: [n({ peso: 3.8, altezza: 75, dislocazione: 40, distanza: 30 })], modello: [0.19, 0.25] },
  { id: 'a2a', titolo: 'Sollevamento plafoniere normali sul furgone', descrizione: '', mansioni: [ELETTRICISTA], metodo: 'niosh', compiti: [n({ peso: 4, altezza: 0, dislocazione: 100, asimmetria: 30 })], modello: [0.26, 0.33] },
  {
    id: 'a2b',
    titolo: 'Montaggio plafoniere normali',
    descrizione: '',
    mansioni: [ELETTRICISTA],
    metodo: 'niosh_composto',
    compiti: [
      n({ descrizione: 'Plafoniera (sollevamento da furgone al cestello)', peso: 4, altezza: 100, dislocazione: 25, distanza: 25, asimmetria: 30, frequenza: 0.1 }),
      n({ descrizione: 'Plafoniera (sollevamento per montaggio)', peso: 4, altezza: 0, dislocazione: 100, distanza: 30, asimmetria: 0, frequenza: 0.1 }),
    ],
    modello: [0.29, 0.36],
  },
  { id: 'a3a', titolo: 'Sollevamento plafoniere di emergenza sul furgone', descrizione: '', mansioni: [ELETTRICISTA], metodo: 'niosh', compiti: [n({ peso: 20, persone: 2, altezza: 0, dislocazione: 100, asimmetria: 30 })], modello: [0.78, 0.98] },
  {
    id: 'a3b',
    titolo: 'Montaggio plafoniere di emergenza',
    descrizione: '',
    mansioni: [ELETTRICISTA],
    metodo: 'niosh_composto',
    compiti: [
      n({ descrizione: 'Plafoniera di emergenza (sollevamento da furgone al cestello)', peso: 20, persone: 2, altezza: 100, dislocazione: 25, distanza: 25, asimmetria: 30, frequenza: 0.1 }),
      n({ descrizione: 'Plafoniera di emergenza (sollevamento per montaggio)', peso: 20, persone: 2, altezza: 0, dislocazione: 100, distanza: 30, asimmetria: 0, frequenza: 0.1 }),
    ],
    modello: [0.86, 1.07],
  },
  { id: 'a4', titolo: 'Trasporto cassetta attrezzi elettrici', descrizione: '', mansioni: [ELETTRICISTA], metodo: 'snook', snook: { azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 8 * 3600, valore: 15 }, modello: [0.58] },
  { id: 'a5', titolo: 'Carico conci prefabbricati tramite joystick', descrizione: '', mansioni: ['m8'], metodo: 'niosh', compiti: [n({ peso: 3, altezza: 75, dislocazione: 40, distanza: 30 })], modello: [0.16, 0.19] },
  { id: 'a7', titolo: 'Trasporto cassetta attrezzi meccanici', descrizione: '', mansioni: [MECCANICO], metodo: 'snook', snook: { azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 8 * 3600, valore: 20 }, modello: [0.77] },
  { id: 'a9', titolo: 'Aggancio/sgancio ganci e catene', descrizione: '', mansioni: ['m19', 'm22', 'm23'], metodo: 'niosh', compiti: [n({ peso: 10, altezza: 0, dislocazione: 25, asimmetria: 30 })], modello: [0.58, 0.72] },
  {
    id: 'a10',
    titolo: 'Trasporto attrezzi e materiali di vario tipo',
    descrizione: '',
    mansioni: [ELETTRICISTA, MECCANICO, 'm16', 'm17', 'm22', 'm23'],
    metodo: 'snook',
    snook: { azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 30 * 60, valore: 15 },
    modello: [0.68],
  },
  { id: 'a11', titolo: 'Attività di magazzino', descrizione: '', mansioni: ['m20'], metodo: 'niosh', compiti: [n({ peso: 15, altezza: 25, dislocazione: 100 })], modello: [0.8, 1.01] },
  { id: 'a12', titolo: 'Montaggio impianti elettrici (utilizzo cacciavite)', descrizione: '', mansioni: [ELETTRICISTA], metodo: 'ocra', ocra: { sx: 0, dx: 7.5, minuti: 30 }, modello: [0, 7.5] },
  { id: 'a13', titolo: 'Sollevamento tubazioni per estensione impianti', descrizione: '', mansioni: ['m6'], metodo: 'niosh', compiti: [n({ peso: 15, altezza: 25, dislocazione: 50, distanza: 30 })], modello: [0.94, 1.17] },
  { id: 'a14', titolo: 'Manutenzione mezzi – Sollevamento componenti', descrizione: '', mansioni: [MECCANICO], metodo: 'niosh', compiti: [n({ peso: 10, altezza: 50, dislocazione: 50, distanza: 30 })], modello: [0.57, 0.71] },
  { id: 'a15', titolo: 'Montaggio impianti meccanici (utilizzo brugole e chiavi inglesi)', descrizione: '', mansioni: [MECCANICO], metodo: 'ocra', ocra: { sx: 0, dx: 7.5, minuti: 30 }, modello: [0, 7.5] },
  { id: 'a16', titolo: 'Sollevamento cassette antincendio', descrizione: '', mansioni: [MECCANICO], metodo: 'niosh', compiti: [n({ peso: 10, altezza: 0, dislocazione: 100 })], modello: [0.59, 0.75] },
  { id: 'a17', titolo: 'Sollevamento estintori', descrizione: '', mansioni: [MECCANICO], metodo: 'niosh', compiti: [n({ peso: 6, altezza: 0, dislocazione: 100 })], modello: [0.36, 0.45] },
  { id: 'a18', titolo: 'Movimentazione tubazioni', descrizione: '', mansioni: ['m7'], metodo: 'niosh', compiti: [n({ peso: 15, altezza: 25, dislocazione: 50, distanza: 30 })], modello: [0.94, 1.17] },
  { id: 'a19', titolo: 'Sollevamento secchio di malta/resina', descrizione: '', mansioni: ['m21'], metodo: 'niosh', compiti: [n({ peso: 10, altezza: 50, dislocazione: 50, distanza: 30, asimmetria: 60 })], modello: [0.7, 0.88] },
  {
    id: 'a20',
    titolo: 'Trasporto manuale di materiali edili sul piazzale',
    descrizione: '',
    mansioni: ['m22', 'm23'],
    metodo: 'snook',
    snook: { azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 60 * 60, valore: 20 },
    modello: [0.83],
  },
]
