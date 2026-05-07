import type { ExportContext } from '../../../data/exportSchemas'
import type { Misura } from '../../../types/index'
import { exportPdfModulo, parseDurataMinuti, minutesToHhMmSs } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'

const configRoa: PdfModuloConfig = {
  moduloId: 'ROA',
  titoloHeader: 'FOGLIO DI CAMPAGNA — RADIAZIONI OTTICHE ARTIFICIALI (ROA)',
  tabella: {
    head: [['#', 'Postazione', 'Sorgente', 'Banda', 'λ (nm)', 'Durata', 'E (W/m²)', 'Tempo (s)', 'H (J/m²)', 'Indice %', 'Note']],
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 20, halign: 'right' },
      9: { cellWidth: 20, halign: 'right' },
      10: {},
    },
    mapMisuraToRow: (m: Misura, idx: number) => {
      const d = (m.dati ?? {}) as Record<string, unknown>
      const durataMin = parseDurataMinuti(d.durata)
      const durataStr = durataMin !== null ? minutesToHhMmSs(durataMin) : ''
      const fmt1 = (v: unknown) => typeof v === 'number' ? v.toFixed(1) : ''
      const fmt2 = (v: unknown) => typeof v === 'number' ? v.toFixed(2) : ''
      const fmtInt = (v: unknown) => typeof v === 'number' ? String(Math.round(v)) : ''
      return [
        String(m.numero ?? idx + 1),
        (d.postazione_nome as string | undefined) ?? '',
        (d.sorgente as string | undefined) ?? '',
        (d.banda as string | undefined) ?? '',
        fmtInt(d.lunghezza_onda),
        durataStr,
        fmt2(d.irradianza_e),
        fmtInt(d.tempo_esposizione),
        fmt2(d.h_radiant),
        fmt1(d.indice_esposizione),
        m.note ?? '',
      ]
    },
  },
}

export async function exportPdfRoa(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configRoa, fotoCtx)
}
