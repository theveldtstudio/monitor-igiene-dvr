import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { tipoLabel, fmtNum } from './_helpers'

const fmt2 = fmtNum(2)

const configGas: PdfModuloConfig = {
  moduloId: 'Gas',
  titoloHeader: 'FOGLIO DI CAMPAGNA — GAS',
  tabella: {
    head: [['#', 'Postazione', 'Fase', 'Tempo', 'Tipo', 'NO₂', 'NO', 'CO', 'CO₂', 'H₂S', 'O₂', 'Altro', 'Note']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 28 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'right' },
      6: { cellWidth: 12, halign: 'right' },
      7: { cellWidth: 12, halign: 'right' },
      8: { cellWidth: 14, halign: 'right' },
      9: { cellWidth: 14, halign: 'right' },
      10: { cellWidth: 14, halign: 'right' },
      11: { cellWidth: 24 },
      12: {},
    },
    mapMisuraToRow: (m, idx) => {
      const d = m.dati as Record<string, unknown>
      let altro = ''
      if (d.altro_gas_nome || typeof d.altro_gas_valore === 'number') {
        const nome = (d.altro_gas_nome as string) ?? ''
        const val = typeof d.altro_gas_valore === 'number' ? fmt2(d.altro_gas_valore) : ''
        altro = [nome, val].filter(Boolean).join(': ')
      }
      return [
        String(idx + 1),
        (d.postazione_nome as string) ?? '',
        (d.fase_nome as string) ?? '',
        (d.tempo_prelievo as string) ?? '',
        tipoLabel(d.tipo_prelievo),
        fmt2(d.no2),
        fmt2(d.no),
        fmt2(d.co),
        fmt2(d.co2),
        fmt2(d.h2s),
        fmt2(d.o2),
        altro,
        (m.note as string) ?? '',
      ]
    },
  },
}

export async function exportPdfGas(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<Blob> {
  return exportPdfModulo(ctx, ctx.misure, configGas, fotoCtx)
}
