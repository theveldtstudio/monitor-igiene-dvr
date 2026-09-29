/**
 * Prepara i dati per il template Word del DVR Movimentazione manuale dei carichi
 * (public/templates/dvr/mmc.docx): una sezione per attività con il metodo di calcolo,
 * riepilogo per mansione, conclusioni e piano.
 */
import { datiCopertina, elenco, maiuscolo, type DocumentoCopertina } from '../comune/copertina'
import { formattaIt } from '../comune/numeri'
import { eGalleria, type AmbitoDvr, type AnagraficaDvr } from '../comune/tipi'
import { unibile } from '../comune/unisciCelle'
import { CICLO_PREDEFINITO, type BloccoTesto } from '../rumore/testiPredefiniti'
import { ETICHETTE_NIOSH, type FasciaNiosh, type PresaNiosh } from './niosh'
import { ETICHETTE_SNOOK, testoIntervallo } from './snook'
import { ETICHETTE_METODO, valutaDvrMmc, type AttivitaMmc, type EsitoAttivitaMmc, type LivelloMmc, type MansioneMmc, type ValutazioneDvrMmc } from './valutazione'

export interface DatiDvrMmc {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: MansioneMmc[]
  attivita: AttivitaMmc[]
  testi?: { ciclo?: BloccoTesto[] }
}

const due = (x: number) => (Number.isFinite(x) ? formattaIt(x, 2) : '∞')
const uno = (x: number) => formattaIt(x, 1)
const num = (x: number) => String(x).replace('.', ',')
const fattore = (x: number) => formattaIt(x, 2)
const DURATE = { breve: 'durata fino a 1 ora', media: 'durata da 1 a 2 ore', lunga: 'durata da 2 a 8 ore' } as const
const PRESE: Record<PresaNiosh, string> = { buono: 'buono', medio: 'medio', scarso: 'scarso' }

const paragrafi = (testo: string) =>
  testo
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)

function datiNiosh(e: EsitoAttivitaMmc) {
  const r = e.niosh!
  const c = e.attivita.compiti![0]
  const persone = c.persone ?? 1
  return {
    vAltezza: num(c.altezza),
    vDislocazione: num(c.dislocazione),
    vDistanza: num(c.distanza),
    vAsimmetria: num(c.asimmetria),
    vFrequenza: num(c.frequenza),
    vDurata: DURATE[c.durata],
    vPresa: PRESE[c.presa],
    vPersone: String(persone),
    testoMano: c.unaMano ? ' – sollevamento con una mano: fattore 0,6' : '',
    fA: fattore(r.fattori.A),
    fB: fattore(r.fattori.B),
    fC: fattore(r.fattori.C),
    fD: fattore(r.fattori.D),
    fE: fattore(r.fattori.E),
    fF: fattore(r.fattori.F),
    fPersone: fattore(r.fattori.persone),
    pesoTesto: persone > 1 ? `${num(r.peso)}\n(${num(c.peso)} kg divisi da ${persone} persone)` : num(r.peso),
    plrAdulti: uno(r.adulti.plr),
    plrAnziani: uno(r.anziani.plr),
    isAdulti: due(r.adulti.is),
    isAnziani: due(r.anziani.is),
    rischioAdulti: `rischio ${ETICHETTE_NIOSH[r.adulti.fascia].rischio}`,
    rischioAnziani: `rischio ${ETICHETTE_NIOSH[r.anziani.fascia].rischio}`,
  }
}

function datiComposto(e: EsitoAttivitaMmc) {
  const r = e.composto!
  return {
    compiti: r.compiti.map((x, k) => ({
      descrizione: x.compito.descrizione || `Compito ${k + 1}`,
      fA: fattore(x.fattori.A),
      fB: fattore(x.fattori.B),
      fC: fattore(x.fattori.C),
      fD: fattore(x.fattori.D),
      fE: fattore(x.fattori.E),
      vA: num(x.compito.altezza),
      vB: num(x.compito.dislocazione),
      vC: num(x.compito.distanza),
      vD: num(x.compito.asimmetria),
      vE: num(x.compito.frequenza),
    })),
    iscAdulti: due(r.adulti.isc),
    iscAnziani: due(r.anziani.isc),
    rischioAdulti: `area ${ETICHETTE_NIOSH[r.adulti.fascia].fascia.toLowerCase()}, rischio ${ETICHETTE_NIOSH[r.adulti.fascia].rischio}`,
    rischioAnziani: `area ${ETICHETTE_NIOSH[r.anziani.fascia].fascia.toLowerCase()}, rischio ${ETICHETTE_NIOSH[r.anziani.fascia].rischio}`,
  }
}

function datiSnook(e: EsitoAttivitaMmc) {
  const r = e.snook!
  const c = e.attivita.snook!
  const trasporto = c.azione === 'trasporto'
  const conMantenimento = !trasporto && c.mantenimento != null && r.limiteMantenimento != null
  return {
    azioneTesto: { spinta: 'Spinta', traino: 'Traino', trasporto: 'Trasporto in piano' }[c.azione],
    etichettaValore: trasporto ? 'peso trasportato\n[kg]' : conMantenimento ? 'forza iniziale / di mantenimento\n[kg]' : 'forza iniziale\n[kg]',
    etichettaLimite: trasporto ? 'peso limite raccomandato\n[kg]' : 'forza limite raccomandata\n[kg]',
    etichettaNumeratore: trasporto ? 'PESO TRASPORTATO' : 'FORZA APPLICATA',
    etichettaDenominatore: trasporto ? 'PESO LIMITE RACCOMANDATO' : 'FORZA LIMITE RACCOMANDATA',
    vAltezza: `${num(c.altezza)} cm`,
    vDistanza: num(c.distanza),
    vFrequenza: `1 azione ogni ${testoIntervallo(c.intervallo)}`,
    valoreTesto: conMantenimento ? `${num(c.valore)} / ${num(c.mantenimento!)}` : num(c.valore),
    limiteTesto: conMantenimento ? `${r.limite} / ${r.limiteMantenimento}` : String(r.limite),
    indice: due(r.indice),
    rischio: `area ${ETICHETTE_SNOOK[r.fascia].fascia.toLowerCase()}, rischio ${ETICHETTE_SNOOK[r.fascia].rischio}`,
  }
}

function datiOcra(e: EsitoAttivitaMmc) {
  const r = e.ocra!
  const arto = (x: typeof r.dx) => (x ? { p: num(x.punteggio), i: num(x.indice), r: x.etichetta.toUpperCase() } : { p: '-', i: '-', r: 'ARTO NON IMPEGNATO' })
  const sx = arto(r.sx)
  const dx = arto(r.dx)
  return {
    sx: sx.p,
    sxIndice: sx.i,
    sxRischio: sx.r,
    dx: dx.p,
    dxIndice: dx.i,
    dxRischio: dx.r,
    minuti: e.attivita.ocra?.minuti != null ? num(e.attivita.ocra.minuti) : '-',
  }
}

/** Righe del riepilogo: NIOSH con due indici, Snook/OCRA con uno, mansioni non esposte. */
function righeRiepilogo(v: ValutazioneDvrMmc) {
  const righe: Record<string, unknown>[] = []
  v.perMansione.forEach((m, i) => {
    const numero = unibile(`m${i}`, String(i + 1))
    const mansione = unibile(`m${i}`, m.mansione.nome)
    if (!m.esiti.length) {
      righe.push({ nonEsposto: true, numero, mansione })
      return
    }
    for (const e of m.esiti) {
      const base = { numero, mansione, attivita: e.attivita.titolo, metodo: ETICHETTE_METODO[e.attivita.metodo] }
      if (e.niosh || e.composto) {
        const a = e.niosh ? e.niosh.adulti.is : e.composto!.adulti.isc
        const z = e.niosh ? e.niosh.anziani.is : e.composto!.anziani.isc
        righe.push({
          ...base,
          doppio: true,
          indiceAdulti: due(a),
          indiceAnziani: due(z),
          rischioAdulti: ETICHETTE_NIOSH[e.livello.adulti as FasciaNiosh].rischio,
          rischioAnziani: ETICHETTE_NIOSH[e.livello.anziani as FasciaNiosh].rischio,
        })
      } else if (e.snook) {
        righe.push({ ...base, singolo: true, indice: due(e.snook.indice), rischio: ETICHETTE_SNOOK[e.snook.fascia].rischio })
      } else if (e.ocra) {
        for (const [lato, x] of [['SX', e.ocra.sx], ['DX', e.ocra.dx]] as const) {
          if (!x) continue
          righe.push({ ...base, singolo: true, indice: `${lato} = ${num(x.punteggio)} (OCRA ${num(x.indice)})`, rischio: `${lato} – ${x.etichetta.toLowerCase()}` })
        }
      }
    }
  })
  return righe
}

function conclusioni(v: ValutazioneDvrMmc) {
  const out: string[] = []
  const nonEsposte = v.perMansione.filter((m) => !m.esiti.length).map((m) => m.mansione.nome)
  const esposte = v.perMansione.filter((m) => m.esiti.length)
  if (nonEsposte.length) {
    out.push(
      `Dall’analisi della tabella riepilogativa emerge che ${nonEsposte.length === 1 ? 'una mansione non risulta esposta' : `${nonEsposte.length} mansioni non risultano esposte`} al rischio da movimentazione manuale dei carichi (${elenco(nonEsposte)}): per queste figure non si è proceduto alla valutazione.`,
    )
  }
  const perLivello = (l: LivelloMmc, k: 'adulti' | 'anziani') => v.esiti.filter((e) => e.livello[k] === l && e.attivita.mansioni.length)
  const descr = (e: EsitoAttivitaMmc, k: 'adulti' | 'anziani') => {
    const valore = e.niosh ? e.niosh[k].is : e.composto ? e.composto[k].isc : e.snook ? e.snook.indice : null
    return `${e.attivita.titolo.toLowerCase()}${valore != null ? ` (${ETICHETTE_METODO[e.attivita.metodo]} ${due(valore)})` : ''}`
  }
  const verdi = v.esiti.filter((e) => e.livello.adulti === 0 && e.livello.anziani === 0)
  if (esposte.length) {
    out.push(
      verdi.length === v.esiti.length
        ? 'Per le mansioni esposte tutte le attività valutate ricadono in area verde, con indici di rischio nulli, trascurabili o accettabili, sia per i lavoratori adulti sia per i giovani e gli over 45.'
        : `Per le mansioni esposte ${verdi.length} attività su ${v.esiti.length} ricadono in area verde, con indici di rischio nulli, trascurabili o accettabili.`,
    )
  }
  for (const k of ['adulti', 'anziani'] as const) {
    const chi = k === 'adulti' ? 'Per i lavoratori adulti (18–45 anni)' : 'Per i lavoratori giovani (sotto i 18 anni) e con più di 45 anni'
    const gialle = perLivello(1, k).map((e) => descr(e, k))
    const rosse = [...perLivello(2, k), ...perLivello(3, k)].map((e) => descr(e, k))
    if (!gialle.length && !rosse.length) continue
    const parti: string[] = []
    if (rosse.length) parti.push(`il rischio è presente per: ${elenco(rosse)}`)
    if (gialle.length) parti.push(`ricadono in area gialla, e richiedono attenzione, ${elenco(gialle)}`)
    out.push(`${chi} ${parti.join('; ')}.`)
  }
  const critiche = v.esiti.filter((e) => Math.max(e.livello.adulti, e.livello.anziani) >= 1)
  out.push(
    critiche.length
      ? `Per le attività in area gialla o rossa si applicano le misure di contenimento del capitolo successivo: impiego prioritario di mezzi meccanici, riduzione del peso dei singoli carichi, movimentazione a due operatori, formazione e addestramento, sorveglianza sanitaria dei lavoratori esposti secondo il protocollo del medico competente.`
      : 'In sintesi la valutazione conferma un rischio contenuto o assente per tutte le mansioni; restano valide le misure generali di prevenzione del capitolo successivo.',
  )
  return out
}

export function datiTemplateMmc(d: DatiDvrMmc) {
  const v = valutaDvrMmc(d.mansioni, d.attivita)
  const a = d.anagrafica
  const tipi = d.ambiti.map((x) => x.tipo)
  const tipoPrincipale = tipi.find(eGalleria) ?? tipi[0]
  const ciclo = d.testi?.ciclo ?? (tipoPrincipale ? CICLO_PREDEFINITO[tipoPrincipale] : undefined) ?? []
  const lavoratori = `lavoratori${a.impresa ? ` di ${a.impresa}` : ''} operanti nel cantiere ${a.denominazione ?? ''}`.trim()
  const nomi = new Map(d.mansioni.map((m) => [m.id, m.nome]))

  const valutate = v.esiti
  const attivita = valutate.map((e, i) => {
    const att = e.attivita
    const ps = paragrafi(att.descrizione)
    return {
      numeroSezione: `6.${i + 1}`,
      titolo: att.titolo,
      titoloMaiuscolo: maiuscolo(att.titolo),
      metodoTesto: ETICHETTE_METODO[att.metodo],
      paragrafi: ps,
      isNiosh: !!e.niosh,
      isComposto: !!e.composto,
      isSnook: !!e.snook,
      isOcra: !!e.ocra,
      ...(e.niosh ? datiNiosh(e) : {}),
      ...(e.composto ? datiComposto(e) : {}),
      ...(e.snook ? datiSnook(e) : {}),
      ...(e.ocra ? datiOcra(e) : {}),
      nonUltima: i < valutate.length - 1,
    }
  })

  return {
    valutazione: v,
    dati: {
      ...datiCopertina(a, d.documento, 'MMC', d.studio),
      intro1:
        `In applicazione al Titolo VI del D.Lgs. 81/08 e s.m.i., viene ${d.documento.primaValutazione === false ? 'effettuato un aggiornamento della' : 'effettuata la'} valutazione del rischio legato alla movimentazione manuale dei carichi per i ${lavoratori}` +
        `${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}.`,
      cicloBlocchi: ciclo,
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      elencoAttivita: d.attivita.map((x, i) => ({
        numero: i + 1,
        titolo: x.titolo,
        sintesi: x.sintesi?.trim() || paragrafi(x.descrizione)[0] || '',
        mansioniTesto: x.mansioni.map((id) => nomi.get(id)).filter(Boolean).join(' / '),
      })),
      testoAnalisi: `Tra tutte le movimentazioni manuali dei carichi effettuate dai ${lavoratori}, sulla base dei dati acquisiti e dei sopralluoghi effettuati è stato possibile fare una analisi preliminare che a partire dalle informazioni già a disposizione:`,
      attivita,
      riepilogo: righeRiepilogo(v),
      conclusioni: conclusioni(v),
      testoPiano: `Sulla base delle criticità individuate per i ${lavoratori} derivanti dalla movimentazione manuale dei carichi, al fine di ridurre al minimo il rischio si suggerisce l'adozione delle seguenti misure di contenimento.`,
    },
  }
}
