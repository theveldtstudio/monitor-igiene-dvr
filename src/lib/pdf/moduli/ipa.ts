import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo, parseDurataMinuti } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { tipoLabel, fmtNum } from './_helpers'

const fmt2 = fmtNum(2)
const fmt3 = fmtNum(3)

const fmtDurataMin = (v: unknown): string => {
  const min = parseDurataMinuti(v)
  return min !== null ? String(Math.round(min)) : ''
}

const configIpa: PdfModuloConfig = {
  moduloId: 'IPA',
  titoloHeader: 'FOGLIO DI CAMPAGNA — IPA (IDROCARBURI POLICICLICI AROMATICI)',
  tabella: {
    head: [['#', 'Postazione', 'Fase', 'Tipo', 'Codice camp.', 'N° fiala', 'N° membrana', 'Pompa', 'Q (l/min)', 'Durata (min)', 'Vol (m³)', 'Note']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 26 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 24 },
      5: { cellWidth: 18 },
      6: { cellWidth: 22 },
      7: { cellWidth: 24 },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 20, halign: 'right' },
      10: { cellWidth: 18, halign: 'right' },
      11: {},
    },
    mapMisuraToRow: (m, idx) => {
      const d = m.dati as Record<string, unknown>
      return [
        String(idx + 1),
        (d.postazione_nome as string) ?? '',
        (d.fase_nome as string) ?? '',
        tipoLabel(d.tipo_misura),
        (d.codice_campione as string) ?? '',
        (d.numero_fiala as string) ?? '',
        (d.numero_membrana as string) ?? '',
        (d.pompa as string) ?? '',
        fmt2(d.portata_q),
        fmtDurataMin(d.durata_prelievo),
        fmt3(d.volume_campionato),
        (m.note as string) ?? '',
      ]
    },
  },
}

export async function exportPdfIpa(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<Blob> {
  return exportPdfModulo(ctx, ctx.misure, configIpa, fotoCtx)
}
