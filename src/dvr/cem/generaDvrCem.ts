/** Generazione del DVR Campi elettromagnetici nel browser. */
import { datiAvanzamento } from '../comune/avanzamento'
import { generaDocx, sostituisciImmagine } from '../comune/generaDocx'
import { caricaIngresso } from '../comune/ingresso'
import { dataUrlInByte, MEDIA_LOGO_CLIENTE } from '../rumore/generaDvrRumore'
import { datiCemDaDatabase } from './daDatabase'
import { datiTemplateCem } from './documento'

export const URL_TEMPLATE_CEM = '/templates/dvr/cem.docx'

export async function generaDvrCem(cantiereId: string, documentoId: string) {
  const ingresso = await caricaIngresso(cantiereId, documentoId)
  const { dati } = datiCemDaDatabase(ingresso)
  const { dati: datiTemplate, valutazione } = datiTemplateCem(dati)
  const risposta = await fetch(URL_TEMPLATE_CEM)
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
