/** Generazione dei DVR Agenti chimici, Fumi di saldatura e Agenti cancerogeni nel browser. */
import { datiAvanzamento } from '../comune/avanzamento'
import { generaDocx, sostituisciImmagine } from '../comune/generaDocx'
import { caricaIngresso } from '../comune/ingresso'
import { dataUrlInByte, MEDIA_LOGO_CLIENTE } from '../rumore/generaDvrRumore'
import type { TipoDvrChimico } from './agenti'
import { datiChimicoDaDatabase } from './daDatabase'
import { datiTemplateChimico } from './documento'

export const URL_TEMPLATE_CHIMICO: Record<TipoDvrChimico, string> = {
  chimico: '/templates/dvr/chimico.docx',
  fumi_saldatura: '/templates/dvr/fumi_saldatura.docx',
  cancerogeno: '/templates/dvr/cancerogeno.docx',
  amianto: '/templates/dvr/amianto.docx',
  ipa: '/templates/dvr/ipa.docx',
}

export async function generaDvrChimico(cantiereId: string, documentoId: string, tipo: TipoDvrChimico) {
  const ingresso = await caricaIngresso(cantiereId, documentoId)
  const { dati } = datiChimicoDaDatabase(ingresso, tipo)
  const { dati: datiTemplate, valutazione } = datiTemplateChimico(dati)
  const risposta = await fetch(URL_TEMPLATE_CHIMICO[tipo])
  if (!risposta.ok) throw new Error(`Template non disponibile (HTTP ${risposta.status})`)
  let docx = generaDocx(await risposta.arrayBuffer(), { ...datiAvanzamento(ingresso.documento.contenuti?.avanzamento, ingresso.documento.periodo_riferimento ?? ''), ...datiTemplate })
  const logo = ingresso.documento.contenuti?.logoCliente
  if (logo) docx = sostituisciImmagine(docx, MEDIA_LOGO_CLIENTE, dataUrlInByte(logo))
  return {
    blob: new Blob([docx as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    nomeFile: datiTemplate.nomeFile,
    valutazione,
  }
}
