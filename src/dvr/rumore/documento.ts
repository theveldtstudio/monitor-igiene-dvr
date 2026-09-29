/**
 * Prepara i dati per il template Word del DVR Rumore (public/templates/dvr/rumore.docx).
 * Tutti i numeri, le fasce e i testi delle conclusioni derivano dalla valutazione:
 * nessun valore viene copiato a mano.
 */
import { formattaIt } from '../comune/numeri'
import { eGalleria, type AmbitoDvr, type AnagraficaDvr, type RevisioneDvr, type TaraturaDvr } from '../comune/tipi'
import { INCERTEZZA_PREDEFINITA, type OpzioniCalcolo, type PeriodoEsposizione } from './calcolo'
import { attenuazioneReale, ETICHETTE_PROTEZIONE, type DpiUdito } from './dpi'
import {
  CICLO_PREDEFINITO,
  PIANO_INTRO,
  PIANO_PUNTI,
  PUNTO_AREE_85,
  STUDIO_PREDEFINITO,
  ZONIZZAZIONE_PREDEFINITA,
  type BloccoTesto,
} from './testiPredefiniti'
import { valutaDvrRumore, type MansioneRumore, type ValutazioneDvrRumore } from './valutazione'

export interface RilievoRumore {
  codice: string
  fase: string
  postazione: string
  tempoMinuti?: number | null
  laeq: number
  lceq?: number | null
  lpeak?: number | null
  macchine?: string | null
  note?: string | null
}

export interface EventoImpulsivo {
  zona: string
  componente: string
  lpeak: number
}

export interface SegnaleAvvertimento {
  fase: string
  /** Es. "del cicalino di retromarcia della mini-pala Bobcat 5510". */
  sorgente: string
  ambiente: number
  segnale: number
}

export interface MacchinaDocumento {
  tipologia: string
  marcaModello?: string | null
  alimentazione?: string | null
}

export interface DatiDvrRumore {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: {
    periodoRiferimento: string
    revisione: number
    integrazione?: number | null
    /** Data come compare nel documento, es. "Luglio 2026". */
    dataEmissioneTesto: string
    anno: number
    primaValutazione?: boolean
    revisioni: RevisioneDvr[]
  }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: (MansioneRumore & { attivita?: string })[]
  macchine: MacchinaDocumento[]
  dpi: DpiUdito[]
  tarature: Omit<TaraturaDvr, 'id' | 'strumento_id'>[]
  rilievi: RilievoRumore[]
  impulsivi: EventoImpulsivo[]
  segnali: SegnaleAvvertimento[]
  /** Testi modificabili: se assenti si usano quelli predefiniti per il tipo di ambito. */
  testi?: {
    ciclo?: BloccoTesto[]
    zonizzazione?: string | null
    pianoIntro?: string
    pianoPunti?: string[]
  }
  opzioni?: OpzioniCalcolo
}

/** Numero in formato italiano senza zeri inutili: 38 -> "38", 27.7 -> "27,7". */
export function numeroIt(v: number | null | undefined, maxDecimali = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '/'
  const f = 10 ** maxDecimali
  return String(Math.round(v * f) / f).replace('.', ',')
}

const siNo = (b: boolean) => (b ? 'SI' : 'NO')
const maiuscolo = (s: string | null | undefined) => (s ?? '').toLocaleUpperCase('it-IT')

function slug(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

const TIPO_PLURALE: Record<DpiUdito['tipo'], string> = {
  inserti: 'per gli inserti',
  archetto: 'per gli inserti ad archetto',
  cuffie: 'per le cuffie',
}

const elencoItaliano = (xs: string[]) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`

function testiDpi(v: ValutazioneDvrRumore, dpi: DpiUdito[]) {
  const nomi = dpi.map((d) => d.nome)
  const adeguati = v.verificheDpi.filter((x) => x.tuttiAdeguati)
  const nonAdeguati = v.verificheDpi.filter((x) => !x.tuttiAdeguati)
  const piccoMax = Math.max(...v.esiti.map((e) => e.piccoMax ?? 0))

  if (dpi.length === 0) {
    return {
      conclusioneDpi: 'Non sono stati indicati dispositivi di protezione individuale dell’udito da verificare.',
      conclusioneDpiBreve: 'Non sono stati indicati DPI dell’udito da verificare.',
      efficaciaDpi1: '',
      efficaciaDpi2: '',
    }
  }

  const range = v.verificheDpi
    .filter((x) => x.livelloMinimo !== null)
    .map((x) => `${x.dpi.nome}: ${formattaIt(x.livelloMinimo)}–${formattaIt(x.livelloMassimo)} dB(A)`)
    .join('; ')

  let conclusioneDpi: string
  if (nonAdeguati.length === 0) {
    conclusioneDpi =
      `La verifica dell’adeguatezza dei dispositivi di protezione dell’udito evidenzia che tutti i DPI esaminati ` +
      `(${elencoItaliano(nomi)}) garantiscono un livello sonoro residuo compreso nell’intervallo raccomandato per tutte ` +
      `le postazioni e fasi lavorative considerate, risultando pertanto idonei alla protezione dei lavoratori. ` +
      `Livelli residui all’orecchio: ${range}.`
  } else {
    const dettagli = nonAdeguati
      .map((x) => {
        const righe = x.righe.filter((r) => !r.verifica.adeguato)
        const tipi = [...new Set(righe.map((r) => ETICHETTE_PROTEZIONE[r.verifica.protezione].toLowerCase()))]
        return `${x.dpi.nome} (${righe.length} fasi con protezione ${tipi.join(' / ')})`
      })
      .join('; ')
    conclusioneDpi =
      `La verifica dell’adeguatezza dei dispositivi di protezione dell’udito evidenzia ` +
      (adeguati.length
        ? `che ${elencoItaliano(adeguati.map((x) => x.dpi.nome))} risultano adeguati per tutte le fasi considerate, mentre `
        : 'che ') +
      `non risultano adeguati in tutte le fasi: ${dettagli}. Livelli residui all’orecchio: ${range}.`
  }

  const semplificate = v.verificheDpi.some((x) => x.righe.some((r) => r.verifica.stimaSemplificata))
  const efficaciaDpi1 =
    (nonAdeguati.length === 0
      ? 'In tutte le fasi e con tutti i dispositivi il livello residuo all’orecchio si mantiene entro l’intervallo ' +
        'raccomandato di 65÷80 dB(A): non si riscontra protezione insufficiente (> 80 dB(A)) né iperprotezione (< 65 dB(A)).'
      : 'Nelle fasi indicate nelle tabelle di verifica il livello residuo all’orecchio esce dall’intervallo raccomandato ' +
        'di 65÷80 dB(A): per tali fasi va preferito un dispositivo adeguato tra quelli verificati.') +
    ` Il massimo livello di picco rilevato è ${formattaIt(piccoMax)} dB(C)` +
    (piccoMax < 135 ? ', inferiore al valore inferiore di azione di 135 dB(C).' : '.') +
    (semplificate
      ? ' Per le fasi senza misura del livello in ponderazione C il livello all’orecchio è stimato con la sola attenuazione M.'
      : '')

  const massimoConDpi = Math.max(
    ...v.esiti.map((e) => (e.lexConDpi.length ? Math.min(...e.lexConDpi) : e.lexArrotondato)),
  )
  const efficaciaDpi2 = v.limiteRispettatoConDpi
    ? `Ne consegue che, tenuto conto dell’attenuazione reale dei dispositivi, il valore limite di esposizione ` +
      `(LEX,8h = 87 dB(A)) non viene superato da alcuna mansione (massimo livello di esposizione con i DPI: ` +
      `${formattaIt(massimoConDpi)} dB(A)).`
    : 'Attenzione: tenuto conto dell’attenuazione reale dei dispositivi, per almeno una mansione il valore limite di ' +
      'esposizione (LEX,8h = 87 dB(A)) risulta superato: il datore di lavoro deve adottare misure immediate (art. 194).'

  const conclusioneDpiBreve =
    nonAdeguati.length === 0
      ? `Tutti i dispositivi di protezione dell’udito verificati risultano adeguati e idonei alla protezione dei ` +
        `lavoratori: per approfondimento si rimanda al capitolo “Efficacia dei DPIu”.`
      : `Non tutti i dispositivi di protezione dell’udito risultano adeguati in tutte le fasi: si rimanda alle tabelle di ` +
        `verifica e al capitolo “Efficacia dei DPIu”.`

  return { conclusioneDpi, conclusioneDpiBreve, efficaciaDpi1, efficaciaDpi2 }
}

function periodoTav(p: PeriodoEsposizione) {
  return {
    minuti: p.minuti,
    fase: p.origine === 'storico' ? `${p.fase.replace(/\*+$/, '')}*` : p.fase,
    macchine: p.macchine?.trim() || '/',
    postazione: p.postazione?.trim() || '\\',
    laeq: formattaIt(p.laeq),
    lpeak: formattaIt(p.lpeak ?? null),
  }
}

export function datiTemplateRumore(d: DatiDvrRumore) {
  const v = valutaDvrRumore({ mansioni: d.mansioni, dpi: d.dpi, opzioni: d.opzioni })
  const par = d.opzioni?.incertezza ?? INCERTEZZA_PREDEFINITA
  const a = d.anagrafica
  const tipi = d.ambiti.map((x) => x.tipo)
  const tipoPrincipale = tipi.find(eGalleria) ?? tipi[0]
  const studio = { ...STUDIO_PREDEFINITO, ...d.studio }
  const revCodice = String(d.documento.revisione).padStart(2, '0')

  // Tabelle numerate in ordine di comparsa
  let n = 0
  const tab = () => ++n
  const tabMansioni = tab()
  const tabMacchine = tab()
  const tabTaratura = tab()
  const tabFasi = tab()
  const tabUni = tab()
  const verificheDpi = v.verificheDpi.map((x) => ({
    numeroTabella: tab(),
    nome: x.dpi.nome,
    righe: x.righe.map((r) => ({
      fase: r.fase,
      postazione: r.postazione,
      laeq: formattaIt(r.verifica.laeq),
      livelloConDpi: formattaIt(r.verifica.livelloConDpi) + (r.verifica.stimaSemplificata ? ' (M)' : ''),
      esito: r.verifica.adeguato ? 'verificato' : `non verificato – ${ETICHETTE_PROTEZIONE[r.verifica.protezione].toLowerCase()}`,
      mansioni: r.mansioniEsposte.join('; '),
    })),
  }))
  const tabEsposizioni = tab()

  const luoghi = d.ambiti.length ? ` (${elencoItaliano(d.ambiti.map((x) => x.nome))})` : ''
  const intro1 =
    `In applicazione del titolo VIII, capo II del D.Lgs. 81/08 e s.m.i., viene effettuat${
      d.documento.primaValutazione ? 'a la valutazione' : 'o un aggiornamento della valutazione'
    } del rischio e dei livelli d’esposizione al rumore per i lavoratori ${a.impresa ? `di ${a.impresa} ` : ''}` +
    `operanti nel cantiere ${a.denominazione ?? ''}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}.`
  const intro2 =
    `Per la redazione del documento sono stati presi in considerazione i rilievi eseguiti nel periodo ` +
    `${d.documento.periodoRiferimento}${luoghi}.`

  const piccoImpulsivi = Math.max(0, ...d.impulsivi.map((x) => x.lpeak))
  const testoImpulsivi = d.impulsivi.length
    ? 'Durante le misurazioni sono stati rilevati eventi sonori impulsivi, riportati nella tabella seguente. ' +
      (piccoImpulsivi < 135
        ? 'Il livello di picco Lpeak,C non supera il valore inferiore di azione previsto dall’art. 189 del D.Lgs. 81/08 ' +
          '(135 dB(C)): tali eventi, pur percepibili come impulsivi, non determinano un incremento del rischio rispetto a ' +
          'quanto già valutato mediante i livelli equivalenti di esposizione.'
        : 'In almeno una zona il livello di picco supera il valore inferiore di azione di 135 dB(C): se ne tiene conto ' +
          'nella classificazione delle mansioni esposte.')
    : 'Durante le misurazioni non sono stati rilevati eventi sonori impulsivi significativi.'

  const ciclo = d.testi?.ciclo ?? (tipoPrincipale ? CICLO_PREDEFINITO[tipoPrincipale] : undefined) ?? []
  const zonizzazione =
    d.testi?.zonizzazione !== undefined
      ? d.testi.zonizzazione
      : tipoPrincipale
        ? (ZONIZZAZIONE_PREDEFINITA[tipoPrincipale] ?? null)
        : null

  const pianoPunti = [...(d.testi?.pianoPunti ?? PIANO_PUNTI)]
  if (v.perFascia[3].length > 0 && !pianoPunti.includes(PUNTO_AREE_85)) pianoPunti.splice(2, 0, PUNTO_AREE_85)

  const fasiMonitorate: { fase: string; postazione: string }[] = []
  for (const r of d.rilievi) {
    if (!fasiMonitorate.some((f) => f.fase === r.fase && f.postazione === r.postazione)) {
      fasiMonitorate.push({ fase: r.fase, postazione: r.postazione })
    }
  }

  const revisioni = [...d.documento.revisioni].sort((x, y) => x.revisione - y.revisione)
  const maxRev = Math.max(3, ...revisioni.map((r) => r.revisione))
  const revisioniCopertina = [maxRev, maxRev - 1, maxRev - 2, maxRev - 3].map((num) => {
    const r = revisioni.find((x) => x.revisione === num)
    return {
      rev: String(num).padStart(2, '0'),
      data: r?.data ?? '',
      descrizione: r?.descrizione ?? '',
      collaborazione: r ? '/' : '',
      redatto: r?.redatto ?? '',
      verificato: r?.verificato ?? '',
      approvato: r?.approvato ?? '',
    }
  })

  return {
    valutazione: v,
    dati: {
      comuneMaiuscolo: maiuscolo(a.comune),
      provinciaMaiuscolo: maiuscolo(a.provincia),
      operaMaiuscolo: maiuscolo(a.opera),
      denominazione: a.denominazione ?? '',
      impresa: a.impresa ?? '',
      datoreLavoro: a.datore_lavoro ?? '',
      rspp: a.rspp ?? '',
      medicoCompetente: a.medico_competente ?? '',
      rls: a.rls,
      gruppoLavoro: a.gruppo_lavoro,
      redatto: a.redatto ?? '\\',
      verificato: a.verificato ?? '\\',
      approvato: a.approvato ?? '\\',
      studioDescrizione: studio.descrizione,
      periodoRiferimento: d.documento.periodoRiferimento,
      integrazioneTesto: d.documento.integrazione ? String(d.documento.integrazione) : '\\',
      dataEmissioneTesto: d.documento.dataEmissioneTesto,
      revisioneCodice: revCodice,
      nomeFile: `DVR_Rumore_${slug(a.impresa)}_${d.documento.anno}_${slug(a.denominazione)}_rev${revCodice}.docx`,
      revisioniCopertina,
      revisioni: revisioni.map((r) => ({
        rev: String(r.revisione).padStart(2, '0'),
        integrazione: r.integrazione ? String(r.integrazione) : '/',
        data: r.data,
        descrizione: r.descrizione,
        redatto: r.redatto ?? '',
        verificato: r.verificato ?? '',
        approvato: r.approvato ?? '',
      })),

      intro1,
      intro2,
      testoEsecutore: `I rilievi fonometrici e la presente relazione sono stati eseguiti dalla società ${studio.esecutore}.`,
      haZonizzazione: Boolean(zonizzazione) && tipi.some(eGalleria),
      testoZonizzazione: zonizzazione ?? '',
      cicloBlocchi: ciclo,

      tabMansioni,
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      tabMacchine,
      macchine: d.macchine.map((m) => ({
        tipologia: m.tipologia,
        marcaModello: m.marcaModello ?? '/',
        alimentazione: m.alimentazione ?? '/',
      })),
      dpi: d.dpi.map((x) => {
        const r = attenuazioneReale(x)
        const ott = Object.fromEntries(
          (x.ottave ?? []).flatMap((o) => [
            [`om${o.frequenza}`, numeroIt(o.media)],
            [`od${o.frequenza}`, numeroIt(o.deviazione)],
          ]),
        )
        return {
          nome: x.nome,
          tipoPlurale: TIPO_PLURALE[x.tipo],
          h: numeroIt(x.h),
          m: numeroIt(x.m),
          l: numeroIt(x.l),
          beta: numeroIt(x.beta, 2),
          hr: numeroIt(r.h),
          mr: numeroIt(r.m),
          lr: numeroIt(r.l),
          haOttave: (x.ottave ?? []).length > 0,
          ...ott,
        }
      }),

      testoImpulsivi,
      haImpulsivi: d.impulsivi.length > 0,
      impulsivi: d.impulsivi.map((x) => ({ zona: x.zona, componente: x.componente, lpeak: formattaIt(x.lpeak) })),
      testoStrumenti:
        'Tutte le misure sono state eseguite con fonometri integratori di classe 1 conformi alla norma IEC 61672-1, ' +
        'con la catena di misura riportata nella tabella seguente.',
      tabTaratura,
      tarature: d.tarature.map((t) => ({
        componente: t.componente,
        costruttore: t.costruttore ?? '',
        modello: t.modello ?? '',
        matricola: t.matricola ?? '',
        dataTaratura: t.data_taratura ? new Date(t.data_taratura).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
        certificato: t.certificato ?? '',
      })),
      tabFasi,
      fasiMonitorate,
      haDatiStorici: d.mansioni.some((m) => m.periodi.some((p) => p.origine === 'storico')),

      tabUni,
      verificheDpi,
      ...testiDpi(v, d.dpi),

      uPosizionamento: numeroIt(par.uPosizionamento),
      uStrumento: numeroIt(par.uStrumento),
      uLaeq: numeroIt(Math.sqrt(par.uPosizionamento ** 2 + par.uStrumento ** 2), 2),
      uComune: numeroIt(par.uComune),

      haSegnali: d.segnali.length > 0,
      segnali: d.segnali.map((s) => {
        const diff = s.segnale - s.ambiente
        return {
          fase: s.fase,
          sorgente: s.sorgente,
          ambiente: formattaIt(s.ambiente),
          segnale: formattaIt(s.segnale),
          esito:
            diff >= 15 && s.segnale >= 65
              ? `In questo caso il segnale di avvertimento supera il rumore di fondo di ${formattaIt(diff)} dB, quindi di oltre 15 dB: l’udibilità è garantita.`
              : `In questo caso il segnale di avvertimento supera il rumore di fondo di soli ${formattaIt(diff)} dB: l’udibilità va verificata sulle bande d’ottava (almeno 10 dB tra 300 e 3000 Hz) o il segnale va potenziato.`,
        }
      }),

      tabEsposizioni,
      esposizioni: v.esiti.map((e) => ({
        nome: e.mansione.nome,
        lex: formattaIt(e.lexArrotondato),
        u: numeroIt(e.incertezza),
        picco: formattaIt(e.piccoMax),
        vibrazioni: siNo(e.mansione.vibrazioni),
        ototossiche: siNo(e.mansione.ototossiche),
      })),
      fascia1: v.perFascia[1].map(maiuscolo),
      fascia2: v.perFascia[2].map(maiuscolo),
      fascia3: v.perFascia[3].map(maiuscolo),
      testoLimite: v.limiteRispettatoConDpi
        ? 'Il valore limite di esposizione (87 dB(A)), tenuto conto dell’attenuazione dei dispositivi di protezione individuali per l’udito, non viene superato per alcuna mansione.'
        : 'Il valore limite di esposizione (87 dB(A)), tenuto conto dell’attenuazione dei dispositivi di protezione individuali per l’udito, risulta superato per almeno una mansione: vanno adottate misure immediate (art. 194 D.Lgs. 81/08).',

      pianoIntro: d.testi?.pianoIntro ?? PIANO_INTRO,
      pianoPunti: pianoPunti.map((testo, i) => ({ numero: i + 1, testo })),

      tav: v.esiti.map((e, i) => ({
        numero: i + 1,
        nomeMaiuscolo: maiuscolo(e.mansione.nome),
        periodi: e.mansione.periodi.map(periodoTav),
        lex: formattaIt(e.lexArrotondato),
        u: numeroIt(e.incertezza),
        picco: formattaIt(e.piccoMax),
        nonUltima: i < v.esiti.length - 1,
      })),

      cantiereRilievi: [a.denominazione, ...d.ambiti.map((x) => x.nome)].filter(Boolean).join(' – '),
      rilievi: d.rilievi.map((r) => ({
        codice: r.codice,
        fase: r.fase,
        postazione: r.postazione,
        tempo: r.tempoMinuti ? String(r.tempoMinuti) : '\\',
        laeq: formattaIt(r.laeq),
        lceq: formattaIt(r.lceq ?? null),
        lpeak: formattaIt(r.lpeak ?? null),
        macchine: r.macchine || '\\',
        note: r.note || '\\',
      })),
    },
  }
}
