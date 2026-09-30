/** Generazione del DVR Radiazioni ottiche artificiali nel browser. */
import { datiAvanzamento } from '../comune/avanzamento'
import { generaDocx, sostituisciImmagine } from '../comune/generaDocx'
import { caricaIngresso } from '../comune/ingresso'
import { dataUrlInByte, MEDIA_LOGO_CLIENTE } from '../rumore/generaDvrRumore'
import { datiRoaDaDatabase } from './daDatabase'
import { datiTemplateRoa } from './documento'

export const URL_TEMPLATE_ROA = '/templates/dvr/roa.docx'

export async function generaDvrRoa(cantiereId: string, documentoId: string) {
  const ingresso = await caricaIngresso(cantiereId, documentoId)
  const { dati } = datiRoaDaDatabase(ingresso)
  const { dati: datiTemplate, valutazione } = datiTemplateRoa(dati)
  const risposta = await fetch(URL_TEMPLATE_ROA)
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
