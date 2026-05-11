import JSZip from 'jszip'
import type { Cantiere, Campagna, Misura, RisorsaCantiere } from '../types'
import type { ExportContext } from '../data/exportSchemas'
import { getExportSchema } from '../data/exportSchemas'
import type { PdfFotoContext } from './pdf'
import {
  exportPdfRumore, exportPdfWbv, exportPdfHav,
  exportPdfMicroclima, exportPdfCem, exportPdfRoa,
  exportPdfPolveri, exportPdfCarbonio, exportPdfGas,
  exportPdfIpa, exportPdfAmianto,
  exportPdfBiologicoSas, exportPdfAcqua,
  exportPdfMmc, exportPdfOwas, exportPdfOcra,
  getPdfModuloLabel,
  buildPdfFilename,
} from './pdf'
import { exportFromTemplate, sanitizeFilename } from './exportExcel'
import type { FotoSheetContext } from './exportFotoSheet'
import { saveBlob } from './saveBlob'

export interface CampagnaCompleta {
  campagna: Campagna
  misure: Misura[]
  risorse: RisorsaCantiere[]
  fotoCtx?: PdfFotoContext
}

export interface ExportCantiereParams {
  cantiere: Cantiere
  /** moduloId → campagne complete (misure, risorse, fotoCtx pre-fetched) */
  campagnePerModulo: Map<string, CampagnaCompleta[]>
  /** Caller builds ExportContext (needs tecnici + strumento pre-fetched) */
  buildExportContext: (campagna: Campagna, misure: Misura[], risorse: RisorsaCantiere[]) => ExportContext
  onProgress?: (progress: ExportProgress) => void
  signal?: AbortSignal
}

export interface ExportProgress {
  fileCorrente: number
  totaleFile: number
  moduloCorrente: string
  campagnaCorrente: string
  fase: 'xlsx' | 'pdf'
}

const PDF_DISPATCHER: Record<string, (ctx: ExportContext, fotoCtx?: PdfFotoContext) => Promise<Blob>> = {
  'rumore': exportPdfRumore,
  'vibrazioni-wbv': exportPdfWbv,
  'vibrazioni-hav': exportPdfHav,
  'microclima': exportPdfMicroclima,
  'cem': exportPdfCem,
  'roa': exportPdfRoa,
  'polveri': exportPdfPolveri,
  'carbonio-elementare': exportPdfCarbonio,
  'gas': exportPdfGas,
  'ipa': exportPdfIpa,
  'amianto': exportPdfAmianto,
  'biologico-sas': exportPdfBiologicoSas,
  'acqua': exportPdfAcqua,
  'mmc': exportPdfMmc,
  'owas': exportPdfOwas,
  'ocra': exportPdfOcra,
}

export async function exportCantiereZip(params: ExportCantiereParams): Promise<void> {
  const { cantiere, campagnePerModulo, buildExportContext, onProgress, signal } = params

  const checkAborted = () => {
    if (signal?.aborted) {
      throw new DOMException('Esportazione annullata', 'AbortError')
    }
  }

  const zip = new JSZip()

  let totaleFile = 0
  for (const campagne of campagnePerModulo.values()) {
    totaleFile += campagne.length * 2
  }

  let fileCorrente = 0

  for (const [moduloId, campagne] of campagnePerModulo) {
    if (campagne.length === 0) continue

    const schema = getExportSchema(moduloId)
    const pdfFn = PDF_DISPATCHER[moduloId]
    if (!schema && !pdfFn) continue

    const folderName = getPdfModuloLabel(moduloId).replace(/[^A-Za-z0-9_-]/g, '_')
    const folder = zip.folder(folderName)
    if (!folder) continue

    for (const campagnaCompleta of campagne) {
      checkAborted()

      const { campagna, misure, risorse, fotoCtx } = campagnaCompleta
      const campagnaLabel = new Date(campagna.data_ora).toISOString().slice(0, 10)
      const ctx = buildExportContext(campagna, misure, risorse)

      // === XLSX ===
      if (schema) {
        fileCorrente++
        onProgress?.({ fileCorrente, totaleFile, moduloCorrente: moduloId, campagnaCorrente: campagnaLabel, fase: 'xlsx' })
        checkAborted()

        const fotoSheetCtx: FotoSheetContext | undefined = fotoCtx
          ? {
              misure,
              fotoPerMisura: fotoCtx.fotoPerMisura,
              risorse,
            }
          : undefined

        const xlsxBlob = await exportFromTemplate(
          schema.templateUrl,
          (wb) => schema.applyData(ctx, wb),
          fotoSheetCtx,
        )
        folder.file(schema.buildFilename(ctx), xlsxBlob)
      }

      // === PDF ===
      if (pdfFn) {
        fileCorrente++
        onProgress?.({ fileCorrente, totaleFile, moduloCorrente: moduloId, campagnaCorrente: campagnaLabel, fase: 'pdf' })
        checkAborted()

        const pdfBlob = await pdfFn(ctx, fotoCtx)
        folder.file(buildPdfFilename(ctx, getPdfModuloLabel(moduloId)), pdfBlob)
      }
    }
  }

  checkAborted()

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipFilename = `Cantiere_${sanitizeFilename(cantiere.nome)}_${new Date().toISOString().slice(0, 10)}.zip`
  saveBlob(zipBlob, zipFilename)
}
