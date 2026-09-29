/**
 * Generazione del DVR Rumore nel browser: legge tutto dal database, calcola, riempie il template Word.
 */
import * as api from '../api'
import { generaDocx, sostituisciImmagine } from '../comune/generaDocx'
import { controllaDpi } from './dpi'
import { datiDaDatabase } from './daDatabase'
import { datiTemplateRumore } from './documento'

export const URL_TEMPLATE_RUMORE = '/templates/dvr/rumore.docx'
/** Riquadro del logo cliente nel template: 198,45 × 52,6 pt. */
export const RAPPORTO_LOGO_CLIENTE = 198.45 / 52.6
const MEDIA_LOGO_CLIENTE = 'word/media/image1.png'

export async function caricaIngresso(cantiereId: string, documentoId: string) {
  const documento = await api.leggiDocumento(documentoId)
  const [anagrafica, revisioni, ambiti, mansioni, documentoMansioni, tempi, misure, macchine, dpi, tarature] = await Promise.all([
    api.leggiAnagrafica(cantiereId),
    api.leggiRevisioni(documentoId),
    api.leggiAmbiti(cantiereId),
    api.leggiMansioni(cantiereId),
    api.leggiDocumentoMansioni(documentoId),
    api.leggiTempi(documentoId),
    api.leggiMisureRumore(cantiereId, documento.campagne_ids),
    api.leggiMacchine(cantiereId),
    api.leggiDpi(cantiereId),
    api.leggiTarature(),
  ])
  if (!anagrafica) throw new Error('Compila prima l’anagrafica DVR del cantiere.')
  return { anagrafica, documento, revisioni, ambiti, mansioni, documentoMansioni, tempi, misure, macchine, dpi, tarature }
}

export async function generaDvrRumore(cantiereId: string, documentoId: string) {
  const ingresso = await caricaIngresso(cantiereId, documentoId)
  const { dati, righeScartate } = datiDaDatabase(ingresso)
  const { dati: datiTemplate, valutazione } = datiTemplateRumore(dati)

  const risposta = await fetch(URL_TEMPLATE_RUMORE)
  if (!risposta.ok) throw new Error(`Template non disponibile (HTTP ${risposta.status})`)
  let docx = generaDocx(await risposta.arrayBuffer(), datiTemplate)

  const logo = ingresso.documento.contenuti?.logoCliente
  if (logo) docx = sostituisciImmagine(docx, MEDIA_LOGO_CLIENTE, dataUrlInByte(logo))

  const avvisiDpi = dati.dpi.flatMap(controllaDpi)
  return {
    blob: new Blob([docx as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    nomeFile: datiTemplate.nomeFile,
    valutazione,
    righeScartate,
    avvisiDpi,
  }
}

function dataUrlInByte(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? ''
  const bin = atob(base64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Adatta un'immagine al riquadro del logo (proporzioni fisse, sfondo trasparente) e la restituisce come PNG data URL. */
export async function adattaLogo(file: File, larghezza = 794): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const altezza = Math.round(larghezza / RAPPORTO_LOGO_CLIENTE)
  const canvas = document.createElement('canvas')
  canvas.width = larghezza
  canvas.height = altezza
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponibile')
  const scala = Math.min(larghezza / bitmap.width, altezza / bitmap.height)
  const w = bitmap.width * scala
  const h = bitmap.height * scala
  ctx.drawImage(bitmap, (larghezza - w) / 2, (altezza - h) / 2, w, h)
  return canvas.toDataURL('image/png')
}
