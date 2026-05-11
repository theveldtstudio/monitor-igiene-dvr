import type { Misura } from '../../../types'
import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { fmtNum } from './_helpers'

const fmt0 = fmtNum(0)
const fmt1 = fmtNum(1)

const presaShort = (v: unknown): string => {
  if (v === 'Buona') return 'B'
  if (v === 'Discreta') return 'D'
  if (v === 'Scarsa') return 'S'
  return ''
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
        { content: '', colSpan: 1 },
        { content: 'Sollevamento (NIOSH)', colSpan: 6, styles: { halign: 'center' } },
        { content: 'Spinta·Traino·Trasporto (Snook-Ciriello)', colSpan: 4, styles: { halign: 'center' } },
        { content: '', colSpan: 1 },
      ],
      ['#', 'Carico (kg)', 'Δ Vert (cm)', 'Dist. corpo (cm)', 'Disloc. (°)', 'Freq.', 'Presa', 'Spinta (kg)', 'Traino (kg)', 'F. mant. (kg)', 'Dist. trasp. (m)', 'Note'],
    ],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 26, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 24, halign: 'right' },
      10: { cellWidth: 26, halign: 'right' },
      11: {},
    },
    mapMisuraToRow: (m, idx) => {
      const d = m.dati as Record<string, unknown>
      return [
        String(idx + 1),
        fmt1(d.carico),
        fmt0(d.distanza_verticale),
        fmt0(d.distanza_peso_corpo),
        fmt0(d.dislocazione_angolare),
        freqConcat(m),
        presaShort(d.giudizio_presa),
        fmt1(d.spinta),
        fmt1(d.traino),
        fmt1(d.forza_mantenimento),
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
