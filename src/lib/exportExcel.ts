import ExcelJS from 'exceljs'
import { addFotoSheet, type FotoSheetContext } from './exportFotoSheet'

export type { FotoSheetContext }

async function loadTemplate(templateUrl: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  if (templateUrl) {
    const response = await fetch(templateUrl)
    if (!response.ok) {
      throw new Error(`Template non trovato: ${templateUrl}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)
  }
  return workbook
}

export async function buildWorkbookBlob(
  templateUrl: string,
  fillWorkbook: (wb: ExcelJS.Workbook) => void | Promise<void>,
  fotoCtx?: FotoSheetContext,
): Promise<Blob> {
  const workbook = await loadTemplate(templateUrl)
  await fillWorkbook(workbook)
  if (fotoCtx) {
    await addFotoSheet(workbook, fotoCtx)
  }
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export async function exportFromTemplate(
  templateUrl: string,
  fillWorkbook: (workbook: ExcelJS.Workbook) => void | Promise<void>,
  outputFilename: string,
  fotoCtx?: FotoSheetContext,
): Promise<void> {
  const blob = await buildWorkbookBlob(templateUrl, fillWorkbook, fotoCtx)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = outputFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

/**
 * Converte un valore (number, string, undefined, null) in number | null.
 * Gestisce stringhe italiane con la virgola come separatore decimale.
 *
 * Esempi:
 *   toNumber(30)        → 30
 *   toNumber("30")      → 30
 *   toNumber("30,5")    → 30.5
 *   toNumber("abc")     → null
 *   toNumber(undefined) → null
 *   toNumber(null)      → null
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return null
    const normalized = trimmed.replace(',', '.')
    const n = Number(normalized)
    return isFinite(n) ? n : null
  }
  return null
}
