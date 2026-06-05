import ExcelJS from 'exceljs'
import { addFotoSheet, type FotoSheetContext } from './exportFotoSheet'
import { cloneSheet } from './exportPaginazione'
import type { ExportSchema, ExportContext } from '../data/exportSchemas'

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

/**
 * Sanitizza un nome foglio Excel: rimuove i caratteri vietati (\ / ? * [ ] :),
 * tronca a 31 char (limite Excel) e garantisce non-vuoto.
 */
function sanitizeSheetName(s: string): string {
  const cleaned = s.replace(/[\\/?*[\]:]/g, '-').trim()
  const sliced = cleaned.slice(0, 31)
  return sliced || 'Foglio'
}

/**
 * Genera un nome foglio univoco entro `used`, troncando a 31 char e
 * appendendo un contatore se collide.
 */
function uniqueSheetName(used: Set<string>, base: string): string {
  const name = sanitizeSheetName(base)
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  let i = 2
  let candidate: string
  do {
    const suffix = ` (${i})`
    candidate = sanitizeSheetName(base.slice(0, 31 - suffix.length)) + suffix
    i++
  } while (used.has(candidate))
  used.add(candidate)
  return candidate
}

/**
 * Export aggregato multi-campagna: un unico file Excel con UN foglio per
 * ogni campagna selezionata. Ogni foglio è prodotto dallo schema esistente
 * (`schema.applyData`) su una copia pristina del template, poi copiato nel
 * workbook master via `cloneSheet` (che funziona cross-workbook).
 *
 * Riusa al 100% i layout/formule/merge dei template ufficiali — nessuna
 * colonna "Campagna" aggiunta (la distinzione è il foglio stesso).
 *
 * Foto escluse per design.
 *
 * @param schema    schema export del modulo (tutte le campagne sono dello stesso modulo)
 * @param contexts  un ExportContext per campagna, in ordine di visualizzazione
 * @param filename  nome file di output
 */
export async function exportMultiCampagne(
  schema: ExportSchema,
  contexts: ExportContext[],
  filename: string,
): Promise<void> {
  const master = new ExcelJS.Workbook()
  const usedNames = new Set<string>()

  for (let ci = 0; ci < contexts.length; ci++) {
    const ctx = contexts[ci]

    // Riempi una copia pristina del template tramite lo schema esistente.
    const wb = await loadTemplate(schema.templateUrl)
    await schema.applyData(ctx, wb)

    // Etichetta foglio = data campagna; prefisso indice per ordinamento+univocità.
    const dateLabel = ctx.campagna.data_ora
      ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT')
      : `Campagna ${ci + 1}`

    // applyData può generare più fogli (overflow >32 misure): li copiamo tutti.
    const srcSheets = wb.worksheets
    srcSheets.forEach((src, si) => {
      const base = srcSheets.length > 1
        ? `${ci + 1} ${dateLabel} p${si + 1}`
        : `${ci + 1} ${dateLabel}`
      cloneSheet(master, src, uniqueSheetName(usedNames, base))
    })
  }

  const buffer = await master.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
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
