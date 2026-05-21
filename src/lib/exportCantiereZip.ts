import JSZip from 'jszip'
import type { Cantiere, Campagna, Misura, RisorsaCantiere, FotoMisura } from '../types'
import type { ExportContext } from '../data/exportSchemas'
import { getExportSchema } from '../data/exportSchemas'
import { buildWorkbookBlob, sanitizeFilename } from './exportExcel'
import type { FotoSheetContext } from './exportFotoSheet'
import { saveBlob } from './saveBlob'

export interface CampagnaCompleta {
  campagna: Campagna
  misure: Misura[]
  risorse: RisorsaCantiere[]
  fotoPerMisura?: Map<string, FotoMisura[]>
}

export interface ExportCantiereParams {
  cantiere: Cantiere
  /** moduloId → campagne complete (misure, risorse, fotoPerMisura pre-fetched) */
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
  fase: 'xlsx'
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
    totaleFile += campagne.length
  }

  let fileCorrente = 0

  for (const [moduloId, campagne] of campagnePerModulo) {
    if (campagne.length === 0) continue

    const schema = getExportSchema(moduloId)
    if (!schema) continue

    const folderName = moduloId.replace(/[^A-Za-z0-9_-]/g, '_')
    const folder = zip.folder(folderName)
    if (!folder) continue

    for (const campagnaCompleta of campagne) {
      checkAborted()

      const { campagna, misure, risorse, fotoPerMisura } = campagnaCompleta
      const campagnaLabel = new Date(campagna.data_ora).toISOString().slice(0, 10)
      const ctx = buildExportContext(campagna, misure, risorse)

      fileCorrente++
      onProgress?.({ fileCorrente, totaleFile, moduloCorrente: moduloId, campagnaCorrente: campagnaLabel, fase: 'xlsx' })
      checkAborted()

      const fotoSheetCtx: FotoSheetContext | undefined = fotoPerMisura
        ? { misure, fotoPerMisura, risorse }
        : undefined

      const xlsxBlob = await buildWorkbookBlob(
        schema.templateUrl,
        (wb) => schema.applyData(ctx, wb),
        fotoSheetCtx,
      )
      folder.file(schema.buildFilename(ctx), xlsxBlob)
    }
  }

  checkAborted()

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipFilename = `Cantiere_${sanitizeFilename(cantiere.nome)}_${new Date().toISOString().slice(0, 10)}.zip`
  saveBlob(zipBlob, zipFilename)
}
