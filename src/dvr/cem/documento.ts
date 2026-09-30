/** Dati per il template Word del DVR Campi elettromagnetici (public/templates/dvr/cem.docx). */
import { datiCopertina, elenco, type DocumentoCopertina } from '../comune/copertina'
import { formattaIt } from '../comune/numeri'
import type { AmbitoDvr, AnagraficaDvr } from '../comune/tipi'
import { unibile } from '../comune/unisciCelle'
import { cicloPredefinito, type BloccoTesto } from '../rumore/testiPredefiniti'
import {
  CARATTERISTICHE,
  DA_VALUTARE,
  GIUSTIFICABILI,
  METODOLOGIA,
  MISURE_PREVENTIVE,
  NORMATIVA,
  ORGANIZZAZIONE,
  pianoPredefinito,
  SENSIBILI,
  STRUMENTAZIONE,
  ZONE,
  type TestiCem,
} from './testi'
import {
  CATEGORIE,
  ESITI,
  livelliPopolazione,
  valoriAzione,
  valutaCem,
  VA_STATICI,
  type EsitoMisura,
  type MisuraCem,
  type SorgenteCem,
  type ValutazioneCem,
} from './valutazione'

export interface DatiDvrCem {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: { id: string; nome: string; attivita?: string }[]
  sorgenti: SorgenteCem[]
  misure: MisuraCem[]
  testi?: TestiCem & { ciclo?: BloccoTesto[] }
}

/** Numero leggibile: 3 cifre significative, separatore delle migliaia col punto. */
export function num(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return '-'
  if (x === 0) return '0'
  const cifre = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(x))))
  const r = Number(x.toFixed(Math.min(cifre, 4)))
  const [intera, dec] = String(Math.abs(r)).split('.')
  return `${r < 0 ? '-' : ''}${intera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${dec ? `,${dec}` : ''}`
}

const pct = (x: number | null) => (x == null ? '-' : x < 0.01 ? '< 1%' : `${formattaIt(x * 100, 0)}%`)

/** "50 Hz", "27 MHz", "2,4 GHz", "statico". */
export function frequenzaTesto(f: number | null | undefined): string {
  if (f == null) return '-'
  if (f < 1) return 'statico'
  const [div, u] = f >= 1e9 ? [1e9, 'GHz'] : f >= 1e6 ? [1e6, 'MHz'] : f >= 1e3 ? [1e3, 'kHz'] : [1, 'Hz']
  return `${num(f / div)} ${u}`
}

const minuscolo = (s: string) => s.charAt(0).toLocaleLowerCase('it-IT') + s.slice(1)

/**
 * Tabella dei valori di azione a bassa frequenza (allegato XXXVI parte II, tab. B1 e B2) con i livelli
 * per la popolazione (1999/519/CE); f in Hz. Le fasce uniscono i confini delle tre tabelle.
 */
const VA_BASSE: string[][] = [
  ['1 ≤ f < 8 Hz', '2,0·10⁴', '2,0·10⁴', '2,0·10⁵ / f²', '3,0·10⁵ / f', '9,0·10⁵ / f', '1,0·10⁴', '4,0·10⁴ / f²'],
  ['8 ≤ f < 25 Hz', '2,0·10⁴', '2,0·10⁴', '2,5·10⁴ / f', '3,0·10⁵ / f', '9,0·10⁵ / f', '1,0·10⁴', '5,0·10³ / f'],
  ['25 ≤ f < 50 Hz', '5,0·10⁵ / f', '2,0·10⁴', '1,0·10³', '3,0·10⁵ / f', '9,0·10⁵ / f', '2,5·10⁵ / f', '5,0·10³ / f'],
  ['50 ≤ f < 300 Hz', '5,0·10⁵ / f', '1,0·10⁶ / f', '1,0·10³', '3,0·10⁵ / f', '9,0·10⁵ / f', '2,5·10⁵ / f', '5,0·10³ / f'],
  ['300 ≤ f < 800 Hz', '5,0·10⁵ / f', '1,0·10⁶ / f', '3,0·10⁵ / f', '3,0·10⁵ / f', '9,0·10⁵ / f', '2,5·10⁵ / f', '5,0·10³ / f'],
  ['800 Hz ≤ f < 1,64 kHz', '5,0·10⁵ / f', '1,0·10⁶ / f', '3,0·10⁵ / f', '3,0·10⁵ / f', '9,0·10⁵ / f', '2,5·10⁵ / f', '6,25'],
  ['1,64 ≤ f < 3 kHz', '5,0·10⁵ / f', '6,1·10²', '3,0·10⁵ / f', '3,0·10⁵ / f', '9,0·10⁵ / f', '2,5·10⁵ / f', '6,25'],
  ['3 ≤ f < 150 kHz', '1,7·10²', '6,1·10²', '1,0·10²', '1,0·10²', '3,0·10²', '87', '6,25'],
  ['150 kHz ≤ f < 1 MHz', '1,7·10²', '6,1·10²', '1,0·10²', '1,0·10²', '3,0·10²', '87', '0,92·10⁶ / f'],
  ['1 ≤ f < 10 MHz', '1,7·10²', '6,1·10²', '1,0·10²', '1,0·10²', '3,0·10²', '87 / √(f/10⁶)', '0,92·10⁶ / f'],
]
const CHIAVI_BASSE = ['frequenza', 'eInf', 'eSup', 'bInf', 'bSup', 'bArti', 'popE', 'popB'] as const

function conclusioni(v: ValutazioneCem, mansioni: DatiDvrCem['mansioni']): { punti: string[]; precisazioni: string[] } {
  const punti: string[] = []
  const g = v.sorgenti.filter((s) => s.giustificabile)
  const ng = v.sorgenti.filter((s) => !s.giustificabile)
  punti.push(
    `sono state censite ${v.sorgenti.length} sorgenti di campi elettromagnetici: ${g.length} giustificabili secondo la norma CEI EN 50499${ng.length ? `, ${ng.length} sottoposte a valutazione specifica` : ''};`,
  )
  const per = (e: EsitoMisura) => ng.filter((s) => s.esito === e)
  const nomi = (xs: typeof ng) => elenco(xs.map((s) => minuscolo(s.sorgente.descrizione)))
  if (ng.length) {
    if (per('popolazione').length) punti.push(`per ${nomi(per('popolazione'))} i livelli rilevati sono inferiori ai livelli di riferimento per la popolazione (zona 0);`)
    if (per('lavoratori').length) {
      punti.push(
        `per ${nomi(per('lavoratori'))} sono superati i livelli per la popolazione ma sono rispettati i valori di azione: le aree vicine alle sorgenti sono in zona 1, da segnalare e interdire ai lavoratori particolarmente sensibili;`,
      )
    }
    if (per('vaInferiori').length) punti.push(`per ${nomi(per('vaInferiori'))} sono superati i valori di azione inferiori ma non quelli superiori: si applicano le misure specifiche dell’art. 210 D.Lgs. 81/08;`)
    if (per('vaSuperiori').length) punti.push(`per ${nomi(per('vaSuperiori'))} sono superati i valori di azione superiori (zona 2): serve la verifica dei valori limite di esposizione e la riduzione dell’esposizione;`)
    const senza = ng.filter((s) => s.esito == null)
    if (senza.length) punti.push(`per ${nomi(senza)} la valutazione si basa sui dati del fabbricante e sulle modalità d’uso, senza misure in campo;`)
  }
  const esposte = v.mansioni.filter((m) => m.esito && m.esito !== 'popolazione')
  if (mansioni.length) {
    punti.push(
      esposte.length
        ? `le mansioni che lavorano in zona 1 o 2 sono: ${elenco(esposte.map((m) => m.mansione.nome))}; per tutte le altre l’esposizione è inferiore ai livelli per la popolazione.`
        : 'per tutte le mansioni l’esposizione è inferiore ai livelli di riferimento per la popolazione: il rischio da campi elettromagnetici è trascurabile, anche per i lavoratori particolarmente sensibili, se le sorgenti sono usate secondo le istruzioni del fabbricante.',
    )
  }
  const precisazioni: string[] = []
  if (v.sorgenti.some((s) => s.esito && s.esito !== 'popolazione')) {
    precisazioni.push('i valori di azione non tutelano i lavoratori particolarmente sensibili al rischio, per i quali valgono i livelli per la popolazione e le distanze di rispetto indicate;')
  }
  precisazioni.push('la valutazione vale per le sorgenti, le modalità d’uso e le distanze di lavoro rilevate: nuove attrezzature o modifiche richiedono l’aggiornamento.')
  return { punti, precisazioni }
}

export function datiTemplateCem(d: DatiDvrCem) {
  const v = valutaCem(d.sorgenti, d.misure, d.mansioni)
  const a = d.anagrafica
  const t = d.testi ?? {}
  const tipi = d.ambiti.map((x) => x.tipo)
  const lavoratori = `lavoratori${a.impresa ? ` di ${a.impresa}` : ''} operanti nel cantiere ${a.denominazione ?? ''}`.trim()
  const nomeMansione = new Map(d.mansioni.map((m) => [m.id, m.nome]))
  const mansioniDi = (s: SorgenteCem) => (s.mansioni ?? []).map((id) => nomeMansione.get(id)).filter(Boolean).join(', ') || '-'
  const numeroSorgente = new Map(d.sorgenti.map((s, i) => [s.id, i + 1]))
  const ng = v.sorgenti.filter((s) => !s.giustificabile)
  const g = v.sorgenti.filter((s) => s.giustificabile)
  const conMisure = v.misure.length > 0
  const { punti, precisazioni } = conclusioni(v, d.mansioni)

  const vaBasse = VA_BASSE.map((r) => Object.fromEntries(CHIAVI_BASSE.map((k, i) => [k, r[i]])) as Record<(typeof CHIAVI_BASSE)[number], string>)
  const vaAlte = [
    { frequenza: '100 kHz ≤ f < 1 MHz', e: '610', b: '2,0·10⁶ / f', popE: '87', popB: '0,92·10⁶ / f' },
    { frequenza: '1 ≤ f < 10 MHz', e: '6,1·10⁸ / f', b: '2,0·10⁶ / f', popE: '87 / √(f/10⁶)', popB: '0,92·10⁶ / f' },
    { frequenza: '10 ≤ f < 400 MHz', e: '61', b: '0,2', popE: '28', popB: '0,092' },
    { frequenza: '400 MHz ≤ f < 2 GHz', e: '3·10⁻³ √f', b: '1,0·10⁻⁵ √f', popE: '1,375 √(f/10⁶)', popB: '0,0046 √(f/10⁶)' },
    { frequenza: '2 GHz ≤ f ≤ 300 GHz', e: '140', b: '0,45', popE: '61', popB: '0,20' },
  ]

  return {
    valutazione: v,
    dati: {
      ...datiCopertina(a, d.documento, 'CEM', d.studio),
      intro1: `In applicazione al Titolo VIII, Capo IV del D.Lgs. 81/08 e s.m.i., viene ${d.documento.primaValutazione === false ? 'effettuato un aggiornamento della' : 'effettuata la'} valutazione dei rischi derivanti dall’esposizione a campi elettromagnetici per i ${lavoratori}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}.`,
      normativa: t.normativa?.length ? t.normativa : NORMATIVA,
      caratteristiche: CARATTERISTICHE,
      vaBasse,
      va50: `A 50 Hz (rete elettrica) i valori di azione sono: campo elettrico ${num(valoriAzione(50).e.inf)} V/m (inferiore) e ${num(valoriAzione(50).e.sup)} V/m (superiore); induzione magnetica ${num(valoriAzione(50).b.inf)} µT (inferiore), ${num(valoriAzione(50).b.sup)} µT (superiore) e ${num(valoriAzione(50).b.arti)} µT per gli arti. I livelli per la popolazione sono ${num(livelliPopolazione(50).e)} V/m e ${num(livelliPopolazione(50).b)} µT.`,
      vaAlte,
      vaStatici: [
        { rischio: 'Interferenza con dispositivi medici impiantati attivi', valore: num(VA_STATICI.dispositiviImpiantati / 1000) },
        { rischio: 'Attrazione e propulsione nel campo periferico di sorgenti ad alta intensità (> 100 mT)', valore: num(VA_STATICI.attrazione / 1000) },
      ],
      giustificabiliElenco: GIUSTIFICABILI,
      daValutareElenco: DA_VALUTARE,
      metodologia: METODOLOGIA,
      zoneTesti: ZONE,
      cicloBlocchi: t.ciclo ?? cicloPredefinito(tipi),
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      misurePreventive: t.misurePreventive?.length ? t.misurePreventive : MISURE_PREVENTIVE,
      organizzazione: t.organizzazione?.length ? t.organizzazione : ORGANIZZAZIONE,
      sorgenti: d.sorgenti.map((s, i) => ({
        numero: String(i + 1),
        descrizione: s.descrizione,
        frequenza: frequenzaTesto(s.frequenza),
        attivita: [s.attivita, s.postazione].filter(Boolean).join(' – ') || '-',
        mansioni: mansioniDi(s),
      })),
      giustificabili: g.map((s) => ({
        descrizione: s.sorgente.descrizione,
        riferimento: CATEGORIE[s.sorgente.categoria].riferimento,
        attivita: s.sorgente.attivita || '-',
        motivazione: s.sorgente.motivazione?.trim() || 'Attrezzatura conforme a priori ai livelli per la popolazione se installata e usata secondo le istruzioni del fabbricante.',
      })),
      conGiustificabili: g.length > 0,
      daValutare: ng.map((s) => ({
        descrizione: s.sorgente.descrizione,
        frequenza: frequenzaTesto(s.sorgente.frequenza),
        attivita: [s.sorgente.attivita, s.sorgente.postazione].filter(Boolean).join(' – ') || '-',
        mansioni: mansioniDi(s.sorgente),
        modalita: s.misure.length ? `Misure in campo (${s.misure.length})` : 'Dati del fabbricante',
        motivazione: s.sorgente.motivazione?.trim() || CATEGORIE[s.sorgente.categoria].nome,
      })),
      conDaValutare: ng.length > 0,
      nessunaDaValutare: ng.length === 0,
      rilieviTesti: conMisure
        ? [
            `Per le sorgenti che richiedono la valutazione specifica sono state eseguite misure del campo elettrico e dell’induzione magnetica nelle postazioni di lavoro, per un totale di ${v.misure.length} punti di misura.`,
            t.strumentazione?.trim() || STRUMENTAZIONE,
          ]
        : [
            ng.length
              ? 'Per le sorgenti che richiedono la valutazione specifica non sono state eseguite misure in campo: la valutazione si basa sui dati tecnici del fabbricante, sui dati di letteratura e sulle distanze di lavoro.'
              : 'Tutte le sorgenti censite sono giustificabili: non è necessario eseguire misure in campo.',
          ],
      conMisure,
      misure: v.misure.map((m, i) => ({
        numero: String(i + 1),
        sorgente: unibile(`s-${m.misura.sorgenteId}`, `${numeroSorgente.get(m.misura.sorgenteId) ?? '?'}. ${m.sorgente?.descrizione ?? '-'}`),
        postazione: `${m.misura.postazione || '-'}${m.misura.arti ? ' (arti)' : ''}`,
        distanza: m.misura.distanza != null ? num(m.misura.distanza) : '-',
        frequenza: frequenzaTesto(m.frequenza),
        e: num(m.misura.e),
        b: num(m.b),
      })),
      confronti: v.misure.map((m, i) => ({
        numero: String(i + 1),
        popolazione: pct(m.indicePopolazione),
        inferiori: pct(m.indiceInf),
        superiori: pct(m.indiceSup),
        esito: m.esito ? ESITI[m.esito].breve : '-',
        zona: m.esito ? String(ESITI[m.esito].zona) : '-',
      })),
      zone: v.sorgenti.map((s) => ({
        sorgente: s.sorgente.descrizione,
        zona: s.esito ? `Zona ${ESITI[s.esito].zona}` : 'Da definire',
        esito: s.esito ? ESITI[s.esito].breve : s.giustificabile ? 'Giustificabile' : 'Senza misure',
        distanza: s.distanzaRispetto != null ? `${num(s.distanzaRispetto)} m` : s.esito && s.esito !== 'popolazione' ? 'Area della sorgente' : '-',
        accesso: !s.esito || s.esito === 'popolazione' ? 'Libero' : s.esito === 'vaSuperiori' ? 'Solo lavoratori autorizzati con misure specifiche' : 'Vietato ai lavoratori particolarmente sensibili',
      })),
      esitiMansioni: v.mansioni.map((m) => ({
        nome: m.mansione.nome,
        sorgenti: m.sorgenti.map((s) => s.sorgente.descrizione).join(', ') || 'Nessuna sorgente specifica',
        esito: m.esito ? ESITI[m.esito].breve : 'Da definire',
      })),
      conMansioni: v.mansioni.length > 0,
      testoSensibili: t.sensibili?.trim() || SENSIBILI,
      conclusioni: punti,
      conPrecisazioni: precisazioni.length > 0,
      precisazioni,
      piano: (t.piano ?? pianoPredefinito(v, tipi)).map((x) => ({ testo: x.testo, sotto: x.sotto ?? [] })),
    },
  }
}
