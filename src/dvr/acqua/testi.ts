/**
 * Testi della relazione di monitoraggio delle acque di cantiere. Non c'è un documento modello ECO-TER:
 * i testi seguono il D.Lgs. 152/2006 (scarichi) e il D.Lgs. 18/2023 (acque destinate al consumo umano)
 * e sono modificabili nel documento.
 */
import type { VocePiano } from '../comune/piano'
import { eGalleria, type TipoAmbito } from '../comune/tipi'
import type { ValutazioneAcqua } from './valutazione'

export interface TestiAcqua {
  normativa?: string[]
  misurePreventive?: string[]
  strumenti?: string[]
  piano?: VocePiano[]
}

export const NORMATIVA: string[] = [
  'D.Lgs. 3 aprile 2006, n. 152 e s.m.i., parte III (tutela delle acque dall’inquinamento), allegato 5, tabella 3 (valori limite di emissione per gli scarichi in acque superficiali e in rete fognaria);',
  'D.Lgs. 23 febbraio 2023, n. 18 (attuazione della direttiva (UE) 2020/2184 sulla qualità delle acque destinate al consumo umano), allegato I;',
  'D.Lgs. 9 aprile 2008, n. 81 e s.m.i., allegato IV punto 1.13 (acqua potabile e servizi igienico-assistenziali nei luoghi di lavoro);',
  'Autorizzazione allo scarico e prescrizioni dell’ente competente, ove presenti;',
  'Metodi analitici per le acque APAT-IRSA CNR (Manuali e linee guida 29/2003): metodi 2060 (pH), 2030 (conducibilità), 2100 (temperatura) e 4120 (ossigeno disciolto).',
]

export const PARAMETRI_TESTI: string[] = [
  'pH: misura l’acidità o la basicità dell’acqua. Nelle acque di cantiere valori elevati (fino a 11–12) sono tipici del contatto con calcestruzzo, spritz-beton e malte cementizie; valori bassi possono derivare da acque di drenaggio di rocce contenenti solfuri.',
  'Conducibilità elettrica (µS/cm): è proporzionale al contenuto di sali disciolti; aumenta con le acque di contatto con i materiali cementizi e con le acque di falda mineralizzate.',
  'Temperatura dell’acqua e dell’ambiente (°C): influisce sulla solubilità dell’ossigeno e sugli equilibri chimici; per gli scarichi in corsi d’acqua la variazione di temperatura a valle dello scarico è regolata dalle note della tabella 3 del D.Lgs. 152/2006.',
  'Ossigeno disciolto (mg/L e % di saturazione): indica lo stato di ossigenazione dell’acqua; valori bassi segnalano la presenza di sostanze ossidabili o ristagni.',
]

export const METODOLOGIA: string[] = [
  'I punti di monitoraggio sono stati individuati con la Direzione di Cantiere lungo il percorso delle acque: venute d’acqua e acque di galleria, vasche di decantazione e di trattamento, punti di scarico, rete dell’acqua per uso igienico-sanitario.',
  'Le misure sono state eseguite in campo con sonde multiparametriche immerse direttamente nell’acqua o in un campione appena prelevato, dopo la stabilizzazione della lettura; per ogni punto sono state registrate anche la data e la temperatura dell’aria.',
  'I valori misurati sono confrontati con i limiti della destinazione dell’acqua di ciascun punto (consumo umano, scarico in acque superficiali o in fognatura) o, in mancanza di una destinazione regolata, riportati come indicatori del processo di trattamento.',
]

export const STRUMENTI: string[] = [
  'pHmetro portatile con elettrodo combinato e compensazione automatica della temperatura, tarato con soluzioni tampone a pH 4, 7 e 10;',
  'conduttimetro portatile con cella di misura e compensazione della temperatura a 20 °C (o 25 °C);',
  'ossimetro portatile a sonda ottica o polarografica, con lettura in mg/L e in % di saturazione;',
  'termometro digitale per la temperatura dell’acqua e dell’aria.',
]

export function misurePredefinite(tipi: TipoAmbito[]): string[] {
  return [
    ...(tipi.some(eGalleria) ? ['raccolta delle acque di galleria in canalette e pozzetti e convogliamento all’impianto di trattamento;'] : []),
    'vasche di decantazione per la separazione dei solidi sospesi e disoleatori per gli idrocarburi;',
    'correzione del pH delle acque basiche (dosaggio di anidride carbonica o acido) prima dello scarico;',
    'pulizia periodica delle vasche e smaltimento dei fanghi come rifiuti;',
    'acqua per uso igienico-sanitario da rete pubblica o da serbatoi puliti e controllati periodicamente.',
  ]
}

export function pianoPredefinito(v: ValutazioneAcqua): VocePiano[] {
  const nc = v.punti.filter((p) => p.nonConformi.length)
  const phAlto = nc.some((p) => p.nonConformi.includes('ph') && p.intervalli.ph && p.limiti.phMax != null && p.intervalli.ph.max > p.limiti.phMax)
  return [
    {
      testo: 'Gestione degli impianti:',
      sotto: [
        'mantenere in efficienza vasche di decantazione, disoleatori e impianto di correzione del pH, con pulizia periodica e registrazione degli interventi;',
        ...(phAlto ? ['nei punti con pH oltre il limite verificare il dosaggio del correttore e trattenere l’acqua nelle vasche fino al rientro nei limiti prima dello scarico;'] : []),
        ...(nc.length ? [`ricercare le cause dei valori non conformi in ${nc.map((p) => p.punto.nome).join(', ')} e ripetere le misure dopo gli interventi;`] : []),
      ],
    },
    {
      testo: 'Monitoraggio:',
      sotto: [
        'proseguire le misure periodiche nei punti di monitoraggio e ogni volta che cambiano le lavorazioni (getti, spritz-beton, iniezioni) o le venute d’acqua;',
        'rispettare le prescrizioni e le frequenze dell’autorizzazione allo scarico e far eseguire le analisi di laboratorio dei parametri non misurabili in campo;',
        'controllare periodicamente l’acqua per uso igienico-sanitario dei servizi di cantiere e del campo base.',
      ],
    },
  ]
}
