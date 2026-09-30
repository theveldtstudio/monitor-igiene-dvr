/**
 * Testi del DVR Campi elettromagnetici. Non c'è un DVR modello ECO-TER: i testi seguono il D.Lgs. 81/08
 * (Titolo VIII Capo IV, allegato XXXVI dal D.Lgs. 159/2016), la direttiva 2013/35/UE e la procedura
 * CEI EN 50499. Nel documento restano modificabili.
 */
import type { VocePiano } from '../comune/piano'
import type { TipoAmbito } from '../comune/tipi'
import type { ValutazioneCem } from './valutazione'

export interface TestiCem {
  normativa?: string[]
  misurePreventive?: string[]
  organizzazione?: string[]
  strumentazione?: string
  sensibili?: string
  piano?: VocePiano[]
}

export const NORMATIVA: string[] = [
  'D.Lgs. 9 aprile 2008, n. 81 e s.m.i., Titolo VIII, Capi I e IV, e allegato XXXVI, come modificati dal D.Lgs. 1 agosto 2016, n. 159;',
  'Direttiva 2013/35/UE del 26 giugno 2013 sulle disposizioni minime di sicurezza e di salute relative all’esposizione dei lavoratori ai rischi derivanti dagli agenti fisici (campi elettromagnetici);',
  'Guida non vincolante di buone prassi per l’attuazione della direttiva 2013/35/UE (Commissione europea), volumi 1 e 2;',
  'Raccomandazione del Consiglio 1999/519/CE del 12 luglio 1999 relativa alla limitazione dell’esposizione della popolazione ai campi elettromagnetici da 0 Hz a 300 GHz;',
  'Legge 22 febbraio 2001, n. 36 e D.P.C.M. 8 luglio 2003 (esposizione della popolazione);',
  'CEI EN 50499 – Procedura per la valutazione dell’esposizione dei lavoratori ai campi elettromagnetici;',
  'CEI EN 62311 – Valutazione degli apparecchi elettrici ed elettronici relativamente ai limiti di esposizione umana ai campi elettromagnetici (0 Hz – 300 GHz);',
  'Linee guida ICNIRP per la limitazione dell’esposizione ai campi elettrici e magnetici variabili nel tempo;',
  'Indicazioni operative per la prevenzione e protezione dai rischi dovuti all’esposizione a campi elettromagnetici nei luoghi di lavoro (Coordinamento Tecnico per la sicurezza nei luoghi di lavoro delle Regioni e delle Province autonome, INAIL).',
]

export const CARATTERISTICHE: string[] = [
  'I campi elettromagnetici (CEM) sono campi elettrici statici, campi magnetici statici e campi elettrici, magnetici ed elettromagnetici variabili nel tempo di frequenza fino a 300 GHz (art. 207 D.Lgs. 81/08). Sono prodotti da tutte le apparecchiature e gli impianti elettrici, dalle linee e cabine di distribuzione dell’energia, dai motori, dalle saldatrici e dai trasmettitori radio.',
  'Alle basse frequenze (fino a 10 MHz) i campi inducono nel corpo campi elettrici e correnti che possono stimolare nervi e muscoli e provocare effetti sensoriali transitori (fosfeni retinici, lievi alterazioni di alcune funzioni cerebrali; vertigini e nausea nei campi magnetici statici o in movimento): sono gli effetti non termici.',
  'Alle radiofrequenze (da 100 kHz a 300 GHz) l’energia assorbita dai tessuti si trasforma in calore: gli effetti termici dipendono dal tasso di assorbimento specifico (SAR) e, oltre 6 GHz, dalla densità di potenza incidente.',
  'Sono inoltre da considerare gli effetti indiretti: interferenza con dispositivi medici impiantati attivi (pacemaker, defibrillatori, neurostimolatori) o passivi (protesi e clip metalliche) e con dispositivi indossati (pompe per insulina), propulsione di oggetti ferromagnetici nei campi statici intensi, correnti di contatto e scariche, innesco di detonatori elettrici e di atmosfere infiammabili.',
  'La valutazione si basa sui valori limite di esposizione (VLE), riferiti a grandezze interne al corpo non misurabili direttamente, e sui valori di azione (VA), grandezze misurabili nell’ambiente di lavoro (campo elettrico E in V/m, induzione magnetica B in µT): il rispetto dei VA garantisce il rispetto dei VLE (art. 208 D.Lgs. 81/08).',
  'Alle basse frequenze i VA inferiori per il campo elettrico prevengono le scariche elettriche e quelli per l’induzione magnetica gli effetti sensoriali; i VA superiori sono riferiti agli effetti sanitari. I VA per l’esposizione degli arti riguardano i campi localizzati (utensili tenuti in mano, cavi di saldatura).',
  'I valori di azione non tutelano i lavoratori particolarmente sensibili al rischio (portatori di dispositivi medici impiantati attivi o passivi, di dispositivi indossati, lavoratrici in gravidanza): per loro si adottano i livelli di riferimento per la popolazione della raccomandazione 1999/519/CE.',
]

export const GIUSTIFICABILI: string[] = [
  'attrezzature da ufficio e informatiche, anche con collegamenti senza fili (Wi-Fi, Bluetooth) per uso pubblico;',
  'utensili elettrici portatili e trasportabili, apparecchi di riscaldamento manuali non a induzione, caricabatterie;',
  'apparecchi elettrici per uso domestico e similare, apparecchi di illuminazione non a radiofrequenza, strumenti di misura e controllo;',
  'telefoni cellulari, radio portatili e dispositivi a bassa potenza marcati CE e usati secondo le istruzioni del fabbricante;',
  'impianti elettrici a 50 Hz con corrente fino a 100 A per fase, cavi isolati o interrati;',
  'stazioni radio base e antenne, per i lavoratori che restano alle distanze previste per la popolazione.',
]

export const DA_VALUTARE: string[] = [
  'saldatura ad arco e a resistenza, fusione e riscaldamento a induzione;',
  'cabine di trasformazione, trasformatori, quadri e linee a 50 Hz con correnti superiori a 100 A per fase;',
  'motori, azionamenti e impianti di grande potenza, gruppi elettrogeni;',
  'magneti permanenti ed elettromagneti (sollevatori magnetici, smagnetizzatori);',
  'trasmettitori a radiofrequenza (ponti radio, antenne, stazioni base) per chi lavora nelle loro vicinanze, radar;',
  'apparecchiature non marcate CE, modificate o usate diversamente da quanto previsto dal fabbricante.',
]

export const METODOLOGIA: string[] = [
  'censimento delle sorgenti di campi elettromagnetici presenti nel cantiere e delle mansioni che lavorano nelle loro vicinanze;',
  'giustificazione secondo la norma CEI EN 50499: le attrezzature e le situazioni della tabella 1 della norma sono conformi a priori ai livelli per la popolazione, se installate e usate secondo le istruzioni del fabbricante; per le altre si procede alla valutazione specifica;',
  'valutazione specifica sui dati del fabbricante, sui dati di letteratura o con misure in campo del campo elettrico e dell’induzione magnetica alle distanze di lavoro;',
  'confronto con i valori di azione inferiori e superiori (allegato XXXVI) e con i livelli di riferimento per la popolazione (raccomandazione 1999/519/CE), classificazione delle aree e individuazione delle misure di prevenzione e protezione.',
]

export const ZONE: string[] = [
  'Zona 0: livelli inferiori ai livelli di riferimento per la popolazione, oppure sorgenti tutte giustificabili; accesso libero, anche ai lavoratori particolarmente sensibili.',
  'Zona 1: possono essere superati i livelli per la popolazione ma sono rispettati i valori di azione superiori; accesso consentito ai soli lavoratori informati e formati e idonei secondo il medico competente, vietato ai lavoratori particolarmente sensibili; area delimitata e segnalata. Dove sono superati i valori di azione inferiori si applicano le misure specifiche dell’art. 210 D.Lgs. 81/08.',
  'Zona 2: possono essere superati i valori di azione superiori; accesso vietato salvo misure che garantiscano il rispetto dei valori limite di esposizione per i lavoratori autorizzati.',
]

export const STRUMENTAZIONE =
  'Le misure sono state eseguite con un analizzatore di campi elettromagnetici a sonda isotropa per il campo elettrico e l’induzione magnetica, posizionando la sonda nei punti occupati dai lavoratori alle distanze di lavoro indicate e rilevando i valori efficaci (rms) alla frequenza di funzionamento della sorgente.'

export const SENSIBILI =
  'Il datore di lavoro verifica, con il medico competente, la presenza di lavoratori particolarmente sensibili al rischio (portatori di dispositivi medici impiantati attivi o passivi, di dispositivi medici indossati, lavoratrici in gravidanza), invitando i lavoratori a segnalare la propria condizione. Per questi lavoratori l’accesso alle zone 1 e 2 è vietato e l’esposizione deve rispettare i livelli di riferimento per la popolazione.'

export const ORGANIZZAZIONE: string[] = [
  'Le sorgenti sono installate e usate secondo le istruzioni del fabbricante; cabine elettriche, quadri e gruppi elettrogeni sono in aree dedicate, con accesso riservato al personale incaricato.',
]

export const MISURE_PREVENTIVE: string[] = [
  'uso di attrezzature marcate CE, installate e mantenute secondo le istruzioni del fabbricante;',
  'accesso alle cabine elettriche e ai locali quadri riservato al personale autorizzato;',
  'informazione dei lavoratori sui rischi per i portatori di dispositivi medici impiantati.',
]

/** Piano proposto dal calcolo (modificabile). */
export function pianoPredefinito(v: ValutazioneCem, tipi: readonly TipoAmbito[] = []): VocePiano[] {
  const esiti = v.sorgenti.map((s) => s.esito)
  const oltrePopolazione = esiti.some((e) => e && e !== 'popolazione')
  const oltreVa = esiti.some((e) => e === 'vaInferiori' || e === 'vaSuperiori')
  const categorie = new Set(v.sorgenti.map((s) => s.sorgente.categoria))
  const generali = [
    'Informare e formare i lavoratori (art. 210-bis D.Lgs. 81/08) sui risultati della valutazione, sulle zone individuate, sugli effetti indiretti e sui rischi per i portatori di dispositivi medici impiantati.',
    'Invitare i lavoratori a comunicare al medico competente il possesso di dispositivi medici impiantati o indossati e lo stato di gravidanza, per le conseguenti limitazioni.',
    'Installare, usare e mantenere le sorgenti secondo le istruzioni del fabbricante; verificare la marcatura CE e le dichiarazioni di conformità delle nuove attrezzature.',
    'Aggiornare la valutazione quando cambiano sorgenti, lavorazioni o organizzazione e comunque almeno ogni quattro anni (art. 181 D.Lgs. 81/08).',
  ]
  const specifiche: string[] = []
  if (oltrePopolazione) {
    specifiche.push(
      'Delimitare e segnalare le aree in cui sono superati i livelli per la popolazione (zona 1), con il segnale di pericolo per campi elettromagnetici e il divieto di accesso ai portatori di dispositivi medici impiantati, alle distanze di rispetto indicate nel documento.',
      'Vietare l’accesso a tali aree ai lavoratori particolarmente sensibili al rischio.',
    )
  }
  if (oltreVa) {
    specifiche.push(
      'Ridurre l’esposizione dove sono superati i valori di azione (art. 210 D.Lgs. 81/08): aumento della distanza dalla sorgente, schermature, limitazione del tempo di permanenza, modifica delle modalità operative.',
      'Sottoporre a sorveglianza sanitaria i lavoratori esposti oltre i valori di azione (art. 211 D.Lgs. 81/08).',
    )
  }
  if (categorie.has('saldatura')) {
    specifiche.push(
      'Saldatura: tenere i cavi di alimentazione e di massa vicini tra loro e dallo stesso lato del corpo, non avvolgerli attorno al corpo, non sedersi né appoggiarsi al generatore e mantenerne la massima distanza compatibile con il lavoro.',
    )
  }
  if ((categorie.has('telefonia') || categorie.has('rf')) && tipi.includes('galleria_tradizionale')) {
    specifiche.push(
      'Durante il caricamento delle volate con inneschi elettrici tenere radio portatili, telefoni e altri trasmettitori alle distanze di sicurezza indicate dal fabbricante degli inneschi.',
    )
  }
  if (categorie.has('magneti')) {
    specifiche.push('Magneti ed elettromagneti: non avvicinare oggetti ferromagnetici liberi e segnalare il divieto di accesso ai portatori di dispositivi medici impiantati.')
  }
  return [
    { testo: 'Misure generali', sotto: generali },
    ...(specifiche.length ? [{ testo: 'Misure specifiche', sotto: specifiche }] : []),
  ]
}
