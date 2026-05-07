import type { ExportContext } from '../../../data/exportSchemas'
import type { Misura } from '../../../types/index'
import { exportPdfModulo, parseDurataMinuti } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { tipoLabel, fmtNum, fmtSottoSoglia } from './_helpers'

const hasLabData = (m: Misura): boolean => {
  const d = m.dati as Record<string, unknown>
  return typeof d.polveri_filtro === 'number'
    || typeof d.silice_filtro_valore === 'number'
}

const fmt2 = fmtNum(2)
const fmt3 = fmtNum(3)

const fmtDurataMin = (v: unknown): string => {
  const min = parseDurataMinuti(v)
  return min !== null ? String(Math.round(min)) : ''
}

const cantiereCols = {
  head: [['#', 'Postazione', 'Fase', 'Tipo', 'Codice filtro', 'Pompa', 'Q (l/min)', 'Durata (min)', 'Vol (m³)', 'Note']],
  columnStyles: {
    0: { cellWidth: 10, halign: 'center' as const },
    1: { cellWidth: 38 },
    2: { cellWidth: 32 },
    3: { cellWidth: 14, halign: 'center' as const },
    4: { cellWidth: 28 },
    5: { cellWidth: 28 },
    6: { cellWidth: 18, halign: 'right' as const },
    7: { cellWidth: 20, halign: 'right' as const },
    8: { cellWidth: 18, halign: 'right' as const },
    9: {},
  },
  mapMisuraToRow: (m: Misura, idx: number): string[] => {
    const d = (m.dati ?? {}) as Record<string, unknown>
    return [
      String(idx + 1),
      (d.postazione_nome as string) ?? '',
      (d.fase_nome as string) ?? '',
      tipoLabel(d.tipo_misura),
      (d.codice_filtro as string) ?? '',
      (d.pompa as string) ?? '',
      fmt2(d.portata_q),
      fmtDurataMin(d.durata_prelievo),
      fmt3(d.volume_campionato),
      (m.note as string) ?? '',
    ]
  },
}

const configPolveri: PdfModuloConfig = {
  moduloId: 'Polveri',
  titoloHeader: 'FOGLIO DI CAMPAGNA — POLVERI',
  tabella: {
    variante: 'adattiva',
    hasLabData,
    cantiere: cantiereCols,
    completa: {
      head: [['#', 'Postazione', 'Fase', 'Tipo', 'Codice filtro', 'Vol (m³)', 'Polveri (mg)', 'Conc polv. (mg/m³)', 'Silice (mg)', 'Conc silice (mg/m³)', 'Note']],
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' as const },
        1: { cellWidth: 30 },
        2: { cellWidth: 26 },
        3: { cellWidth: 12, halign: 'center' as const },
        4: { cellWidth: 24 },
        5: { cellWidth: 18, halign: 'right' as const },
        6: { cellWidth: 20, halign: 'right' as const },
        7: { cellWidth: 26, halign: 'right' as const },
        8: { cellWidth: 20, halign: 'right' as const },
        9: { cellWidth: 26, halign: 'right' as const },
        10: {},
      },
      mapMisuraToRow: (m: Misura, idx: number): string[] => {
        const d = (m.dati ?? {}) as Record<string, unknown>
        return [
          String(idx + 1),
          (d.postazione_nome as string) ?? '',
          (d.fase_nome as string) ?? '',
          tipoLabel(d.tipo_misura),
          (d.codice_filtro as string) ?? '',
          fmt3(d.volume_campionato),
          fmt3(d.polveri_filtro),
          fmt3(d.conc_polveri),
          fmtSottoSoglia(d.silice_filtro_valore, d.silice_filtro_raw, d.silice_sotto_soglia, 3),
          fmtSottoSoglia(d.conc_silice, undefined, d.conc_silice_sotto_soglia, 3),
          (m.note as string) ?? '',
        ]
      },
    },
  },
}

export async function exportPdfPolveri(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configPolveri, fotoCtx)
}
