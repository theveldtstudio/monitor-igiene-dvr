/**
 * Riempie un template .docx (docxtemplater) con i dati del DVR.
 * Funziona nel browser e in Node: riceve e restituisce byte, nessun accesso a file.
 */
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { unisciCelleMarcate } from './unisciCelle'

export class ErroreTemplate extends Error {
  dettagli: string[]
  constructor(dettagli: string[]) {
    super(`Template DVR non valido: ${dettagli.join('; ')}`)
    this.dettagli = dettagli
  }
}

interface ErroreDocxtemplater {
  properties?: { errors?: { properties?: { explanation?: string } }[]; explanation?: string }
}

export function generaDocx(template: ArrayBuffer | Uint8Array, dati: Record<string, unknown>): Uint8Array {
  const zip = new PizZip(template)
  let doc: Docxtemplater
  try {
    doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Un dato mancante lascia la cella vuota invece di scrivere "undefined".
      nullGetter: () => '',
    })
    doc.render(dati)
  } catch (e) {
    const err = e as ErroreDocxtemplater
    const lista = err.properties?.errors?.map((x) => x.properties?.explanation ?? 'errore') ?? [
      err.properties?.explanation ?? String(e),
    ]
    throw new ErroreTemplate(lista)
  }
  const out = doc.getZip()
  const xml = out.file('word/document.xml')?.asText()
  if (xml) out.file('word/document.xml', unisciCelleMarcate(xml))
  return out.generate({ type: 'uint8array', compression: 'DEFLATE' })
}

/**
 * Sostituisce un'immagine del template (es. il logo del cliente) mantenendo le dimensioni
 * del riquadro: il chiamante deve passare un'immagine già adattata alle proporzioni del riquadro.
 */
export function sostituisciImmagine(docx: Uint8Array, percorsoMedia: string, immagine: Uint8Array): Uint8Array {
  const zip = new PizZip(docx)
  if (!zip.file(percorsoMedia)) throw new Error(`Immagine ${percorsoMedia} non presente nel template`)
  zip.file(percorsoMedia, immagine)
  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' })
}
