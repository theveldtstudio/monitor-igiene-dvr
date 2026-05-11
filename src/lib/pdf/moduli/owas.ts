import type { ExportContext } from '../../../data/exportSchemas'
import { exportPdfModulo } from '../core'
import type { PdfModuloConfig, PdfFotoContext } from '../core'

const fmtDurataOwas = (v: unknown): string => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return ''
  if (v < 60) return `${Math.round(v)}'`
  const ore = Math.floor(v / 60)
  const min = Math.round(v % 60)
  return `${ore}h${min.toString().padStart(2, '0')}`
}

const fmtCode = (v: unknown): string => (typeof v === 'number' ? String(v) : '')

const configOwas: PdfModuloConfig = {
  moduloId: 'OWAS',
  titoloHeader: 'FOGLIO DI CAMPAGNA — POSTURE INCONGRUE (OWAS)',
  tabella: {
    head: [['#', 'Mansione', 'Attività', 'Durata', 'Schiena', 'Braccia', 'Gambe', 'Carico', 'Classe AC', 'Note']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 50 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 24, halign: 'center' },
      9: {},
    },
    mapMisuraToRow: (m, idx) => {
      const d = m.dati as Record<string, unknown>
      return [
        String(idx + 1),
        (d.mansione as string) ?? '',
        (d.attivita as string) ?? '',
        fmtDurataOwas(d.durata),
        fmtCode(d.schiena),
        fmtCode(d.braccia),
        fmtCode(d.gambe),
        fmtCode(d.carico),
        fmtCode(d.classe),
        (m.note as string) ?? '',
      ]
    },
  },
}

export async function exportPdfOwas(
  ctx: ExportContext,
  fotoCtx?: PdfFotoContext,
): Promise<Blob> {
  return exportPdfModulo(ctx, ctx.misure, configOwas, fotoCtx)
}
