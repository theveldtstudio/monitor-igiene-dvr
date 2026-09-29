/**
 * Dati del DVR ROA Castagnola 2026 (tabelle 8–17 del modello).
 */
import type { DpiSaldatura, RilievoLuminanza, SorgenteRoa } from '../valutazione'

const SALDATURA_UV =
  'Le saldature, a prescindere dal metallo, possono superare i valori limite previsti per le radiazioni UV per tempi di esposizione dell’ordine di decine di secondi a distanza di un metro dall’arco.'
const TAGLIO_UV =
  'I tagli con cannello ossiacetilenico, a prescindere dal metallo tagliato, possono superare i valori limite previsti per le radiazioni UV per tempi di esposizione dell’ordine di decine di secondi a distanza di un metro dal taglio.'
const SALDATURA_MISURE =
  'È noto che con qualsiasi corrente di saldatura e su qualsiasi supporto i tempi per cui si raggiunge una sovraesposizione per il lavoratore addetto risultano dell’ordine delle decine di secondi a distanza di un metro dall’arco. Ciò implica che, pur essendo il rischio elevato, l’effettuazione delle misure e la determinazione esatta dei tempi di esposizione è del tutto superflua per l’operatore addetto. Al fine di proteggere i lavoratori dai rischi la norma EN 169 associa univocamente specifici filtri di protezione ad ogni procedimento di saldatura secondo la corrente utilizzata.'
const LASER_MISURE =
  'Le stazioni totali vengono usate sempre con prisma. L’utilizzo senza prisma è sporadico e per brevi periodi. Il raggio laser è visibile (rosso) e la classe 3R comporta un rischio limitato. Trattandosi di utilizzo sporadico e all’aperto, non è necessario procedere a misurazioni strumentali.'
const NON_REPERITA = ''

const saldatura = (id: string, descrizione: string, attivita: string, funzionamento: string, espostiDiretti: string, espostiIndebiti: string, motivazione: string): SorgenteRoa => ({
  id,
  tipo: 'macchina',
  descrizione,
  attivita,
  funzionamento,
  utilizzo: 'Distanza operatore - sorgente: 50 cm',
  classe: NON_REPERITA,
  saldatura: true,
  motivazione,
  spettro: 'ultravioletti',
  distanza: 'Circa 50 cm',
  tempo: '60',
  espostiDiretti,
  espostiIndebiti,
  misure: false,
  motivazioneMisure: SALDATURA_MISURE,
})

const lampada = (id: string, descrizione: string, attivita: string, classe: string, extra: Partial<SorgenteRoa> = {}): SorgenteRoa => ({ id, tipo: 'lampada', descrizione, attivita, funzionamento: '/', utilizzo: '/', classe, ...extra })

const stazione = (id: string, descrizione: string, componente: string, classe: string, extra: Partial<SorgenteRoa> = {}): SorgenteRoa => ({
  id,
  tipo: 'laser',
  descrizione,
  componente,
  attivita: 'Rilievi topografici in esterno',
  funzionamento: '/',
  utilizzo: '/',
  classe,
  ...extra,
})

const laserNonGiust = (modello: string): Partial<SorgenteRoa> => ({
  spettro: 'Raggio laser visibile (rosso)',
  distanza: 'Variabile',
  tempo: 'Esposizione accidentale',
  espostiDiretti: 'Nessuna',
  espostiIndebiti: 'Mansioni che, accidentalmente, si trovano nel raggio d’azione del laser',
  misure: false,
  motivazioneMisure: LASER_MISURE,
  descrizioneAnalisi: `Laser del distanziometro della stazione totale ${modello}`,
})

export const SORGENTI_CASTAGNOLA: SorgenteRoa[] = [
  saldatura('s1', 'Saldatrice ESAB MIG L405W', 'Saldatura MIG/MAG a filo continuo eseguita in officina', 'Corrente di saldatura: 10 ÷ 180 A', 'Saldatore che esegue la saldatura', 'Tutte le mansioni che stanno nella zona in cui viene effettuata la saldatura', SALDATURA_UV),
  saldatura('s2', 'Saldatrice ad elettrodo', 'Saldatura con elettrodo rivestito di acciaio e ferro', 'Corrente di saldatura: 40 ÷ 100 A', 'Saldatore che esegue la saldatura', 'Tutte le mansioni che stanno nella zona in cui viene effettuata la saldatura', SALDATURA_UV),
  saldatura('s3', 'Cannello ossiacetilenico per tagli', 'Taglio del ferro durante l’attività di carpenteria e riscaldi guaine', 'Portata gas: 1800 ÷ 3150 l/h', 'Meccanico che esegue il taglio/riscaldo; Carpentiere che esegue il taglio/riscaldo', 'Tutte le mansioni che stanno nella zona in cui viene effettuato il taglio', TAGLIO_UV),
  lampada('l1', 'Illuminazione standard uso ufficio', 'Attività d’ufficio', 'Esente'),
  lampada('l2', 'Monitor dei computer', 'Attività d’ufficio', 'Esente'),
  lampada('l3', 'Fotocopiatrici', 'Attività d’ufficio', 'Esente'),
  lampada('l4', 'Fari a paramento (neon)', 'Tutte le lavorazioni eseguite in galleria', '', {
    utilizzo: 'Altezza da terra: 2 m',
    spettro: 'Luce visibile',
    distanza: 'Ca. 2 m dal piano di calpestio',
    tempo: '480',
    espostiDiretti: 'Tutte le mansioni di galleria',
    espostiIndebiti: 'Nessuna',
    misure: true,
    motivazioneMisure: 'Ci sono le condizioni per poter eseguire misure di illuminamento.',
  }),
  lampada('l5', 'Fari FL PFM 165 W 4000 K SYM 100 BK', 'Tutte le lavorazioni eseguite in galleria', 'RG1', {
    utilizzo: 'Altezza da terra: 2 m',
    spettro: 'Luce visibile',
    distanza: 'Ca. 2 m dal piano di calpestio',
    tempo: '480',
    espostiDiretti: 'Tutte le mansioni di galleria',
    espostiIndebiti: 'Nessuna',
    misure: false,
    motivazioneMisure:
      'Si considera sicura, senza necessità di informare l’installatore o l’utilizzatore, una sorgente che rispetti i livelli di esposizione da rischio blu corrispondenti al gruppo RG1 della CEI EN 62471 per un tempo di esposizione di 100 s. Inoltre l’esposizione è trascurabile in quanto i lavoratori non sono soggetti ad una prolungata osservazione del fascio di luce.',
  }),
  lampada('l6', 'Lampade indicatrici dei veicoli (frecce, freno, retromarcia, fendinebbia)', 'Tutte le lavorazioni eseguite in galleria e nel piazzale', 'Esente'),
  lampada('l7', 'Fari dei veicoli', 'Tutte le lavorazioni eseguite in galleria e nel piazzale', '', {
    spettro: 'Luce visibile',
    distanza: 'Variabile',
    tempo: 'Esposizione accidentale',
    espostiDiretti: 'Tutte le mansioni di galleria',
    espostiIndebiti: 'Nessuna',
    misure: false,
    motivazioneMisure: 'L’esposizione è trascurabile in quanto i lavoratori non sono soggetti ad una prolungata osservazione del fascio di luce.',
  }),
  lampada('l8', 'Lampioni di illuminazione del campo base (piazzale uffici/mensa e piazzale dormitori)', 'Aree di passaggio', 'Esente', { utilizzo: 'Lampade da 150/250 W con vetro di protezione' }),
  stazione('z1', 'Stazione totale Leica TS15', 'Distanziometro (con prisma), ATR, PowerSearch', '1'),
  stazione('z2', 'Stazione totale Leica TS15', 'Piombino laser', '2'),
  stazione('z3', 'Stazione totale Leica TS15', 'Distanziometro (senza prisma)', '3R', laserNonGiust('Leica TS15')),
  stazione('z4', 'Stazione totale Leica TS16', 'Distanziometro (laser rosso visibile coassiale)', '3R', laserNonGiust('Leica TS16')),
  stazione('z5', 'Stazione totale Leica MS50', 'Distanziometro (Wave Form Digitising, laser rosso visibile coassiale)', '3R', laserNonGiust('Leica MS50')),
  stazione('z6', 'Stazione totale Leica MS60', 'Distanziometro (Wave Form Digitising, laser rosso visibile coassiale)', '3R', laserNonGiust('Leica MS60')),
]

/** Tabelle 15 e 16: il modello indica 0,0277 come angolo θ ma lo usa come angolo solido ω. */
export const RILIEVI_CASTAGNOLA: RilievoLuminanza[] = [{ id: 'r1', sorgente: 'Fari a paramento in galleria', ev: 35, distanza: 220, omega: 0.0277 }]

export const DPI_CASTAGNOLA: DpiSaldatura[] = [
  {
    id: 'd1',
    processo: 'elettrodi',
    etichetta: 'Saldatura ad elettrodo rivestito',
    min: 40,
    max: 100,
    dotazione: '10-11; 9-13',
    descrizione: 'maschere Würth WSH III DIN 10-11 e Würth Solar II DIN 9-13',
    condizioni: 'Distanza operatore-sorgente: ~50 cm; illuminamento medio dell’area in officina: 100 lux',
  },
  {
    id: 'd2',
    processo: 'mig_pesanti',
    etichetta: 'Saldatura MIG/MAG a filo continuo',
    min: 80,
    max: 170,
    dotazione: '10-11; 9-13',
    descrizione: 'maschere Würth WSH III DIN 10-11 e Würth Solar II DIN 9-13',
    condizioni: 'Distanza operatore-sorgente: ~50 cm; illuminamento medio dell’area in officina: 100 lux',
  },
  {
    id: 'd3',
    processo: 'ossitaglio',
    etichetta: 'Taglio con cannello ossiacetilenico',
    min: 1800,
    max: 3150,
    dotazione: '5',
    descrizione: 'occhiali SPARTA DIN 5',
    condizioni: 'Distanza operatore-sorgente: ~50 cm; illuminamento medio dell’ambiente di lavoro: 300 lux',
  },
]
