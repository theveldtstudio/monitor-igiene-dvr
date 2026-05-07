import type { ExportContext } from '../../../data/exportSchemas'
import type { Misura } from '../../../types'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { fmtNum, fmtSottoSoglia } from './_helpers'

const fmt0 = fmtNum(0)

const hasLabData = (m: Misura): boolean => {
  const d = m.dati as Record<string, unknown>
  return typeof d.conta_22 === 'number'
      || typeof d.conta_36 === 'number'
      || typeof d.muffe_lieviti === 'number'
      || (typeof d.conta_22_raw === 'string' && d.conta_22_raw.length > 0)
      || (typeof d.conta_36_raw === 'string' && d.conta_36_raw.length > 0)
      || (typeof d.muffe_lieviti_raw === 'string' && d.muffe_lieviti_raw.length > 0)
}

const macchineJoin = (m: Misura): string => {
  const d = m.dati as Record<string, unknown>
  const arr = d.macchine_nomi
  if (Array.isArray(arr)) return arr.filter(Boolean).join(', ')
  return ''
}

const configBiologicoSas: PdfModuloConfig = {
  moduloId: 'Biologico-SAS',
  titoloHeader: 'FOGLIO DI CAMPAGNA — BIOLOGICO (SAS)',
  tabella: {
    variante: 'adattiva',
    hasLabData,
    cantiere: {
      head: [['#', 'Codice', 'Postazione', 'Fase', 'Macchine', 'T. prel.', 'Vol. (L)', 'Note']],
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 38 },
        3: { cellWidth: 32 },
        4: { cellWidth: 50 },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 20, halign: 'right' },
        7: {},
      },
      mapMisuraToRow: (m, idx) => {
        const d = m.dati as Record<string, unknown>
        return [
          String(idx + 1),
          (d.codice_filtro as string) ?? '',
          (d.postazione_nome as string) ?? '',
          (d.fase_nome as string) ?? '',
          macchineJoin(m),
          (d.tempo_prelievo as string) ?? '',
          fmt0(d.volume_aspirato),
          (m.note as string) ?? '',
        ]
      },
    },
    completa: {
      head: [['#', 'Codice', 'Postazione', 'Fase', 'Macchine', 'T. prel.', 'Vol. (L)', '22°C (UFC/m³)', '36°C (UFC/m³)', 'Muffe+Liev. (UFC/m³)', 'Note']],
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 28 },
        3: { cellWidth: 24 },
        4: { cellWidth: 32 },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 16, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' },
        8: { cellWidth: 22, halign: 'right' },
        9: { cellWidth: 28, halign: 'right' },
        10: {},
      },
      mapMisuraToRow: (m, idx) => {
        const d = m.dati as Record<string, unknown>
        return [
          String(idx + 1),
          (d.codice_filtro as string) ?? '',
          (d.postazione_nome as string) ?? '',
          (d.fase_nome as string) ?? '',
          macchineJoin(m),
          (d.tempo_prelievo as string) ?? '',
          fmt0(d.volume_aspirato),
          fmtSottoSoglia(d.conta_22, d.conta_22_raw, d.conta_22_sotto_soglia, 0),
          fmtSottoSoglia(d.conta_36, d.conta_36_raw, d.conta_36_sotto_soglia, 0),
          fmtSottoSoglia(d.muffe_lieviti, d.muffe_lieviti_raw, d.muffe_lieviti_sotto_soglia, 0),
          (m.note as string) ?? '',
        ]
      },
    },
  },
}

export async function exportPdfBiologicoSas(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<void> {
  return exportPdfModulo(ctx, ctx.misure, configBiologicoSas, fotoCtx)
}
