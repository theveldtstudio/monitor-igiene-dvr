/**
 * Prepara i dati per il template Word del DVR Posture incongrue (public/templates/dvr/posture.docx).
 * Tabelle di classificazione, riepilogo, conclusioni e allegato derivano dal calcolo.
 */
import { datiCopertina, elenco, maiuscolo, type DocumentoCopertina } from '../comune/copertina'
import { arrotonda } from '../comune/numeri'
import { eGalleria, type AmbitoDvr, type AnagraficaDvr } from '../comune/tipi'
import { unibile } from '../comune/unisciCelle'
import { numeroIt } from '../rumore/documento'
import { cicloPredefinito, type BloccoTesto } from '../rumore/testiPredefiniti'
import { DESCRIZIONI_OWAS, FASCE_POSTURE, type ClasseOwas, type FasciaPosture, type RigaGiornata } from './calcolo'
import { valutaDvrPosture, type AttivitaCatalogo, type MansionePosture, type ValutazioneDvrPosture } from './valutazione'

export interface DatiDvrPosture {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: MansionePosture[]
  catalogo: AttivitaCatalogo[]
  testi?: { ciclo?: BloccoTesto[] }
}

const RISCHIO_PREDEFINITO = 'Posture incongrue'
const trattino = (x: number) => (x > 0 ? numeroIt(x, 1) : '-')
const indiceTesto = (x: number) => numeroIt(x, 1)

/** Gruppi del catalogo nell'ordine di prima comparsa. */
function gruppi(catalogo: AttivitaCatalogo[]) {
  const out: { titolo: string; voci: { a: AttivitaCatalogo; i: number }[] }[] = []
  catalogo.forEach((a, i) => {
    const titolo = a.gruppo.trim() || 'Attività'
    let g = out.find((x) => x.titolo === titolo)
    if (!g) out.push((g = { titolo, voci: [] }))
    g.voci.push({ a, i })
  })
  return out
}

/** Le operazioni "ripartite" diventano quattro righe, una per classe, con un quarto della durata. */
function righeAllegato(righe: RigaGiornata[], chiaveGiornata: string) {
  return righe.flatMap((r, k) => {
    const classi: { classe: ClasseOwas; minuti: number }[] =
      r.classe === 'ripartita' ? ([1, 2, 3, 4] as const).map((c) => ({ classe: c, minuti: r.minuti / 4 })) : [{ classe: r.classe, minuti: r.minuti }]
    return classi.map((c) => ({
      fase: unibile(`${chiaveGiornata}|${r.fase}`, r.fase),
      attivita: unibile(`${chiaveGiornata}|${r.fase}|${r.attivita}|${r.classe === 'ripartita' ? k : ''}`, r.attivita),
      minuti: numeroIt(arrotonda(c.minuti, 2), 2),
      classe: String(c.classe),
    }))
  })
}

function conclusioni(v: ValutazioneDvrPosture, catalogo: AttivitaCatalogo[]) {
  const valutate = v.esiti.filter((e) => e.esito.peggiore)
  const fasceConMansioni = ([3, 2, 1, 0] as FasciaPosture[]).filter((f) => v.perFascia[f].length)
  const maxFascia = fasceConMansioni[0] ?? 0
  const out: string[] = []
  if (fasceConMansioni.length === 1) {
    out.push(
      maxFascia === 0
        ? 'Per tutte le mansioni valutate il rischio derivante dall’assunzione di posture incongrue risulta assente.'
        : `Tutte le mansioni valutate risultano esposte ad un rischio ${FASCE_POSTURE[maxFascia].tipo.toLowerCase()} da posture incongrue.`,
    )
  } else if (fasceConMansioni.length > 1) {
    const parti = fasceConMansioni.map((f) => {
      const n = v.perFascia[f].length
      return `${FASCE_POSTURE[f].tipo.toLowerCase()} per ${n} ${n === 1 ? 'mansione' : 'mansioni'}`
    })
    out.push(`Delle ${valutate.length} mansioni valutate, il rischio da posture incongrue risulta ${elenco(parti)}, come riportato nella tabella precedente.`)
  }

  const peggiori = (classe: number) => [
    ...new Set(catalogo.filter((_, i) => v.classiCatalogo[i].includes(classe as ClasseOwas)).map((a) => a.attivita.trim().toLowerCase())),
  ]
  const c4 = peggiori(4)
  const c3 = peggiori(3)
  if (c4.length) out.push(`Le posture che comportano maggior rischio (classe 4) sono quelle assunte durante le seguenti attività: ${elenco(c4)}.`)
  else if (c3.length) out.push(`Le posture che comportano maggior rischio (classe 3) sono quelle assunte durante le seguenti attività: ${elenco(c3)}.`)
  else if (catalogo.length) out.push('Nessuna delle posture osservate ricade nelle classi di rischio 3 e 4.')

  if (maxFascia <= 1) {
    if (c4.length || c3.length) {
      out.push(
        'Si tratta tuttavia di posture che il lavoratore assume per brevi periodi di tempo e per questo motivo non incidono in maniera significativa sul rischio della mansione.',
      )
    }
    out.push(
      'In generale le lavorazioni svolte in cantiere sono lavorazioni che portano il lavoratore a muoversi continuamente e che difficilmente richiedono che il lavoratore che le svolge debba rimanere fermo, per lungo tempo, assumendo una postura scomoda. Inoltre, in generale, le posture che il lavoratore deve assumere per svolgere le sue normali operazioni difficilmente sono vincolanti e nella maggior parte delle situazioni il lavoratore ha spazio per muoversi e assumere la postura più comoda per sé.',
    )
  } else {
    const critiche = [...v.perFascia[3], ...v.perFascia[2]]
    out.push(
      `Per le mansioni a rischio ${maxFascia === 3 ? 'elevato o medio' : 'medio'} (${elenco(critiche)}) è necessario intervenire sulle attività che impongono posture in classe 3 e 4, ` +
        'riducendone la durata, alternandole con attività meno gravose o modificando le attrezzature e la postazione di lavoro, con l’urgenza indicata nella tabella di classificazione del rischio.',
    )
  }
  return out
}

function puntiPiano(v: ValutazioneDvrPosture) {
  const punti = [
    'Eseguire la formazione ed informazione dei lavoratori sul rischio specifico e sui metodi di contenimento del rischio.',
    'Per tutte le attività che non richiedono necessariamente l’intervento manuale del lavoratore prediligere l’utilizzo dei mezzi meccanici.',
    'Effettuare la manutenzione periodica dei mezzi, in particolare sedili e schienali, ed annotare sul registro di manutenzione, predisposto dall’Impresa, gli interventi eseguiti su ciascun mezzo.',
  ]
  const critiche = [...v.perFascia[3], ...v.perFascia[2]]
  if (critiche.length) {
    punti.push(
      `Per ${elenco(critiche)}: ridurre il tempo trascorso nelle posture in classe 3 e 4 attraverso la rotazione dei compiti e pause di recupero, e valutare ausili (sollevatori, piattaforme, attrezzi a manico lungo) che evitino di lavorare con la schiena flessa o ruotata e con le braccia sopra il livello delle spalle.`,
    )
    punti.push('Sottoporre i lavoratori delle mansioni a rischio medio o elevato alla sorveglianza sanitaria secondo il protocollo definito dal medico competente.')
  } else {
    punti.push('Attivare la sorveglianza sanitaria sui lavoratori che ne facciano richiesta e qualora il medico competente ne confermi l’opportunità.')
  }
  return punti
}

export function datiTemplatePosture(d: DatiDvrPosture) {
  const v = valutaDvrPosture(d.mansioni, d.catalogo)
  const a = d.anagrafica
  const tipi = d.ambiti.map((x) => x.tipo)
  const galleria = tipi.some(eGalleria)
  const ciclo = d.testi?.ciclo ?? cicloPredefinito(tipi)
  const cantiere = a.denominazione ? `del cantiere ${a.denominazione}` : 'del cantiere'
  const soggetti = `lavoratori${a.impresa ? ` di ${a.impresa}` : ''} operanti ${galleria ? `nelle gallerie ${cantiere}` : `nell’ambito ${cantiere}`}`
  const lavoratori = `i ${soggetti}`

  const gs = gruppi(d.catalogo)
  let tabella = 2
  const gruppiAttivita = gs.map((g) => ({
    numero: tabella++,
    titolo: g.titolo,
    righe: g.voci.map(({ a: x }) => ({
      fase: unibile(`${g.titolo}|${x.fase}`, x.fase),
      attivita: x.attivita,
      descrizione: x.descrizione,
      rischio: x.rischio?.trim() || RISCHIO_PREDEFINITO,
      mansioni: x.mansioni,
    })),
  }))
  const gruppiClassi = gs
    .map((g) => ({
      numero: 0,
      titolo: g.titolo,
      posture: g.voci.flatMap(({ a: x, i }) =>
        x.posture.map((p, k) => ({
          fase: unibile(`${g.titolo}|${x.fase}`, x.fase),
          attivita: unibile(`${g.titolo}|${x.fase}|${i}`, x.attivita),
          mansioni: unibile(`${g.titolo}|${x.fase}|${i}`, x.mansioni),
          schienaTesto: DESCRIZIONI_OWAS.schiena[p.schiena],
          bracciaTesto: DESCRIZIONI_OWAS.braccia[p.braccia],
          gambeTesto: DESCRIZIONI_OWAS.gambe[p.gambe],
          caricoTesto: DESCRIZIONI_OWAS.carico[p.carico],
          schiena: p.schiena,
          braccia: p.braccia,
          gambe: p.gambe,
          carico: p.carico,
          classe: v.classiCatalogo[i][k],
        })),
      ),
    }))
    .filter((g) => g.posture.length)
  gruppiClassi.forEach((g) => (g.numero = tabella++))
  const tabRiepilogo = tabella++
  const tabClassificazione = tabella++
  const tabTipi = tabella++

  const valutate = v.esiti.filter((e) => e.esito.peggiore)
  const tav = valutate.map((e, n) => ({
    numero: n + 1,
    nomeMaiuscolo: maiuscolo(e.mansione.nome),
    giornate: e.mansione.giornate
      .filter((g) => g.righe.some((r) => r.minuti > 0))
      .map((g, k) => ({ titolo: g.titolo, righe: righeAllegato(g.righe.filter((r) => r.minuti > 0), `${n}|${k}`) })),
    riepilogo: e.esito.giornate.map((g) => ({
      f1: trattino(g.frequenze[0]),
      f2: trattino(g.frequenze[1]),
      f3: trattino(g.frequenze[2]),
      f4: trattino(g.frequenze[3]),
      indice: indiceTesto(g.indice),
    })),
    tipoMaiuscolo: maiuscolo(FASCE_POSTURE[e.esito.fascia].tipo),
    nonUltima: n < valutate.length - 1,
  }))

  const inLuogo = galleria ? 'in galleria' : 'in cantiere'
  return {
    valutazione: v,
    dati: {
      ...datiCopertina(a, d.documento, 'Posture', d.studio),
      intro1:
        `In applicazione al D.Lgs. 81/08, art. 28, viene ${d.documento.primaValutazione === false ? 'aggiornata' : 'effettuata'}, per ${lavoratori}, ` +
        'la valutazione del rischio legato alle posture incongrue durante l’attività lavorativa ovvero all’assunzione ed al mantenimento di posture faticose imposte da particolari condizioni operative.',
      cicloBlocchi: ciclo,
      tabMansioni: 1,
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      inLuogo,
      gruppiAttivita,
      gruppiClassi,
      testoCalcoloMansioni:
        `Al fine di poter calcolare per ciascuna mansione un indice di rischio, sulla base del ciclo di lavoro normalmente svolto dai ${soggetti}, ` +
        'è stata calcolata la frequenza con cui ogni mansione svolge attività in classe di rischio 1, 2, 3 o 4 quindi è stato calcolato l’indice di rischio I applicando la formula [1].',
      tabRiepilogo,
      riepilogo: valutate.map((e) => {
        const g = e.esito.peggiore!
        return {
          mansione: e.mansione.nome,
          f1: trattino(g.frequenze[0]),
          f2: trattino(g.frequenze[1]),
          f3: trattino(g.frequenze[2]),
          f4: trattino(g.frequenze[3]),
          indice: indiceTesto(g.indice),
          tipo: FASCE_POSTURE[e.esito.fascia].tipo,
        }
      }),
      tabClassificazione,
      tabTipi,
      tipiRischio: ([3, 2, 1, 0] as FasciaPosture[])
        .filter((f) => v.perFascia[f].length)
        .map((f) => ({ tipo: FASCE_POSTURE[f].tipo, mansioni: v.perFascia[f], intervento: FASCE_POSTURE[f].intervento })),
      conclusioni: conclusioni(v, d.catalogo),
      testoPiano: `Sulla base delle criticità individuate per ${lavoratori}, derivanti dall’assunzione di posture incongrue durante l’attività lavorativa ed al fine di ridurre al minimo il rischio si suggerisce di:`,
      pianoPunti: puntiPiano(v),
      tav,
    },
  }
}
