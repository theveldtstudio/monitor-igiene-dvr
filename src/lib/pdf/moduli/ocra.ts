import type { Misura } from '../../../types'
import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'
import { fmtNum } from './_helpers'

const fmt1 = fmtNum(1)
const fmt2 = fmtNum(2)

const fasciaText = (m: Misura): string => {
  const d = m.dati as Record<string, unknown>
  if (typeof d.fascia_label === 'string' && d.fascia_label.length > 0) {
    return d.fascia_label
  }
  if (d.fascia_rischio !== undefined && d.fascia_rischio !== null) {
    return String(d.fascia_rischio)
  }
  return ''
}

const configOcra: PdfModuloConfig = {
  moduloId: 'OCRA',
  titoloHeader: 'FOGLIO DI CAMPAGNA — MOVIMENTI RIPETITIVI ARTI SUPERIORI (OCRA)',
  tabella: {
    head: [['#', 'Compito', 'Arto', 'Min.', 'Pt. intrinseco', '× Mol.', 'Pt. reale', 'Fascia', 'Note']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 40 },
      8: {},
    },
    mapMisuraToRow: (m, idx) => {
      const d = m.dati as Record<string, unknown>
      return [
        String(idx + 1),
        (d.denominazione as string) ?? '',
        (d.arto_valutato as string) ?? '',
        typeof d.minuti_compito === 'number' ? String(Math.round(d.minuti_compito)) : '',
        fmt1(d.punteggio_intrinseco),
        fmt2(d.moltiplicatore_durata),
        fmt1(d.punteggio_reale),
        fasciaText(m),
        (m.note as string) ?? '',
      ]
    },
  },
}

export async function exportPdfOcra(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<Blob> {
  return exportPdfModulo(ctx, ctx.misure, configOcra, fotoCtx)
}
