/** Dati per il template Word del monitoraggio delle acque di cantiere (public/templates/dvr/acqua.docx). */
import { datiCopertina, elenco, type DocumentoCopertina } from '../comune/copertina'
import { formattaIt } from '../comune/numeri'
import type { AmbitoDvr, AnagraficaDvr } from '../comune/tipi'
import { unibile } from '../comune/unisciCelle'
import { cicloPredefinito, type BloccoTesto } from '../rumore/testiPredefiniti'
import { METODOLOGIA, misurePredefinite, NORMATIVA, PARAMETRI_TESTI, pianoPredefinito, STRUMENTI, type TestiAcqua } from './testi'
import { DESTINAZIONI, PARAMETRI, testoLimite, valutaAcqua, type Destinazione, type MisuraAcqua, type PuntoAcqua } from './valutazione'

export interface DatiDvrAcqua {
  anagrafica: Omit<AnagraficaDvr, 'cantiere_id'>
  studio?: { descrizione?: string; esecutore?: string }
  documento: DocumentoCopertina & { primaValutazione?: boolean }
  ambiti: Pick<AmbitoDvr, 'nome' | 'tipo'>[]
  punti: PuntoAcqua[]
  misure: MisuraAcqua[]
  testi?: TestiAcqua & { ciclo?: BloccoTesto[] }
}

const num = (x: number | null | undefined, d: number) => (x == null || !Number.isFinite(x) ? '-' : formattaIt(x, d))
const maiuscola = (s: string) => s.charAt(0).toLocaleUpperCase('it-IT') + s.slice(1)

export function datiTemplateAcqua(d: DatiDvrAcqua) {
  const v = valutaAcqua(d.punti, d.misure)
  const a = d.anagrafica
  const t = d.testi ?? {}
  const tipi = d.ambiti.map((x) => x.tipo)
  const numeroPunto = new Map(d.punti.map((p, i) => [p.id, i + 1]))

  const conclusioni: string[] = [`sono stati monitorati ${v.punti.length} punti con ${v.misure.length} misure di campo;`]
  const nc = v.punti.filter((p) => p.nonConformi.length)
  const conformi = v.punti.filter((p) => p.esito === 'conforme')
  const senza = v.punti.filter((p) => p.esito === 'senza limite')
  if (conformi.length) conclusioni.push(`i valori rispettano i limiti della destinazione in ${elenco(conformi.map((p) => p.punto.nome))};`)
  for (const p of nc) {
    const pars = p.nonConformi.map((id) => {
      const par = PARAMETRI.find((x) => x.id === id)!
      const i = p.intervalli[id]!
      return `${par.nome} ${i.min === i.max ? num(i.min, par.decimali) : `${num(i.min, par.decimali)}–${num(i.max, par.decimali)}`}${par.unita ? ` ${par.unita}` : ''} (limite ${testoLimite(id, p.limiti)})`
    })
    conclusioni.push(`in ${p.punto.nome} (${DESTINAZIONI[p.punto.destinazione].nome.toLocaleLowerCase('it-IT')}) non sono rispettati i limiti per ${elenco(pars)}: servono gli interventi indicati nel piano;`)
  }
  if (senza.length) conclusioni.push(`in ${elenco(senza.map((p) => p.punto.nome))} i valori sono riportati come indicatori del processo, senza limiti di legge;`)
  conclusioni.push('i risultati valgono per le condizioni del periodo di monitoraggio: variazioni delle lavorazioni o delle venute d’acqua richiedono nuove misure.')

  const destinazioniUsate = [...new Set(d.punti.map((p) => p.destinazione))] as Destinazione[]

  return {
    valutazione: v,
    dati: {
      ...datiCopertina(a, d.documento, 'Acqua', d.studio),
      intro1: `Il presente documento riporta ${d.documento.primaValutazione === false ? 'l’aggiornamento del' : 'il'} monitoraggio delle acque del cantiere ${a.denominazione ?? ''}${a.impresa ? ` (${a.impresa})` : ''}${a.opera ? `, nell’ambito dell’opera ${a.opera}` : ''}: acque di lavorazione e di galleria, acque trattate e scaricate e acqua per uso igienico-sanitario.`,
      normativa: t.normativa?.length ? t.normativa : NORMATIVA,
      parametri: PARAMETRI_TESTI,
      limiti: (destinazioniUsate.length ? destinazioniUsate : (['consumo_umano', 'scarico_superficiale'] as Destinazione[])).flatMap((dest) =>
        PARAMETRI.map((par) => ({
          destinazione: unibile(`d-${dest}`, `${DESTINAZIONI[dest].nome}\n(${DESTINAZIONI[dest].fonte})`),
          parametro: `${par.nome}${par.unita ? ` [${par.unita}]` : ''}`,
          limite: testoLimite(par.id, DESTINAZIONI[dest].limiti),
        })),
      ),
      metodologia: METODOLOGIA,
      strumenti: t.strumenti?.length ? t.strumenti : STRUMENTI,
      cicloBlocchi: t.ciclo ?? cicloPredefinito(tipi),
      misurePreventive: t.misurePreventive?.length ? t.misurePreventive : misurePredefinite(tipi),
      punti: d.punti.map((p, i) => ({
        numero: String(i + 1),
        nome: p.nome,
        descrizione: p.descrizione?.trim() || '-',
        destinazione: DESTINAZIONI[p.destinazione].nome,
        n: String(v.punti[i].misure.length),
      })),
      conMisure: v.misure.length > 0,
      misure: v.misure.map((e) => ({
        punto: unibile(`p-${e.misura.puntoId}`, e.punto ? `${numeroPunto.get(e.punto.id)}. ${e.punto.nome}` : '-'),
        data: e.misura.data || '-',
        ph: num(e.misura.ph, 1),
        conducibilita: num(e.misura.conducibilita, 0),
        tAcqua: num(e.misura.tAcqua, 1),
        tAmbiente: num(e.misura.tAmbiente, 1),
        o2Perc: num(e.misura.o2Perc, 0),
        o2MgL: num(e.misura.o2MgL, 1),
        esito: e.esito ? maiuscola(e.esito) : '-',
      })),
      confronti: v.punti.flatMap((p) =>
        PARAMETRI.filter((par) => p.intervalli[par.id]).map((par) => {
          const i = p.intervalli[par.id]!
          const esiti = p.misure.map((m) => m.esiti[par.id])
          const esito = esiti.includes('non conforme') ? 'Non conforme' : esiti.includes('conforme') ? 'Conforme' : 'Senza limite'
          return {
            punto: unibile(`c-${p.punto.id}`, p.punto.nome),
            parametro: `${par.nome}${par.unita ? ` [${par.unita}]` : ''}`,
            valori: i.min === i.max ? num(i.min, par.decimali) : `${num(i.min, par.decimali)} – ${num(i.max, par.decimali)}`,
            limite: testoLimite(par.id, p.limiti),
            esito,
          }
        }),
      ),
      conclusioni,
      piano: (t.piano ?? pianoPredefinito(v)).map((x) => ({ testo: x.testo, sotto: x.sotto ?? [] })),
    },
  }
}
