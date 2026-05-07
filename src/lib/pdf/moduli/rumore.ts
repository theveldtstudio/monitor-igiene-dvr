import type { ExportContext } from '../../../data/exportSchemas'
import type { Misura } from '../../../types'
import { exportPdfModulo, parseDurataMinuti, minutesToHhMmSs } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'

const configRumore: PdfModuloConfig = {
  moduloId: 'Rumore',
  titoloHeader: 'FOGLIO DI CAMPAGNA — RUMORE',
  tabella: {
    head: [['#', 'Postazione', 'Fase', 'Macchine', 'Durata', 'Leq dBA', 'Leq dBC', 'Lpeak', 'Note']],
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 38 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 'auto' },
    },
    mapMisuraToRow: (m: Misura, idx: number) => {
      const dati = (m.dati ?? {}) as Record<string, unknown>
      const postazione = (dati.postazione_nome as string | undefined) ?? ''
      const fase = (dati.fase_nome as string | undefined) ?? ''
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      const durataMin = parseDurataMinuti(dati.durata)
      const durataStr = minutesToHhMmSs(durataMin)

      const leqDba = typeof dati.leq_dba === 'number'
        ? dati.leq_dba.toFixed(1)
        : (dati.leq_dba != null ? String(dati.leq_dba) : '')
      const leqDbc = typeof dati.leq_dbc === 'number'
        ? dati.leq_dbc.toFixed(1)
        : (dati.leq_dbc != null ? String(dati.leq_dbc) : '')
      const lpeak = typeof dati.lpeak_dbc === 'number'
        ? dati.lpeak_dbc.toFixed(1)
        : (dati.lpeak_dbc != null ? String(dati.lpeak_dbc) : '')

      return [
        String(m.numero ?? idx + 1),
        postazione,
        fase,
        macchine.join(', '),
        durataStr,
        leqDba,
        leqDbc,
        lpeak,
        m.note ?? '',
      ]
    },
  },
}

export async function exportPdfRumore(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configRumore, fotoCtx)
}
