/**
 * Testi del DVR Agenti biologici. Non c'è un DVR modello ECO-TER: i testi seguono il D.Lgs. 81/08
 * (Titolo X, allegati XLVI–XLVIII) e sono modificabili nel documento. L'elenco degli agenti potenziali
 * proposto dipende dagli ambiti del documento.
 */
import type { VocePiano } from '../comune/piano'
import { eGalleria, type TipoAmbito } from '../comune/tipi'
import type { AgenteBiologico, ValutazioneBiologica } from './valutazione'

export interface TestiBiologico {
  normativa?: string[]
  misurePreventive?: string[]
  sorveglianza?: string[]
  piano?: VocePiano[]
}

export const NORMATIVA: string[] = [
  'D.Lgs. 9 aprile 2008, n. 81 e s.m.i., Titolo X “Esposizione ad agenti biologici” e allegati XLVI (elenco degli agenti classificati), XLVII e XLVIII (misure di contenimento);',
  'Direttiva 2000/54/CE relativa alla protezione dei lavoratori contro i rischi derivanti da un’esposizione ad agenti biologici durante il lavoro e direttiva (UE) 2019/1833 (aggiornamento dell’elenco degli agenti);',
  'Legge 5 marzo 1963, n. 292 e s.m.i. (vaccinazione antitetanica obbligatoria per i lavoratori edili e delle altre categorie indicate);',
  'Linee guida per la prevenzione e il controllo della legionellosi (Conferenza Stato-Regioni, 7 maggio 2015);',
  'UNI EN 13098 – Esposizione negli ambienti di lavoro – Misurazione di microrganismi e composti microbici aerodispersi;',
  'UNI EN ISO 14698-1 – Camere bianche e ambienti associati controllati – Controllo della biocontaminazione (principi generali del campionamento dell’aria);',
  'European Collaborative Action “Indoor air quality & its impact on man”, report n. 12 (1993): Biological particles in indoor environments.',
]

export const CARATTERISTICHE: string[] = [
  'Per agente biologico si intende qualsiasi microrganismo, anche geneticamente modificato, coltura cellulare ed endoparassita umano che potrebbe provocare infezioni, allergie o intossicazioni (art. 267 D.Lgs. 81/08).',
  'Nei cantieri non si usano deliberatamente agenti biologici: l’esposizione è potenziale e deriva dal contatto con terra, acqua, fanghi e reflui, da punture di insetti e zecche, da impianti idrici e di climatizzazione e dal primo soccorso. In questi casi il datore di lavoro valuta il rischio e applica le misure del Titolo X che risultano pertinenti (art. 271 c. 4).',
  'Gli agenti biologici sono classificati in quattro gruppi in base alla pericolosità (art. 268 e allegato XLVI):',
]

export const METODOLOGIA: string[] = [
  'individuazione, per ogni ambito di lavoro, degli agenti biologici potenzialmente presenti, delle vie di trasmissione e delle mansioni che possono essere esposte;',
  'stima della probabilità P di esposizione (1 improbabile, 2 poco probabile, 3 probabile, 4 molto probabile) sulla base delle lavorazioni, dei luoghi e delle misure già adottate;',
  'stima del danno D dal gruppo di pericolosità dell’agente (gruppo 1 → 1, gruppo 2 → 2, gruppo 3 → 3, gruppo 4 → 4), modificabile in presenza di vaccino efficace o di effetti solo allergici;',
  'calcolo dell’indice di rischio R = P × D e classificazione;',
  'misura della carica microbica dell’aria negli ambienti chiusi e confinati (uffici, spogliatoi, mense, galleria), dove eseguita;',
  'definizione delle misure di prevenzione e protezione e del programma di sorveglianza sanitaria.',
]

export const CAMPIONAMENTO: string[] = [
  'La carica microbica dell’aria è stata misurata con un campionatore ad impatto (SAS – Surface Air System), che aspira un volume noto di aria e lo fa impattare su piastre di terreno di coltura: agar per la conta batterica totale incubato a 22 °C (batteri ambientali) e a 36 °C (batteri mesofili, anche di origine umana) e agar Sabouraud per muffe e lieviti.',
  'Dopo l’incubazione si contano le colonie; il numero, corretto con la tabella statistica del campionatore e diviso per il volume aspirato, dà la concentrazione in unità formanti colonia per metro cubo (UFC/m³).',
  'Non esistono valori limite di legge per la carica microbica dell’aria: i risultati sono confrontati con le categorie indicative della European Collaborative Action (report n. 12, 1993) per gli ambienti non industriali, riportate nella tabella seguente.',
]

export const MISURE_PREVENTIVE: string[] = [
  'servizi igienici, spogliatoi e docce mantenuti puliti e con acqua calda e fredda; lavaggio delle mani prima dei pasti e a fine turno;',
  'cassetta di primo soccorso con disinfettanti; medicazione immediata di ferite e abrasioni;',
  'vaccinazione antitetanica dei lavoratori secondo la legge 292/1963;',
  'guanti, stivali e indumenti di lavoro per le lavorazioni con terra, fanghi e acque;',
  'derattizzazione e disinfestazione periodiche delle aree di cantiere e del campo base;',
  'manutenzione e pulizia periodica degli impianti idrici e di climatizzazione.',
]

export const SORVEGLIANZA: string[] = [
  'Per i lavoratori per i quali la valutazione ha evidenziato un rischio per la salute il datore di lavoro, su conforme parere del medico competente, mette a disposizione vaccini efficaci e ne informa i lavoratori (art. 279 D.Lgs. 81/08). La vaccinazione antitetanica è obbligatoria per i lavoratori edili (legge 292/1963).',
  'La sorveglianza sanitaria è attivata per i lavoratori esposti ad agenti biologici per i quali la valutazione lo rende necessario (art. 279); il medico competente può proporre l’allontanamento temporaneo del lavoratore e segnala eventuali casi di malattia o decesso dovuti all’esposizione.',
  'Il registro degli esposti (art. 280) è richiesto solo per l’esposizione ad agenti dei gruppi 3 e 4 derivante dall’attività lavorativa: nel cantiere l’esposizione è potenziale e il registro non è di norma necessario, salvo diversa valutazione del medico competente.',
]

let n = 0
const A = (x: Omit<AgenteBiologico, 'id'>): AgenteBiologico => ({ id: `ag-${++n}`, ...x })

/** Agenti potenziali proposti per gli ambiti del documento (il tecnico li modifica). */
export function agentiPredefiniti(tipi: TipoAmbito[]): AgenteBiologico[] {
  const esterno = tipi.some((t) => t === 'viadotto' || t === 'opere_esterne' || t === 'piazzale')
  const galleria = tipi.some(eGalleria)
  const campo = tipi.some((t) => t === 'campo_base' || t === 'uffici')
  const out: AgenteBiologico[] = [
    A({ nome: 'Clostridium tetani', gruppo: 2, malattia: 'Tetano', trasmissione: 'Ferite, abrasioni e punture con materiale contaminato da terra', attivita: 'Tutte le lavorazioni operative (scavi, carpenteria, movimentazione di materiali)', probabilita: 2, danno: 2, vaccino: 'Antitetanico (obbligatorio, L. 292/1963)' }),
    A({ nome: 'Leptospira interrogans', gruppo: 2, malattia: 'Leptospirosi', trasmissione: 'Contatto di cute lesa e mucose con acque, fanghi e terreni contaminati dalle urine di roditori', attivita: galleria ? 'Scavi con venute d’acqua, drenaggi, vasche di decantazione' : 'Scavi con acqua, drenaggi, lavori in prossimità di corsi d’acqua', probabilita: 2 }),
    A({ nome: 'Legionella pneumophila', gruppo: 2, malattia: 'Legionellosi', trasmissione: 'Inalazione di aerosol da impianti idrici (docce, serbatoi) e da acqua nebulizzata', attivita: campo ? 'Docce e impianti idrici del campo base, bagnatura con acqua nebulizzata' : 'Docce di cantiere, bagnatura con acqua nebulizzata', probabilita: 1 }),
    A({ nome: 'Enterobatteri (Escherichia coli) e virus dell’epatite A', gruppo: 2, malattia: 'Gastroenteriti, epatite A', trasmissione: 'Via oro-fecale: contatto con reflui, fognature, servizi igienici', attivita: 'Allacci fognari, manutenzione dei servizi igienici e delle fosse settiche', probabilita: 1, vaccino: 'Epatite A (su indicazione del medico competente)' }),
    A({ nome: 'Muffe (Aspergillus spp., Penicillium spp.)', gruppo: 2, malattia: 'Allergie e irritazioni delle vie respiratorie', trasmissione: 'Inalazione di spore da polveri, materiali umidi e impianti di climatizzazione', attivita: galleria ? 'Ambienti umidi e confinati, galleria, locali con impianti di climatizzazione' : 'Locali umidi e con impianti di climatizzazione', probabilita: 2, danno: 1 }),
    A({ nome: 'Virus dell’epatite B e C, HIV', gruppo: 3, malattia: 'Epatite B e C, AIDS', trasmissione: 'Contatto con sangue durante il primo soccorso', attivita: 'Addetti al primo soccorso', probabilita: 1, vaccino: 'Epatite B (su indicazione del medico competente)' }),
  ]
  if (esterno)
    out.push(
      A({ nome: 'Borrelia burgdorferi e virus TBE (trasmessi da zecche)', gruppo: 3, malattia: 'Malattia di Lyme, encefalite da zecca', trasmissione: 'Puntura di zecche in aree con vegetazione', attivita: 'Disboscamento, lavori in aree verdi e boschive, rilievi topografici', probabilita: 2, danno: 2, vaccino: 'Encefalite da zecca (in zone endemiche, su indicazione del medico competente)' }),
    )
  return out
}

/** Piano di contenimento proposto dal calcolo. */
export function pianoPredefinito(v: ValutazioneBiologica): VocePiano[] {
  const medi = v.agenti.filter((e) => e.classe === 'medio' || e.classe === 'alto')
  const aria = v.misure.filter((m) => m.peggiore === 'alta' || m.peggiore === 'molto alta')
  const nomi = (xs: string[]) => [...new Set(xs)].join(', ')
  const piano: VocePiano[] = [
    {
      testo: 'Misure generali (artt. 272 e 273 D.Lgs. 81/08):',
      sotto: [
        'mantenere puliti e in efficienza servizi igienici, spogliatoi, docce e mense; mettere a disposizione acqua, sapone e prodotti per la detersione della cute;',
        'vietare di mangiare, bere e fumare durante le lavorazioni con terra, fanghi e reflui e tenere separati gli indumenti di lavoro da quelli personali;',
        'eseguire la derattizzazione e la disinfestazione periodiche delle aree di cantiere e del campo base.',
      ],
    },
    {
      testo: 'Informazione, formazione e sorveglianza sanitaria (artt. 278 e 279 D.Lgs. 81/08):',
      sotto: [
        'informare e formare i lavoratori sui rischi biologici, sulle precauzioni igieniche, sull’uso dei DPI e sulla segnalazione immediata di ferite e punture;',
        'verificare lo stato della vaccinazione antitetanica di tutti i lavoratori (L. 292/1963) e offrire le altre vaccinazioni indicate dal medico competente;',
        ...(medi.length ? [`attivare la sorveglianza sanitaria per le mansioni esposte a ${nomi(medi.map((e) => e.agente.nome))} secondo il protocollo del medico competente.`] : []),
      ],
    },
    {
      testo: 'Misure specifiche e DPI:',
      sotto: [
        'guanti resistenti al taglio e impermeabili, stivali e indumenti da lavoro per le lavorazioni con terra, fanghi, acque e reflui; medicare subito ferite e abrasioni;',
        'addetti al primo soccorso: guanti monouso, visiera o occhiali e maschera per la respirazione bocca a bocca;',
        'gestire gli impianti idrici (docce, serbatoi) secondo le linee guida per la legionellosi: temperatura dell’acqua calda, pulizia e disinfezione periodica dei soffioni e dei serbatoi;',
        ...(v.agenti.some((e) => /zecch/i.test(e.agente.nome)) ? ['nei lavori in aree verdi usare indumenti chiari e coprenti e repellenti; controllare la cute a fine turno e rimuovere subito le zecche.'] : []),
        ...(aria.length ? [`ambienti con carica microbica alta (${nomi(aria.map((m) => m.misura.postazione))}): pulire e sanificare gli impianti di climatizzazione e i filtri, migliorare il ricambio d’aria e ripetere le misure.`] : []),
      ],
    },
  ]
  return piano
}
