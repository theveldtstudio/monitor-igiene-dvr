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
        { content: 'Sollevamento (NIOSH)', colSpan: 8, styles: { halign: 'center' } },
        { content: 'Spinta·Traino·Trasporto (Snook-Ciriello)', colSpan: 4, styles: { halign: 'center' } },
        { content: '', colSpan: 1 },
      ],
      ['#', 'Carico (kg)', 'H. mani (cm)', 'Dist. vert. (cm)', 'Dist. peso/corpo (cm)', 'Disloc. (°)', 'Freq. gesti', 'Giudizio presa', 'N° pers.', 'F. manten. (kg)', 'Spinta (kg)', 'Traino (kg)', 'Dist. trasp. (m)', 'Note'],
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
