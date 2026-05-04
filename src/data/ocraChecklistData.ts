/**
 * Dati Checklist OCRA - punteggi delle voci.
 * Fonte: foglio cartaceo "Checklist OCRA - procedura breve" (Colombini-Occhipinti).
 */

export interface OcraOption {
  id: string
  label: string
  punteggio: number
}

export interface OcraSubsection {
  id: string
  titolo: string
  descrizione?: string
  modalita: 'radio' | 'checkbox'
  opzioni: OcraOption[]
}

export interface OcraSection {
  id: string
  titolo: string
  descrizione: string
  /** strategia per calcolare il punteggio della sezione dai sottoblocchi */
  calcolo: 'sum' | 'max_sub_sum_strict' | 'max_sub' | 'max_distretti_plus_stereotipia'
  sottoblocchi: OcraSubsection[]
}

// SEZIONE 1: RECUPERO (radio, 1 sola scelta)
export const SEZIONE_RECUPERO: OcraSection = {
  id: 'recupero',
  titolo: '1. Recupero (interruzioni)',
  descrizione: 'Modalità di interruzione del lavoro ripetitivo (scegliere una sola risposta)',
  calcolo: 'sum',
  sottoblocchi: [{
    id: 'recupero',
    titolo: 'Pause / interruzioni',
    modalita: 'radio',
    opzioni: [
      { id: 'r0', label: 'Esiste interruzione di almeno 8-10 min ogni ora (compresa pausa mensa); o tempo recupero in ciclo ≥10 sec ogni 60 sec', punteggio: 0 },
      { id: 'r2', label: 'Esistono 2 interruzioni al mattino e 2 al pomeriggio (oltre la pausa mensa) di almeno 8-10 minuti in turno di 7-8 ore', punteggio: 2 },
      { id: 'r3', label: 'Esistono 2 pause di almeno 8-10 minuti in turno di 6 ore (senza pausa mensa); o 4 interruzioni (oltre mensa) in turno di 7-8 ore', punteggio: 3 },
      { id: 'r4', label: 'Esistono 2 interruzioni di almeno 8-10 minuti in turno di 7-8 ore (con pausa mensa); o 3 interruzioni (no mensa) in 7-8 ore', punteggio: 4 },
      { id: 'r6', label: 'In turno di 7 ore circa, senza pausa mensa, è presente una sola pausa di almeno 10 minuti; o in 8 ore con pausa mensa è presente 1 sola pausa', punteggio: 6 },
      { id: 'r10', label: 'Non esistono di fatto interruzioni se non di pochi minuti (meno di 5) in 7-8 ore di turno', punteggio: 10 },
    ]
  }]
}

// SEZIONE 2: FREQUENZA (2 sotto-blocchi: Dinamiche + Statiche, si prende max)
export const SEZIONE_FREQUENZA: OcraSection = {
  id: 'frequenza',
  titolo: '2. Frequenza azioni',
  descrizione: 'Una sola risposta per blocco. Punteggio = MAX tra Dinamiche e Statiche.',
  calcolo: 'max_sub',
  sottoblocchi: [
    {
      id: 'dinamiche',
      titolo: 'Azioni tecniche dinamiche',
      modalita: 'radio',
      opzioni: [
        { id: 'd0', label: 'Movimenti braccia lenti, frequenti interruzioni (20 az/min)', punteggio: 0 },
        { id: 'd1', label: 'Movimenti braccia non troppo veloci (30 az/min, 1 azione/2 sec) con possibili interruzioni', punteggio: 1 },
        { id: 'd3', label: 'Movimenti braccia più rapidi (~40 az/min) ma con possibilità di brevi interruzioni', punteggio: 3 },
        { id: 'd4', label: 'Movimenti braccia abbastanza rapidi (~40 az/min), possibilità interruzioni occasionale e irregolare', punteggio: 4 },
        { id: 'd6', label: 'Movimenti braccia rapidi e costanti (~50 az/min), possibili interruzioni solo sporadiche', punteggio: 6 },
        { id: 'd8', label: 'Movimenti braccia molto rapidi e costanti, carenza di interruzioni rende difficile mantenere il ritmo (60 az/min)', punteggio: 8 },
        { id: 'd10', label: 'Frequenze elevatissime (70 e oltre/min), non sono possibili interruzioni', punteggio: 10 },
      ]
    },
    {
      id: 'statiche',
      titolo: 'Azioni tecniche statiche',
      modalita: 'radio',
      opzioni: [
        { id: 's2_3', label: 'È mantenuto un oggetto in presa statica per ≥5 sec, occupa 2/3 del tempo ciclo', punteggio: 2 },
        { id: 's3_3', label: 'È mantenuto un oggetto in presa statica per ≥5 sec, occupa 3/3 del tempo ciclo', punteggio: 3 },
      ]
    }
  ]
}

// SEZIONE 3: FORZA (3 sotto-blocchi cumulativi)
export const SEZIONE_FORZA: OcraSection = {
  id: 'forza',
  titolo: '3. Forza',
  descrizione: 'Possono essere barrate più risposte; sommare i punteggi.',
  calcolo: 'sum',
  sottoblocchi: [
    {
      id: 'massimale',
      titolo: 'Forza quasi massimale (Borg ≥8)',
      modalita: 'checkbox',
      opzioni: [
        { id: 'm_2sec', label: '2 secondi ogni 10 minuti', punteggio: 6 },
        { id: 'm_1pc', label: '1% del tempo', punteggio: 12 },
        { id: 'm_5pc', label: '5% del tempo', punteggio: 24 },
        { id: 'm_10pc', label: 'oltre il 10% del tempo (NON ACCETTABILE)', punteggio: 32 },
      ]
    },
    {
      id: 'forte',
      titolo: 'Forza forte/molto forte (Borg 5-7)',
      modalita: 'checkbox',
      opzioni: [
        { id: 'f_2sec', label: '2 secondi ogni 10 minuti', punteggio: 4 },
        { id: 'f_1pc', label: '1% del tempo', punteggio: 8 },
        { id: 'f_5pc', label: '5% del tempo', punteggio: 16 },
        { id: 'f_10pc', label: 'oltre il 10% del tempo (NON ACCETTABILE)', punteggio: 24 },
      ]
    },
    {
      id: 'moderata',
      titolo: 'Forza moderata (Borg 3-4)',
      modalita: 'checkbox',
      opzioni: [
        { id: 'mod_2sec', label: '2 secondi ogni 10 minuti', punteggio: 2 },
        { id: 'mod_1pc', label: '1% del tempo', punteggio: 4 },
        { id: 'mod_5pc', label: '5% del tempo', punteggio: 6 },
        { id: 'mod_10pc', label: 'oltre il 10% del tempo', punteggio: 8 },
      ]
    }
  ]
}

// SEZIONE 4: POSTURA (4 distretti + stereotipia)
export const SEZIONE_POSTURA: OcraSection = {
  id: 'postura',
  titolo: '4. Postura',
  descrizione: 'MAX tra A/B/C/D, sommato a Stereotipia.',
  calcolo: 'max_distretti_plus_stereotipia',
  sottoblocchi: [
    {
      id: 'spalla',
      titolo: 'A) Spalla',
      modalita: 'radio',
      opzioni: [
        { id: 'sp1', label: 'Braccia non sollevate, lavoro su piano d\'appoggio o vicino al tronco (>50% del tempo)', punteggio: 0 },
        { id: 'sp2', label: 'Braccia mantenute senza appoggio quasi ad altezza spalle per ~10% del tempo', punteggio: 1 },
        { id: 'sp3', label: 'Braccia mantenute senza appoggio quasi ad altezza spalle per ~1/3 del tempo', punteggio: 2 },
        { id: 'sp4', label: 'Braccia mantenute senza appoggio quasi ad altezza spalle per più di metà del tempo', punteggio: 6 },
        { id: 'sp5', label: 'Braccia mantenute senza appoggio quasi ad altezza spalle per quasi tutto il tempo', punteggio: 12 },
      ]
    },
    {
      id: 'gomito',
      titolo: 'B) Gomito',
      modalita: 'radio',
      opzioni: [
        { id: 'g1', label: 'Gomito esegue ampi movimenti di flesso-estensioni o prono-supinazione, movimenti bruschi per ~1/3 del tempo', punteggio: 2 },
        { id: 'g2', label: 'Gomito esegue ampi movimenti di flesso-estensioni o prono-supinazione, movimenti bruschi per più di metà del tempo', punteggio: 4 },
        { id: 'g3', label: 'Gomito esegue ampi movimenti di flesso-estensioni o prono-supinazione, movimenti bruschi per quasi tutto il tempo', punteggio: 8 },
      ]
    },
    {
      id: 'polso',
      titolo: 'C) Polso',
      modalita: 'radio',
      opzioni: [
        { id: 'p1', label: 'Polso fa piegamenti estremi o assume posizioni fastidiose per almeno 1/3 del tempo', punteggio: 2 },
        { id: 'p2', label: 'Polso fa piegamenti estremi o posizioni fastidiose per più di metà del tempo', punteggio: 4 },
        { id: 'p3', label: 'Polso fa piegamenti estremi per circa tutto il tempo', punteggio: 8 },
      ]
    },
    {
      id: 'mano',
      titolo: 'D) Mano (presa)',
      modalita: 'radio',
      opzioni: [
        { id: 'mn1', label: 'Mano afferra a dita strette (pinch), uncino, palmare per ~1/3 del tempo', punteggio: 2 },
        { id: 'mn2', label: 'Mano afferra a dita strette (pinch), uncino, palmare per più di metà del tempo', punteggio: 4 },
        { id: 'mn3', label: 'Mano afferra a dita strette (pinch), uncino, palmare per quasi tutto il tempo', punteggio: 8 },
      ]
    },
    {
      id: 'stereotipia',
      titolo: 'E) Stereotipia',
      modalita: 'radio',
      opzioni: [
        { id: 'st1', label: 'Gesti lavorativi identici di spalla/gomito/polso/mani per più della metà del tempo (o ciclo 8-15 sec a contenuto prevalente)', punteggio: 1.5 },
        { id: 'st2', label: 'Gesti lavorativi identici di spalla/gomito/polso/mani per quasi tutto il tempo (o ciclo <8 sec a contenuto prevalente)', punteggio: 3 },
      ]
    }
  ]
}

// SEZIONE 5: COMPLEMENTARI (checkbox)
export const SEZIONE_COMPLEMENTARI: OcraSection = {
  id: 'complementari',
  titolo: '5. Fattori complementari',
  descrizione: 'Selezionare tutti quelli applicabili.',
  calcolo: 'sum',
  sottoblocchi: [{
    id: 'complementari',
    titolo: 'Fattori di rischio complementari',
    modalita: 'checkbox',
    opzioni: [
      { id: 'c1', label: 'Vengono usati per più della metà del tempo guanti inadeguati alla presa', punteggio: 2 },
      { id: 'c2', label: 'Sono presenti movimenti bruschi o a strappo o contraccolpi (≥2/min)', punteggio: 2 },
      { id: 'c3', label: 'Sono presenti impatti ripetuti (uso mani per dare colpi ≥10/h)', punteggio: 2 },
      { id: 'c4', label: 'Sono presenti contatti con superfici fredde (<0°C) o lavori in celle frigorifere', punteggio: 2 },
      { id: 'c5', label: 'Vengono usati strumenti vibranti o avvitatori a contraccolpo per almeno 1/3 del tempo', punteggio: 2 },
      { id: 'c6', label: 'Vengono usati attrezzi che provocano compressioni su strutture muscolo-tendinee', punteggio: 2 },
      { id: 'c7', label: 'Vengono svolti lavori di precisione per più di metà del tempo', punteggio: 2 },
      { id: 'c8', label: 'Sono presenti più fattori complementari che considerati complessivamente occupano più di metà del tempo', punteggio: 2 },
      { id: 'c9', label: 'Sono presenti uno o più fattori complementari che occupano quasi tutto il tempo', punteggio: 3 },
      { id: 'c10', label: 'I ritmi di lavoro sono determinati dalla macchina ma esistono zone "polmone"', punteggio: 1 },
      { id: 'c11', label: 'I ritmi di lavoro sono completamente determinati dalla macchina (catena di montaggio)', punteggio: 2 },
    ]
  }]
}

export const TUTTE_LE_SEZIONI: OcraSection[] = [
  SEZIONE_RECUPERO,
  SEZIONE_FREQUENZA,
  SEZIONE_FORZA,
  SEZIONE_POSTURA,
  SEZIONE_COMPLEMENTARI,
]

/**
 * Tabella moltiplicatore durata in base ai minuti totali compito ripetitivo.
 */
export function calcolaMoltiplicatoreDurata(minuti: number | null): number | null {
  if (minuti === null || minuti < 0) return null
  if (minuti <= 120) return 0.5
  if (minuti <= 180) return 0.65
  if (minuti <= 240) return 0.75
  if (minuti <= 300) return 0.85
  if (minuti <= 360) return 0.925
  if (minuti <= 420) return 0.95
  if (minuti <= 480) return 1.0
  return 1.5
}

export interface FasciaRischio {
  livello: 1 | 2 | 3 | 4 | 5
  label: string
  colore: string
}

export function calcolaFasciaRischio(punteggioReale: number): FasciaRischio {
  if (punteggioReale <= 7.5) return { livello: 1, label: 'Accettabile', colore: '#2E7D32' }
  if (punteggioReale <= 11) return { livello: 2, label: 'Borderline / rischio molto lieve', colore: '#F9A825' }
  if (punteggioReale <= 14) return { livello: 3, label: 'Rischio lieve', colore: '#EF6C00' }
  if (punteggioReale <= 22.5) return { livello: 4, label: 'Rischio medio', colore: '#C62828' }
  return { livello: 5, label: 'Rischio elevato', colore: '#7B1F1F' }
}
