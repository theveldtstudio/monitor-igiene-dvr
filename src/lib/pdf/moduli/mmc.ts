import type { Misura } from '../../../types'
import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { fmtNum } from './_helpers'

const fmt0 = fmtNum(0)
const fmt1 = fmtNum(1)

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
        { content: '', colSpan: 1 },
        { content: 'Sollevamento (NIOSH)', colSpan: 8, styles: { halign: 'center', lineWidth: 0.4, lineColor: [60, 60, 60] as [number, number, number] } },
        { content: 'Spinta·Traino·Trasporto (Snook-Ciriello)', colSpan: 4, styles: { halign: 'center', lineWidth: 0.4, lineColor: [60, 60, 60] as [number, number, number] } },
        { content: '', colSpan: 1 },
      ],
      [
        { content: '#',                    styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Carico (kg)',          styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'H. mani (cm)',         styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Dist. vert. (cm)',     styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Dist. peso/corpo (cm)', styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Disloc. (°)',          styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Freq. gesti',          styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Giudizio presa',       styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'N° pers.',             styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'F. manten. (kg)',      styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Spinta (kg)',          styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Traino (kg)',          styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Dist. trasp. (m)',     styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
        { content: 'Note',                 styles: { lineWidth: 0.3, lineColor: [80, 80, 80] as [number, number, number] } },
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
