/**
 * Testi predefiniti del DVR Rumore, ripresi dai DVR ECO-TER e aggiornati.
 * Sono il punto di partenza: nel documento restano modificabili (campo `contenuti` del DVR).
 */
import type { TipoAmbito } from '../comune/tipi'

export interface BloccoTesto {
  testo: string
  punti: string[]
}

export const CICLO_PREDEFINITO: Partial<Record<TipoAmbito, BloccoTesto[]>> = {
  galleria_tbm: [
    {
      testo:
        'La realizzazione della galleria è effettuata a mezzo di fresa meccanica a piena sezione (TBM). Lo scavo e il ' +
        'montaggio dei conci di rivestimento si alternano in modo ciclico; l’avanzamento è di tipo meccanizzato continuo. ' +
        'Il ciclo di lavorazione della TBM prevede in sequenza le seguenti fasi principali:',
      punti: [
        'scavo (avanzamento della fresa);',
        'iniezione della malta bicomponente tra il concio montato e le pareti della galleria, contestuale all’avanzamento;',
        'montaggio dell’anello di rivestimento con conci prefabbricati;',
        'movimentazione e trasporto dei conci con MSV e posa mediante erettore;',
        'allungamento del nastro trasportatore, del ventolino e delle tubazioni.',
      ],
    },
  ],
  galleria_tradizionale: [
    {
      testo:
        'La galleria è realizzata con metodo di scavo tradizionale. Il ciclo di avanzamento prevede in sequenza le ' +
        'seguenti fasi principali:',
      punti: [
        'perforazione del fronte e, se previsto, caricamento e brillamento delle volate oppure scavo con martellone;',
        'smarino del materiale abbattuto;',
        'disgaggio e messa in sicurezza del fronte;',
        'posa delle centine e spritz-beton;',
        'getto delle murette, dell’arco rovescio e del rivestimento definitivo nelle zone retrostanti.',
      ],
    },
  ],
  viadotto: [
    {
      testo:
        'Le lavorazioni per la realizzazione dei viadotti si svolgono all’aperto e comprendono le seguenti fasi principali:',
      punti: [
        'realizzazione delle fondazioni (pali e plinti);',
        'costruzione di pile e spalle;',
        'varo e posa degli impalcati;',
        'getti di completamento e finiture.',
      ],
    },
  ],
}

export const ZONIZZAZIONE_PREDEFINITA: Partial<Record<TipoAmbito, string>> = {
  galleria_tbm:
    'In relazione alla configurazione della TBM, caratterizzata dalla presenza di numerose sorgenti sonore distribuite ' +
    'lungo l’intero sviluppo della macchina (gruppi idraulici, motori, nastri trasportatori, coclee, impianti ausiliari, ' +
    'ventilazione e altre apparecchiature di servizio), non è possibile individuare una distanza univoca dal punto di ' +
    'emissione alla quale il livello di esposizione si riduca al di sotto di 85 dB(A). La zona con livelli sonori ' +
    'inferiori a tale valore è generalmente individuabile all’esterno della TBM, oltre l’area di influenza delle ' +
    'sorgenti di rumore presenti sulla macchina.',
  galleria_tradizionale:
    'Sono stati effettuati rilievi a distanze differenti durante le fasi lavorative particolarmente rumorose, al fine di ' +
    'verificare la distanza dal fronte oltre la quale il livello sonoro scende al di sotto di 85 dB(A).',
}

export const PIANO_INTRO =
  'Sulla base dei risultati della presente valutazione, al fine di mantenere i livelli di esposizione entro valori ' +
  'accettabili e perseguire il miglioramento continuo delle condizioni di lavoro, si raccomanda l’adozione delle ' +
  'seguenti misure tecniche, organizzative e procedurali.'

export const PIANO_PUNTI: string[] = [
  'Informare e formare periodicamente tutti i lavoratori sui rischi derivanti dall’esposizione al rumore, con particolare riferimento al corretto utilizzo dei dispositivi di protezione dell’udito, alle attività maggiormente rumorose e alle procedure operative previste.',
  'Limitare, ove tecnicamente possibile, la permanenza del personale non direttamente coinvolto nelle aree caratterizzate da livelli sonori elevati.',
  'Mantenere in perfetta efficienza macchine, impianti ausiliari, sistemi di ventilazione, gruppi idraulici, nastri trasportatori, mezzi di movimentazione e tutte le attrezzature di lavoro mediante un programma di manutenzione ordinaria e straordinaria, registrando gli interventi effettuati.',
  'Verificare periodicamente lo stato di usura di componenti meccanici, rivestimenti, carter, sistemi antivibranti e cabine dei mezzi, intervenendo tempestivamente in presenza di anomalie che possano determinare incrementi del livello di rumorosità.',
  'Utilizzare, ove disponibili, macchine e attrezzature caratterizzate da minori emissioni acustiche e privilegiare soluzioni tecniche che consentano la riduzione del rumore alla sorgente.',
  'Garantire la disponibilità di dispositivi di protezione individuale dell’udito adeguati ai livelli di esposizione rilevati e provvedere alla loro sostituzione quando risultino usurati, danneggiati o non più idonei.',
  'Vigilare sul corretto utilizzo dei DPI per l’udito durante tutte le attività nelle quali i livelli sonori superano i valori di azione previsti dal D.Lgs. 81/08, attraverso l’attività dei preposti e del personale di coordinamento.',
  'Assicurare che i segnali acustici di avvertimento installati sui mezzi e sulle attrezzature rimangano chiaramente percepibili anche nelle condizioni di massimo rumore ambientale, verificandone periodicamente il corretto funzionamento.',
  'Aggiornare la presente valutazione del rischio ogniqualvolta intervengano modifiche significative delle lavorazioni, delle attrezzature, dell’organizzazione del cantiere, dei tempi di esposizione o a seguito dell’introduzione di nuove macchine o nuovi DPI.',
  'Proseguire il monitoraggio periodico dell’esposizione al rumore nell’ambito del programma di igiene industriale del cantiere, al fine di verificare l’efficacia delle misure adottate e individuare eventuali ulteriori interventi di miglioramento.',
  'Sottoporre i lavoratori alla sorveglianza sanitaria secondo quanto previsto dall’art. 196 del D.Lgs. 81/08, in funzione dei livelli di esposizione rilevati e delle valutazioni del Medico Competente.',
]

/** Punto aggiunto quando almeno una mansione è in 3ª fascia (art. 192 c. 3). */
export const PUNTO_AREE_85 =
  'Segnalare con appositi cartelli, delimitare e limitare l’accesso ai luoghi di lavoro nei quali i lavoratori possono essere esposti a un rumore al di sopra dei valori superiori di azione (art. 192, comma 3, D.Lgs. 81/08).'

export const STUDIO_PREDEFINITO = {
  descrizione: 'Società di Ingegneria e di Servizi',
  esecutore: 'Eco-Ter S.r.l. di Pianoro (Bologna)',
}
