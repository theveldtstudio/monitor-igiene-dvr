import type ExcelJS from 'exceljs'
import type { Misura, FotoMisura, RisorsaCantiere } from '../types'
import { supabase } from './supabase'

export interface FotoSheetContext {
  misure: Misura[]
  fotoPerMisura: Map<string, FotoMisura[]>
  risorse: RisorsaCantiere[]
}

type FotoWithCreatedAt = FotoMisura & { created_at?: string | null }

async function downloadAndCompress(pathLocale: string): Promise<ArrayBuffer | null> {
  try {
    const { data: signedData, error: signError } = await supabase.storage
      .from('misure-foto').createSignedUrl(pathLocale, 300)
    if (signError || !signedData?.signedUrl) return null
    const resp = await fetch(signedData.signedUrl)
    if (!resp.ok) return null
    const blob = await resp.blob()
    const img = await createImageBitmap(blob)
    const ratio = 800 / Math.max(img.width, img.height)
    const w = ratio < 1 ? Math.round(img.width * ratio) : img.width
    const h = ratio < 1 ? Math.round(img.height * ratio) : img.height
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    const compressedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 })
    return await compressedBlob.arrayBuffer()
  } catch (error) {
    console.warn('[exportFotoSheet] foto non scaricabile:', pathLocale, error)
    return null
  }
}

function readStringField(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim().length > 0) return v.trim()
  }
  return null
}

function getSecondoCampoHeader(misura: Misura, risorse: RisorsaCantiere[]): string {
  const dati = (misura.dati ?? {}) as Record<string, unknown>

  const direct = readStringField(dati, [
    'mansione', 'mansione_descrizione',
    'attivita', 'attivita_descrizione',
    'descrizione_mansione', 'descrizione',
    'descrizioneMansione', 'descrizioneAttivita',
  ])
  if (direct) return direct

  const faseId = readStringField(dati, ['fase_id', 'faseId', 'fase_lavorativa_id'])
  if (faseId) {
    const fase = risorse.find((r) => r.id === faseId && r.tipo === 'fase')
    if (fase?.valore) return fase.valore
  }

  const macchineIds = Array.isArray(dati.macchine_ids)
    ? (dati.macchine_ids as string[])
    : Array.isArray(dati.macchineIds)
      ? (dati.macchineIds as string[])
      : []
  const singolaMacchinaId = readStringField(dati, ['macchina_id', 'macchinaId'])
  const candidatoId = macchineIds[0] ?? singolaMacchinaId
  if (candidatoId) {
    const macchina = risorse.find((r) => r.id === candidatoId && r.tipo === 'macchina')
    if (macchina?.valore) return macchina.valore
  }

  return ''
}

function buildMisuraHeader(misura: Misura, risorse: RisorsaCantiere[]): string {
  const dati = (misura.dati ?? {}) as Record<string, unknown>

  let postazione = ''
  if (typeof dati.postazione_nome === 'string' && dati.postazione_nome) {
    postazione = dati.postazione_nome
  } else if (typeof dati.postazione_id === 'string' && dati.postazione_id) {
    const risorsa = risorse.find((r) => r.id === dati.postazione_id)
    if (risorsa) postazione = risorsa.valore
  }

  const secondoCampo = getSecondoCampoHeader(misura, risorse)
  const parti = [`Misura #${misura.numero}`]
  if (postazione) parti.push(postazione)
  if (secondoCampo) parti.push(secondoCampo)
  return parti.join(' — ')
}

export async function addFotoSheet(
  workbook: ExcelJS.Workbook,
  ctx: FotoSheetContext,
): Promise<void> {
  const { misure, fotoPerMisura, risorse } = ctx

  const misureConFoto = misure.filter((m) => (fotoPerMisura.get(m.id) ?? []).length > 0)
  if (misureConFoto.length === 0) return

  const ws = workbook.addWorksheet('Foto')

  // Col A e C: thin spacer; Col B e D: foto (~454px @ 96dpi)
  ws.getColumn(1).width = 2
  ws.getColumn(2).width = 64
  ws.getColumn(3).width = 2
  ws.getColumn(4).width = 64

  let currentRow = 0 // 0-indexed per addImage; ws.getRow usa 1-indexed (currentRow+1)

  for (let mi = 0; mi < misureConFoto.length; mi++) {
    const misura = misureConFoto[mi]
    const fotos = (fotoPerMisura.get(misura.id) ?? [])
      .slice()
      .sort((a, b) => {
        const ta = (a as FotoWithCreatedAt).created_at ?? ''
        const tb = (b as FotoWithCreatedAt).created_at ?? ''
        return ta.localeCompare(tb)
      })

    // Header misura
    const headerRow = ws.getRow(currentRow + 1)
    headerRow.height = 18
    const headerCell = headerRow.getCell(1)
    headerCell.value = buildMisuraHeader(misura, risorse)
    headerCell.font = { bold: true, size: 11 }
    headerCell.alignment = { vertical: 'middle', horizontal: 'left' }
    headerRow.commit()
    currentRow++

    // Righe foto (2 per riga)
    for (let i = 0; i < fotos.length; i += 2) {
      const fotoRow = ws.getRow(currentRow + 1)
      fotoRow.height = 256 // ~340px a ~1.33px/pt
      fotoRow.getCell(1).value = null // forza materializzazione della riga

      // Foto sinistra → col B (tl.col=1)
      const buf1 = await downloadAndCompress(fotos[i].path_locale)
      if (buf1) {
        const id1 = workbook.addImage({ buffer: buf1, extension: 'jpeg' })
        ws.addImage(id1, {
          tl: { col: 1, row: currentRow },
          ext: { width: 454, height: 340 },
        })
      } else {
        fotoRow.getCell(2).value = '[foto non disponibile]'
      }

      // Foto destra → col D (tl.col=3)
      if (i + 1 < fotos.length) {
        const buf2 = await downloadAndCompress(fotos[i + 1].path_locale)
        if (buf2) {
          const id2 = workbook.addImage({ buffer: buf2, extension: 'jpeg' })
          ws.addImage(id2, {
            tl: { col: 3, row: currentRow },
            ext: { width: 454, height: 340 },
          })
        } else {
          fotoRow.getCell(4).value = '[foto non disponibile]'
        }
      }

      fotoRow.commit()
      currentRow++
    }

    // Riga separatrice tra misure (non dopo l'ultima)
    if (mi < misureConFoto.length - 1) {
      const sepRow = ws.getRow(currentRow + 1)
      sepRow.height = 80
      sepRow.getCell(1).value = null
      sepRow.commit()
      currentRow++
    }
  }
}
