/**
 * Prepara i dati per il template Word del DVR Radiazioni ottiche artificiali
 * (public/templates/dvr/roa.docx), come il DVR ROA Castagnola 2026.
 */
import { datiCopertina, elenco, type DocumentoCopertina } from '../comune/copertina'
import type { AmbitoDvr, AnagraficaDvr } from '../comune/tipi'
import { unibile } from '../comune/unisciCelle'
import type { VocePiano } from '../comune/piano'
import { cicloPredefinito, type BloccoTesto } from '../rumore/testiPredefiniti'
import { PROCESSI_EN169 } from './en169'
import { giustificabile, LIMITE_LUMINANZA, lvArrotondata, TIPI_SORGENTE, valutaRoa, type DpiSaldatura, type RilievoLuminanza, type SorgenteRoa, type TipoSorgente, type ValutazioneRoa } from './valutazione'

export interface TestiRoa {
  ciclo?: BloccoTesto[]
  /** 6.6.1 DPI utilizzati: un DPI per voce */
  dpi?: string[]
  /** 6.6.2 organizzazione dei luoghi di lavoro */
  organizzazione?: string[]
  /** 8. strumento e modalità delle misure di illuminamento */
  strumentoMisure?: string
  sensibili?: string
  fotosensibilizzanti?: string
  piano?: VocePiano[]
}

export interface DatiDvrRoa {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: { id: string; nome: string; attivita?: string }[]
  sorgenti: SorgenteRoa[]
  rilievi: RilievoLuminanza[]
  dpi: DpiSaldatura[]
  testi?: TestiRoa
}

/** Numero con punto delle migliaia e virgola decimale, uguale in ogni ambiente (Node e browser). */
const num = (x: number) => {
  const [intera, decimali] = String(x).split('.')
  const segno = intera.startsWith('-') ? '-' : ''
  const cifre = intera.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return segno + cifre + (decimali ? `,${decimali}` : '')
}
const minuscolo = (s: string) => s.charAt(0).toLocaleLowerCase('it-IT') + s.slice(1)
const classeTesto = (s: SorgenteRoa) => s.classe?.trim() || 'Informazione non reperita'
const ORDINE: TipoSorgente[] = ['macchina', 'lampada', 'laser']

export const TESTI_SENSIBILI = 'Non sono presenti tra i lavoratori gruppi particolarmente sensibili al rischio, quali donne in stato di gravidanza o minorenni.'
export const TESTI_FOTOSENSIBILIZZANTI =
  'Durante le lavorazioni in cantiere non vengono utilizzate sostanze chimiche fotosensibilizzanti. Questo, comunque, non esclude che i singoli lavoratori facciano uso personale di agenti fotosensibilizzanti tra quelli riportati nella tabella seguente.'
export const STRUMENTO_MISURE = 'Le misure sono state eseguite con luxmetro posizionando lo strumento in prossimità della sorgente, con la testa fotometrica parallela al piano di calpestio.'

export function organizzazionePredefinita(sorgenti: SorgenteRoa[]): string[] {
  if (!sorgenti.some((s) => s.saldatura)) return ['Nel cantiere non si eseguono saldature o tagli termici.']
  return [
    'Le operazioni di saldatura e taglio avvengono generalmente su un banco da lavoro all’interno dell’officina.',
    'Nelle aree di saldatura devono essere presenti i segnali di avvertimento del pericolo di radiazioni ultraviolette da saldatura e i cartelli di prescrizione dell’obbligo di usare i DPI (guanti protettivi e schermi o occhiali).',
  ]
}

export function pianoPredefinito(v: ValutazioneRoa): VocePiano[] {
  const saldature = v.nonGiustificabili.some((s) => s.saldatura)
  const laser = v.nonGiustificabili.filter((s) => s.tipo === 'laser')
  const out: VocePiano[] = []
  if (saldature) {
    out.push({
      testo: 'Al fine di limitare esposizioni indebite a ROA:',
      sotto: [
        'limitare l’accesso alle aree adibite all’esecuzione delle saldature e dei tagli termici, anche con schermi o tende di protezione;',
        'attivare i preposti affinché vigilino che nelle aree in cui vengono eseguite saldature e tagli termici non stazionino lavoratori non direttamente coinvolti nell’attività in corso.',
      ],
    })
  }
  out.push({
    testo:
      'Eseguire la formazione e l’informazione di tutti i lavoratori sui rischi dell’esposizione debita e indebita alle radiazioni ottiche coerenti e non coerenti; particolare importanza deve essere data alla formazione dei neoassunti, prima che inizino la loro attività in cantiere.',
  })
  for (const d of v.dpi.filter((x) => !x.adeguato && x.mancanti.length)) {
    out.push({ testo: `Fornire ai lavoratori filtri con numero di graduazione ${d.mancanti.join(' e ')} da utilizzare durante ${minuscolo(d.dpi.etichetta || PROCESSI_EN169[d.dpi.processo].nome)}.` })
  }
  if (saldature) {
    out.push({
      testo: 'Tenere a disposizione dei lavoratori che eseguono le saldature e i tagli termici gli adeguati DPI e fare in modo che, nel tempo, rimangano efficaci. A tale scopo:',
      sotto: [
        'istruire i lavoratori sul corretto utilizzo dei DPI, sulle attività in cui hanno l’obbligo di indossarli, su come pulirli e custodirli;',
        'attivare i preposti perché vigilino sul corretto uso dei DPI;',
        'sostituire tempestivamente i DPI, su richiesta del lavoratore, qualora ne venga riscontrata l’usura.',
      ],
    })
  }
  if (laser.length) {
    out.push({
      testo: 'Per gli apparecchi laser non giustificabili:',
      sotto: ['utilizzare le stazioni totali con il prisma ogni volta che è possibile;', 'non puntare il raggio verso le persone ed evitare la visione diretta del fascio;', 'informare gli addetti ai rilievi topografici sulle precauzioni indicate dal fabbricante.'],
    })
  }
  if (v.nonGiustificabili.length) out.push({ testo: 'Attivare la sorveglianza sanitaria secondo quanto previsto dall’art. 218 del D.Lgs. 81/08 e s.m.i.' })
  if (saldature) out.push({ testo: 'Disporre la segnaletica di identificazione del rischio di superamento dei valori limite di esposizione a ROA in tutte le aree in cui vengono eseguite saldature e tagli termici.' })
  return out
}

function conclusioni(v: ValutazioneRoa) {
  const punti: string[] = []
  const precisazioni: string[] = []
  const saldature = v.nonGiustificabili.filter((s) => s.saldatura)
  const laser = v.nonGiustificabili.filter((s) => s.tipo === 'laser')
  const attivitaSaldatura = [...new Set(saldature.map((s) => minuscolo(s.attivita.trim() || s.descrizione)))]
  if (saldature.length) punti.push(`le attività che espongono i lavoratori a livelli di ROA superiori ai limiti fissati dalla normativa sono: ${elenco(attivitaSaldatura)};`)
  if (laser.length) {
    const apparecchi = [...new Set(laser.map((s) => s.descrizione))]
    punti.push(`il raggio laser degli apparecchi ${elenco(apparecchi.map(minuscolo))} potrebbe esporre i lavoratori a radiazioni ottiche artificiali per esposizioni accidentali;`)
  }
  if (v.rilievi.length) {
    const max = Math.max(...v.rilievi.map((r) => r.lv))
    const oltre = v.rilievi.filter((r) => !r.rispetta)
    punti.push(
      oltre.length
        ? `la luminanza di ${elenco(oltre.map((r) => minuscolo(r.sorgente)))} supera il limite di ${num(LIMITE_LUMINANZA)} cd/m² a tutela del rischio retinico;`
        : `le luminanze calcolate dalle misure di illuminamento (fino a ${num(lvArrotondata(max))} cd/m²) rispettano il limite di ${num(LIMITE_LUMINANZA)} cd/m² a tutela del rischio retinico;`,
    )
  }
  punti.push(
    v.nonGiustificabili.length > saldature.length + laser.length
      ? 'per le altre sorgenti censite in cantiere l’esposizione è risultata trascurabile o al di sotto dei limiti previsti a tutela del rischio retinico e cutaneo.'
      : 'tutte le altre sorgenti censite in cantiere sono giustificabili e le relative emissioni sono al di sotto dei limiti previsti a tutela del rischio retinico e cutaneo.',
  )
  if (v.dpi.length) {
    const non = v.dpi.filter((d) => !d.adeguato)
    precisazioni.push(
      non.length
        ? `i DPI in dotazione non sono adeguati per ${elenco(non.map((d) => minuscolo(d.dpi.etichetta || PROCESSI_EN169[d.dpi.processo].nome)))}: occorre fornire filtri con il numero di graduazione indicato nella tabella del capitolo 10;`
        : 'l’impresa ha dotato i lavoratori che eseguono saldature e tagli di DPI adeguati alle caratteristiche delle macchine utilizzate. Ci possono tuttavia essere esposizioni pericolose per i lavoratori che, non eseguendo direttamente le attività a rischio, gravitano nell’area in cui queste lavorazioni vengono svolte;',
    )
  }
  if (laser.length) precisazioni.push('l’esposizione al raggio laser può avvenire solo accidentalmente durante misure rapide e di tipo speditivo; l’utilizzo senza prisma, unica condizione in cui è presente il rischio, è occasionale.')
  return { punti, precisazioni }
}

function righeGiustificazione(xs: SorgenteRoa[], tipo: TipoSorgente) {
  return xs
    .filter((s) => s.tipo === tipo)
    .map((s) => ({
      descrizione: tipo === 'laser' ? unibile(`d-${s.descrizione}`, s.descrizione) : s.descrizione,
      componente: s.componente ?? '',
      classe: tipo === 'laser' && s.classe ? `Laser classe ${s.classe}` : classeTesto(s),
      attivita: tipo === 'laser' ? unibile(`a-${s.descrizione}`, s.attivita) : s.attivita,
      esito: giustificabile(s) ? 'SI' : 'NO',
      motivazione: s.motivazione ?? '',
    }))
}

function righeAnalisi(xs: SorgenteRoa[], tipo: TipoSorgente) {
  return xs
    .filter((s) => s.tipo === tipo)
    .map((s) => ({
      descrizione: s.descrizioneAnalisi?.trim() || [s.descrizione, s.componente].filter(Boolean).join(' – '),
      spettro: s.spettro || '-',
      distanza: s.distanza || '-',
      tempo: s.tempo || '-',
      diretti: s.espostiDiretti || '-',
      indebiti: s.espostiIndebiti || '-',
      esito: unibile(`e-${s.misure ? 'SI' : 'NO'}-${s.motivazioneMisure ?? ''}`, s.misure ? 'SI' : 'NO'),
      motivazione: s.motivazioneMisure ?? '',
    }))
}

export function datiTemplateRoa(d: DatiDvrRoa) {
  const v = valutaRoa(d.sorgenti, d.rilievi, d.dpi, d.mansioni)
  const a = d.anagrafica
  const t = d.testi ?? {}
  const tipi = d.ambiti.map((x) => x.tipo)
  const ciclo = t.ciclo ?? cicloPredefinito(tipi)
  const lavoratori = `lavoratori${a.impresa ? ` di ${a.impresa}` : ''} operanti nel cantiere ${a.denominazione ?? ''}`.trim()
  const ordinate = [...d.sorgenti].sort((x, y) => ORDINE.indexOf(x.tipo) - ORDINE.indexOf(y.tipo))
  const ng = v.nonGiustificabili
  const { punti, precisazioni } = conclusioni(v)
  const conMisure = v.rilievi.length > 0

  return {
    valutazione: v,
    dati: {
      ...datiCopertina(a, d.documento, 'ROA', d.studio),
      intro1: `In applicazione al Titolo VIII, Capo V del D.Lgs. 81/08 e s.m.i., viene ${d.documento.primaValutazione === false ? 'effettuato un aggiornamento della' : 'effettuata la'} valutazione dei livelli d’esposizione a radiazioni ottiche artificiali per i ${lavoratori}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}.`,
      cicloBlocchi: ciclo,
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      testoDpi: `I dispositivi di protezione individuale messi a disposizione${a.impresa ? ` da ${a.impresa}` : ''} per ridurre l’esposizione a ROA sono:`,
      dpiElenco: t.dpi?.length ? t.dpi : [...new Set(d.dpi.map((x) => x.descrizione).filter((x): x is string => !!x?.trim()))],
      organizzazione: t.organizzazione?.length ? t.organizzazione : organizzazionePredefinita(d.sorgenti),
      sorgenti: ordinate.map((s) => ({
        tipo: unibile(`t-${s.tipo}`, TIPI_SORGENTE[s.tipo].plurale),
        descrizione: [s.descrizione, s.componente].filter(Boolean).join(' – '),
        attivita: s.attivita,
        funzionamento: s.funzionamento || '/',
        utilizzo: s.utilizzo || '/',
      })),
      conMacchine: d.sorgenti.some((s) => s.tipo === 'macchina'),
      conLampade: d.sorgenti.some((s) => s.tipo === 'lampada'),
      conLaser: d.sorgenti.some((s) => s.tipo === 'laser'),
      macchine: righeGiustificazione(d.sorgenti, 'macchina'),
      lampade: righeGiustificazione(d.sorgenti, 'lampada'),
      laser: righeGiustificazione(d.sorgenti, 'laser'),
      conNonGiustificabili: ng.length > 0,
      nessunaNonGiustificabile: ng.length === 0,
      ngMacchine: righeAnalisi(ng, 'macchina'),
      ngLampade: righeAnalisi(ng, 'lampada'),
      ngLaser: righeAnalisi(ng, 'laser'),
      conNgMacchine: ng.some((s) => s.tipo === 'macchina'),
      conNgLampade: ng.some((s) => s.tipo === 'lampada'),
      conNgLaser: ng.some((s) => s.tipo === 'laser'),
      rilieviTesti: conMisure
        ? [
            'Sulla base degli esiti della valutazione preliminare delle sorgenti non giustificabili e delle situazioni lavorative, nel cantiere oggetto di questa valutazione non sono presenti situazioni in cui risulti necessario eseguire misure di irradianza efficace, radianza efficace o esposizione radiante efficace.',
            'Ci sono invece situazioni in cui, per verificare il rispetto dei limiti di esposizione, è possibile eseguire misure di illuminamento finalizzate al calcolo della luminanza.',
            `Si è proceduto pertanto al rilievo in campo dell’illuminamento su: ${elenco(v.rilievi.map((r) => minuscolo(r.sorgente)))}.`,
            t.strumentoMisure?.trim() || STRUMENTO_MISURE,
          ]
        : [
            'Sulla base degli esiti della valutazione preliminare delle sorgenti non giustificabili e delle situazioni lavorative, nel cantiere oggetto di questa valutazione non sono presenti situazioni in cui risulti necessario eseguire misure in campo: la valutazione si basa sui dati del fabbricante, sulla letteratura e sulle situazioni espositive analoghe.',
          ],
      conMisure,
      campionamenti: v.rilievi.map((r) => ({ sorgente: r.sorgente, ev: num(r.ev), distanza: r.distanza != null ? num(r.distanza) : '-', omega: num(r.omega) })),
      luminanze: v.rilievi.map((r) => ({
        sorgente: r.sorgente,
        ev: num(r.ev),
        omega: num(r.omega),
        lv: Number.isFinite(r.lv) ? num(lvArrotondata(r.lv)) : '-',
        limite: num(LIMITE_LUMINANZA),
        rispetta: r.rispetta ? 'SI' : 'NO',
      })),
      elaborazioneTesto: conMisure
        ? 'Le misure di illuminamento eseguite in campo sono state utilizzate per il calcolo della luminanza (Lv) attraverso la relazione:'
        : 'Non essendo state eseguite misure in campo, non ci sono rilievi da elaborare.',
      conDpi: v.dpi.length > 0,
      nessunDpi: v.dpi.length === 0,
      dpiRighe: v.dpi.flatMap((e, i) => {
        const p = PROCESSI_EN169[e.dpi.processo]
        const verifica = e.adeguato
          ? `SI – Il numero di graduazione dei filtri in dotazione (${e.dpi.descrizione || e.dpi.dotazione}) è pari o immediatamente superiore a quello raccomandato dalla UNI EN 169.`
          : `NO – ${e.mancanti.length ? `Manca il filtro n° ${e.mancanti.join(' e ')} raccomandato dalla UNI EN 169` : 'Il campo di utilizzo è fuori dal prospetto della UNI EN 169'} (in dotazione: ${e.dpi.descrizione || e.dpi.dotazione}).`
        const righe = e.richieste.length ? e.richieste : [{ da: e.dpi.min, a: e.dpi.max, n: NaN }]
        return righe.map((r) => ({
          processo: unibile(`p${i}`, e.dpi.etichetta || p.nome),
          campo: `${p.grandezza.charAt(0).toUpperCase() + p.grandezza.slice(1)}: ${num(r.da)} ÷ ${num(r.a)} ${p.unita}`,
          dotazione: unibile(`d${i}`, e.dpi.dotazione || '-'),
          condizioni: unibile(`c${i}`, e.dpi.condizioni || '-'),
          richiesto: Number.isNaN(r.n) ? '-' : String(r.n),
          verifica: unibile(`v${i}`, verifica),
        }))
      }),
      testoSensibili: t.sensibili?.trim() || TESTI_SENSIBILI,
      testoFotosensibilizzanti: t.fotosensibilizzanti?.trim() || TESTI_FOTOSENSIBILIZZANTI,
      conclusioni: punti,
      conPrecisazioni: precisazioni.length > 0,
      precisazioni,
      piano: (t.piano ?? pianoPredefinito(v)).map((x) => ({ testo: x.testo, sotto: x.sotto ?? [] })),
    },
  }
}
