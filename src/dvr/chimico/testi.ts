/**
 * Testi predefiniti dei DVR Agenti chimici, Fumi di saldatura e Agenti cancerogeni, ripresi dai DVR
 * modello Castagnola e resi generici (senza riferimenti a un cantiere). Si modificano nel documento.
 */
import type { VocePiano } from '../comune/piano'
import type { TipoDvrChimico } from './agenti'

export interface TestiChimico {
  dpi?: string[]
  misure?: string[]
  campionamento?: string[]
  strumenti?: string[]
  tempi?: string[]
  piano?: VocePiano[]
}

const DPI_FACCIALI = [
  'I dispositivi di protezione individuale utilizzati dai lavoratori per ridurre l’esposizione alle polveri sono facciali filtranti ad “alta efficienza” del tipo FFP3 (UNI EN 149, perdita totale verso l’interno massima 2%), con fattore di protezione operativo pari a 30: sono quindi adatti a concentrazioni fino a 30 volte il valore limite dell’agente.',
  'In alternativa l’impresa mette a disposizione facciali filtranti a “media efficienza” del tipo FFP2 (perdita totale verso l’interno massima 8%), con fattore di protezione operativo pari a 10: sono adatti a concentrazioni fino a 10 volte il valore limite.',
]

export function testiPredefiniti(tipo: TipoDvrChimico, galleria: boolean): Required<TestiChimico> {
  const ventilazione = galleria ? ['impianto di ventilazione generale in galleria con portata regolabile;'] : []
  const cabine = 'cabine dei mezzi dotate di impianto di condizionamento, che permettono di lavorare con la cabina completamente chiusa;'
  const bagnatura = galleria
    ? ['bagnatura del marino subito dopo la volata, prima dell’inizio dello smarino;', 'bagnatura del tracciato delle gallerie e delle piste di cantiere;', 'bagnatura del fronte (tramite gli ugelli montati sul martello) durante le fasi di scavo e disgaggio;']
    : ['bagnatura delle piste di cantiere e delle aree di lavoro polverose;']
  const formazione = (art: string) =>
    `Formazione e informazione dei lavoratori e dei preposti (art. ${art} D.Lgs. 81/08) sul rischio specifico, sui risultati della valutazione e sulle misure da adottare, in particolare per i neoassunti prima che inizino le loro attività e ad ogni cambiamento delle lavorazioni che influisca sulla natura e sul grado dei rischi;`

  if (tipo === 'fumi_saldatura') {
    return {
      dpi: [DPI_FACCIALI[0]],
      misure: [
        'aerazione del locale officina attraverso le aperture di cui è dotato;',
        'impiego della cappa di aspirazione localizzata per l’abbattimento dei fumi;',
        'dotazione degli adeguati DPI per la protezione delle vie respiratorie;',
        'monitoraggi ambientali e valutazioni del rischio periodici.',
      ],
      campionamento: [
        'Al fine di valutare il rischio nell’officina durante l’attività di saldatura e calcolare l’esposizione dei lavoratori, sono stati effettuati campionamenti di gas, polveri respirabili e polveri inalabili, con analisi dei metalli potenzialmente presenti.',
        'I campionamenti sono stati eseguiti secondo la UNI EN ISO 10882 (parti 1 e 2): personali sul saldatore durante la saldatura, ambientali nell’officina a distanza dalla saldatura (esposizione indiretta degli altri lavoratori) e, dove possibile, in assenza di saldature per le concentrazioni di fondo.',
      ],
      strumenti: [
        'analizzatore multigas con sensori a celle elettrochimiche e IR;',
        'pompe a basso flusso per il prelievo delle polveri, con ciclone per la frazione respirabile e selettore per la frazione inalabile;',
        'membrane in policarbonato diametro 25 mm, porosità 0,8 µm;',
        'bilancia analitica per la pesata delle polveri e spettrofotometro per l’analisi dei metalli.',
      ],
      tempi: [
        'I risultati delle misure sono associati alle fasi lavorative durante le quali sono stati eseguiti i campionamenti; considerando la durata media di ciascuna fase è calcolato il livello di esposizione media giornaliera per ciascun addetto (media ponderata sulle 8 ore, UNI EN 689), confrontato con i valori limite.',
      ],
      piano: [
        { testo: 'Misure generali (art. 224 D.Lgs. 81/08):', sotto: [formazione('227'), 'limitare al minimo indispensabile il personale presente nell’officina durante le attività di saldatura.'] },
        {
          testo: 'Misure specifiche di protezione e prevenzione (art. 225 D.Lgs. 81/08):',
          sotto: [
            'durante le saldature utilizzare sempre la cappa di aspirazione, mantenuta secondo le indicazioni del costruttore, e mantenere il locale ben aerato;',
            'non sostare in prossimità dell’area di saldatura se non strettamente necessario e, in questo caso, indossare facciali filtranti FFP3;',
            'informare gli operatori sui prodotti utilizzati (schede di sicurezza di fili ed elettrodi) e sulle misure di protezione di occhi, mani, pelle e vie respiratorie;',
            'utilizzare DPI per le vie respiratorie (FFP3), guanti e schermi o maschere per saldatura adeguati;',
            'attivare la sorveglianza sanitaria dei saldatori (artt. 229 e 230 D.Lgs. 81/08).',
          ],
        },
      ],
    }
  }

  if (tipo === 'cancerogeno') {
    return {
      dpi: DPI_FACCIALI,
      misure: [...ventilazione, cabine, ...bagnatura, 'monitoraggi ambientali periodici e valutazione del rischio;', 'dotazione degli adeguati DPI (facciali filtranti FFP2 e FFP3).'],
      campionamento: [
        'Le misure sono state effettuate nelle principali postazioni di lavoro in cui è possibile la presenza di silice libera cristallina e di carbonio elementare, con campionamenti “d’area” in postazione fissa (concentrazioni nelle diverse aree, fasi di breve durata, condizioni del sistema ambiente-processo) e campionamenti “personali” su alcune mansioni.',
        'La silice libera cristallina è determinata sulla frazione respirabile per diffrattometria a raggi X; il carbonio elementare per analisi termo-ottica secondo il metodo NIOSH 5040. Quando la quantità sul filtro è inferiore al limite di rilevabilità, si usa la concentrazione corrispondente al limite di rilevabilità (condizione più gravosa).',
      ],
      strumenti: [
        'strumentazione per misure di temperatura e velocità dell’aria;',
        'pompe per prelievo polveri con selettori per la frazione respirabile (cicloni);',
        'membrane in policarbonato per le polveri e membrane in quarzo per il carbonio elementare;',
        'bilancia analitica, diffrattometro a raggi X e analizzatore termo-ottico per le determinazioni di laboratorio.',
      ],
      tempi: [
        'I dati forniti dall’impresa (durata delle lavorazioni e avanzamento nel periodo) e i risultati dei rilievi sono stati elaborati associando le concentrazioni misurate alle fasi lavorative; considerando la durata media di ciascuna fase è calcolato il livello di esposizione media giornaliera per ciascun addetto (UNI EN 689), confrontato con i valori limite dell’allegato XLIII del D.Lgs. 81/08.',
      ],
      piano: [
        {
          testo: 'Controllo e informazione:',
          sotto: [formazione('239'), 'proseguire i monitoraggi ambientali periodici di polveri, silice e carbonio elementare e aggiornare la valutazione; tenere il registro degli esposti (art. 243 D.Lgs. 81/08) se l’esposizione non è trascurabile.'],
        },
        {
          testo: 'Misure tecniche e organizzative:',
          sotto: [
            ...(galleria ? ['limitare al minimo il personale presente al fronte durante scavo, smarino e spritz e svolgere all’esterno le lavorazioni che non è necessario eseguire in galleria;', 'eseguire la manutenzione dell’impianto di ventilazione e verificare le portate rispetto al progetto;'] : []),
            'tenere chiusi i finestrini dei mezzi durante le lavorazioni polverose e curare la manutenzione degli impianti di climatizzazione e dei filtri;',
            'tenere umide le piste e le aree di lavoro; spegnere i motori durante le attese e controllare periodicamente i gas di scarico dei mezzi.',
          ],
        },
        { testo: 'Protezione individuale e sorveglianza sanitaria:', sotto: ['utilizzare i facciali filtranti FFP3 (o FFP2) nelle fasi a maggiore emissione di polveri e fumi;', 'attivare la sorveglianza sanitaria degli esposti (art. 242 D.Lgs. 81/08).'] },
      ],
    }
  }

  return {
    dpi: DPI_FACCIALI,
    misure: [...ventilazione, cabine, ...bagnatura, 'monitoraggi ambientali periodici e valutazione del rischio;', 'dotazione degli adeguati DPI (facciali filtranti FFP2 e FFP3).'],
    campionamento: [
      'Per le polveri in frazione respirabile sono stati effettuati campionamenti “d’area” in postazione fissa (concentrazioni nelle diverse aree di lavoro, fasi di breve durata, condizioni del sistema ambiente-processo) e campionamenti “personali” su alcune mansioni, per l’intera durata dell’attività.',
      'Per la determinazione di CO, CO₂, NO, NO₂, H₂S e O₂ si è utilizzata una strumentazione in grado di monitorare in continuo, con visualizzazione diretta del dato, posizionata in modo da ottenere dati rappresentativi della fase lavorativa. Tutte le misure sono state accompagnate dal rilievo della velocità dell’aria.',
      'Per le misure che non è stato possibile effettuare nel corso di questa campagna sono stati utilizzati dati di campagne precedenti, in condizioni lavorative e ambientali il più possibile simili.',
    ],
    strumenti: [
      'strumentazione per misure di temperatura e velocità dell’aria;',
      'pompe per prelievo polveri con selettori per la frazione respirabile (cicloni);',
      'analizzatore multigas con sensori a celle elettrochimiche e IR;',
      'membrane in policarbonato diametro 25 mm, porosità 0,8 µm, e bilancia analitica per la pesata delle polveri.',
    ],
    tempi: [
      'I dati forniti dall’impresa (durata delle lavorazioni e avanzamento nel periodo) e i risultati dei rilievi sono stati elaborati associando le concentrazioni misurate alle fasi lavorative durante le quali sono stati eseguiti i campionamenti.',
      'Considerata la durata media di ciascuna fase, è calcolato il livello di esposizione media giornaliera per ciascun addetto come media ponderata sulle 8 ore (UNI EN 689), confrontato con i valori TLV-TWA.',
    ],
    piano: [
      {
        testo: 'Misure generali (art. 224 D.Lgs. 81/08):',
        sotto: [
          formazione('227'),
          ...(galleria ? ['limitare al minimo indispensabile il personale presente in galleria e svolgere nel piazzale esterno tutte le lavorazioni che non è necessario svolgere in galleria;', 'eseguire la manutenzione dell’impianto di ventilazione, riparare rapidamente le perdite della tubazione e controllare le portate rispetto al progetto;'] : []),
          'effettuare la manutenzione periodica dei mezzi, in particolare degli impianti di climatizzazione, sostituendo i filtri secondo le indicazioni del fabbricante e annotando gli interventi in un registro;',
          'attivare la sorveglianza sanitaria (art. 229 D.Lgs. 81/08).',
        ],
      },
      {
        testo: 'Misure specifiche di protezione e prevenzione (art. 225 D.Lgs. 81/08):',
        sotto: [
          'gli operatori dei mezzi devono lavorare con la cabina chiusa;',
          'polveri: pulire la cabina dei mezzi e i filtri dell’aria con sistema aspirante, tenere umide le piste, usare i facciali filtranti durante le operazioni più polverose;',
          'gas: spegnere i motori durante le attese lunghe, usare gasolio a basso tenore di zolfo e controllare periodicamente i gas di scarico dei mezzi;',
          'proseguire i monitoraggi ambientali come da programma di igiene del lavoro.',
        ],
      },
      ...(galleria ? [{ testo: 'Disposizioni in caso di incidenti e di emergenza (art. 226 D.Lgs. 81/08):', sotto: ['applicare le procedure del piano di emergenza in caso di assenza o riduzione rilevante della ventilazione.'] }] : []),
    ],
  }
}
