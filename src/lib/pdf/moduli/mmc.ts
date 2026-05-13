import type { Misura } from '../../../types'
import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { fmtNum } from './_helpers'
import type { Styles } from 'jspdf-autotable'

const fmt0 = fmtNum(0)
const fmt1 = fmtNum(1)

function defaultHeaderCellStyle(): Partial<Styles> {
  return {
    fillColor: [235, 235, 235],
    textColor: [0, 0, 0],
    fontStyle: 'bold',
    halign: 'center',
    lineWidth: 0.2,
    lineColor: [0, 0, 0],
  }
}

const freqConcat = (m: Misura): string => {
  const d = m.dati as Record<string, unknown>
  if (typeof d.frequenza_gesti !== 'number') return ''
  const unita = (d.frequenza_unita as string) ?? 'atti/min'
  return `${d.frequenza_gesti} ${unita}`
}

const configMmc: PdfModuloConfig = {
  moduloId: 'MMC',
  titoloHeader: 'FOGLIO DI CAMPAGNA — MOVIMENTAZIONE MANUALE CARICHI (MMC)',
  tabella: {
    head: [
      [
        { content: '', colSpan: 1, styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
        { content: 'Sollevamento (NIOSH)', colSpan: 8, styles: {
            halign: 'center',
            fillColor: [50, 50, 50],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            cellPadding: 2,
          } },
        { content: 'Spinta·Traino·Trasporto (Snook-Ciriello)', colSpan: 4, styles: {
            halign: 'center',
            fillColor: [50, 50, 50],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            cellPadding: 2,
          } },
        { content: '', colSpan: 1, styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
      ],
      [
        { content: '#',                     styles: defaultHeaderCellStyle() },
        { content: 'Carico (kg)',           styles: defaultHeaderCellStyle() },
        { content: 'H. mani (cm)',          styles: defaultHeaderCellStyle() },
        { content: 'Dist. vert. (cm)',      styles: defaultHeaderCellStyle() },
        { content: 'Dist. peso/corpo (cm)', styles: defaultHeaderCellStyle() },
        { content: 'Disloc. (°)',           styles: defaultHeaderCellStyle() },
        { content: 'Freq. gesti',           styles: defaultHeaderCellStyle() },
        { content: 'Giudizio presa',        styles: defaultHeaderCellStyle() },
        { content: 'N° pers.',              styles: defaultHeaderCellStyle() },
        { content: 'F. manten. (kg)',       styles: defaultHeaderCellStyle() },
        { content: 'Spinta (kg)',           styles: defaultHeaderCellStyle() },
        { content: 'Traino (kg)',           styles: defaultHeaderCellStyle() },
        { content: 'Dist. trasp. (m)',      styles: defaultHeaderCellStyle() },
        { content: 'Note',                  styles: defaultHeaderCellStyle() },
      ],
    ],
    columnStyles: {
      0:  { cellWidth: 8,      halign: 'center' },   // #
      1:  { cellWidth: 18,     halign: 'center' },   // Carico (kg)
      2:  { cellWidth: 18,     halign: 'center' },   // H. mani (cm)
      3:  { cellWidth: 20,     halign: 'center' },   // Dist. vert. (cm)
      4:  { cellWidth: 24,     halign: 'center' },   // Dist. peso/corpo (cm)
      5:  { cellWidth: 18,     halign: 'center' },   // Disloc. (°)
      6:  { cellWidth: 20,     halign: 'center' },   // Freq. gesti
      7:  { cellWidth: 22,     halign: 'center' },   // Giudizio presa
      8:  { cellWidth: 14,     halign: 'center' },   // N° pers.
      9:  { cellWidth: 22,     halign: 'center' },   // F. manten. (kg)
      10: { cellWidth: 18,     halign: 'center' },   // Spinta (kg)
      11: { cellWidth: 18,     halign: 'center' },   // Traino (kg)
      12: { cellWidth: 20,     halign: 'center' },   // Dist. trasp. (m)
      13: { cellWidth: 'auto', halign: 'left'   },   // Note
    },
    mapMisuraToRow: (m, idx) => {
      const d = m.dati as Record<string, unknown>
      return [
        String(idx + 1),
        fmt1(d.carico),
        fmt0(d.altezza_mani),
        fmt0(d.distanza_verticale),
        fmt0(d.distanza_peso_corpo),
        fmt0(d.dislocazione_angolare),
        freqConcat(m),
        String(d.giudizio_presa ?? ''),
        fmt0(d.n_persone),
        fmt1(d.forza_mantenimento),
        fmt1(d.spinta),
        fmt1(d.traino),
        fmt0(d.distanza_trasporto),
        (m.note as string) ?? '',
      ]
    },
  },
}

export async function exportPdfMmc(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<Blob> {
  return exportPdfModulo(ctx, ctx.misure, configMmc, fotoCtx)
}
