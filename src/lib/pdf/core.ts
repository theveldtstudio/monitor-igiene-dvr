import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportContext } from '../../data/exportSchemas'
import type { Misura } from '../../types'
import { addPdfFotoAppendix } from './fotoAppendix'
import type { PdfFotoContext } from './fotoAppendix'

export type { PdfFotoContext }

export const PAGE_W = 297
export const PAGE_H = 210
export const MARGIN = 10
export const COL2_X = MARGIN + (PAGE_W - 2 * MARGIN) / 2
export const LINE_H = 5

export function parseDurataMinuti(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map(p => p.trim())
    if (parts.length === 2) {
      const h = Number(parts[0]), m = Number(parts[1])
      return isFinite(h) && isFinite(m) ? h * 60 + m : null
    }
    if (parts.length === 3) {
      const h = Number(parts[0]), m = Number(parts[1]), s = Number(parts[2])
      return isFinite(h) && isFinite(m) && isFinite(s) ? h * 60 + m + s / 60 : null
    }
    return null
  }
  const n = Number(trimmed.replace(',', '.'))
  return isFinite(n) ? n : null
}

export function minutesToHhMmSs(minutes: number | null): string {
  if (minutes === null) return ''
  const totalSec = Math.round(minutes * 60)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDataIt(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('it-IT')
}

export function buildTecnicoNome(ctx: ExportContext): string {
  return ctx.tecnici.length > 0
    ? ctx.tecnici.map(t => `${t.nome} ${t.cognome}`.trim()).join(', ')
    : ''
}

export function buildStrumentoStr(ctx: ExportContext): string {
  return ctx.strumento
    ? [ctx.strumento.nome, ctx.strumento.modello, ctx.strumento.matricola].filter(Boolean).join(' ')
    : ''
}

function buildPdfFilename(ctx: ExportContext, moduloId: string): string {
  const cantiereSafe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
  const data = ctx.campagna.data_ora
    ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10)
    : 'data'
  return `${cantiereSafe}_${moduloId}_${data}.pdf`
}

export interface PdfModuloConfig {
  moduloId: string
  titoloHeader: string
  tabella: {
    head: string[][]
    columnStyles: Record<number, { cellWidth?: number | 'auto'; halign?: 'left' | 'center' | 'right' }>
    mapMisuraToRow: (m: Misura, idx: number) => string[]
  }
}

export async function exportPdfModulo(
  ctx: ExportContext,
  misure: Misura[],
  config: PdfModuloConfig,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const dataFormatted = formatDataIt(ctx.campagna.data_ora)
  const tecnicoNome = buildTecnicoNome(ctx)
  const strumentoStr = buildStrumentoStr(ctx)

  // --- HEADER ---
  let y = 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(config.titoloHeader, MARGIN, y)

  y += 5
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)

  y += 6
  const headerRows: [string, string, string, string][] = [
    ['Cantiere:', ctx.cantiere.nome, 'Data:', dataFormatted],
    ['Committente:', ctx.cantiere.committente ?? '', 'Tecnico:', tecnicoNome],
    ['Strumento:', strumentoStr, '', ''],
  ]

  headerRows.forEach(([l1, v1, l2, v2]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(l1, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.text(v1, MARGIN + 24, y)
    if (l2) {
      doc.setFont('helvetica', 'bold')
      doc.text(l2, COL2_X, y)
      doc.setFont('helvetica', 'normal')
      doc.text(v2, COL2_X + 20, y)
    }
    y += LINE_H
  })

  y += 3

  // --- TABLE ---
  const sorted = [...misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))

  autoTable(doc, {
    startY: y,
    head: config.tabella.head,
    body: sorted.map(config.tabella.mapMisuraToRow),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, textColor: [0, 0, 0] },
    headStyles: { fillColor: [221, 221, 221], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: config.tabella.columnStyles,
    margin: { left: MARGIN, right: MARGIN },
  })

  // --- FOOTER firma ---
  const tablePageCount = doc.getNumberOfPages()
  doc.setPage(tablePageCount)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY: number = (doc as any).lastAutoTable?.finalY ?? 170
  const footerY = Math.min(finalY + 10, 190)

  doc.setLineWidth(0.3)
  doc.line(MARGIN, footerY, PAGE_W - MARGIN, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Tecnico rilevatore: ___________________________', MARGIN, footerY + 7)
  doc.text('Data: _______________  Firma: ___________________________', MARGIN, footerY + 13)

  // --- APPENDICE FOTO ---
  if (fotoCtx) {
    await addPdfFotoAppendix(doc, fotoCtx)
  }

  // --- PAGE NUMBERS ---
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Pag. ${i} di ${totalPages}`, PAGE_W - MARGIN, 7, { align: 'right' })
  }

  doc.save(buildPdfFilename(ctx, config.moduloId))
}
