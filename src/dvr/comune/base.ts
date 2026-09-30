/** Parti comuni dei dati di un DVR ricavate dal database: anagrafica, documento, ambiti e mansioni. */
import { meseAnno } from '../rumore/daDatabase'
import type { Ingresso } from './ingresso'

export function baseDaIngresso(x: Ingresso) {
  const mansioni = [...x.documentoMansioni]
    .sort((a, b) => a.ordine - b.ordine)
    .map((dm) => {
      const m = x.mansioni.find((y) => y.id === dm.mansione_id)
      return { id: dm.mansione_id, nome: m?.nome ?? '(mansione eliminata)', attivita: m?.attivita ?? undefined }
    })
  const ambitiDoc = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
  const { cantiere_id: _c, ...anagrafica } = x.anagrafica
  void _c
  return {
    anagrafica,
    documento: {
      periodoRiferimento: x.documento.periodo_riferimento ?? '',
      revisione: x.documento.revisione,
      integrazione: x.documento.integrazione,
      dataEmissioneTesto: meseAnno(x.documento.data_emissione),
      anno: (x.documento.data_emissione ? new Date(x.documento.data_emissione) : new Date()).getFullYear(),
      primaValutazione: x.documento.revisione === 0 && !x.documento.documento_precedente_id,
      revisioni: x.revisioni,
    },
    ambiti: (ambitiDoc.length ? ambitiDoc : x.ambiti).map((a) => ({ nome: a.nome, tipo: a.tipo })),
    mansioni,
  }
}

export const numero = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
export const testo = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')

let contatore = 0
export const nuovoId = (prefisso: string) => `${prefisso}-${Date.now().toString(36)}-${(++contatore).toString(36)}`
