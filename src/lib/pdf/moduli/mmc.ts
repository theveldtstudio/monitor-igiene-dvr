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
      0:  { cellWidth: 18,     halign: 'center' },
      1:  { cellWidth: 48,     halign: 'center' },
      2:  { cellWidth: 48,     halign: 'center' },
      3:  { cellWidth: 50,     halign: 'center' },
      4:  { cellWidth: 62,     halign: 'center' },
      5:  { cellWidth: 48,     halign: 'center' },
      6:  { cellWidth: 52,     halign: 'center' },
      7:  { cellWidth: 56,     halign: 'center' },
      8:  { cellWidth: 38,     halign: 'center' },
      9:  { cellWidth: 56,     halign: 'center' },
      10: { cellWidth: 48,     halign: 'center' },
      11: { cellWidth: 48,     halign: 'center' },
      12: { cellWidth: 52,     halign: 'center' },
      13: { cellWidth: 'auto', halign: 'left'   },
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
