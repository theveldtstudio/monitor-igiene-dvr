import type { ExportContext } from '../../../data/exportSchemas'
import type { Misura } from '../../../types/index'
import { exportPdfModulo, parseDurataMinuti, minutesToHhMmSs } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'

const configCem: PdfModuloConfig = {
  moduloId: 'CEM',
  titoloHeader: 'FOGLIO DI CAMPAGNA — CAMPI ELETTROMAGNETICI (CEM)',
  tabella: {
    head: [['#', 'Postazione', 'Sorgente', 'Frequenza', 'Durata', 'E (V/m)', 'H (A/m)', 'B (μT)', 'Indice %', 'Note']],
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 38 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 20, halign: 'right' },
      9: {},
    },
    mapMisuraToRow: (m: Misura, idx: number) => {
      const d = (m.dati ?? {}) as Record<string, unknown>
      const durataMin = parseDurataMinuti(d.durata)
      const durataStr = durataMin !== null ? minutesToHhMmSs(durataMin) : ''
      const freq = d.frequenza !== undefined && d.frequenza !== null && d.frequenza !== ''
        ? `${d.frequenza} ${(d.unita_frequenza as string | undefined) ?? 'Hz'}`.trim()
        : ''
      const fmt2 = (v: unknown) => typeof v === 'number' ? v.toFixed(2) : ''
      const fmt1 = (v: unknown) => typeof v === 'number' ? v.toFixed(1) : ''
      return [
        String(m.numero ?? idx + 1),
        (d.postazione_nome as string | undefined) ?? '',
        (d.sorgente as string | undefined) ?? '',
        freq,
        durataStr,
        fmt2(d.campo_e),
        fmt2(d.campo_h),
        fmt2(d.induzione_b),
        fmt1(d.indice_esposizione),
        m.note ?? '',
      ]
    },
  },
}

export async function exportPdfCem(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configCem, fotoCtx)
}
