/**
 * Dati per i template Word dei DVR Agenti chimici, Fumi di saldatura e Agenti cancerogeni
 * (public/templates/dvr/chimico.docx, fumi_saldatura.docx, cancerogeno.docx).
 * Le colonne degli agenti hanno chiavi piatte (es. `v_no2`, `tlv_no2`) perché il template
 * docxtemplater non usa percorsi annidati.
 */
import type { VocePiano } from '../comune/piano'
import { datiCopertina, elenco, type DocumentoCopertina } from '../comune/copertina'
import { formattaIt } from '../comune/numeri'
import { eGalleria, type AmbitoDvr, type AnagraficaDvr, type MacchinaDvr } from '../comune/tipi'
import { unibile } from '../comune/unisciCelle'
import { cicloPredefinito, type BloccoTesto } from '../rumore/testiPredefiniti'
import { AGENTI_PREDEFINITI, conPiemonte, type AgenteChimico, type TipoDvrChimico } from './agenti'
import { testiPredefiniti, type TestiChimico } from './testi'
import {
  CLASSI_PIEMONTE,
  indiceClasse,
  valutaChimico,
  type AmbienteChimico,
  type ClassePiemonte,
  type MisuraAmbiente,
  type PeriodoChimico,
  type ValutazioneChimica,
} from './valutazione'

export interface DatiDvrChimico {
  tipo: TipoDvrChimico
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: { id: string; nome: string; attivita?: string }[]
  macchine: Pick<MacchinaDvr, 'tipologia' | 'marca_modello' | 'alimentazione'>[]
  /** limiti e gravità modificati nel documento (id agente → valori) */
  agenti?: Partial<Record<string, Partial<Pick<AgenteChimico, 'tlv' | 'stel' | 'gravita'>>>>
  ambienti: AmbienteChimico[]
  /** matrice dei tempi: righe per mansione */
  tempi: { mansioneId: string; periodi: PeriodoChimico[] }[]
  testi?: TestiChimico & { ciclo?: BloccoTesto[] }
}

/** Descrizione predefinita del lavoro di saldatura (DVR Fumi di saldatura). */
export const CICLO_SALDATURA: BloccoTesto[] = [
  {
    testo:
      'Le attività di saldatura sono eseguite principalmente in officina, su materiale ferroso non rivestito, con procedimento MIG/MAG (saldatrice a filo continuo); saltuariamente possono essere effettuate saldature ad elettrodo. Le fasi lavorative considerate sono:',
    punti: ['saldatura (saldatore, con esposizione diretta ai fumi);', 'attività varie in officina (meccanici e altri lavoratori, con esposizione indiretta).'],
  },
]

/** Gruppo dell'agente nelle tabelle: polveri e metalli (frazione respirabile o inalabile) o gas. */
export function gruppoAgente(a: AgenteChimico): 'respirabile' | 'inalabile' | 'gas' {
  if (a.unita === 'ppm' || a.unita === '%') return 'gas'
  return a.id.endsWith('_inal') ? 'inalabile' : 'respirabile'
}

const FILE: Record<TipoDvrChimico, string> = { chimico: 'Chimico', fumi_saldatura: 'Fumi_saldatura', cancerogeno: 'Cancerogeno', amianto: 'Amianto', ipa: 'IPA' }

/** Amianto: soglia delle esposizioni sporadiche e di debole intensità (ESEDI, art. 249 c. 2) su 8 ore. */
export const SOGLIA_ESEDI = 10
/** IPA: valore obiettivo del benzo[a]pirene nell'aria ambiente (D.Lgs. 155/2010, media annua). */
export const BAP_ARIA_AMBIENTE = 1

/** Numero con virgola: le concentrazioni con i decimali dell'agente, il resto senza zeri inutili. */
const num = (x: number | null | undefined, decimali?: number) => {
  if (x == null || !Number.isFinite(x)) return '-'
  if (decimali != null) return formattaIt(x, decimali)
  return String(Math.round(x * 1000) / 1000).replace('.', ',')
}
const pct = (x: number) => (x < 1 ? '<1' : num(Math.round(x * 10) / 10))
const minuscolo = (s: string) => s.charAt(0).toLocaleLowerCase('it-IT') + s.slice(1)
const NOMI_CLASSE: Record<ClassePiemonte, string> = { irrilevante: 'Irrilevante', modesto: 'Modesto', medio: 'Medio', alto: 'Alto', 'molto alto': 'Molto alto' }

export function agentiDocumento(tipo: TipoDvrChimico, modifiche: DatiDvrChimico['agenti'] = {}): AgenteChimico[] {
  return AGENTI_PREDEFINITI[tipo].map((a) => ({ ...a, ...(modifiche?.[a.id] ?? {}) }))
}

/** Valori per agente con chiave piatta: { v_no2: '0,38', ... }. */
function perAgente(agenti: AgenteChimico[], prefisso: string, f: (a: AgenteChimico) => string) {
  return Object.fromEntries(agenti.map((a) => [`${prefisso}_${a.id}`, f(a)]))
}

function conclusioniAgenti(agenti: AgenteChimico[], v: ValutazioneChimica): string[] {
  const out: string[] = []
  for (const ag of agenti) {
    const indici = v.ambienti.flatMap((e) => e.indici.filter((i) => i.agente.id === ag.id).map((i) => ({ i, e })))
    if (!indici.length) continue
    const max = indici.reduce((x, y) => (y.i.ir > x.i.ir ? y : x))
    const perClasse = CLASSI_PIEMONTE.map((c) => ({ c, n: indici.filter((x) => x.i.classe === c.classe).length })).filter((x) => x.n)
    const alte = indici.filter((x) => indiceClasse(x.i.classe) >= indiceClasse('medio'))
    const riepilogo = perClasse.map((x) => `${x.n} ${x.n === 1 ? 'ambiente' : 'ambienti'} a rischio ${x.c.classe}`)
    out.push(
      `${ag.nome}: ${elenco(riepilogo)}${alte.length ? `; i valori più alti per ${elenco([...new Set(alte.map((x) => minuscolo(`${x.e.ambiente.fase} (${x.e.ambiente.postazione.toLocaleLowerCase('it-IT')})`)))].slice(0, 6))}` : ''}. Indice massimo ${max.i.ir} (${minuscolo(max.e.ambiente.fase)}).`,
    )
  }
  return out
}

function conclusioniMansioni(agenti: AgenteChimico[], v: ValutazioneChimica, articolo = '235'): string[] {
  const out: string[] = []
  const conSuperamenti = v.mansioni.filter((m) => m.superamenti.length)
  if (!v.mansioni.length) return ['Non è stata compilata la matrice dei tempi: l’esposizione per mansione non è stata calcolata.']
  if (!conSuperamenti.length) {
    out.push(
      `Dal confronto dei livelli di esposizione giornaliera con i valori limite emerge che per tutte le ${v.mansioni.length} mansioni valutate le esposizioni sono inferiori ai limiti di riferimento${agenti.some((a) => a.cancerogeno) ? `; per gli agenti cancerogeni l’esposizione deve comunque essere ridotta al livello più basso tecnicamente possibile (art. ${articolo} D.Lgs. 81/08)` : ''}.`,
    )
    return out
  }
  out.push(
    `Dal confronto dei livelli di esposizione giornaliera con i valori limite emerge che ${v.mansioni.length - conSuperamenti.length} mansioni su ${v.mansioni.length} hanno esposizioni inferiori ai limiti di riferimento.`,
  )
  for (const ag of agenti) {
    const oltre = conSuperamenti.filter((m) => m.superamenti.includes(ag.id))
    if (!oltre.length) continue
    const limite = ag.minimo != null ? `minimo ${num(ag.minimo)} ${ag.unita}` : `limite ${num(ag.tlv)} ${ag.unita}`
    out.push(
      `${ag.sigla} (${limite}): superamento per ${elenco(oltre.map((m) => `${m.mansione.nome} (${num(m.twa[ag.id], ag.decimali)} ${ag.unita})`))}. Per queste mansioni si applicano con priorità le misure specifiche del capitolo successivo e si verificano l’uso dei DPI delle vie respiratorie e la sorveglianza sanitaria.`,
    )
  }
  return out
}

/** Amianto: ESEDI, esposti e superamenti; IPA: confronto con il fondo dell'aria ambiente. */
function conclusioniSpecifiche(tipo: TipoDvrChimico, agenti: AgenteChimico[], v: ValutazioneChimica): string[] {
  const conValore = (id: string) => v.mansioni.filter((m) => m.twa[id] != null)
  const nomi = (ms: ValutazioneChimica['mansioni'], id: string, dec: number, u: string) => elenco(ms.map((m) => `${m.mansione.nome} (${num(m.twa[id], dec)} ${u})`))
  if (tipo === 'amianto') {
    const ag = agenti.find((a) => a.id === 'amianto')
    const ms = conValore('amianto')
    if (!ag || !ms.length) return []
    const limite = ag.tlv ?? 100
    const esedi = ms.filter((m) => m.twa.amianto! <= SOGLIA_ESEDI)
    const esposti = ms.filter((m) => m.twa.amianto! > SOGLIA_ESEDI && m.twa.amianto! <= limite)
    const out: string[] = []
    if (esedi.length)
      out.push(
        `Esposizione non superiore a ${num(SOGLIA_ESEDI)} ff/L (8 ore): ${nomi(esedi, 'amianto', ag.decimali, 'ff/L')}. Il livello è compatibile con le esposizioni sporadiche e di debole intensità (ESEDI, art. 249 c. 2 D.Lgs. 81/08), se anche la frequenza e la durata degli interventi rientrano nei criteri ESEDI.`,
      )
    if (esposti.length)
      out.push(
        `Esposizione superiore a ${num(SOGLIA_ESEDI)} ff/L ma entro il valore limite: ${nomi(esposti, 'amianto', ag.decimali, 'ff/L')}. Questi lavoratori sono esposti ai sensi del Capo III: notifica (art. 250), misure di prevenzione (art. 251), sorveglianza sanitaria (art. 259) e registro di esposizione (art. 260).`,
      )
    return out
  }
  if (tipo === 'ipa') {
    const ag = agenti.find((a) => a.id === 'bap')
    const ms = conValore('bap')
    if (!ag || !ms.length) return []
    const oltreFondo = ms.filter((m) => m.twa.bap! > BAP_ARIA_AMBIENTE)
    return [
      oltreFondo.length
        ? `Benzo[a]pirene superiore al valore obiettivo per l’aria ambiente (${num(BAP_ARIA_AMBIENTE)} ng/m³, D.Lgs. 155/2010) per ${nomi(oltreFondo, 'bap', ag.decimali, 'ng/m³')}: l’esposizione è di origine professionale; questi lavoratori vanno considerati esposti ai fini della sorveglianza sanitaria (art. 242) e del registro di esposizione (art. 243).`
        : `Per tutte le mansioni il benzo[a]pirene non supera il valore obiettivo per l’aria ambiente (${num(BAP_ARIA_AMBIENTE)} ng/m³, D.Lgs. 155/2010): l’esposizione professionale non si distingue dal fondo.`,
      `Per gli IPA il D.Lgs. 81/08 non fissa un valore limite: il riferimento usato per il benzo[a]pirene (${num(ag.tlv)} ng/m³, ${ag.fonte}) è indicativo.`,
    ]
  }
  return []
}

/** Sintesi dei valori medi per ambiente: agenti oltre il limite, massimi, quota di silice nelle polveri. */
function analisiPerAmbiente(agenti: AgenteChimico[], v: ValutazioneChimica): string[] {
  const out: string[] = []
  const nome = (e: ValutazioneChimica['ambienti'][number]) => minuscolo(`${e.ambiente.fase}${e.ambiente.postazione && e.ambiente.postazione !== '-' ? ` (${e.ambiente.postazione.toLocaleLowerCase('it-IT')})` : ''}`)
  for (const ag of agenti) {
    const conValore = v.ambienti.filter((e) => e.concentrazioni[ag.id]?.valore != null)
    if (!conValore.length) continue
    const max = conValore.reduce((x, y) => (y.concentrazioni[ag.id].valore! > x.concentrazioni[ag.id].valore! ? y : x))
    const oltre = ag.tlv != null ? conValore.filter((e) => e.concentrazioni[ag.id].valore! > ag.tlv!) : []
    const valoreMax = `${num(max.concentrazioni[ag.id].valore, ag.decimali)} ${ag.unita}`
    if (ag.tlv == null) {
      out.push(`${ag.nome}: misurato in ${conValore.length} ${conValore.length === 1 ? 'ambiente' : 'ambienti'}; il valore medio più alto è ${valoreMax} (${nome(max)}).`)
      continue
    }
    out.push(
      oltre.length
        ? `${ag.nome}: la concentrazione media supera il valore limite (${num(ag.tlv)} ${ag.unita}) in ${oltre.length} ${oltre.length === 1 ? 'ambiente' : 'ambienti'} su ${conValore.length} (${elenco(oltre.map(nome).slice(0, 6))}); il valore più alto è ${valoreMax} (${nome(max)}).`
        : `${ag.nome}: le concentrazioni medie sono inferiori al valore limite${ag.tlv != null ? ` (${num(ag.tlv)} ${ag.unita})` : ''} in tutti i ${conValore.length} ambienti; il valore più alto è ${valoreMax} (${nome(max)}).`,
    )
  }
  const quote = v.ambienti
    .map((e) => {
      const p = e.concentrazioni.polveri_resp?.valore
      const si = e.concentrazioni.silice?.valore
      return p && si != null ? (si / p) * 100 : null
    })
    .filter((x): x is number => x != null)
  if (quote.length > 1) {
    out.push(`La silice libera cristallina rappresenta tra il ${num(Math.round(Math.min(...quote)))}% e il ${num(Math.round(Math.max(...quote)))}% delle polveri respirabili, a seconda della lavorazione.`)
  }
  return out
}

export function datiTemplateChimico(d: DatiDvrChimico) {
  const agenti = agentiDocumento(d.tipo, d.agenti)
  const nomi = new Map(d.mansioni.map((m) => [m.id, m.nome]))
  const piemonte = conPiemonte(d.tipo)
  const v = valutaChimico(
    agenti,
    d.ambienti,
    d.tempi.filter((t) => nomi.has(t.mansioneId)).map((t) => ({ mansione: { id: t.mansioneId, nome: nomi.get(t.mansioneId)! }, periodi: t.periodi })),
    { piemonte },
  )
  const a = d.anagrafica
  const tipi = d.ambiti.map((x) => x.tipo)
  const inGalleria = tipi.some(eGalleria)
  const ciclo = d.testi?.ciclo ?? (d.tipo === 'fumi_saldatura' ? CICLO_SALDATURA : cicloPredefinito(tipi))
  const t = { ...testiPredefiniti(d.tipo, inGalleria), ...Object.fromEntries(Object.entries(d.testi ?? {}).filter(([, x]) => x != null && (!Array.isArray(x) || x.length))) } as Required<TestiChimico>
  const lavoratori = `lavoratori${a.impresa ? ` di ${a.impresa}` : ''} operanti nel cantiere ${a.denominazione ?? ''}`.trim()
  const periodo = d.documento.periodoRiferimento
  const misurati = agenti.filter((ag) => ag.tlv != null)
  const oggetto = {
    chimico: 'polveri e gas tossici',
    fumi_saldatura: 'fumi di saldatura (polveri, metalli e gas)',
    cancerogeno: 'silice libera cristallina e carbonio elementare (gas di scarico dei motori diesel)',
    amianto: 'fibre di amianto',
    ipa: 'idrocarburi policiclici aromatici (IPA)',
  }[d.tipo]
  const capo = { chimico: 'Titolo IX, Capo I', fumi_saldatura: 'Titolo IX, Capo I', cancerogeno: 'Titolo IX, Capo II', amianto: 'Titolo IX, Capo III', ipa: 'Titolo IX, Capo II' }[d.tipo]

  // dati rilevati per ambiente (una riga per misura, medie unite in verticale)
  const misureAmbienti = d.ambienti.flatMap((amb, i) => {
    const esito = v.ambienti[i]
    const righe: MisuraAmbiente[] = amb.misure.length ? amb.misure : [{ id: 'vuota', valori: {} }]
    return righe.map((m) => ({
      attivita: unibile(`a${i}`, `${amb.fase}\n${amb.postazione}`),
      fronte: m.fronte || (m.storico ? 'Campagna precedente' : '-'),
      avanzamento: m.avanzamento != null ? num(m.avanzamento) : '-',
      ...perAgente(agenti, 'c', (ag) => (m.valori[ag.id] != null ? `${num(m.valori[ag.id], ag.decimali)}${m.storico ? '*' : ''}` : '\\')),
      ...Object.fromEntries(
        agenti.map((ag) => {
          const c = esito.concentrazioni[ag.id]
          return [`m_${ag.id}`, unibile(`m${i}${ag.id}`, c.valore != null ? `${num(c.valore, ag.decimali)}${c.storico ? '*' : ''}` : '-')]
        }),
      ),
    }))
  })

  const ambientiIR = v.ambienti.map((e) => {
    const perAg = new Map(e.indici.map((x) => [x.agente.id, x]))
    const riga = (pref: string, f: (x: NonNullable<ReturnType<typeof perAg.get>>) => string, vuoto = '-') =>
      perAgente(misurati, pref, (ag) => {
        const x = perAg.get(ag.id)
        return x ? f(x) : vuoto
      })
    return {
      titolo: `${e.ambiente.fase}\n${e.ambiente.postazione}`,
      mansioniEsposte: e.ambiente.mansioniEsposte?.trim() || '-',
      ...riga('v', (x) => num(x.concentrazione, x.agente.decimali)),
      ...perAgente(misurati, 'tlv', (ag) => num(ag.tlv)),
      ...riga('pct', (x) => pct(x.percentuale)),
      ...riga('e', (x) => num(x.e)),
      ...riga('d', (x) => String(x.d)),
      ...riga('g', (x) => String(x.m)),
      ...riga('ir', (x) => String(x.ir)),
      ...riga('cl', (x) => NOMI_CLASSE[x.classe]),
    }
  })

  const conGruppo = (e: (typeof v.ambienti)[number], gas: boolean) => e.indici.some((i) => (gruppoAgente(i.agente) === 'gas') === gas)
  const ambientiIRPolveri = ambientiIR.filter((_, i) => conGruppo(v.ambienti[i], false))
  const ambientiIRGas = ambientiIR.filter((_, i) => conGruppo(v.ambienti[i], true))

  // classi per mansione: per ogni agente la classe più alta tra gli ambienti in cui la mansione lavora
  const perAmbiente = new Map(v.ambienti.map((e) => [e.ambiente.id, e]))
  const classiMansioni = d.tempi
    .filter((t) => nomi.has(t.mansioneId))
    .map((t) => {
      const esiti = [...new Set(t.periodi.map((p) => p.ambiente).filter((x): x is string => !!x))].map((id) => perAmbiente.get(id)).filter((e) => e != null)
      const massimo = new Map<string, { agente: AgenteChimico; classe: ClassePiemonte }>()
      for (const e of esiti)
        for (const i of e.indici) {
          const x = massimo.get(i.agente.id)
          if (!x || indiceClasse(i.classe) > indiceClasse(x.classe)) massimo.set(i.agente.id, { agente: i.agente, classe: i.classe })
        }
      const righe = (gas: boolean) =>
        CLASSI_PIEMONTE.map((c) => {
          const ag = misurati.filter((a) => (gruppoAgente(a) === 'gas') === gas && massimo.get(a.id)?.classe === c.classe)
          return { classe: NOMI_CLASSE[c.classe], inquinanti: ag.map((a) => a.nome).join('\n'), misure: c.classe === 'irrilevante' ? 'Non necessarie' : 'Necessarie', n: ag.length }
        }).filter((r) => r.n > 0)
      return { mansione: nomi.get(t.mansioneId)!, polveri: righe(false), gas: righe(true) }
    })
    .filter((m) => m.polveri.length || m.gas.length)

  // conclusioni per agente: tabella delle classi con attività e mansioni esposte
  const classiAgenti = misurati
    .filter((ag) => ag.gravita && v.ambienti.some((e) => e.indici.some((i) => i.agente.id === ag.id)))
    .map((ag) => ({
      agente: ag.nome,
      agenteMinuscolo: minuscolo(ag.nome),
      righe: CLASSI_PIEMONTE.map((c) => {
        const amb = v.ambienti.filter((e) => e.indici.some((i) => i.agente.id === ag.id && i.classe === c.classe))
        return {
          classe: c.classe.toLocaleUpperCase('it-IT'),
          attivita: [...new Set(amb.map((e) => `${e.ambiente.fase} – ${e.ambiente.postazione.toLocaleLowerCase('it-IT')}`))].join('\n'),
          mansioniEsposte: [...new Set(amb.map((e) => e.ambiente.mansioniEsposte?.trim()).filter(Boolean))].join('\n') || (amb.length ? 'Tutte le mansioni presenti' : ''),
          misure: c.classe === 'irrilevante' ? 'Non necessarie' : 'Necessarie',
          presente: amb.length > 0,
        }
      }).filter((r) => r.presente),
    }))

  const esposizioni = v.mansioni.map((m, i) => ({
    numero: String(i + 1),
    nome: m.mansione.nome,
    ...perAgente(agenti, 't', (ag) => num(m.twa[ag.id], ag.decimali)),
  }))
  const limiti = {
    ...perAgente(agenti, 'tlv', (ag) => (ag.minimo != null ? `min ${num(ag.minimo)}` : num(ag.tlv))),
    ...perAgente(agenti, 'stel', (ag) => num(ag.stel)),
  }

  const tav = v.mansioni.map((m, i) => ({
    numero: String(i + 1),
    nome: m.mansione.nome.toLocaleUpperCase('it-IT'),
    righe: m.periodi.map((p) => ({
      fase: p.fase,
      postazione: p.postazione?.trim() || '\\',
      minuti: String(p.minuti),
      ...perAgente(agenti, 'v', (ag) => num(p.valori[ag.id], ag.decimali)),
    })),
    minutiTotali: String(m.minuti),
    ...perAgente(agenti, 'tot', (ag) => num(m.twa[ag.id], ag.decimali)),
    nonUltima: i < v.mansioni.length - 1,
  }))

  const allegato1 = d.ambienti.flatMap((amb) =>
    amb.misure
      .filter((m) => !m.storico)
      .map((m): Record<string, string> => ({
        fase: amb.fase,
        postazione: amb.postazione,
        fronte: m.fronte || '-',
        data: m.data || '-',
        tipo: m.tipo || '-',
        tempo: m.tempo || '-',
        macchine: m.macchine || '\\',
        note: m.note || '',
        temperatura: num(m.temperatura ?? null),
        velocita: num(m.velocita ?? null),
        pompa: num(m.pompa ?? null),
        ...perAgente(agenti, 'c', (ag) => (m.valori[ag.id] != null ? num(m.valori[ag.id], ag.decimali) : '\\')),
      })),
  )

  const conStorici = d.ambienti.some((x) => x.misure.some((m) => m.storico))
  const allegatoEc = allegato1.filter((r) => r.c_ec != null && r.c_ec !== '\\')

  // medie per ambiente (DVR Agenti cancerogeni) e sintesi dei valori
  const medieAmbienti = v.ambienti.map((e) => ({
    attivita: `${e.ambiente.fase}\n${e.ambiente.postazione}`,
    ...perAgente(agenti, 'm', (ag) => {
      const c = e.concentrazioni[ag.id]
      return c.valore != null ? `${num(c.valore, ag.decimali)}${c.storico ? '*' : ''}` : '-'
    }),
  }))
  const analisiAmbienti = analisiPerAmbiente(agenti, v)
  const gas = agenti.filter((ag) => gruppoAgente(ag) === 'gas').map((ag) => ag.id)
  const polveri = agenti.filter((ag) => gruppoAgente(ag) !== 'gas').map((ag) => ag.id)
  const allegatoGas = allegato1.filter((r) => gas.some((id) => r[`c_${id}`] !== '\\'))
  const allegatoPolveri = allegato1.filter((r) => polveri.some((id) => r[`c_${id}`] !== '\\'))

  return {
    valutazione: v,
    agenti,
    dati: {
      ...datiCopertina(a, d.documento, FILE[d.tipo], d.studio),
      periodoTesto: periodo ?? '',
      periodoNelTesto: periodo ? ` nel periodo ${periodo}` : '',
      intro: [
        `In applicazione al ${capo} del D.Lgs. 81/08 e s.m.i., viene ${d.documento.primaValutazione === false ? 'effettuato un aggiornamento della' : 'effettuata la'} valutazione dell’esposizione a ${oggetto} per i ${lavoratori}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}.`,
        `Per la redazione del documento sono stati presi in considerazione i rilievi effettuati${periodo ? ` nel periodo ${periodo}` : ''}${conStorici ? ' e, per le lavorazioni non misurate in questa campagna, i dati delle campagne precedenti' : ''}.`,
      ],
      cicloBlocchi: ciclo,
      galleria: inGalleria,
      mansioni: d.mansioni.map((m, i) => ({ numero: String(i + 1), nome: m.nome, attivita: m.attivita ?? '' })),
      macchine: d.macchine.map((m) => ({ tipologia: m.tipologia, modello: m.marca_modello || '\\', alimentazione: m.alimentazione || '\\', utensile: '\\' })),
      conMacchine: d.macchine.length > 0,
      testiDpi: t.dpi,
      misurePreventive: t.misure,
      testiCampionamento: t.campionamento,
      strumenti: t.strumenti,
      sintesi: d.ambienti.map((x) => {
        const misurato = (g: ReturnType<typeof gruppoAgente>) =>
          agenti.filter((ag) => gruppoAgente(ag) === g && x.misure.some((m) => m.valori[ag.id] != null)).map((ag) => ag.sigla).join(', ') || '\\'
        return {
          fase: x.fase,
          postazione: x.postazione,
          n: String(x.misure.filter((m) => !m.storico).length),
          respirabili: misurato('respirabile'),
          inalabili: misurato('inalabile'),
          gas: misurato('gas'),
        }
      }),
      testiTempi: t.tempi,
      misureAmbienti,
      notaStorici: conStorici ? 'Nota: l’asterisco associato ai valori indica che il dato è stato acquisito da precedenti campagne di rilevamento.' : '',
      ambientiIR,
      ambientiIRPolveri,
      ambientiIRGas,
      conIRPolveri: ambientiIRPolveri.length > 0,
      conIRGas: ambientiIRGas.length > 0,
      classiAgenti,
      classiMansioni,
      conclusioniAgenti: piemonte ? conclusioniAgenti(misurati, v) : [],
      esposizioni,
      ...limiti,
      conclusioniMansioni: [...conclusioniMansioni(agenti, v, d.tipo === 'amianto' ? '251' : '235'), ...conclusioniSpecifiche(d.tipo, agenti, v)],
      piano: (t.piano as VocePiano[]).map((x) => ({ testo: x.testo, sotto: x.sotto ?? [] })),
      pianoTabelle: (t.piano as VocePiano[]).map((x, i) => ({ testo: x.testo, righe: (x.sotto ?? []).map((s, j) => ({ n: `${i + 1}.${j + 1}`, testo: s })) })),
      medieAmbienti,
      analisiAmbienti,
      allegatoEc,
      conEc: allegatoEc.length > 0,
      conStorici,
      allegato1,
      allegatoGas,
      allegatoPolveri,
      conGas: allegatoGas.length > 0,
      conPolveri: allegatoPolveri.length > 0,
      tav,
      conTav: tav.length > 0,
    },
  }
}
