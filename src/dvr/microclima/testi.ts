/**
 * Testi predefiniti del DVR Microclima, ricavati dai quattro DVR modello e resi generici.
 * Il tecnico li può sostituire dall'editor (misure preventive, piano, vestiario).
 */
import type { VocePiano } from '../comune/piano'
import { estivo, type ScenarioMicroclima } from './valutazione'

export { pianoDaTesto, pianoInTesto, type VocePiano } from '../comune/piano'

export interface CapoVestiario {
  capo: string
  clo: number
}


export const galleria = (s: ScenarioMicroclima) => s === 'galleria_inverno' || s === 'galleria_estate'

/** Vestiario invernale del DVR Castagnola (tabella 3). */
export const VESTIARIO_INVERNALE: CapoVestiario[] = [
  { capo: 'Biancheria', clo: 0.11 },
  { capo: 'Pantaloni lunghi pesanti', clo: 0.32 },
  { capo: 'Maglietta a maniche lunghe', clo: 0.22 },
  { capo: 'Calze corte', clo: 0.04 },
  { capo: 'Giacca pesante', clo: 0.49 },
  { capo: 'Scarpe chiuse (suola spessa)', clo: 0.04 },
  { capo: 'Elmetto', clo: 0.06 },
]

export const CLO_PREDEFINITO = (s: ScenarioMicroclima) => (estivo(s) ? 0.5 : 1.5)

export function vestiarioPredefinito(s: ScenarioMicroclima): CapoVestiario[] {
  return estivo(s) ? [] : VESTIARIO_INVERNALE.map((c) => ({ ...c }))
}

export function misurePredefinite(s: ScenarioMicroclima): string[] {
  const stagione = estivo(s) ? 'estivo' : 'invernale'
  const out = [
    `L’impresa fornisce a tutti i lavoratori indumenti da lavoro adeguati al periodo ${stagione}, il cui isolamento termico intrinseco è stato valutato nel paragrafo precedente.`,
  ]
  if (estivo(s)) out.push('A tutti i lavoratori è garantita una sufficiente quantità d’acqua durante il turno di lavoro.')
  out.push(
    estivo(s)
      ? 'Le cabine dei mezzi sono dotate di impianto di condizionamento.'
      : 'Le cabine dei mezzi sono dotate di impianto di climatizzazione e riscaldamento, tale per cui i lavoratori possono regolare la temperatura in base alle loro esigenze.',
  )
  if (!estivo(s)) {
    out.push(
      'Quando si verificano condizioni climatiche particolarmente avverse (temperature di gelo, pioggia intensa, neve, forte vento, ecc.) le attività in esterno sono sospese.',
    )
  }
  return out
}

const SINTOMI_CALDO: VocePiano = {
  testo: 'negli incontri formativi evidenziare i sintomi dovuti all’eccessivo affaticamento da calore o stress termico, quali ad esempio:',
  sotto: [
    'battito cardiaco accelerato e prolungato per parecchi minuti;',
    'temperatura corporea interna superiore a 38,5 °C in personale sanitariamente idoneo e acclimatato;',
    'dopo uno sforzo da lavoro di picco, battito cardiaco superiore a 120 bpm dopo un recupero di un minuto;',
    'sintomi di affaticamento improvviso e grave, nausea, vertigini, capogiri;',
  ],
}

const VENTILAZIONE: VocePiano[] = [
  { testo: 'regolare la portata del ventilatore in modo da assicurare una velocità di deflusso dell’aria conforme alle prescrizioni progettuali;' },
  { testo: 'eseguire rapidamente la manutenzione del tubo di ventilazione in caso di rotture o strappi, onde evitare il più possibile abbassamenti di portata;' },
  { testo: 'limitare il più possibile le curvature del tubo di ventilazione in modo da ridurre le perdite di carico;' },
]

const COMUNI: VocePiano[] = [
  { testo: 'effettuare la manutenzione degli impianti di condizionamento e riscaldamento dei mezzi, in modo che all’interno dei mezzi gli operatori possano regolare sempre la temperatura;' },
  { testo: 'fornire a tutti gli operatori un vestiario adeguato al tipo di mansione ed alla stagione in cui si lavora, garantendo la possibilità di coprirsi o spogliarsi facilmente in funzione del tipo di attività;' },
]

export function pianoPredefinito(s: ScenarioMicroclima): VocePiano[] {
  if (s === 'esterno_inverno') {
    return [
      {
        testo: 'effettuare la formazione e l’informazione sul rischio specifico e in merito ai risultati della presente valutazione, con particolare riferimento a:',
        sotto: [
          'riconoscimento dei segni premonitori e dei sintomi clinici dello stress da freddo, anche in assenza di brividi;',
          'procedure corrette per il recupero del calore corporeo ed il primo soccorso;',
          'corrette abitudini alimentari ed idriche;',
        ],
      },
      ...COMUNI,
      { testo: 'mettere a disposizione guanti da usare nelle giornate più fredde, anche quando l’attività richiede una particolare agilità delle mani;' },
      { testo: 'rivestire di materiale isolante le attrezzature con impugnature metalliche;' },
      { testo: 'nelle giornate particolarmente fredde o ventose garantire a tutti i lavoratori che operano all’aperto la possibilità di ripararsi, nelle pause, in un locale adeguatamente riscaldato;' },
      { testo: 'sospendere le attività non essenziali in caso di condizioni meteo particolarmente avverse (forte vento, gelo, neve).' },
    ]
  }
  const out: VocePiano[] = [
    { testo: 'effettuare la formazione sul rischio specifico e l’informazione in merito ai risultati della presente valutazione;' },
    SINTOMI_CALDO,
  ]
  if (galleria(s)) out.push(...VENTILAZIONE)
  out.push(...COMUNI, { testo: 'garantire una adeguata quantità di acqua a tutti gli operatori;' })
  out.push({
    testo:
      s === 'esterno_estate'
        ? 'garantire a tutti i lavoratori dei periodi di riposo in luoghi ombreggiati durante la normale attività lavorativa;'
        : 'garantire a tutti i lavoratori dei periodi di riposo durante la normale attività lavorativa;',
  })
  out.push({ testo: 'garantire a tutti i lavoratori brevi pause di riposo durante la normale attività lavorativa, in particolare nelle giornate particolarmente calde (T > 30 °C).' })
  if (estivo(s)) {
    out.push(
      { testo: 'nelle giornate in cui si superano i 30 °C programmare le lavorazioni più gravose nelle ore meno calde e prevedere pause in luoghi freschi o ombreggiati, con frequenza e durata crescenti con il dispendio metabolico;' },
      { testo: 'mettere a disposizione dei lavoratori acqua fresca e integratori salini;' },
    )
  }
  return out
}
