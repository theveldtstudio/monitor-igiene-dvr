import type { ExportContext } from '../../../data/exportSchemas'
import type { Misura } from '../../../types/index'
import { exportPdfModulo, parseDurataMinuti, minutesToHhMmSs } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'

const configMicroclima: PdfModuloConfig = {
  moduloId: 'Microclima',
  titoloHeader: 'FOGLIO DI CAMPAGNA — MICROCLIMA',
  tabella: {
    head: [['#', 'Postazione', 'Ambiente', 'Durata', 'Ta', 'Tg', 'Tnw', 'UR%', 'Va', 'WBGT', 'Note']],
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 16, halign: 'right' },
      8: { cellWidth: 16, halign: 'right' },
      9: { cellWidth: 18, halign: 'right' },
      10: {},
    },
    mapMisuraToRow: (m: Misura, idx: number) => {
      const d = (m.dati ?? {}) as Record<string, unknown>
      const durataMin = parseDurataMinuti(d.durata)
      const durataStr = durataMin !== null ? minutesToHhMmSs(durataMin) : ''
      const fmt1 = (v: unknown) => typeof v === 'number' ? v.toFixed(1) : ''
      const fmt2 = (v: unknown) => typeof v === 'number' ? v.toFixed(2) : ''
      return [
        String(m.numero ?? idx + 1),
        (d.postazione_nome as string | undefined) ?? '',
        (d.ambiente as string | undefined) ?? '',
        durataStr,
        fmt1(d.ta),
        fmt1(d.tg),
        fmt1(d.tnw),
        fmt1(d.ur),
        fmt2(d.va),
        fmt1(d.wbgt),
        m.note ?? '',
      ]
    },
  },
}

export async function exportPdfMicroclima(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configMicroclima, fotoCtx)
}
