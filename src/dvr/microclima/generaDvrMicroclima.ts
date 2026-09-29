/** Generazione del DVR Microclima nel browser. */
import { generaDocx, sostituisciImmagine } from '../comune/generaDocx'
import { caricaIngresso } from '../comune/ingresso'
import { dataUrlInByte, MEDIA_LOGO_CLIENTE } from '../rumore/generaDvrRumore'
import { datiMicroclimaDaDatabase } from './daDatabase'
import { datiTemplateMicroclima } from './documento'

export const URL_TEMPLATE_MICROCLIMA = '/templates/dvr/microclima.docx'

export async function generaDvrMicroclima(cantiereId: string, documentoId: string) {
  const ingresso = await caricaIngresso(cantiereId, documentoId)
  const { dati } = datiMicroclimaDaDatabase(ingresso)
  const { dati: datiTemplate, valutazione } = datiTemplateMicroclima(dati)
  const risposta = await fetch(URL_TEMPLATE_MICROCLIMA)
  if (!risposta.ok) throw new Error(`Template non disponibile (HTTP ${risposta.status})`)
  let docx = generaDocx(await risposta.arrayBuffer(), datiTemplate)
  const logo = ingresso.documento.contenuti?.logoCliente
  if (logo) docx = sostituisciImmagine(docx, MEDIA_LOGO_CLIENTE, dataUrlInByte(logo))
  return {
    blob: new Blob([docx as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    nomeFile: datiTemplate.nomeFile,
    valutazione,
  }
}
