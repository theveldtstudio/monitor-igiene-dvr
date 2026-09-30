/** Cantiere di prova per il DVR CEM (non c'è un DVR modello): sorgenti tipiche di una galleria in tradizionale. */
import type { MisuraCem, SorgenteCem } from '../valutazione'

export const MANSIONI_CEM = [
  { id: 'sal', nome: 'Fabbro saldatore', attivita: 'Saldature e tagli in officina' },
  { id: 'ele', nome: 'Elettricista', attivita: 'Manutenzione di cabine, quadri e impianti elettrici' },
  { id: 'min', nome: 'Minatore', attivita: 'Attività al fronte di scavo' },
  { id: 'tec', nome: 'Tecnico di cantiere', attivita: 'Attività di ufficio e sopralluoghi' },
]

export const SORGENTI_CEM: SorgenteCem[] = [
  { id: 's1', categoria: 'ufficio', descrizione: 'PC, stampanti e monitor degli uffici', frequenza: 50, attivita: 'Attività di ufficio', mansioni: ['tec'] },
  { id: 's2', categoria: 'telefonia', descrizione: 'Radio ricetrasmittenti portatili', frequenza: 446e6, attivita: 'Comunicazioni in galleria', mansioni: ['min', 'ele', 'tec'] },
  { id: 's3', categoria: 'utensili', descrizione: 'Utensili elettrici portatili', frequenza: 50, attivita: 'Lavorazioni varie', mansioni: ['sal', 'ele', 'min'] },
  { id: 's4', categoria: 'saldatura', descrizione: 'Saldatrice ad arco ESAB MIG L405W', frequenza: 50, attivita: 'Saldatura', postazione: 'Officina fabbri', mansioni: ['sal'] },
  { id: 's5', categoria: 'trasformatore', descrizione: 'Cabina di trasformazione MT/BT', frequenza: 50, attivita: 'Manutenzione impianti', postazione: 'Piazzale', mansioni: ['ele'] },
  { id: 's6', categoria: 'generatori', descrizione: 'Gruppo elettrogeno 400 kVA', frequenza: 50, attivita: 'Rifornimento e manutenzione', postazione: 'Piazzale', mansioni: ['ele'] },
]

export const MISURE_CEM: MisuraCem[] = [
  { id: 'm1', sorgenteId: 's4', postazione: 'Mano sul cavo di massa', distanza: 0.05, e: 12, b: 1450, arti: true },
  { id: 'm2', sorgenteId: 's4', postazione: 'Operatore, tronco', distanza: 0.3, e: 8, b: 210 },
  { id: 'm3', sorgenteId: 's4', postazione: 'Banco di lavoro', distanza: 1, e: 4, b: 38 },
  { id: 'm4', sorgenteId: 's4', postazione: 'Ingresso officina', distanza: 3, e: 2, b: 3.1 },
  { id: 'm5', sorgenteId: 's5', postazione: 'Fronte quadro BT', distanza: 0.5, e: 310, b: 150 },
  { id: 'm6', sorgenteId: 's5', postazione: 'Porta cabina', distanza: 1.5, e: 120, b: 42 },
  { id: 'm7', sorgenteId: 's5', postazione: 'Esterno cabina', distanza: 3, e: 25, b: 6.5 },
  { id: 'm8', sorgenteId: 's6', postazione: 'Pannello di comando', distanza: 0.5, e: 40, b: 28 },
  { id: 'm9', sorgenteId: 's6', postazione: 'Area rifornimento', distanza: 2, e: 10, b: 3.2 },
]
