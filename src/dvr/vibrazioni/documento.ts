/**
 * Prepara i dati per il template Word del DVR Vibrazioni (public/templates/dvr/vibrazioni.docx).
 * Elenchi per fascia, conclusioni e tabelle derivano dal calcolo.
 */
import { arrotonda } from '../comune/numeri'
import type { AmbitoDvr, AnagraficaDvr, RevisioneDvr, TaraturaDvr } from '../comune/tipi'
import { cicloPredefinito, STUDIO_PREDEFINITO, type BloccoTesto } from '../rumore/testiPredefiniti'
import {
  SOGLIE_VIBRAZIONI,
  valoriPerCalcolo,
  type FasciaVibrazioni,
  type MisuraVibrazione,
  type OpzioniVibrazioni,
  type PeriodoVibrazione,
  type TipoVibrazione,
} from './calcolo'
import { valutaDvrVibrazioni, type MansioneVibrazioni, type ValutazioneDvrVibrazioni } from './valutazione'

export interface RilievoVibrazione extends MisuraVibrazione {
  matricola?: string | null
  posizione?: string | null
  trazione?: string | null
  utensile?: string | null
  asse?: string | null
  alimentazione?: string | null
  accessorio?: string | null
  temperatura?: string | null
  note?: string | null
}

export interface MacchinaDocumentoVib {
  tipologia: string
  marcaModello?: string | null
  alimentazione?: string | null
}

export interface DatiDvrVibrazioni {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: {
    periodoRiferimento: string
    revisione: number
    integrazione?: number | null
    dataEmissioneTesto: string
    anno: number
    primaValutazione?: boolean
    revisioni: RevisioneDvr[]
    rapportoWbv?: string | null
    rapportoHav?: string | null
  }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: (MansioneVibrazioni & { attivita?: string })[]
  macchine: MacchinaDocumentoVib[]
  tarature: Omit<TaraturaDvr, 'id' | 'strumento_id'>[]
  rilievi: RilievoVibrazione[]
  testi?: { ciclo?: BloccoTesto[] }
  opzioni?: OpzioniVibrazioni
}

const MAIUSC = (s: string | null | undefined) => (s ?? '').toLocaleUpperCase('it-IT')
const due = (x: number | null | undefined) => (x === null || x === undefined || !Number.isFinite(x) ? '/' : arrotonda(x, 2).toFixed(2).replace('.', ','))
const vuotoSe = (s: string | null | undefined, sostituto = '\\') => (s && s.trim() ? s : sostituto)
const oNessuna = (xs: string[]) => (xs.length ? xs : ['Nessuna'])
const elenco = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`)

function slug(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function righeTav(periodi: PeriodoVibrazione[]) {
  return periodi.map((p) => ({
    minuti: p.minuti,
    fase: p.origine === 'storico' ? `${p.fase.replace(/\*+$/, '')}*` : p.fase,
    macchina: vuotoSe(p.macchina),
    a: due(p.a),
    dettaglio: vuotoSe(p.dettaglio),
  }))
}

function conclusioni(v: ValutazioneDvrVibrazioni) {
  const nomiConValore = (tipo: TipoVibrazione, f: FasciaVibrazioni) =>
    v.esiti.filter((e) => e[tipo].fascia === f).map((e) => `${e.mansione.nome} (${due(e[tipo].esposizione)} m/s²)`)
  const oltreLimite = [...nomiConValore('wbv', 3), ...nomiConValore('hav', 3)]
  const conclusione1 =
    (oltreLimite.length
      ? `Dal calcolo dell’esposizione giornaliera A(8) risulta che superano il valore limite: ${elenco(oltreLimite)}. Per queste mansioni il datore di lavoro deve adottare misure immediate per riportare l’esposizione al di sotto del valore limite (art. 203, comma 3).`
      : 'Dal calcolo dell’esposizione giornaliera A(8) risulta che nessuna mansione supera il valore limite (1,0 m/s² per il corpo intero, 5 m/s² per il mano-braccio).') +
    ' Le situazioni da attenzionare sono:'
  const testoTipo = (tipo: TipoVibrazione, etichetta: string) => {
    const s = SOGLIE_VIBRAZIONI[tipo]
    const sopra = nomiConValore(tipo, 2)
    const limite = nomiConValore(tipo, 3)
    let t = `${etichetta} – `
    t += sopra.length
      ? `sopra il valore d’azione (${due(s.azione)} m/s²) ma entro il limite: ${elenco(sopra)}.`
      : `nessuna mansione supera il valore d’azione (${due(s.azione)} m/s²).`
    if (limite.length) t += ` Oltre il valore limite (${due(s.limite)} m/s²): ${elenco(limite)}.`
    return `${t} I valori includono l’incremento del 20% per l’incertezza (linee guida INAIL).`
  }
  return {
    conclusione1,
    conclusioneWbv: testoTipo('wbv', 'Corpo intero (WBV)'),
    conclusioneHav: testoTipo('hav', 'Mano-braccio (HAV)'),
    conclusioneFinale:
      'Le restanti mansioni presentano esposizioni inferiori ai valori d’azione; le mansioni che non utilizzano macchine o utensili vibranti hanno esposizione trascurabile.',
  }
}

export function datiTemplateVibrazioni(d: DatiDvrVibrazioni) {
  const v = valutaDvrVibrazioni(d.mansioni, d.opzioni)
  const a = d.anagrafica
  const studio = { ...STUDIO_PREDEFINITO, ...d.studio }
  const revCodice = String(d.documento.revisione).padStart(2, '0')
  const tipi = d.ambiti.map((x) => x.tipo)
  const ciclo = d.testi?.ciclo ?? cicloPredefinito(tipi)

  const valori = valoriPerCalcolo(d.rilievi)
  const rilieviWbv = d.rilievi.filter((r) => r.tipo === 'wbv')
  const rilieviHav = d.rilievi.filter((r) => r.tipo === 'hav')
  const utensili = [...new Map(rilieviHav.map((r) => [r.macchina.trim().toLowerCase(), r])).values()]

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

  // Rischio prevalente per il capitolo di elaborazione dei dati
  const rapporto = (tipo: TipoVibrazione) => Math.max(0, ...v.esiti.map((e) => e[tipo].esposizione / SOGLIE_VIBRAZIONI[tipo].azione))
  const prevalente: TipoVibrazione = rapporto('hav') > rapporto('wbv') ? 'hav' : 'wbv'
  const altro: TipoVibrazione = prevalente === 'wbv' ? 'hav' : 'wbv'
  const espostiAltro = v.esiti.filter((e) => e[altro].fascia >= 1).map((e) => e.mansione.nome)
  const nomeTipo = { wbv: 'al corpo intero', hav: 'al sistema mano-braccio' }
  const testoElaborazione =
    `Dall’analisi dei cicli produttivi, dei mezzi e delle attrezzature utilizzati emerge che il rischio maggiore riguarda l’esposizione alle vibrazioni trasmesse ${nomeTipo[prevalente]}.` +
    (espostiAltro.length
      ? ` Non va trascurata l’esposizione alle vibrazioni trasmesse ${nomeTipo[altro]} per: ${elenco(espostiAltro)}.`
      : '')

  const tav = (tipo: TipoVibrazione) => {
    const con = v.esiti.filter((e) => e.mansione[tipo].length > 0)
    const s = SOGLIE_VIBRAZIONI[tipo]
    return con.map((e, i) => ({
      titolo: `${tipo.toUpperCase()} - TAV ${i + 1}\nMANSIONE: ${e.mansione.nome} - Turno maggiormente gravoso`,
      periodi: righeTav(e.mansione[tipo]),
      a8: due(e[tipo].a8),
      esposizione: due(e[tipo].esposizione),
      azione: due(s.azione),
      limite: due(s.limite),
      haStorici: e.mansione[tipo].some((p) => p.origine === 'storico'),
      nonUltima: i < con.length - 1,
    }))
  }

  const nomi = (tipo: TipoVibrazione, f: FasciaVibrazioni) => oNessuna(v.perFascia[tipo][f])

  return {
    valutazione: v,
    valori,
    dati: {
      comuneMaiuscolo: MAIUSC(a.comune),
      provinciaMaiuscolo: MAIUSC(a.provincia),
      operaMaiuscolo: MAIUSC(a.opera),
      denominazione: a.denominazione ?? '',
      impresa: a.impresa ?? '',
      datoreLavoro: a.datore_lavoro ?? '',
      rspp: a.rspp ?? '',
      medicoCompetente: a.medico_competente ?? '',
      rls: a.rls,
      gruppoLavoro: a.gruppo_lavoro,
      redatto: a.redatto ?? '/',
      verificato: a.verificato ?? '/',
      approvato: a.approvato ?? '/',
      studioDescrizione: studio.descrizione,
      periodoRiferimento: d.documento.periodoRiferimento,
      integrazioneTesto: d.documento.integrazione ? String(d.documento.integrazione) : '/',
      dataEmissioneTesto: d.documento.dataEmissioneTesto,
      revisioneCodice: revCodice,
      nomeFile: `DVR_Vibrazioni_${slug(a.impresa)}_${d.documento.anno}_${slug(a.denominazione)}_rev${revCodice}.docx`,
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

      intro1:
        `In applicazione del titolo VIII, capo III del D.Lgs. 81/08 e s.m.i., viene effettuat${d.documento.primaValutazione ? 'a la valutazione' : 'o un aggiornamento della valutazione'} ` +
        `del rischio e dei livelli d’esposizione alle vibrazioni trasmesse al sistema mano-braccio (HAV) ed al corpo intero (WBV), per i lavoratori ` +
        `${a.impresa ? `di ${a.impresa} ` : ''}operanti nel cantiere ${a.denominazione ?? ''}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}. ` +
        'L’indagine è stata condotta sulla base di riferimenti normativi e norme di buona tecnica, in particolare:',
      cicloBlocchi: ciclo,

      tabMansioni: 1,
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      tabMacchine: 2,
      macchine: d.macchine.map((m) => ({ tipologia: m.tipologia, marcaModello: m.marcaModello ?? '/', alimentazione: m.alimentazione ?? '/' })),
      tabAttrezzature: 3,
      attrezzature: utensili.length
        ? utensili.map((u) => ({ tipologia: u.macchina, alimentazione: vuotoSe(u.alimentazione, '/') }))
        : [{ tipologia: 'Nessun utensile vibrante', alimentazione: '/' }],
      testoAnalisiHav: utensili.length
        ? `Nel caso specifico della presente valutazione le vibrazioni trasmesse al sistema mano-braccio possono essere determinate dall’utilizzo di: ${elenco(utensili.map((u) => u.macchina.toLowerCase()))}.`
        : 'Nel caso specifico della presente valutazione non sono stati individuati utensili portatili che trasmettano vibrazioni significative al sistema mano-braccio.',
      tabEsposte: 4,
      esposteHav: oNessuna(v.esiti.filter((e) => e.hav.fascia > 0).map((e) => e.mansione.nome)),
      esposteWbv: oNessuna(v.esiti.filter((e) => e.wbv.fascia > 0).map((e) => e.mansione.nome)),
      nonEsposte: oNessuna(v.esiti.filter((e) => e.wbv.fascia === 0 && e.hav.fascia === 0).map((e) => e.mansione.nome)),

      strumenti: d.tarature.map(
        (t) => `${t.componente} ${[t.costruttore, t.modello].filter(Boolean).join(' ')}${t.matricola ? `, n° di serie ${t.matricola}` : ''}${t.certificato ? ` (certificato ${t.certificato})` : ''};`,
      ),

      testoElaborazione,
      tabValoriWbv: 5,
      valoriWbv: valori
        .filter((x) => x.tipo === 'wbv')
        .map((x) => ({ macchina: x.macchina, fase: x.dettaglio ? `${x.fase} – regime ${x.dettaglio}` : x.fase, n: x.n, valore: due(x.valore) })),
      tabValoriHav: 6,
      valoriHav: valori.filter((x) => x.tipo === 'hav').map((x) => ({ macchina: x.macchina, dettaglio: vuotoSe(x.dettaglio, '/'), fase: x.fase, n: x.n, valore: due(x.valore) })),

      ...conclusioni(v),
      hav0: nomi('hav', 0),
      hav1: nomi('hav', 1),
      hav2: nomi('hav', 2),
      hav3: nomi('hav', 3),
      wbv0: nomi('wbv', 0),
      wbv1: nomi('wbv', 1),
      wbv2: nomi('wbv', 2),
      wbv3: nomi('wbv', 3),

      tavWbv: tav('wbv'),
      tavHav: tav('hav'),

      cantiereRilievi: [a.denominazione, ...d.ambiti.map((x) => x.nome)].filter(Boolean).join(' – '),
      rapportoWbv: d.documento.rapportoWbv ?? '',
      rapportoHav: d.documento.rapportoHav ?? '',
      rilieviWbvPresenti: rilieviWbv.length > 0,
      rilieviHavPresenti: rilieviHav.length > 0,
      rilieviWbv: rilieviWbv.map((r) => ({
        codice: r.codice,
        macchina: r.macchina,
        matricola: vuotoSe(r.matricola),
        posizione: vuotoSe(r.posizione),
        trazione: vuotoSe(r.trazione),
        utensile: vuotoSe(r.utensile),
        fase: r.fase,
        dettaglio: vuotoSe(r.dettaglio),
        a: due(r.a),
        asse: vuotoSe(r.asse),
        note: vuotoSe(r.note),
        temperatura: vuotoSe(r.temperatura),
      })),
      rilieviHav: rilieviHav.map((r) => ({
        codice: r.codice,
        macchina: r.macchina,
        matricola: vuotoSe(r.matricola, '/'),
        dettaglio: vuotoSe(r.dettaglio),
        alimentazione: vuotoSe(r.alimentazione),
        accessorio: vuotoSe(r.accessorio, '/'),
        fase: r.fase,
        a: due(r.a),
        note: vuotoSe(r.note),
        temperatura: vuotoSe(r.temperatura),
      })),
    },
  }
}

