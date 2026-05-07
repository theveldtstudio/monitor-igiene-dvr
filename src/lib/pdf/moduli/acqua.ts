import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { fmtNum } from './_helpers'

const fmt0 = fmtNum(0)
const fmt1 = fmtNum(1)
const fmt2 = fmtNum(2)

const configAcqua: PdfModuloConfig = {
  moduloId: 'Acqua',
  titoloHeader: 'FOGLIO DI CAMPAGNA — MONITORAGGIO ACQUA',
  tabella: {
    head: [['#', 'Punto monitoraggio', 'pH', 'Cond. (µS/cm)', 'T acqua (°C)', 'T amb. (°C)', 'O₂ (%)', 'O₂ (mg/L)', 'Note']],
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: {},
    },
    mapMisuraToRow: (m, idx) => {
      const d = m.dati as Record<string, unknown>
      return [
        String(idx + 1),
        (d.punto_monitoraggio as string) ?? '',
        fmt2(d.ph),
        fmt0(d.conducibilita),
        fmt1(d.t_acqua),
        fmt1(d.t_ambiente),
        fmt1(d.o2_perc),
        fmt2(d.o2_mg_l),
        (m.note as string) ?? '',
      ]
    },
  },
}

export async function exportPdfAcqua(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configAcqua, fotoCtx)
}
