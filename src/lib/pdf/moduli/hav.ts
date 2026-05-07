import type { ExportContext } from '../../../data/exportSchemas'
import type { Misura } from '../../../types/index'
import { exportPdfModulo, parseDurataMinuti, minutesToHhMmSs } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'

const configHav: PdfModuloConfig = {
  moduloId: 'HAV',
  titoloHeader: 'FOGLIO DI CAMPAGNA — VIBRAZIONI MANO-BRACCIO (HAV)',
  tabella: {
    head: [['#', 'Utensile', 'Matricola', 'Impugnatura', 'Durata', 'Aw x', 'Aw y', 'Aw z', 'A(w)sum', 'Note']],
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
      9: {},
    },
    mapMisuraToRow: (m: Misura, idx: number) => {
      const d = (m.dati ?? {}) as Record<string, unknown>
      const durataMin = parseDurataMinuti(d.durata)
      const durataStr = durataMin !== null ? minutesToHhMmSs(durataMin) : ''

      let impugnatura = String(d.impugnatura ?? '')
      if (impugnatura === 'altro' && d.impugnatura_altro) {
        impugnatura = `altro: ${d.impugnatura_altro}`
      }

      const fmt = (v: unknown) => typeof v === 'number' ? v.toFixed(2) : ''
      return [
        String(m.numero ?? idx + 1),
        (d.utensile as string | undefined) ?? '',
        (d.matricola as string | undefined) ?? '',
        impugnatura,
        durataStr,
        fmt(d.aw_x),
        fmt(d.aw_y),
        fmt(d.aw_z),
        fmt(d.aw_sum),
        m.note ?? '',
      ]
    },
  },
}

export async function exportPdfHav(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configHav, fotoCtx)
}
