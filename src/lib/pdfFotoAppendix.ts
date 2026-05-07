import type { jsPDF } from 'jspdf'
import { supabase } from './supabase'
import type { Misura, FotoMisura, RisorsaCantiere } from '../types'

export interface PdfFotoContext {
  misure: Misura[]
  fotoPerMisura: Map<string, FotoMisura[]>
  risorse: { postazioni: RisorsaCantiere[]; fasi: RisorsaCantiere[]; macchine: RisorsaCantiere[] }
}

type FotoWithCreatedAt = FotoMisura & { created_at?: string | null }

async function downloadAndCompressToDataUrl(pathLocale: string): Promise<string | null> {
  try {
    const { data: blob, error } = await supabase.storage.from('misure-foto').download(pathLocale)
    if (error || !blob) {
      console.warn('[pdfFotoAppendix] foto non scaricabile:', pathLocale, error)
      return null
    }
    const img = await createImageBitmap(blob)
    const ratio = 800 / Math.max(img.width, img.height)
    const w = ratio < 1 ? Math.round(img.width * ratio) : img.width
    const h = ratio < 1 ? Math.round(img.height * ratio) : img.height
    const canvas = new OffscreenCanvas(w, h)
    const ctx2d = canvas.getContext('2d')!
    ctx2d.drawImage(img, 0, 0, w, h)
    const compressed = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 })
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(compressed)
    })
  } catch (err) {
    console.warn('[pdfFotoAppendix] foto non scaricabile:', pathLocale, err)
    return null
  }
}

function buildMisuraHeader(misura: Misura, risorse: PdfFotoContext['risorse']): string {
  const dati = (misura.dati ?? {}) as Record<string, unknown>

  let postazione = ''
  if (typeof dati.postazione_nome === 'string' && dati.postazione_nome) {
    postazione = dati.postazione_nome
  } else if (typeof dati.postazione_id === 'string') {
    const r = risorse.postazioni.find((r) => r.id === dati.postazione_id)
    if (r) postazione = r.valore
  }

  let secondo = ''
  if (typeof dati.fase_nome === 'string' && dati.fase_nome) {
    secondo = dati.fase_nome
  } else if (typeof dati.fase_id === 'string') {
    const r = risorse.fasi.find((r) => r.id === dati.fase_id)
    if (r) secondo = r.valore
  } else {
    const macchineIds = Array.isArray(dati.macchine_ids) ? (dati.macchine_ids as string[]) : []
    const primoId = macchineIds[0]
    if (primoId) {
      const r = risorse.macchine.find((r) => r.id === primoId)
      if (r) secondo = r.valore
    }
  }

  const parti = [`Misura #${misura.numero}`]
  if (postazione) parti.push(postazione)
  if (secondo) parti.push(secondo)
  return parti.join(' — ')
}

export async function addPdfFotoAppendix(doc: jsPDF, ctx: PdfFotoContext): Promise<void> {
  const { misure, fotoPerMisura, risorse } = ctx

  const misureConFoto = misure.filter((m) => (fotoPerMisura.get(m.id) ?? []).length > 0)
  if (misureConFoto.length === 0) return

  const PAGE_W = 297
  const PAGE_H = 210
  const MARGIN = 10
  const PHOTO_W = 120
  const PHOTO_H = 85
  const GAP_H = 10   // horizontal gap between 2 photos
  const GAP_V = 8    // vertical gap between photo rows
  const PAGE_HEADER_H = 12
  const MISURA_HEADER_H = 8

  let y = MARGIN

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('APPENDICE FOTO', MARGIN, y + 6)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y + 8, PAGE_W - MARGIN, y + 8)
    y += PAGE_HEADER_H
  }

  doc.addPage('a4', 'landscape')
  y = MARGIN
  drawPageHeader()

  for (const misura of misureConFoto) {
    const fotos = (fotoPerMisura.get(misura.id) ?? [])
      .slice()
      .sort((a, b) => {
        const ta = (a as FotoWithCreatedAt).created_at ?? ''
        const tb = (b as FotoWithCreatedAt).created_at ?? ''
        return ta.localeCompare(tb)
      })

    // Pagebreak if not enough space for header + at least one foto row
    if (PAGE_H - MARGIN - y < MISURA_HEADER_H + PHOTO_H) {
      doc.addPage('a4', 'landscape')
      y = MARGIN
      drawPageHeader()
    }

    // Misura header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(buildMisuraHeader(misura, risorse), MARGIN, y + 5)
    y += MISURA_HEADER_H

    for (let i = 0; i < fotos.length; i += 2) {
      if (PAGE_H - MARGIN - y < PHOTO_H) {
        doc.addPage('a4', 'landscape')
        y = MARGIN
        drawPageHeader()
      }

      const x1 = MARGIN
      const x2 = MARGIN + PHOTO_W + GAP_H

      const dataUrl1 = await downloadAndCompressToDataUrl(fotos[i].path_locale)
      if (dataUrl1) {
        doc.addImage(dataUrl1, 'JPEG', x1, y, PHOTO_W, PHOTO_H)
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text('foto non caricabile', x1 + PHOTO_W / 2, y + PHOTO_H / 2, { align: 'center' })
        doc.setTextColor(0)
      }

      if (i + 1 < fotos.length) {
        const dataUrl2 = await downloadAndCompressToDataUrl(fotos[i + 1].path_locale)
        if (dataUrl2) {
          doc.addImage(dataUrl2, 'JPEG', x2, y, PHOTO_W, PHOTO_H)
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(150)
          doc.text('foto non caricabile', x2 + PHOTO_W / 2, y + PHOTO_H / 2, { align: 'center' })
          doc.setTextColor(0)
        }
      }

      y += PHOTO_H + GAP_V
    }

    y += GAP_V
  }
}
