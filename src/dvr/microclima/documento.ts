/**
 * Prepara i dati per il template Word del DVR Microclima (public/templates/dvr/microclima.docx).
 * Un solo template per i quattro scenari dei DVR modello: le sezioni si accendono con i flag
 * galleria/esterno, pmvRilievi, wbgtRilievi, pmvMesi, picco e freddo.
 */
import { datiCopertina, elenco, type DocumentoCopertina } from '../comune/copertina'
import { formattaIt } from '../comune/numeri'
import { eGalleria, type AmbitoDvr, type AnagraficaDvr } from '../comune/tipi'
import { unibile } from '../comune/unisciCelle'
import { CICLO_PREDEFINITO, type BloccoTesto } from '../rumore/testiPredefiniti'
import { CATEGORIE_COMFORT, CLASSI_IREQ, limiteWbgt } from './indici'
import { CLO_PREDEFINITO, galleria, misurePredefinite, pianoPredefinito, vestiarioPredefinito, type CapoVestiario, type VocePiano } from './testi'
import {
  conRilievi,
  estivo,
  valutaMicroclima,
  type EsitoLavorazione,
  type LavorazioneMicroclima,
  type MansioneMicroclima,
  type ParametriMicroclima,
  type RilievoMicroclima,
  type ValutazioneMicroclima,
} from './valutazione'

export interface DatiDvrMicroclima {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: MansioneMicroclima[]
  parametri: ParametriMicroclima
  lavorazioni: LavorazioneMicroclima[]
  rilievi: RilievoMicroclima[]
  /** capi del vestiario (se vuoto la tabella non compare) */
  vestiario?: CapoVestiario[]
  /** periodo di osservazione delle lavorazioni, es. "Dicembre 2024 – Febbraio 2025" */
  periodoOsservazione?: string
  testi?: { ciclo?: BloccoTesto[]; misure?: string[]; piano?: VocePiano[] }
}

const uno = (x: number | null | undefined) => formattaIt(x, 1)
const due = (x: number | null | undefined) => formattaIt(x, 2)
const met = (x: number) => formattaIt(x, 1)
const dleTesto = (x: number) => (!Number.isFinite(x) || x > 8 ? '> 8' : uno(x))
const minuscolo = (s: string) => s.charAt(0).toLocaleLowerCase('it-IT') + s.slice(1)

/** Didascalie numerate nell'ordine in cui le tabelle compaiono nel documento. */
function numeratore(primo: number) {
  let n = primo
  return (testo: string) => `Tabella ${n++}. ${testo}`
}

/** Raggruppa elementi consecutivi con la stessa chiave (per le celle unite). */
function gruppi<T>(xs: T[], chiave: (x: T) => string): T[][] {
  const out: T[][] = []
  for (const x of xs) {
    const ultimo = out[out.length - 1]
    if (ultimo && chiave(ultimo[0]) === chiave(x)) ultimo.push(x)
    else out.push([x])
  }
  return out
}

export function datiTemplateMicroclima(d: DatiDvrMicroclima) {
  const p = d.parametri
  const s = p.scenario
  const clo = p.clo || CLO_PREDEFINITO(s)
  const acclimatati = p.acclimatati ?? true
  const v = valutaMicroclima({ ...p, clo }, d.lavorazioni, d.rilievi, d.mansioni)
  const a = d.anagrafica
  const nomi = new Map(d.mansioni.map((m) => [m.id, m.nome]))
  const mansioniDi = (l: LavorazioneMicroclima) => l.mansioni.map((id) => nomi.get(id)).filter((x): x is string => !!x)
  const mansioniTesto = (l: LavorazioneMicroclima) => mansioniDi(l).join('\n') || '-'
  const tipi = d.ambiti.map((x) => x.tipo)
  const tipoPrincipale = tipi.find(eGalleria) ?? tipi[0]
  const ciclo = d.testi?.ciclo ?? (tipoPrincipale ? CICLO_PREDEFINITO[tipoPrincipale] : undefined) ?? []
  const inGalleria = galleria(s)
  const stagione = estivo(s) ? 'estivo' : 'invernale'
  const dove = inGalleria ? 'in galleria' : 'in esterno'
  const lavoratori = `lavoratori${a.impresa ? ` di ${a.impresa}` : ''} operanti ${dove} nel cantiere ${a.denominazione ?? ''}`.trim()
  const tab = numeratore(3)
  const meteo = p.meteo
  const mesi = meteo?.mesi ?? []
  const nomiMesi = elenco(mesi.map((m) => m.mese.toLocaleLowerCase('it-IT')))
  const vestiario = d.vestiario ?? vestiarioPredefinito(s)

  // ---------------------------------------------------------------- 1. Introduzione
  const intro = [
    `In applicazione del Titolo II Capo I del D.Lgs. 81/08 e s.m.i. viene ${d.documento.primaValutazione === false ? 'effettuato un aggiornamento della' : 'effettuata la'} valutazione delle condizioni di benessere termo-igrometrico nel periodo ${stagione} che interessano i ${lavoratori}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}.`,
    conRilievi(s)
      ? 'La valutazione è stata effettuata attraverso rilievi microclimatici eseguiti nelle varie aree di lavoro all’interno della galleria e durante lo svolgimento delle principali fasi lavorative.'
      : `La valutazione è stata effettuata a partire dai dati meteoclimatici ${meteo?.stazione ? `della stazione di ${meteo.stazione}` : 'della stazione meteo di riferimento'} per i mesi di ${nomiMesi || 'riferimento'}${meteo?.periodo ? ` degli anni ${meteo.periodo}` : ''}, associati alle principali lavorazioni svolte in esterno.`,
  ]

  // ---------------------------------------------------------------- 4. Metodologia
  const metodo = conRilievi(s)
    ? {
        testo42: 'Per la determinazione degli indici microclimatici e la caratterizzazione dell’ambiente termico sono stati misurati i seguenti parametri all’interno della galleria:',
        parametri42: [
          '(Ta) temperatura dell’aria (temperatura di bulbo secco);',
          '(Va) velocità dell’aria;',
          '(Urel) umidità relativa dell’aria;',
          '(Tuvn) temperatura di bulbo umido a ventilazione naturale;',
          '(Tg) temperatura globotermometrica;',
          '(Trug) temperatura di rugiada.',
        ],
        titolo43: 'Campionamenti',
        testo43:
          'Il campionamento dei parametri ambientali è stato effettuato con la centralina posizionata nelle varie aree di lavoro durante lo svolgimento delle principali fasi lavorative, con la ventilazione al regime in uso per l’attività in corso. La durata media utile delle misure è di circa 20 minuti.',
        titolo44: 'Strumentazione utilizzata',
        testo44: 'Centralina microclimatica dotata di:',
        strumenti: ['sonda psicrometrica;', 'anemometro a filo caldo;', 'sonda globotermometrica;', 'sonda a bulbo umido a ventilazione naturale.'],
      }
    : {
        testo42: `Per la valutazione delle condizioni microclimatiche nelle aree esterne sono stati utilizzati i dati meteo giornalieri${meteo?.fonte ? ` forniti da ${meteo.fonte}` : ''}${meteo?.stazione ? ` per la stazione di ${meteo.stazione}` : ''}, relativi ai mesi di ${nomiMesi}${meteo?.periodo ? ` degli anni ${meteo.periodo}` : ''}. I parametri utilizzati sono:`,
        parametri42: ['(Ta) temperatura media giornaliera, con i valori minimo e massimo delle medie giornaliere;', '(Urel) umidità relativa media;', '(Va) velocità media dell’aria.'],
        titolo43: 'Dati meteoclimatici',
        testo43:
          'I dati giornalieri sono stati mediati sul periodo di riferimento per ottenere i valori rappresentativi di ciascun mese. Per la temperatura media radiante, non fornita dalle stazioni meteo, si assume il valore indicato per ciascun mese o, in mancanza, la temperatura dell’aria.',
        titolo44: 'Giornate critiche',
        testo44: estivo(s)
          ? 'Per le giornate più calde la valutazione è integrata con i parametri della giornata più gravosa del periodo (temperatura dell’aria, umidità, vento, temperatura di globo e di bulbo umido naturale), sui quali si calcola l’indice WBGTe.'
          : 'Per le giornate più fredde la valutazione è integrata, per ciascun mese, con la giornata peggiore (temperatura minima, umidità relativa della stessa giornata e velocità del vento più alta), sulla quale si calcolano IREQ, DLE e WCI.',
        strumenti: [] as string[],
      }

  // ---------------------------------------------------------------- 5. Acquisizione dati
  const didMansioni = tab('Mansioni e gruppi omogenei per la valutazione')
  const conVestiario = vestiario.length > 0
  const didVestiario = conVestiario ? tab(`Isolamento termico dell’abbigliamento ${stagione}`) : ''
  const testoVestiario = conVestiario
    ? 'Sulla base delle osservazioni fatte direttamente in cantiere sull’abbigliamento indossato dai lavoratori, viene determinato l’isolamento termico del vestiario sfruttando i dati di letteratura che forniscono, per ogni capo d’abbigliamento, l’isolamento termico.'
    : `Il vestiario a disposizione dei lavoratori per il periodo ${stagione} è tale da conferire una resistenza termica pari a ${due(clo)} clo.`
  const didMet = tab(`Valori di dispendio metabolico (attività ${dove})`)
  const periodo = d.periodoOsservazione?.trim() || d.documento.periodoRiferimento || '-'
  const lavorazioniMet = gruppi(d.lavorazioni, (l) => l.fase).flatMap((g, i) =>
    g.map((l) => ({
      periodo: unibile('periodo', periodo),
      fase: unibile(`f${i}`, l.fase),
      mansioni: mansioniTesto(l),
      met: met(l.met),
    })),
  )

  // ---------------------------------------------------------------- 6. Dati
  const rilieviUsati = [...new Set(v.esiti.map((e) => e.rilievo).filter((r): r is RilievoMicroclima => !!r))]
  const rilieviTabella = (rilieviUsati.length ? d.rilievi.filter((r) => rilieviUsati.includes(r)) : d.rilievi).map((r) => ({
    fase: r.fase,
    sigla: `${r.codice}\n${r.data}`,
    postazione: r.postazione,
    ta: uno(r.ta),
    va: due(r.va),
    ur: uno(r.ur),
    tnw: uno(r.tnw),
    trug: uno(r.trugiada),
    tg: uno(r.tg),
  }))
  const didRilievi = conRilievi(s) ? tab('Risultati delle misure eseguite') : ''
  const didMeteo = conRilievi(s) ? '' : tab(`Dati meteoclimatici medi dei mesi di ${nomiMesi}${meteo?.periodo ? ` (${meteo.periodo})` : ''}`)
  const testoMeteo = conRilievi(s)
    ? ''
    : `${meteo?.fonte ? `Dal sito ${meteo.fonte} sono` : 'Sono'} stati ricavati i dati relativi a temperatura dell’aria (Ta), umidità relativa (Urel) e velocità del vento (Va) dei mesi di ${nomiMesi}${meteo?.periodo ? ` degli anni ${meteo.periodo}` : ''}${meteo?.stazione ? `, relativi alla stazione meteo di ${meteo.stazione}` : ''}. Nella tabella seguente se ne riportano i valori medi.`
  const tabellaMeteo = mesi.map((m) => ({ mese: m.mese, ta: uno(m.ta), taMin: uno(m.taMin), taMax: uno(m.taMax), ur: uno(m.ur), va: uno(m.va) }))

  // ---------------------------------------------------------------- 7. Ambiente termico
  const t = v.temperature
  const ambienteTermico: string[] = []
  if (s === 'galleria_inverno') {
    ambienteTermico.push(`In base ai rilievi effettuati è stato possibile classificare l’ambiente termico della galleria nel periodo invernale come “ambiente moderato”.`)
    if (t) ambienteTermico.push(`La temperatura dell’aria media in galleria è pari a ${uno(t.media)} °C, con valori massimi pari a ${uno(t.max)} °C e minimi di ${uno(t.min)} °C; l’umidità relativa oscilla tra ${uno(t.urMin)}% e ${uno(t.urMax)}%.`)
    ambienteTermico.push(
      'È ragionevole considerare che l’assenza di intense sorgenti di calore localizzate, la sostanziale uniformità di vestiario e le mansioni che comportano un’attività fisica simile per quasi tutti gli operatori richiedano al sistema di termoregolazione un intervento moderato per il mantenimento dell’omeotermia.',
    )
  } else if (s === 'galleria_estate') {
    ambienteTermico.push(
      `In base ai rilievi effettuati è stato possibile classificare l’ambiente termico della galleria nel periodo estivo come “ambiente caldo”${t ? `, con temperature dell’aria comprese tra ${uno(t.min)} °C e ${uno(t.max)} °C e umidità relativa tra ${uno(t.urMin)}% e ${uno(t.urMax)}%` : ''}.`,
      'Per la valutazione si utilizza pertanto l’indice WBGT (UNI EN ISO 7243), confrontato con i valori limite per classe metabolica.',
    )
  } else {
    const ta = mesi.map((m) => m.ta)
    const ur = mesi.map((m) => m.ur)
    const intervallo = (xs: number[], u: string) => (xs.length ? `tra ${uno(Math.min(...xs))}${u} e ${uno(Math.max(...xs))}${u}` : '')
    ambienteTermico.push(
      `Sulla base dei dati climatici medi dei mesi di ${nomiMesi}, l’ambiente termico esterno del cantiere nel periodo ${stagione} è classificabile come “ambiente moderato”${s === 'esterno_estate' ? ' tendente al caldo' : ' tendente al freddo'}: le temperature medie mensili sono comprese ${intervallo(ta, ' °C')} e l’umidità relativa media ${intervallo(ur, '%')}.`,
    )
    ambienteTermico.push(
      s === 'esterno_estate'
        ? 'La classificazione si riferisce al quadro climatico medio e non esclude le giornate particolarmente calde, nelle quali l’ambiente diventa “caldo”: per queste giornate la valutazione è integrata con l’indice WBGTe calcolato sulla giornata più gravosa del periodo.'
        : 'Nelle giornate più fredde e ventose i parametri si avvicinano a quelli degli ambienti freddi: in un’ottica precauzionale la valutazione è integrata con i metodi propri degli ambienti freddi (IREQ, durata limite di esposizione e indice WCI) applicati alle giornate peggiori di ciascun mese.',
    )
  }

  // ---------------------------------------------------------------- 8. Elaborazione
  const perLavorazione = (e: EsitoLavorazione) => e.lavorazione.fase
  const elaborazione: string[] = []
  const noteElaborazione: string[] = []
  let didPmv = ''
  let pmvRighe: Record<string, string>[] = []
  let didWbgt = ''
  let wbgtRighe: Record<string, string>[] = []
  const pmvMesi: { didascalia: string; righe: Record<string, string>[] }[] = []
  let didPicco = ''
  let didIreq = ''
  let ireqRighe: Record<string, string>[] = []
  let didWci = ''
  const pmvEsiti = v.esiti.filter((e) => e.comfort)
  const wbgtEsiti = v.esiti.filter((e) => e.wbgt)
  const meseEsiti = v.esiti.filter((e) => e.mesi)
  const esclusione =
    'Il calcolo degli indici non è stato effettuato per le mansioni che operano all’interno dei mezzi (escavatori, muletti, ecc.) né per gli impiegati che lavorano in ufficio, in quanto sia le macchine operatrici sia gli uffici sono dotati di impianto di climatizzazione e riscaldamento regolabile dai lavoratori.'

  if (s === 'galleria_inverno') {
    elaborazione.push(
      'La temperatura è risultata compresa tra 10 e 30 °C: sono stati pertanto calcolati gli indici PMV (voto medio previsto) e PPD (percentuale prevista di insoddisfatti), tipici degli ambienti moderati, per le varie mansioni durante le principali lavorazioni.',
      `I valori sono stati calcolati considerando l’isolamento termico intrinseco del vestiario a disposizione dei lavoratori pari a ${due(clo)} clo e i valori di dispendio metabolico riportati nella tabella del paragrafo 5.6; la temperatura media radiante è ricavata dalla temperatura globotermometrica.`,
    )
    didPmv = tab('Valori di PMV e PPD per gli ambienti classificati come moderati')
    pmvRighe = gruppi(pmvEsiti, perLavorazione).flatMap((g, i) =>
      g.map((e) => ({
        lavorazione: unibile(`l${i}`, e.lavorazione.fase),
        mansioni: mansioniTesto(e.lavorazione),
        clo: unibile(`c${i}`, due(clo)),
        met: met(e.lavorazione.met),
        pmv: uno(e.comfort!.pmv),
        ppd: uno(e.comfort!.ppd),
      })),
    )
    noteElaborazione.push(esclusione)
    const ppd = pmvEsiti.map((e) => e.comfort!.ppd)
    if (ppd.length && Math.max(...ppd) > 10) {
      noteElaborazione.push(
        `La percentuale di insoddisfatti varia tra ${uno(Math.min(...ppd))}% e ${uno(Math.max(...ppd))}%${Math.min(...ppd) > 10 ? ', sempre oltre' : ', in parte oltre'} il limite di riferimento del 10%; i valori più alti si registrano per le lavorazioni a maggior dispendio metabolico.`,
        `Tali valori sono stati ottenuti considerando una resistenza termica complessiva di ${due(clo)} clo: i lavoratori dispongono di vestiario di diversa resistenza termica (giacche leggere, giacche imbottite, ecc.) e possono indossare quello più adatto alla condizione operativa in cui si trovano.`,
      )
    }
  } else if (s === 'galleria_estate') {
    elaborazione.push(
      'Nella tabella seguente si determina, per ogni lavorazione e per ogni gruppo di mansioni, l’indice WBGTi, normalmente utilizzato per la valutazione degli ambienti caldi interni (WBGTi = 0,7 Tuvn + 0,3 Tg).',
    )
    didWbgt = tab('Calcolo del WBGTi per gli ambienti classificati come caldi')
    wbgtRighe = gruppi(wbgtEsiti, (e) => `${e.lavorazione.fase}|${e.rilievo!.id}`).flatMap((g, i) =>
      g.map((e) => ({
        lavorazione: unibile(`l${i}`, e.lavorazione.fase),
        mansioni: mansioniTesto(e.lavorazione),
        ta: unibile(`ta${i}`, uno(e.rilievo!.ta)),
        tg: unibile(`tg${i}`, uno(e.rilievo!.tg)),
        tnw: unibile(`tn${i}`, uno(e.rilievo!.tnw)),
        met: met(e.lavorazione.met),
        wbgt: unibile(`w${i}`, uno(e.wbgt!.valore)),
        limite: String(e.wbgt!.limite),
      })),
    )
    noteElaborazione.push(esclusione)
  } else {
    elaborazione.push(
      `Le tabelle seguenti riportano, per ciascun mese, gli indici PMV e PPD calcolati per le principali lavorazioni svolte in esterno con i dati climatici medi del mese, considerando un isolamento termico del vestiario pari a ${due(clo)} clo e i valori di dispendio metabolico della tabella del paragrafo 5.6.`,
      'La temperatura media radiante è assunta pari a quella indicata per il mese o, in mancanza, pari alla temperatura dell’aria.',
    )
    mesi.forEach((m, k) => {
      pmvMesi.push({
        didascalia: tab(`Calcolo degli indici sulla base delle medie del mese di ${m.mese} (Ta = ${uno(m.ta)} °C, Va = ${uno(m.va)} m/s, Urel = ${uno(m.ur)}%, Tr = ${uno(m.tr ?? m.ta)} °C, ${due(clo)} clo)`),
        righe: meseEsiti.map((e) => ({
          lavorazione: e.lavorazione.fase,
          mansioni: mansioniTesto(e.lavorazione),
          clo: due(clo),
          met: met(e.lavorazione.met),
          pmv: uno(e.mesi![k].comfort.pmv),
          ppd: uno(e.mesi![k].comfort.ppd),
        })),
      })
    })
    noteElaborazione.push(esclusione)
  }

  const picco = s === 'esterno_estate' && p.meteo?.picco && v.piccoWbgt !== null ? p.meteo.picco : null
  const piccoTesti: string[] = []
  let piccoRighe: Record<string, string>[] = []
  if (picco) {
    piccoTesti.push(
      'Durante l’estate si possono verificare giornate particolarmente avverse, con temperature che superano i 30 °C. Per quantificare il rischio da stress termico in queste condizioni è stato calcolato l’indice WBGTe (UNI EN ISO 7243: WBGTe = 0,7 Tuvn + 0,2 Tg + 0,1 Ta).',
      `Il calcolo considera i dati della giornata più gravosa del periodo di riferimento${picco.data ? `, il ${picco.data}` : ''}: temperatura dell’aria ${uno(picco.ta)} °C, umidità relativa ${uno(picco.ur)}%, velocità del vento ${uno(picco.va)} m/s, temperatura di globo ${uno(picco.tg)} °C, temperatura di bulbo umido naturale ${uno(picco.tnw)} °C.`,
      `Il valore WBGTe = ${uno(v.piccoWbgt)} °C, rappresentativo del picco, viene confrontato con i limiti di ciascuna lavorazione nel capitolo successivo.`,
    )
    didPicco = tab('Calcolo del WBGTe nella giornata più gravosa')
    piccoRighe = meseEsiti.map((e) => ({
      lavorazione: e.lavorazione.fase,
      mansioni: mansioniTesto(e.lavorazione),
      met: met(e.lavorazione.met),
      wbgt: `${uno(e.picco!.valore)} °C`,
      limiteAcc: `${limiteWbgt(e.lavorazione.met, true)} °C`,
      limiteNon: `${limiteWbgt(e.lavorazione.met, false)} °C`,
    }))
  }

  const freddo = s === 'esterno_inverno' && mesi.some((m) => m.peggiore)
  const freddoTesti: string[] = []
  const peggiori: string[] = []
  let wciRighe: Record<string, string>[] = []
  if (freddo) {
    freddoTesti.push(
      'Al fine di integrare la valutazione del discomfort termico con una specifica analisi del rischio per la salute derivante dall’esposizione al freddo, è stato applicato il metodo dell’isolamento termico richiesto (IREQ) della norma UNI EN ISO 11079, con i dati climatici più severi di ciascun mese (“giornata peggiore”):',
    )
    for (const m of mesi) {
      if (m.peggiore) peggiori.push(`${m.mese}: temperatura ${uno(m.peggiore.ta)} °C, umidità relativa ${uno(m.peggiore.ur)}%, velocità del vento ${uno(m.peggiore.va)} m/s.`)
    }
    didIreq = tab('Valutazione del rischio da freddo secondo il metodo IREQ (UNI EN ISO 11079) e durata limite di esposizione (DLE)')
    ireqRighe = mesi.flatMap((m, k) => {
      if (!m.peggiore) return []
      const perMet = gruppi(
        [...meseEsiti].sort((x, y) => x.lavorazione.met - y.lavorazione.met),
        (e) => String(e.lavorazione.met),
      )
      return perMet.map((g) => {
        const f = g[0].mesi![k].freddo!
        return {
          mese: unibile(`m${k}`, m.mese.length > 5 ? `${m.mese.slice(0, 3)}.` : m.mese),
          met: met(g[0].lavorazione.met),
          min: uno(f.min),
          neu: uno(f.neu),
          confronto: CLASSI_IREQ[f.classe].confronto,
          dle: dleTesto(f.dle),
          mansioni: [...new Set(g.flatMap((e) => mansioniDi(e.lavorazione)))].join(', ') || '-',
        }
      })
    })
    didWci = tab('Indice WCI calcolato per le giornate peggiori')
    wciRighe = v.wci.map((w) => ({ mese: w.mese, ta: `${uno(w.ta)} °C`, va: `${uno(w.va)} m/s`, wci: String(w.valore), intervallo: w.intervallo, effetto: w.effetto }))
  }

  // ---------------------------------------------------------------- 9. Confronto
  let didConfrontoPmv = ''
  let confrontoPmv: Record<string, string>[] = []
  let didConfrontoWbgt = ''
  let didConfrontoMesi = ''
  let confrontoMesi: Record<string, string>[] = []
  let didCategorie = ''
  let didConfrontoPicco = ''
  let didClassiIreq = ''
  let didConfrontoWci = ''
  if (s === 'galleria_inverno') {
    didConfrontoPmv = tab('Confronto PMV-PPD con i limiti di riferimento')
    confrontoPmv = pmvEsiti.map((e) => ({
      lavorazione: e.lavorazione.fase,
      postazione: e.rilievo?.postazione || '-',
      mansioni: mansioniTesto(e.lavorazione),
      pmv: uno(e.comfort!.pmv),
      ppd: uno(e.comfort!.ppd),
    }))
  } else if (s === 'galleria_estate') {
    didConfrontoWbgt = tab('Confronto del WBGTi con i limiti di riferimento')
  } else {
    didConfrontoMesi = tab('Confronto PMV-PPD con i limiti di riferimento – ambiente termico moderato')
    confrontoMesi = meseEsiti.flatMap((e, i) =>
      e.mesi!.map((m) => ({
        lavorazione: unibile(`l${i}`, e.lavorazione.fase),
        mansioni: unibile(`n${i}`, mansioniTesto(e.lavorazione)),
        mese: m.mese,
        pmv: uno(m.comfort.pmv),
        ppd: uno(m.comfort.ppd),
        categoria: m.comfort.categoria,
      })),
    )
    didCategorie = tab('Intervalli dei limiti di riferimento PMV-PPD (UNI EN ISO 7730)')
    if (picco) didConfrontoPicco = tab('Confronto del WBGTe con i limiti di riferimento – giornata più gravosa')
    if (freddo) {
      didClassiIreq = tab('Intervalli dei limiti di riferimento del metodo IREQ')
      didConfrontoWci = tab('Indice WCI: confronto con i valori di riferimento')
    }
  }
  const nota = acclimatati ? '(*) WBGT limite per soggetti acclimatati, in base alla classe metabolica (UNI EN ISO 7243).' : '(*) WBGT limite per soggetti non acclimatati, in base alla classe metabolica (UNI EN ISO 7243).'

  return {
    valutazione: v,
    dati: {
      ...datiCopertina(a, d.documento, `Microclima_${stagione}`, d.studio),
      ambitoOggetto: inGalleria ? 'Interno galleria' : 'Attività in esterno',
      stagioneTesto: `Periodo ${stagione}`,
      intro,
      testoAllegato: conRilievi(s) ? 'In allegato si riportano i rapporti di prova delle misure eseguite.' : 'In allegato si riportano i dati meteoclimatici utilizzati per la valutazione.',
      titoloAllegato2: conRilievi(s) ? 'RAPPORTI DI PROVA DELLE MISURE EFFETTUATE' : 'DATI METEOCLIMATICI DI RIFERIMENTO',
      allegato2Indice: conRilievi(s) ? 'ALLEGATO 2 – Rapporti di prova' : 'ALLEGATO 2 – Dati meteoclimatici di riferimento',
      ...metodo,
      cloTesto: due(clo),
      datiIntro: conRilievi(s)
        ? [
            'Le misure sono state eseguite all’interno della galleria nelle postazioni maggiormente significative.',
            'Non sono stati eseguiti rilievi sui mezzi perché dotati di impianto di condizionamento: le condizioni microclimatiche a bordo sono gestite direttamente dagli operatori.',
          ]
        : [testoMeteo],
      cicloBlocchi: ciclo,
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      didMansioni,
      conVestiario,
      testoVestiario,
      didVestiario,
      vestiario: vestiario.map((c) => ({ capo: c.capo, clo: due(c.clo), totale: unibile('clo', due(clo)) })),
      didMet,
      lavorazioniMet,
      misure: d.testi?.misure ?? misurePredefinite(s),
      galleria: inGalleria,
      esterno: !inGalleria,
      conRilievi: conRilievi(s),
      didRilievi,
      rilievi: rilieviTabella,
      testoMeteo,
      didMeteo,
      meteo: tabellaMeteo,
      ambienteTermico,
      elaborazione,
      noteElaborazione,
      pmvRilievi: s === 'galleria_inverno',
      didPmv,
      pmvRighe,
      wbgtRilievi: s === 'galleria_estate',
      didWbgt,
      wbgtRighe,
      pmvMesi,
      esterni: !conRilievi(s),
      picco: !!picco,
      piccoTesti,
      didPicco,
      piccoWbgt: uno(v.piccoWbgt),
      piccoRighe,
      freddo,
      freddoTesti,
      peggiori,
      didIreq,
      ireqRighe,
      testoIreq: `Il calcolo è eseguito secondo l’algoritmo della norma UNI EN ISO 11079 con un isolamento del vestiario pari a ${due(clo)} clo; la DLE è calcolata con riferimento al criterio IREQmin (accumulo limite di calore Qlim = 144 kJ/m²).`,
      testoWci:
        'Per la prevenzione del raffreddamento locale delle parti scoperte (mani, volto, orecchie) è stato applicato l’indice di raffreddamento del vento (Wind Chill Index, WCI) alle stesse giornate peggiori: WCI = 1,16 × (10,45 + 10 √Va − Va) × (33 − Ta).',
      didWci,
      wci: wciRighe,
      didConfrontoPmv,
      confrontoPmv,
      didConfrontoWbgt,
      notaWbgt: nota,
      didConfrontoMesi,
      confrontoMesi,
      didCategorie,
      categorie: (['A', 'B', 'C', 'D'] as const).map((k) => ({ categoria: k, ...CATEGORIE_COMFORT[k] })),
      didConfrontoPicco,
      didClassiIreq,
      classiIreq: (['C', 'B', 'A'] as const).map((k) => ({ classe: k, ...CLASSI_IREQ[k] })),
      didConfrontoWci,
      conclusioni: conclusioni(s, v, clo, mesi.map((m) => m.mese), picco?.data),
      piano: (d.testi?.piano ?? pianoPredefinito(s)).map((x) => ({ testo: x.testo, sotto: x.sotto ?? [] })),
    },
  }
}

function conclusioni(s: DatiDvrMicroclima['parametri']['scenario'], v: ValutazioneMicroclima, clo: number, mesi: string[], dataPicco?: string): string[] {
  const out: string[] = []
  const t = v.temperature
  const lav = (xs: EsitoLavorazione[]) => elenco([...new Set(xs.map((e) => minuscolo(e.lavorazione.fase)))])
  if (s === 'galleria_inverno') {
    const pmv = v.esiti.filter((e) => e.comfort)
    const ppd = pmv.map((e) => e.comfort!.ppd)
    out.push('Dai dati riportati nelle tabelle precedenti si evince che, nel periodo invernale, i lavoratori operano all’interno della galleria in ambiente moderato.')
    if (t) out.push(`La temperatura dell’aria media in galleria è pari a ${uno(t.media)} °C, con valori compresi tra ${uno(t.min)} °C e ${uno(t.max)} °C; l’umidità relativa oscilla tra ${uno(t.urMin)}% e ${uno(t.urMax)}%.`)
    if (ppd.length) {
      const peggiore = pmv.reduce((x, y) => (y.comfort!.ppd > x.comfort!.ppd ? y : x))
      const fuori = pmv.filter((e) => e.comfort!.categoria === 'D')
      out.push(
        fuori.length
          ? `La percentuale di insoddisfatti, calcolata con gli indici PMV e PPD, è compresa tra ${uno(Math.min(...ppd))}% e ${uno(Math.max(...ppd))}%${fuori.length === pmv.length ? ', sempre' : ' e in parte'} superiore al valore di riferimento del 10%. Il valore più alto si registra per ${minuscolo(peggiore.lavorazione.fase)} (PPD ${uno(peggiore.comfort!.ppd)}%): gli indici crescono con il dispendio metabolico delle mansioni.`
          : `La percentuale di insoddisfatti, calcolata con gli indici PMV e PPD, è compresa tra ${uno(Math.min(...ppd))}% e ${uno(Math.max(...ppd))}%, entro i valori di riferimento.`,
      )
    }
    out.push(
      'Gli indici PMV e PPD danno un’indicazione della percezione dei lavoratori in un ambiente termico moderato: il superamento dei valori di riferimento non esprime una situazione di rischio per la salute ma una condizione di discomfort, gestita con le misure del capitolo successivo.',
    )
  } else if (s === 'galleria_estate') {
    const w = v.esiti.filter((e) => e.wbgt)
    const oltre = w.filter((e) => e.wbgt!.superato)
    out.push(`Dai dati riportati nelle tabelle precedenti si evince che, nel periodo estivo, i lavoratori operano all’interno della galleria in ambiente caldo${t ? `, con temperature dell’aria comprese tra ${uno(t.min)} °C e ${uno(t.max)} °C` : ''}.`)
    out.push(
      oltre.length
        ? `L’indice WBGTi supera il valore limite per ${lav(oltre)}: per queste lavorazioni sussiste un rischio da stress termico e si applicano le misure del capitolo successivo, con priorità alla ventilazione, alle pause in luogo fresco e all’idratazione.`
        : 'L’indice WBGTi risulta inferiore ai valori limite per tutte le lavorazioni valutate: restano valide le misure generali di prevenzione del capitolo successivo, da intensificare nelle giornate più calde.',
    )
    const vicini = w.filter((e) => !e.wbgt!.superato && e.wbgt!.limite - e.wbgt!.valore <= 1)
    if (vicini.length) out.push(`Si segnala che per ${lav(vicini)} il WBGTi è prossimo al limite (entro 1 °C).`)
  } else {
    const esiti = v.esiti.filter((e) => e.mesi)
    const d = esiti.filter((e) => e.mesi!.some((m) => m.comfort.categoria === 'D'))
    out.push(`La valutazione si è basata sui dati climatici medi dei mesi di ${elenco(mesi.map((m) => m.toLocaleLowerCase('it-IT')))} e sull’applicazione dei modelli della UNI EN ISO 7730${s === 'esterno_estate' ? ' e della UNI EN ISO 7243' : ' e della UNI EN ISO 11079'}.`)
    out.push(
      d.length
        ? `Nelle condizioni climatiche medie gli indici PMV e PPD indicano una condizione di discomfort (categoria D) per ${lav(d)}; per le altre lavorazioni il comfort è accettabile. Il superamento dei valori di riferimento degli indici PMV e PPD esprime una condizione di discomfort e non di rischio per la salute.`
        : 'Nelle condizioni climatiche medie gli indici PMV e PPD indicano condizioni di comfort accettabile per tutte le lavorazioni valutate.',
    )
    if (s === 'esterno_estate' && v.piccoWbgt !== null) {
      const oltre = esiti.filter((e) => e.picco?.superato)
      out.push(
        oltre.length
          ? `Nella giornata più gravosa${dataPicco ? ` (${dataPicco})` : ''} il WBGTe stimato è pari a ${uno(v.piccoWbgt)} °C e supera il limite per ${lav(oltre)}: in tali giornate sussiste un rischio da stress termico, che impone l’attivazione del piano di prevenzione del capitolo successivo (pause in luogo ombreggiato, riprogrammazione delle lavorazioni più gravose nelle ore meno calde, idratazione).`
          : `Nella giornata più gravosa${dataPicco ? ` (${dataPicco})` : ''} il WBGTe stimato è pari a ${uno(v.piccoWbgt)} °C, inferiore ai limiti di tutte le lavorazioni.`,
      )
    }
    if (s === 'esterno_inverno') {
      const c = esiti.filter((e) => e.mesi!.some((m) => m.freddo?.classe === 'C'))
      const b = esiti.filter((e) => !c.includes(e) && e.mesi!.some((m) => m.freddo?.classe === 'B'))
      if (c.length) out.push(`Nelle giornate peggiori l’isolamento del vestiario (${due(clo)} clo) è inferiore all’IREQmin per ${lav(c)}: l’esposizione va limitata alla durata limite (DLE) indicata in tabella, con pause in locale riscaldato e vestiario più isolante.`)
      if (b.length) out.push(`Per ${lav(b)} l’isolamento del vestiario è compreso tra IREQmin e IREQneu: il rischio è limitato nel tempo e va gestito con pause di recupero.`)
      if (!c.length && !b.length) out.push(`Nelle giornate peggiori l’isolamento del vestiario (${due(clo)} clo) è adeguato per tutte le lavorazioni (Icl ≥ IREQneu).`)
      const wmax = v.wci.length ? v.wci.reduce((x, y) => (y.valore > x.valore ? y : x)) : null
      if (wmax) out.push(`L’indice WCI delle giornate peggiori raggiunge ${wmax.valore} kcal/(h·m²) a ${wmax.mese.toLocaleLowerCase('it-IT')} (${wmax.effetto.toLocaleLowerCase('it-IT')})${wmax.valore >= 1200 ? ': è necessario proteggere le parti scoperte (guanti, sottocasco, protezione del volto) e ridurre i tempi di esposizione.' : '.'}`)
    }
  }
  out.push('Le misure di prevenzione e protezione da adottare sono riportate nel capitolo successivo.')
  return out
}
