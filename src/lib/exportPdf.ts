import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportContext } from '../data/exportSchemas'

function parseDurataMinuti(value: unknown): number | null {
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

function minutesToHhMmSs(minutes: number): string {
  const totalSec = Math.round(minutes * 60)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function buildPdfFilename(ctx: ExportContext, moduloId: string): string {
  const cantiereSafe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
  const data = ctx.campagna.data_ora
    ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10)
    : 'data'
  return `${cantiereSafe}_${moduloId}_${data}.pdf`
}

export function exportPdfRumore(ctx: ExportContext): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const PAGE_W = 297
  const MARGIN = 10
  const COL2_X = MARGIN + (PAGE_W - 2 * MARGIN) / 2
  const LINE_H = 5

  const dataFormatted = ctx.campagna.data_ora
    ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT')
    : ''

  const tecnicoNome = ctx.tecnici.length > 0
    ? ctx.tecnici.map(t => `${t.nome} ${t.cognome}`.trim()).join(', ')
    : ''

  const strumentoStr = ctx.strumento
    ? [ctx.strumento.nome, ctx.strumento.modello, ctx.strumento.matricola].filter(Boolean).join(' ')
    : ''

  // --- HEADER ---
  let y = 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('FOGLIO DI CAMPAGNA — RUMORE', MARGIN, y)

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
  const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))

  const head = [['#', 'Postazione', 'Fase', 'Macchine', 'Durata', 'Leq dBA', 'Lpeak dBC', 'Note']]

  const body = misure.map((m, idx) => {
    const dati = (m.dati ?? {}) as Record<string, unknown>
    const postazione = (dati.postazione_nome as string | undefined) ?? ''
    const fase = (dati.fase_nome as string | undefined) ?? ''
    const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

    const durataMin = parseDurataMinuti(dati.durata)
    const durataStr = durataMin !== null ? minutesToHhMmSs(durataMin) : ''

    const leq = typeof dati.leq_dba === 'number'
      ? dati.leq_dba.toFixed(1)
      : (dati.leq_dba != null ? String(dati.leq_dba) : '')
    const lpeak = typeof dati.lpeak_dbc === 'number'
      ? dati.lpeak_dbc.toFixed(1)
      : (dati.lpeak_dbc != null ? String(dati.lpeak_dbc) : '')

    return [
      String(m.numero ?? idx + 1),
      postazione,
      fase,
      macchine.join(', '),
      durataStr,
      leq,
      lpeak,
      m.note ?? '',
    ]
  })

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, textColor: [0, 0, 0] },
    headStyles: { fillColor: [221, 221, 221], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 'auto' },
    },
    margin: { left: MARGIN, right: MARGIN },
  })

  // --- PAGE NUMBERS (tutte le pagine) ---
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Pag. ${i} di ${pageCount}`, PAGE_W - MARGIN, 7, { align: 'right' })
  }

  // --- FOOTER firma (solo ultima pagina) ---
  doc.setPage(pageCount)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY: number = (doc as any).lastAutoTable?.finalY ?? 170
  const footerY = Math.min(finalY + 10, 190)

  doc.setLineWidth(0.3)
  doc.line(MARGIN, footerY, PAGE_W - MARGIN, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Tecnico rilevatore: ___________________________', MARGIN, footerY + 7)
  doc.text('Data: _______________  Firma: ___________________________', MARGIN, footerY + 13)

  doc.save(buildPdfFilename(ctx, 'Rumore'))
}
