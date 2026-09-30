/** Dati per il template Word del DVR Agenti biologici (public/templates/dvr/biologico.docx). */
import { datiCopertina, elenco, type DocumentoCopertina } from '../comune/copertina'
import type { AmbitoDvr, AnagraficaDvr } from '../comune/tipi'
import { cicloPredefinito, type BloccoTesto } from '../rumore/testiPredefiniti'
import { CAMPIONAMENTO, CARATTERISTICHE, METODOLOGIA, MISURE_PREVENTIVE, NORMATIVA, pianoPredefinito, SORVEGLIANZA, type TestiBiologico } from './testi'
import { CATEGORIE_ARIA, CLASSI, GRUPPI, indiceAria, valutaBiologico, type AgenteBiologico, type ClasseRischio, type MisuraSas } from './valutazione'

export interface DatiDvrBiologico {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  mansioni: { id: string; nome: string; attivita?: string }[]
  agenti: AgenteBiologico[]
  misure: MisuraSas[]
  testi?: TestiBiologico & { ciclo?: BloccoTesto[] }
}

const ufc = (x: number | null | undefined) => (x == null || !Number.isFinite(x) ? '-' : String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
const maiuscola = (s: string) => s.charAt(0).toLocaleUpperCase('it-IT') + s.slice(1)
const NOME_CLASSE: Record<ClasseRischio, string> = { trascurabile: 'Trascurabile', basso: 'Basso', medio: 'Medio', alto: 'Alto' }

export function datiTemplateBiologico(d: DatiDvrBiologico) {
  const v = valutaBiologico(d.agenti, d.misure, d.mansioni)
  const a = d.anagrafica
  const t = d.testi ?? {}
  const tipi = d.ambiti.map((x) => x.tipo)
  const lavoratori = `lavoratori${a.impresa ? ` di ${a.impresa}` : ''} operanti nel cantiere ${a.denominazione ?? ''}`.trim()
  const nomeMansione = new Map(d.mansioni.map((m) => [m.id, m.nome]))
  const mansioniDi = (ag: AgenteBiologico) => (ag.mansioni ?? []).map((id) => nomeMansione.get(id)).filter(Boolean).join(', ') || 'Tutte le mansioni'

  // conclusioni
  const conclusioni: string[] = []
  const perClasse = CLASSI.map((c) => ({ c, xs: v.agenti.filter((e) => e.classe === c.classe) })).filter((x) => x.xs.length)
  conclusioni.push(
    `sono stati considerati ${v.agenti.length} agenti biologici potenziali: ${elenco(perClasse.map((x) => `${x.xs.length} a rischio ${x.c.classe}`))};`,
  )
  for (const x of perClasse.filter((x) => x.c.classe === 'medio' || x.c.classe === 'alto')) {
    conclusioni.push(`rischio ${x.c.classe} per ${elenco(x.xs.map((e) => `${e.agente.nome} (${e.agente.malattia.toLocaleLowerCase('it-IT')})`))}: ${x.c.azioni.toLocaleLowerCase('it-IT')}`)
  }
  if (v.misure.length) {
    const alte = v.misure.filter((m) => m.peggiore && indiceAria(m.peggiore) >= indiceAria('alta'))
    conclusioni.push(
      alte.length
        ? `la carica microbica dell’aria è alta in ${elenco(alte.map((m) => m.misura.postazione))}: vanno verificati la pulizia degli ambienti e degli impianti di climatizzazione e il ricambio d’aria;`
        : `la carica microbica dell’aria misurata in ${v.misure.length} ${v.misure.length === 1 ? 'punto' : 'punti'} è compresa nelle categorie da molto bassa a intermedia degli ambienti non industriali;`,
    )
  }
  const esposte = v.mansioni.filter((m) => m.classe === 'medio' || m.classe === 'alto')
  if (d.mansioni.length) {
    conclusioni.push(
      esposte.length
        ? `le mansioni con rischio medio o alto sono: ${elenco(esposte.map((m) => m.mansione.nome))}; per loro si applicano le misure specifiche del piano e la sorveglianza sanitaria indicata dal medico competente.`
        : 'per nessuna mansione il rischio biologico supera la classe bassa: sono sufficienti le misure generali di igiene, la formazione e la vaccinazione antitetanica.',
    )
  }

  return {
    valutazione: v,
    dati: {
      ...datiCopertina(a, d.documento, 'Biologico', d.studio),
      intro1: `In applicazione al Titolo X del D.Lgs. 81/08 e s.m.i., viene ${d.documento.primaValutazione === false ? 'effettuato un aggiornamento della' : 'effettuata la'} valutazione dei rischi derivanti dall’esposizione ad agenti biologici per i ${lavoratori}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}.`,
      normativa: t.normativa?.length ? t.normativa : NORMATIVA,
      caratteristiche: CARATTERISTICHE,
      gruppi: ([1, 2, 3, 4] as const).map((g) => ({ gruppo: `Gruppo ${g}`, descrizione: GRUPPI[g] })),
      metodologia: METODOLOGIA,
      classi: CLASSI.map((c) => ({ r: c.da === c.a ? String(c.da) : `${c.da} – ${c.a}`, classe: NOME_CLASSE[c.classe], azioni: c.azioni })),
      campionamento: CAMPIONAMENTO,
      categorieAria: CATEGORIE_ARIA.map((c, i) => {
        const prima = CATEGORIE_ARIA[i - 1]
        const fascia = (k: 'batteri' | 'funghi') => (i === 0 ? `< ${c[k]}` : Number.isFinite(c[k]) ? `${prima[k]} – ${c[k]}` : `> ${prima[k]}`)
        return { categoria: maiuscola(c.categoria), batteri: fascia('batteri'), funghi: fascia('funghi') }
      }),
      cicloBlocchi: t.ciclo ?? cicloPredefinito(tipi),
      mansioni: d.mansioni.map((m, i) => ({ numero: i + 1, nome: m.nome, attivita: m.attivita ?? '' })),
      misurePreventive: t.misurePreventive?.length ? t.misurePreventive : MISURE_PREVENTIVE,
      agenti: v.agenti.map((e, i) => ({
        numero: String(i + 1),
        nome: e.agente.nome,
        gruppo: String(e.agente.gruppo),
        malattia: e.agente.malattia,
        trasmissione: e.agente.trasmissione,
        attivita: e.agente.attivita,
        mansioni: mansioniDi(e.agente),
      })),
      valutazioni: v.agenti.map((e, i) => ({
        numero: String(i + 1),
        nome: e.agente.nome,
        p: String(e.agente.probabilita),
        d: String(e.d),
        r: String(e.r),
        classe: NOME_CLASSE[e.classe],
        vaccino: e.agente.vaccino?.trim() || '-',
      })),
      conMisure: v.misure.length > 0,
      misure: v.misure.map((m, i) => ({
        numero: String(i + 1),
        postazione: m.misura.postazione || '-',
        fase: m.misura.fase || '-',
        data: m.misura.data || '-',
        c22: ufc(m.misura.conta22),
        c36: ufc(m.misura.conta36),
        muffe: ufc(m.misura.muffe),
      })),
      classiMisure: v.misure.map((m, i) => ({
        numero: String(i + 1),
        postazione: m.misura.postazione || '-',
        c22: m.c22 ? maiuscola(m.c22) : '-',
        c36: m.c36 ? maiuscola(m.c36) : '-',
        muffe: m.muffe ? maiuscola(m.muffe) : '-',
      })),
      esitiMansioni: v.mansioni.map((m) => ({
        nome: m.mansione.nome,
        agenti: m.agenti.map((e) => `${e.agente.nome} (${e.classe})`).join('\n') || 'Nessun agente',
        classe: m.classe ? NOME_CLASSE[m.classe] : 'Trascurabile',
      })),
      conMansioni: v.mansioni.length > 0,
      sorveglianza: t.sorveglianza?.length ? t.sorveglianza : SORVEGLIANZA,
      conclusioni,
      piano: (t.piano ?? pianoPredefinito(v)).map((x) => ({ testo: x.testo, sotto: x.sotto ?? [] })),
    },
  }
}
