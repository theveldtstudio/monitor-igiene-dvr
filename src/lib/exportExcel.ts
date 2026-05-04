import ExcelJS from 'exceljs'

/**
 * Carica un template .xlsx, applica una funzione di "fill" e scarica il file modificato.
 *
 * @param templateUrl - URL relativo del template (es. '/templates/rumore.xlsx')
 * @param fillWorkbook - funzione che riceve il workbook caricato e modifica le celle
 * @param outputFilename - nome del file da scaricare (es. 'A1_Lotto4_Rumore_2026-04-25.xlsx')
 */
export async function exportFromTemplate(
  templateUrl: string,
  fillWorkbook: (workbook: ExcelJS.Workbook) => void | Promise<void>,
  outputFilename: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  if (templateUrl) {
    const response = await fetch(templateUrl)
    if (!response.ok) {
      throw new Error(`Template non trovato: ${templateUrl}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)
  }

  await fillWorkbook(workbook)

  const outBuffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
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
