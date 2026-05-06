import type ExcelJS from 'exceljs'
import type { Misura, Cantiere, Campagna, Tecnico, Strumento, RisorsaCantiere } from '../types'
import { toNumber } from '../lib/exportExcel'

/**
 * Parsa una stringa di durata in vari formati e ritorna i minuti come number.
 * Formati supportati:
 *   "30"       → 30 minuti
 *   "30,5"     → 30.5 minuti
 *   "00:30:00" → 30 minuti (hh:mm:ss)
 *   "0:30"     → 30 minuti (h:mm)
 *   30          → 30 minuti (number diretto)
 *
 * Returns null se non parsabile.
 */
function parseDurataMinuti(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed === '') return null

  // Caso hh:mm:ss o h:mm:ss
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => p.trim())
    if (parts.length === 2) {
      // h:mm
      const h = Number(parts[0])
      const m = Number(parts[1])
      if (isFinite(h) && isFinite(m)) return h * 60 + m
      return null
    }
    if (parts.length === 3) {
      // h:mm:ss
      const h = Number(parts[0])
      const m = Number(parts[1])
      const s = Number(parts[2])
      if (isFinite(h) && isFinite(m) && isFinite(s)) return h * 60 + m + s / 60
      return null
    }
    return null
  }

  // Caso numero semplice (con virgola italiana)
  const normalized = trimmed.replace(',', '.')
  const n = Number(normalized)
  return isFinite(n) ? n : null
}

export interface ExportContext {
  cantiere: Cantiere
  campagna: Campagna
  misure: Misura[]
  tecnici: Tecnico[]
  strumento: Strumento | null
  risorse: RisorsaCantiere[]
}

export interface ExportSchema {
  templateUrl: string
  buildFilename: (ctx: ExportContext) => string
  applyData: (ctx: ExportContext, workbook: import('exceljs').Workbook) => void
}

/**
 * Schema export per Rumore.
 *
 * STRUTTURA TEMPLATE (Foglio_di_campagna_rumore1.xlsx):
 * - 4 blocchi da 8 misure ognuno = max 32 misure per file
 * - Blocco 1: header r1,  dati r4-11  (misure 1-8)
 * - Blocco 2: header r16, dati r19-26 (misure 9-16)
 * - Blocco 3: header r31, dati r34-41 (misure 17-24)
 * - Blocco 4: header r46, dati r49-56 (misure 25-32)
 *
 * Tabella per ogni misura (riga R):
 *   A = numero misura (già nel template)
 *   B = durata (sec)
 *   C = postazione
 *   D = fase
 *   E = macchine (concatenate con virgola)
 *   F = Leq dBA
 *   G = Leq dBC
 *   H = Lpeak dBC
 *   I = note
 */
export const exportSchemaRumore: ExportSchema = {
  templateUrl: '/templates/rumore.xlsx',

  buildFilename: (ctx) => {
    const cantiereSafe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${cantiereSafe}_Rumore_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Rumore")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4  },
      { headerRow: 16, dataStartRow: 19 },
      { headerRow: 31, dataStartRow: 34 },
      { headerRow: 46, dataStartRow: 49 },
    ]

    const dataFormatted = ctx.campagna.data_ora
      ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT')
      : ''
    const cantiereNome = ctx.cantiere.nome

    const committente = ctx.cantiere.committente ?? ''
    blocchi.forEach((b) => {
      // B{headerRow} = committente (subito dopo la label "Impresa:" in A{headerRow})
      const cellaCommittente = ws.getCell(`B${b.headerRow}`)
      cellaCommittente.value = committente || null
      cellaCommittente.alignment = { horizontal: 'center', vertical: 'middle' }

      // C{headerRow} = pulizia (in passato scrivevamo qui la data per errore)
      ws.getCell(`C${b.headerRow}`).value = null

      // D{headerRow} = "Data: gg/mm/aaaa" — etichetta + valore inline
      // (il template aveva solo "Data:" come label senza una cella valore disponibile)
      const cellaData = ws.getCell(`D${b.headerRow}`)
      cellaData.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      cellaData.alignment = { horizontal: 'center', vertical: 'middle' }

      // F{headerRow} = cantiere
      const cellaCantiere = ws.getCell(`F${b.headerRow}`)
      cellaCantiere.value = cantiereNome
      cellaCantiere.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // Larghezze colonne ottimali per header (Impresa + committente)
    ws.getColumn('A').width = 12
    ws.getColumn('B').width = 28

    ctx.misure.forEach((m, idx) => {
      const blockIdx = Math.floor(idx / 8)
      if (blockIdx >= blocchi.length) {
        console.warn(`Misura ${idx + 1}: superato il numero massimo di 32 misure per file. Ignorata.`)
        return
      }
      const localRow = idx % 8
      const r = blocchi[blockIdx].dataStartRow + localRow

      const dati = m.dati as Record<string, unknown>
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      const durataMin = parseDurataMinuti(dati.durata)
      // Excel rappresenta gli orari come frazione di giorno (1 = 24h, 1/1440 = 1 min).
      // Applichiamo runtime il format hh:mm:ss alla cella per garantire la visualizzazione corretta
      // anche se il template non lo specifica.
      const cellaDurata = ws.getCell(`B${r}`)
      cellaDurata.value = durataMin !== null ? durataMin / 1440 : null
      cellaDurata.numFmt = 'hh:mm:ss'
      cellaDurata.alignment = { horizontal: 'center', vertical: 'middle' }
      ws.getCell(`C${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`E${r}`).value = macchine.length > 0 ? macchine.join(', ') : null
      ws.getCell(`F${r}`).value = toNumber(dati.leq_dba)
      ws.getCell(`G${r}`).value = toNumber(dati.leq_dbc)
      ws.getCell(`H${r}`).value = toNumber(dati.lpeak_dbc)

      const cellaNote = ws.getCell(`I${r}`)
      cellaNote.value = m.note ?? null
      cellaNote.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })

    // Nel template:
    //   A{row}:B{row} è merged → scriviamo "Tecnico" sul master A{row}
    //   C{row}:D{row} è merged → scriviamo i nomi sul master C{row}
    const nomiTecnici = ctx.tecnici.length > 0 ? ctx.tecnici.map((t) => t.nome).join(', ') : ''
    const tecnicoRows = [13, 28, 43, 58]
    tecnicoRows.forEach((row) => {
      ws.getCell(`A${row}`).value = 'Tecnico'
      if (nomiTecnici) {
        ws.getCell(`C${row}`).value = nomiTecnici
      }
    })
  },
}

/**
 * Schema export WBV (vibrazioni corpo intero).
 * Template: public/templates/wbv.xlsx, foglio "CI".
 *
 * Layout template (post-modifica con header Rumore-style):
 * - Riga 1: header (A=Impresa:, B=committente, C=data, D=Data:, E=CANTIERE/AZIENDA, F=cantiere, P=Progressiva:, Q=Pag: 1)
 * - Riga 2: vuota separatrice
 * - Riga 3: intestazioni colonne (Rilev n°, Data, Durata, ecc.)
 * - Riga 4: sotto-header X/Y/Z
 * - Riga 5+: dati misure
 *
 * cellMap dati misure (a partire da r5):
 *   A = numero misura (già nel template)
 *   B = data campagna
 *   C = durata
 *   D = macchina_nome
 *   E = targa
 *   F = posizione_operatore
 *   G = trazione
 *   H = utensile
 *   I = regime
 *   J = fase_nome
 *   K = aw_x
 *   L = aw_y
 *   M = aw_z
 *   N = (formula A(w)max nel template, non sovrascriviamo)
 *   O = (formula asse, non sovrascriviamo)
 *   P = note
 *   Q = temperatura
 */
export const exportSchemaWbv: ExportSchema = {
  templateUrl: '/templates/wbv.xlsx',

  buildFilename: (ctx) => {
    const cantiereSafe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${cantiereSafe}_WBV_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('CI')
    if (!ws) throw new Error("Foglio 'CI' non trovato nel template WBV")

    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome

    // === Header riga 1 ===
    const cellaCommittente = ws.getCell('B1')
    cellaCommittente.value = committente || null
    cellaCommittente.alignment = { horizontal: 'center', vertical: 'middle' }

    ws.getCell('C1').value = null
    const cellaData = ws.getCell('D1')
    cellaData.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
    cellaData.alignment = { horizontal: 'center', vertical: 'middle' }

    const cellaCantiere = ws.getCell('F1')
    cellaCantiere.value = cantiereNome
    cellaCantiere.alignment = { horizontal: 'center', vertical: 'middle' }

    ws.getColumn('A').width = 12
    ws.getColumn('B').width = 28

    // === Dati misure dalla riga 5 ===
    const DATA_START_ROW = 5
    ctx.misure.forEach((m, idx) => {
      const r = DATA_START_ROW + idx
      const dati = m.dati as Record<string, unknown>

      ws.getCell(`B${r}`).value = dataFormatted
      const durataMin = parseDurataMinuti(dati.durata)
      const cellaDurata = ws.getCell(`C${r}`)
      cellaDurata.value = durataMin !== null ? durataMin / 1440 : null
      cellaDurata.numFmt = 'hh:mm:ss'
      cellaDurata.alignment = { horizontal: 'center', vertical: 'middle' }

      ws.getCell(`D${r}`).value = (dati.macchina_nome as string | undefined) ?? null
      ws.getCell(`E${r}`).value = (dati.targa as string | undefined) ?? null
      ws.getCell(`F${r}`).value = (dati.posizione_operatore as string | undefined) ?? null
      ws.getCell(`G${r}`).value = (dati.trazione as string | undefined) ?? null
      ws.getCell(`H${r}`).value = (dati.utensile as string | undefined) ?? null
      ws.getCell(`I${r}`).value = (dati.regime as string | undefined) ?? null
      ws.getCell(`J${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`K${r}`).value = toNumber(dati.aw_x)
      ws.getCell(`L${r}`).value = toNumber(dati.aw_y)
      ws.getCell(`M${r}`).value = toNumber(dati.aw_z)
      // N e O = formule del template, non tocchiamo
      const cellaNote = ws.getCell(`P${r}`)
      cellaNote.value = m.note ?? null
      cellaNote.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      ws.getCell(`Q${r}`).value = (dati.temperatura as string | undefined) ?? null
    })
  },
}

/**
 * Schema export HAV (vibrazioni mano-braccio).
 * Template: public/templates/hav.xlsx, foglio "MB".
 *
 * Layout template (post-modifica con header Rumore-style):
 * - Riga 1: header (A=Impresa:, B=committente, C=data, D=Data:, E=CANTIERE/AZIENDA, F=cantiere, N=Progressiva:, O=Pag: 1)
 * - Riga 2: vuota
 * - Riga 3: intestazioni colonne
 * - Riga 4: sotto-header X/Y/Z
 * - Riga 5+: dati misure
 *
 * cellMap dati misure (a partire da r5):
 *   A = numero misura (già nel template)
 *   B = data campagna
 *   C = durata
 *   D = utensile
 *   E = matricola
 *   F = impugnatura (+ "altro: ..." se impugnatura === 'altro')
 *   G = alimentazione
 *   H = accessorio
 *   I = fase_nome
 *   J = aw_x
 *   K = aw_y
 *   L = aw_z
 *   M = (formula A(w)sum nel template, non sovrascriviamo)
 *   N = note
 *   O = temperatura
 */
export const exportSchemaHav: ExportSchema = {
  templateUrl: '/templates/hav.xlsx',

  buildFilename: (ctx) => {
    const cantiereSafe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${cantiereSafe}_HAV_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('MB')
    if (!ws) throw new Error("Foglio 'MB' non trovato nel template HAV")

    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome

    // === Header riga 1 ===
    const cellaCommittente = ws.getCell('B1')
    cellaCommittente.value = committente || null
    cellaCommittente.alignment = { horizontal: 'center', vertical: 'middle' }

    ws.getCell('C1').value = null
    const cellaData = ws.getCell('D1')
    cellaData.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
    cellaData.alignment = { horizontal: 'center', vertical: 'middle' }

    const cellaCantiere = ws.getCell('F1')
    cellaCantiere.value = cantiereNome
    cellaCantiere.alignment = { horizontal: 'center', vertical: 'middle' }

    ws.getColumn('A').width = 12
    ws.getColumn('B').width = 28

    // === Dati misure dalla riga 5 ===
    const DATA_START_ROW = 5
    ctx.misure.forEach((m, idx) => {
      const r = DATA_START_ROW + idx
      const dati = m.dati as Record<string, unknown>

      let impugnaturaText: string | null = null
      const imp = dati.impugnatura as string | undefined
      if (imp) {
        if (imp === 'altro' && dati.impugnatura_altro) {
          impugnaturaText = `altro: ${dati.impugnatura_altro}`
        } else {
          impugnaturaText = imp
        }
      }

      ws.getCell(`B${r}`).value = dataFormatted
      const durataMin = parseDurataMinuti(dati.durata)
      const cellaDurata = ws.getCell(`C${r}`)
      cellaDurata.value = durataMin !== null ? durataMin / 1440 : null
      cellaDurata.numFmt = 'hh:mm:ss'
      cellaDurata.alignment = { horizontal: 'center', vertical: 'middle' }

      ws.getCell(`D${r}`).value = (dati.utensile as string | undefined) ?? null
      ws.getCell(`E${r}`).value = (dati.matricola as string | undefined) ?? null
      ws.getCell(`F${r}`).value = impugnaturaText
      ws.getCell(`G${r}`).value = (dati.alimentazione as string | undefined) ?? null
      ws.getCell(`H${r}`).value = (dati.accessorio as string | undefined) ?? null
      ws.getCell(`I${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`J${r}`).value = toNumber(dati.aw_x)
      ws.getCell(`K${r}`).value = toNumber(dati.aw_y)
      ws.getCell(`L${r}`).value = toNumber(dati.aw_z)
      // M = formula A(w)sum, non tocchiamo
      const cellaNote = ws.getCell(`N${r}`)
      cellaNote.value = m.note ?? null
      cellaNote.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      ws.getCell(`O${r}`).value = (dati.temperatura as string | undefined) ?? null
    })
  },
}

/**
 * Schema export OWAS (Occupational Work Assessment System).
 * Template: public/templates/owas.xlsx, foglio "Foglio1".
 *
 * Layout template:
 * - Riga 1: A=Impresa:, B=committente, C=Data: gg/mm/aaaa, D=Cantiere:, E=cantiereNome (merged E1:H1)
 * - Righe 2-4: intestazioni colonne (statiche nel template)
 * - Righe 5-13: dati misure (max 9), colonna A numerazione fissa NON toccare
 * - Riga 16: A16:B16=label, C16:J16=nomiTecnici
 *
 * cellMap dati misure (a partire da r5):
 *   A = numerazione fissa nel template, non tocchiamo
 *   B = dati.mansione
 *   C = dati.attivita
 *   D = durata in frazione giorno (hh:mm:ss)
 *   E = dati.schiena (1-4)
 *   F = dati.braccia (1-3)
 *   G = dati.gambe (1-7)
 *   H = dati.carico (1-3)
 *   I = dati.classe (1-4)
 *   J = m.note
 */
export const exportSchemaOwas: ExportSchema = {
  templateUrl: '/templates/owas.xlsx',

  buildFilename: (ctx) => {
    const cantiereSafe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${cantiereSafe}_OWAS_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template OWAS")

    const dataFormatted = ctx.campagna.data_ora
      ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT')
      : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome

    // === Header riga 1 ===
    ws.getCell('B1').value = committente || null
    ws.getCell('C1').value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
    ws.getCell('E1').value = cantiereNome

    // === Dati misure righe 5-13 (max 9) ===
    const DATA_START_ROW = 5
    const MAX_MISURE = 9

    const misureOrdinate = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))

    if (misureOrdinate.length > MAX_MISURE) {
      console.warn('OWAS export: max 9 misure, troncate', misureOrdinate.length - MAX_MISURE, 'misure escluse')
    }

    misureOrdinate.slice(0, MAX_MISURE).forEach((m, i) => {
      const r = DATA_START_ROW + i
      const dati = (m.dati ?? {}) as Record<string, unknown>

      ws.getCell(`B${r}`).value = (dati.mansione as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.attivita as string | undefined) ?? null

      const durataMin = parseDurataMinuti(dati.durata)
      const cellaDurata = ws.getCell(`D${r}`)
      cellaDurata.value = durataMin !== null ? durataMin / 1440 : null
      cellaDurata.numFmt = 'hh:mm:ss'

      ws.getCell(`E${r}`).value = toNumber(dati.schiena)
      ws.getCell(`F${r}`).value = toNumber(dati.braccia)
      ws.getCell(`G${r}`).value = toNumber(dati.gambe)
      ws.getCell(`H${r}`).value = toNumber(dati.carico)
      ws.getCell(`I${r}`).value = toNumber(dati.classe)
      ws.getCell(`J${r}`).value = m.note ?? null
    })

    // === Footer riga 16 ===
    const nomiTecnici = ctx.tecnici.length > 0 ? ctx.tecnici.map((t) => t.nome).join(', ') : ''
    if (nomiTecnici) {
      ws.getCell('C16').value = nomiTecnici
    }
  },
}

function risolviNomiRisorsa(
  dati: Record<string, unknown>,
  risorseMap: Map<string, string>,
): { postazione: string; fase: string; macchine: string } {
  const postazioneNome = typeof dati.postazione_nome === 'string' && dati.postazione_nome.trim().length > 0
    ? dati.postazione_nome.trim()
    : null
  const postazioneId = typeof dati.postazione_id === 'string'
    ? dati.postazione_id
    : (typeof dati.postazioneId === 'string' ? dati.postazioneId : null)
  const postazione = postazioneNome ?? (postazioneId ? risorseMap.get(postazioneId) ?? '' : '')

  const faseNome = typeof dati.fase_nome === 'string' && dati.fase_nome.trim().length > 0
    ? dati.fase_nome.trim()
    : null
  const faseId = typeof dati.fase_id === 'string' ? dati.fase_id : null
  const fase = faseNome ?? (faseId ? risorseMap.get(faseId) ?? '' : '')

  let macchineList: string[] = []
  const macchineNomi = Array.isArray(dati.macchine_nomi) ? (dati.macchine_nomi as unknown[]) : null
  const macchineIds = Array.isArray(dati.macchine_ids) ? (dati.macchine_ids as unknown[]) : null
  if (macchineNomi && macchineNomi.length > 0) {
    macchineList = macchineNomi
      .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
      .map((n) => n.trim())
  } else if (macchineIds && macchineIds.length > 0) {
    macchineList = macchineIds
      .filter((id): id is string => typeof id === 'string')
      .map((id) => risorseMap.get(id) ?? '')
      .filter((n) => n.length > 0)
  }

  if (macchineList.length === 0) {
    const macchinaNome = typeof dati.macchina_nome === 'string' && dati.macchina_nome.trim().length > 0
      ? dati.macchina_nome.trim()
      : null
    const macchinaId = typeof dati.macchina_id === 'string' ? dati.macchina_id : null
    const single = macchinaNome ?? (macchinaId ? risorseMap.get(macchinaId) ?? '' : '')
    if (single.length > 0) macchineList = [single]
  }

  return { postazione, fase, macchine: macchineList.join('; ') }
}

function applyDataGenerico(
  ctx: ExportContext,
  workbook: ExcelJS.Workbook,
  moduloLabel: string,
  risorsePerCantiere: Map<string, string>,
): void {
  const sheet = workbook.addWorksheet('Misure')

  const cantiereNome = ctx.cantiere?.nome ?? ''
  const committente = ctx.cantiere?.committente ?? ''
  const dataCampagna = ctx.campagna?.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
  const statoCampagna = ctx.campagna?.stato ?? ''
  const tecniciStr = (ctx.tecnici ?? []).map((t) => `${t.nome} ${t.cognome}`).join(', ')
  const strumentoStr = ctx.strumento ? `${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})` : ''

  sheet.getCell('A1').value = `CANTIERE: ${cantiereNome}`
  sheet.mergeCells('A1:I1')
  sheet.getCell('A2').value = `COMMITTENTE: ${committente}`
  sheet.mergeCells('A2:I2')
  sheet.getCell('A3').value = `CAMPAGNA: ${moduloLabel} — ${dataCampagna} — ${statoCampagna}`
  sheet.mergeCells('A3:I3')
  sheet.getCell('A4').value = `TECNICO: ${tecniciStr || '—'} · STRUMENTO: ${strumentoStr || '—'}`
  sheet.mergeCells('A4:I4')

  ;(['A1', 'A2', 'A3', 'A4'] as const).forEach((addr) => {
    const cell = sheet.getCell(addr)
    cell.font = { bold: false, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })
  sheet.getCell('A1').font = { bold: true, size: 12 }
  sheet.getCell('A3').font = { bold: true, size: 11 }

  const headerRowIdx = 6
  const headers = ['#', 'Postazione', 'Fase', 'Macchine', 'Durata', 'Dati misura', 'Note']
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRowIdx, i + 1)
    cell.value = h
    cell.font = { bold: true, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
    }
  })

  const misure = ctx.misure ?? []
  misure.forEach((m, idx) => {
    const rowIdx = headerRowIdx + 1 + idx
    const dati = (m.dati ?? {}) as Record<string, unknown>

    const { postazione, fase, macchine } = risolviNomiRisorsa(dati, risorsePerCantiere)

    let durataStr = ''
    if (typeof dati.durata === 'string' || typeof dati.durata === 'number') {
      durataStr = String(dati.durata)
    } else if (typeof dati.durataMinuti === 'number') {
      const min = dati.durataMinuti
      const h = Math.floor(min / 60)
      const m2 = min % 60
      durataStr = `${h}h ${m2}m`
    }

    const escludi = new Set([
      'postazione_id', 'postazione_nome', 'postazioneId',
      'fase_id', 'fase_nome',
      'macchine_ids', 'macchine_nomi',
      'macchina_id', 'macchina_nome',
      'durata', 'durataMinuti',
    ])
    const datiSerializzati = Object.entries(dati)
      .filter(([k, v]) => !escludi.has(k) && v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('; ')

    sheet.getCell(rowIdx, 1).value = m.numero ?? idx + 1
    sheet.getCell(rowIdx, 2).value = postazione
    sheet.getCell(rowIdx, 3).value = fase
    sheet.getCell(rowIdx, 4).value = macchine
    sheet.getCell(rowIdx, 5).value = durataStr
    sheet.getCell(rowIdx, 6).value = datiSerializzati
    sheet.getCell(rowIdx, 7).value = m.note ?? ''
  })

  sheet.getColumn(1).width = 5
  sheet.getColumn(2).width = 20
  sheet.getColumn(3).width = 20
  sheet.getColumn(4).width = 25
  sheet.getColumn(5).width = 12
  sheet.getColumn(6).width = 60
  sheet.getColumn(7).width = 30
}

function buildSchemaGenerico(moduloId: string, moduloLabel: string): ExportSchema {
  return {
    templateUrl: '',
    buildFilename: (ctx) => {
      const cantiereSafe = (ctx.cantiere?.nome ?? 'cantiere').replace(/[^a-zA-Z0-9_-]/g, '_')
      const dataStr = ctx.campagna?.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
      return `${cantiereSafe}_${moduloId}_${dataStr}.xlsx`
    },
    applyData: (ctx, wb) => {
      const risorseMap = new Map<string, string>()
      for (const r of ctx.risorse ?? []) {
        risorseMap.set(r.id, r.valore)
      }
      applyDataGenerico(ctx, wb, moduloLabel, risorseMap)
    },
  }
}

// ─── Microclima ───────────────────────────────────────────────────────────────
// Template: public/templates/microclima.xlsx — 4 pagine × 8 misure = 32 max
// Colonne A-M: n°, postazione, fase, ambiente, Ta, Tg, Tnw, UR, Va, WBGT,
//   attività metabolica, vestiario, note
const exportSchemaMicroclima: ExportSchema = {
  templateUrl: '/templates/microclima.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_Microclima_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Microclima")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`F${b.footerRow}`).value = strumentoStr
    })

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`Microclima: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>

      ws.getCell(`B${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = (dati.ambiente as string | undefined) ?? null
      ws.getCell(`E${r}`).value = toNumber(dati.ta)
      ws.getCell(`F${r}`).value = toNumber(dati.tg)
      ws.getCell(`G${r}`).value = toNumber(dati.tnw)
      ws.getCell(`H${r}`).value = toNumber(dati.ur)
      ws.getCell(`I${r}`).value = toNumber(dati.va)
      ws.getCell(`J${r}`).value = toNumber(dati.wbgt)
      ws.getCell(`K${r}`).value = (dati.attivita_metabolica as string | undefined) ?? null
      ws.getCell(`L${r}`).value = (dati.vestiario as string | undefined) ?? null
      const n = ws.getCell(`M${r}`)
      n.value = m.note ?? null
      n.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
  },
}

// ─── CEM ─────────────────────────────────────────────────────────────────────
// Template: public/templates/cem.xlsx — 4 pagine × 8 misure = 32 max
// Colonne A-L: n°, postazione, fase, sorgente CEM, frequenza (val+unità),
//   distanza(m), E(V/m), H(A/m), B(µT), limite rif., indice esp.(%), note
const exportSchemaCem: ExportSchema = {
  templateUrl: '/templates/cem.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_CEM_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template CEM")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`F${b.footerRow}`).value = strumentoStr
    })

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`CEM: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>

      const freqVal = toNumber(dati.frequenza)
      const freqUnita = typeof dati.unita_frequenza === 'string' ? dati.unita_frequenza : ''
      const freqStr = freqVal !== null ? `${freqVal} ${freqUnita}`.trim() : (freqUnita || null)

      ws.getCell(`B${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = (dati.sorgente as string | undefined) ?? null
      ws.getCell(`E${r}`).value = freqStr
      ws.getCell(`F${r}`).value = toNumber(dati.distanza)
      ws.getCell(`G${r}`).value = toNumber(dati.campo_e)
      ws.getCell(`H${r}`).value = toNumber(dati.campo_h)
      ws.getCell(`I${r}`).value = toNumber(dati.induzione_b)
      ws.getCell(`J${r}`).value = (dati.limite_riferimento as string | undefined) ?? null
      ws.getCell(`K${r}`).value = toNumber(dati.indice_esposizione)
      const n = ws.getCell(`L${r}`)
      n.value = m.note ?? null
      n.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
  },
}

// ─── ROA ─────────────────────────────────────────────────────────────────────
// Template: public/templates/roa.xlsx — 4 pagine × 8 misure = 32 max
// Colonne A-N: n°, postazione, fase, sorgente ROA, banda spettrale, λ(nm),
//   dist(m), E(W/m²), L(W/m²·sr), t.esp(s), H(J/m²), limite rif.,
//   indice esp.(%), note
const exportSchemaRoa: ExportSchema = {
  templateUrl: '/templates/roa.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_ROA_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template ROA")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`F${b.footerRow}`).value = strumentoStr
    })

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`ROA: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>

      ws.getCell(`B${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = (dati.sorgente as string | undefined) ?? null
      ws.getCell(`E${r}`).value = (dati.banda as string | undefined) ?? null
      ws.getCell(`F${r}`).value = toNumber(dati.lunghezza_onda)
      ws.getCell(`G${r}`).value = toNumber(dati.distanza)
      ws.getCell(`H${r}`).value = toNumber(dati.irradianza_e)
      ws.getCell(`I${r}`).value = toNumber(dati.radianza_l)
      ws.getCell(`J${r}`).value = toNumber(dati.tempo_esposizione)
      ws.getCell(`K${r}`).value = toNumber(dati.h_radiant)
      ws.getCell(`L${r}`).value = (dati.limite_riferimento as string | undefined) ?? null
      ws.getCell(`M${r}`).value = toNumber(dati.indice_esposizione)
      const n = ws.getCell(`N${r}`)
      n.value = m.note ?? null
      n.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
  },
}

// ─── Biologico SAS ───────────────────────────────────────────────────────────
// Template: public/templates/biologico-sas.xlsx — 4 pagine × 8 misure = 32 max
// Colonne A-K: n°, codice filtro, postazione, fase/mansione, macchine/impianti,
//   t.prelievo, volume(L), conta22°C(UFC/m³), conta36°C(UFC/m³),
//   muffe+lieviti(UFC/m³), note
// I campi UFC esportano la stringa raw (es. "<10") se presente.
const exportSchemaBiologico: ExportSchema = {
  templateUrl: '/templates/biologico-sas.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_Biologico_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Biologico SAS")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`F${b.footerRow}`).value = strumentoStr
    })

    const ufcVal = (raw: unknown, valore: unknown, sottoSoglia: unknown): string | number | null => {
      if (typeof raw === 'string' && raw.trim()) return raw.trim()
      const n = toNumber(valore)
      if (n === null) return null
      return sottoSoglia === true ? `<${n}` : n
    }

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`Biologico: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      ws.getCell(`B${r}`).value = (dati.codice_filtro as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`E${r}`).value = macchine.length > 0 ? macchine.join(', ') : null
      ws.getCell(`F${r}`).value = (dati.tempo_prelievo as string | undefined) ?? null
      ws.getCell(`G${r}`).value = toNumber(dati.volume_aspirato)
      ws.getCell(`H${r}`).value = ufcVal(dati.conta_22_raw, dati.conta_22, dati.conta_22_sotto_soglia)
      ws.getCell(`I${r}`).value = ufcVal(dati.conta_36_raw, dati.conta_36, dati.conta_36_sotto_soglia)
      ws.getCell(`J${r}`).value = ufcVal(dati.muffe_lieviti_raw, dati.muffe_lieviti, dati.muffe_lieviti_sotto_soglia)
      const n = ws.getCell(`K${r}`)
      n.value = m.note ?? null
      n.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
  },
}

// ─── Gas ─────────────────────────────────────────────────────────────────────
// Template: public/templates/gas.xlsx — 4 pagine × 8 misure = 32 max
// Layout per ogni blocco (BASE_ROW = 1 | 16 | 31 | 46):
//   header:  BASE_ROW
//   dati:    BASE_ROW+4 … BASE_ROW+11
//   footer:  BASE_ROW+12
export const exportSchemaGas: ExportSchema = {
  templateUrl: '/templates/gas.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_Gas_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Gas")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 5,  footerRow: 13 },
      { headerRow: 16, dataStartRow: 20, footerRow: 28 },
      { headerRow: 31, dataStartRow: 35, footerRow: 43 },
      { headerRow: 46, dataStartRow: 50, footerRow: 58 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`I${b.footerRow}`).value = strumentoStr
    })

    const tipoLabel = (v: unknown): string | null => {
      if (typeof v !== 'string' || !v) return null
      const map: Record<string, string> = { personale: 'Personale', ambientale: 'Ambientale', puntuale: 'Puntuale' }
      return map[v] ?? v
    }

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`Gas: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      ws.getCell(`B${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = (dati.tempo_prelievo as string | undefined) ?? null
      ws.getCell(`E${r}`).value = tipoLabel(dati.tipo_prelievo)
      ws.getCell(`F${r}`).value = macchine.length > 0 ? macchine.join(', ') : null
      ws.getCell(`G${r}`).value = toNumber(dati.no2)
      ws.getCell(`H${r}`).value = toNumber(dati.no)
      ws.getCell(`I${r}`).value = toNumber(dati.co)
      ws.getCell(`J${r}`).value = toNumber(dati.co2)
      ws.getCell(`K${r}`).value = toNumber(dati.h2s)

      const altroNome = typeof dati.altro_gas_nome === 'string' ? dati.altro_gas_nome.trim() : ''
      const altroVal = toNumber(dati.altro_gas_valore)
      if (altroNome && altroVal !== null) ws.getCell(`L${r}`).value = `${altroNome}: ${altroVal}`
      else if (altroNome) ws.getCell(`L${r}`).value = altroNome
      else if (altroVal !== null) ws.getCell(`L${r}`).value = altroVal

      ws.getCell(`M${r}`).value = toNumber(dati.o2)
      const n = ws.getCell(`N${r}`)
      n.value = m.note ?? null
      n.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
  },
}

// ─── Polveri ─────────────────────────────────────────────────────────────────
// Template: public/templates/polveri.xlsx — 4 pagine × 8 misure = 32 max
// Colonne A-N: n°, fase, postazione, tipo misura, macchine, codice filtro,
//   pompa, Q(L/min), durata(min), volume(L), polveri filtro(mg),
//   conc polveri(mg/m³), silice filtro(mg), conc silice(mg/m³)
// Nota: temperatura e velocita_aria NON in colonne (non standard per il
//   foglio cartaceo).
const exportSchemaPolveri: ExportSchema = {
  templateUrl: '/templates/polveri.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_Polveri_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Polveri")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`I${b.footerRow}`).value = strumentoStr
    })

    const tipoLabel = (v: unknown): string | null => {
      if (typeof v !== 'string' || !v) return null
      const map: Record<string, string> = { personale: 'Personale', ambientale: 'Ambientale', statico: 'Ambientale statico' }
      return map[v] ?? v
    }

    const concSottoSoglia = (val: unknown, flag: unknown): number | string | null => {
      const n = toNumber(val)
      if (n === null) return null
      return flag === true ? `<${n}` : n
    }

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`Polveri: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      ws.getCell(`B${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = tipoLabel(dati.tipo_misura)
      ws.getCell(`E${r}`).value = macchine.length > 0 ? macchine.join(', ') : null
      ws.getCell(`F${r}`).value = (dati.codice_filtro as string | undefined) ?? null
      ws.getCell(`G${r}`).value = (dati.pompa as string | undefined) ?? null
      ws.getCell(`H${r}`).value = toNumber(dati.portata_q)
      ws.getCell(`I${r}`).value = toNumber(dati.durata_prelievo)
      ws.getCell(`J${r}`).value = toNumber(dati.volume_campionato)
      ws.getCell(`K${r}`).value = toNumber(dati.polveri_filtro)
      ws.getCell(`L${r}`).value = toNumber(dati.conc_polveri)
      ws.getCell(`M${r}`).value = typeof dati.silice_filtro_raw === 'string' && dati.silice_filtro_raw ? dati.silice_filtro_raw : toNumber(dati.silice_filtro_valore)
      ws.getCell(`N${r}`).value = concSottoSoglia(dati.conc_silice, dati.conc_silice_sotto_soglia)
    })
  },
}

// ─── Carbonio elementare ─────────────────────────────────────────────────────
// Template: public/templates/carbonio-elementare.xlsx — 4 pagine × 8 = 32 max
// Colonne A-L: n°, fase, postazione, tipo misura, macchine, codice filtro,
//   pompa, Q(L/min), durata(min), volume(L), EC filtro(µg), conc EC(mg/m³)
// Nota: temperatura e velocita_aria NON in colonne.
const exportSchemaCarbonio: ExportSchema = {
  templateUrl: '/templates/carbonio-elementare.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_CarbonioElementare_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Carbonio elementare")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`H${b.footerRow}`).value = strumentoStr
    })

    const tipoLabel = (v: unknown): string | null => {
      if (typeof v !== 'string' || !v) return null
      const map: Record<string, string> = { personale: 'Personale', ambientale: 'Ambientale', statico: 'Ambientale statico' }
      return map[v] ?? v
    }

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`Carbonio: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      ws.getCell(`B${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = tipoLabel(dati.tipo_misura)
      ws.getCell(`E${r}`).value = macchine.length > 0 ? macchine.join(', ') : null
      ws.getCell(`F${r}`).value = (dati.codice_filtro as string | undefined) ?? null
      ws.getCell(`G${r}`).value = (dati.pompa as string | undefined) ?? null
      ws.getCell(`H${r}`).value = toNumber(dati.portata_q)
      ws.getCell(`I${r}`).value = toNumber(dati.durata_prelievo)
      ws.getCell(`J${r}`).value = toNumber(dati.volume_campionato)
      // EC filtro: usa raw string se presente (può contenere "<")
      ws.getCell(`K${r}`).value = typeof dati.ec_filtro_raw === 'string' && dati.ec_filtro_raw ? dati.ec_filtro_raw : toNumber(dati.ec_filtro_valore)
      // conc EC: prefissa "<" se sotto soglia
      const concEc = toNumber(dati.conc_ec)
      ws.getCell(`L${r}`).value = concEc !== null && dati.ec_sotto_soglia === true ? `<${concEc}` : concEc
    })
  },
}

// ─── IPA ─────────────────────────────────────────────────────────────────────
// Template: public/templates/ipa.xlsx — 4 pagine × 8 misure = 32 max
// Colonne A-L: n°, fase, postazione, tipo misura, macchine, codice campione,
//   n° fiala, n° membrana, pompa, Q(L/min), durata(min), volume(L)
// Nota: nessuna colonna risultato — i valori analitici IPA vengono dal lab.
// Nota: temperatura e velocita_aria NON in colonne.
const exportSchemaIpa: ExportSchema = {
  templateUrl: '/templates/ipa.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_IPA_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template IPA")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`H${b.footerRow}`).value = strumentoStr
    })

    const tipoLabel = (v: unknown): string | null => {
      if (typeof v !== 'string' || !v) return null
      const map: Record<string, string> = { personale: 'Personale', ambientale: 'Ambientale', statico: 'Ambientale statico' }
      return map[v] ?? v
    }

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`IPA: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      ws.getCell(`B${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = tipoLabel(dati.tipo_misura)
      ws.getCell(`E${r}`).value = macchine.length > 0 ? macchine.join(', ') : null
      ws.getCell(`F${r}`).value = (dati.codice_campione as string | undefined) ?? null
      ws.getCell(`G${r}`).value = (dati.numero_fiala as string | undefined) ?? null
      ws.getCell(`H${r}`).value = (dati.numero_membrana as string | undefined) ?? null
      ws.getCell(`I${r}`).value = (dati.pompa as string | undefined) ?? null
      ws.getCell(`J${r}`).value = toNumber(dati.portata_q)
      ws.getCell(`K${r}`).value = toNumber(dati.durata_prelievo)
      ws.getCell(`L${r}`).value = toNumber(dati.volume_campionato)
    })
  },
}

// ─── Amianto ─────────────────────────────────────────────────────────────────
// Template: public/templates/amianto.xlsx — 4 pagine × 8 misure = 32 max
// Colonne A-M: n°, fase, postazione, tipo misura, macchine, codice filtro,
//   pompa, Q(L/min), durata(min), volume(L), fibre filtro(ff/mm²),
//   conc fibre tot.(ff/L), conc amianto(ff/L)
// Nota: temperatura e velocita_aria NON in colonne.
const exportSchemaAmianto: ExportSchema = {
  templateUrl: '/templates/amianto.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_Amianto_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Amianto")

    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
      { headerRow: 27, dataStartRow: 30, footerRow: 38 },
      { headerRow: 40, dataStartRow: 43, footerRow: 51 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`H${b.footerRow}`).value = strumentoStr
    })

    const tipoLabel = (v: unknown): string | null => {
      if (typeof v !== 'string' || !v) return null
      const map: Record<string, string> = { personale: 'Personale', ambientale: 'Ambientale', statico: 'Ambientale statico' }
      return map[v] ?? v
    }

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`Amianto: misura ${idx + 1} oltre 32 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>
      const macchine = (dati.macchine_nomi as string[] | undefined) ?? []

      ws.getCell(`B${r}`).value = (dati.fase_nome as string | undefined) ?? null
      ws.getCell(`C${r}`).value = (dati.postazione_nome as string | undefined) ?? null
      ws.getCell(`D${r}`).value = tipoLabel(dati.tipo_misura)
      ws.getCell(`E${r}`).value = macchine.length > 0 ? macchine.join(', ') : null
      ws.getCell(`F${r}`).value = (dati.codice_filtro as string | undefined) ?? null
      ws.getCell(`G${r}`).value = (dati.pompa as string | undefined) ?? null
      ws.getCell(`H${r}`).value = toNumber(dati.portata_q)
      ws.getCell(`I${r}`).value = toNumber(dati.durata_prelievo)
      ws.getCell(`J${r}`).value = toNumber(dati.volume_campionato)
      ws.getCell(`K${r}`).value = toNumber(dati.fibre_filtro)
      ws.getCell(`L${r}`).value = toNumber(dati.conc_fibre_totali)
      // conc amianto: prefissa "<" se sotto soglia
      const concAmianto = toNumber(dati.conc_amianto)
      ws.getCell(`M${r}`).value = concAmianto !== null && dati.amianto_sotto_soglia === true ? `<${concAmianto}` : concAmianto
    })
  },
}

// ─── Acqua ───────────────────────────────────────────────────────────────────
// Template: public/templates/acqua.xlsx — 2 pagine × 8 misure = 16 max
// Acqua è un modulo compatto (pochi parametri fisico-chimici), 2 pagine
// sono sufficienti per coprire tutti i casi pratici di monitoraggio.
// Colonne A-I: n°, punto monitoraggio, pH, conducibilità(µS/cm),
//   T acqua(°C), T ambiente(°C), O2(%), O2(mg/L), note
const exportSchemaAcqua: ExportSchema = {
  templateUrl: '/templates/acqua.xlsx',

  buildFilename: (ctx) => {
    const safe = ctx.cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_')
    const data = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toISOString().slice(0, 10) : 'data'
    return `${safe}_Acqua_${data}.xlsx`
  },

  applyData: (ctx, workbook) => {
    const ws = workbook.getWorksheet('Foglio1')
    if (!ws) throw new Error("Foglio 'Foglio1' non trovato nel template Acqua")

    // 2 pagine × 8 misure = 16 max; PAGE_ROWS=13
    const blocchi = [
      { headerRow: 1,  dataStartRow: 4,  footerRow: 12 },
      { headerRow: 14, dataStartRow: 17, footerRow: 25 },
    ]
    const dataFormatted = ctx.campagna.data_ora ? new Date(ctx.campagna.data_ora).toLocaleDateString('it-IT') : ''
    const committente = ctx.cantiere.committente ?? ''
    const cantiereNome = ctx.cantiere.nome
    const nomiTecnici = ctx.tecnici.map((t) => `${t.nome} ${t.cognome}`.trim()).join(', ')
    const strumentoStr = ctx.strumento
      ? `Strumentazione: ${ctx.strumento.nome} ${ctx.strumento.modello} (${ctx.strumento.matricola})`
      : 'Strumentazione:'

    blocchi.forEach((b) => {
      const c = ws.getCell(`B${b.headerRow}`)
      c.value = committente || null
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      const d = ws.getCell(`D${b.headerRow}`)
      d.value = dataFormatted ? `Data: ${dataFormatted}` : 'Data:'
      d.alignment = { horizontal: 'center', vertical: 'middle' }
      const k = ws.getCell(`F${b.headerRow}`)
      k.value = cantiereNome
      k.alignment = { horizontal: 'center', vertical: 'middle' }
      if (nomiTecnici) ws.getCell(`C${b.footerRow}`).value = nomiTecnici
      ws.getCell(`F${b.footerRow}`).value = strumentoStr
    })

    const misure = [...ctx.misure].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    misure.forEach((m, idx) => {
      const bi = Math.floor(idx / 8)
      if (bi >= blocchi.length) { console.warn(`Acqua: misura ${idx + 1} oltre 16 — ignorata`); return }
      const r = blocchi[bi].dataStartRow + (idx % 8)
      const dati = (m.dati ?? {}) as Record<string, unknown>

      ws.getCell(`B${r}`).value = (dati.punto_monitoraggio as string | undefined) ?? null
      ws.getCell(`C${r}`).value = toNumber(dati.ph)
      ws.getCell(`D${r}`).value = toNumber(dati.conducibilita)
      ws.getCell(`E${r}`).value = toNumber(dati.t_acqua)
      ws.getCell(`F${r}`).value = toNumber(dati.t_ambiente)
      ws.getCell(`G${r}`).value = toNumber(dati.o2_perc)
      ws.getCell(`H${r}`).value = toNumber(dati.o2_mg_l)
      const n = ws.getCell(`I${r}`)
      n.value = m.note ?? null
      n.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
  },
}

export const EXPORT_SCHEMAS: Record<string, ExportSchema> = {
  rumore: exportSchemaRumore,
  'vibrazioni-wbv': exportSchemaWbv,
  'vibrazioni-hav': exportSchemaHav,
  microclima: exportSchemaMicroclima,
  cem: exportSchemaCem,
  roa: exportSchemaRoa,
  gas: exportSchemaGas,
  polveri: exportSchemaPolveri,
  'carbonio-elementare': exportSchemaCarbonio,
  ipa: exportSchemaIpa,
  amianto: exportSchemaAmianto,
  'biologico-sas': exportSchemaBiologico,
  acqua: exportSchemaAcqua,
  mmc: buildSchemaGenerico('mmc', 'MMC'),
  owas: exportSchemaOwas,
  ocra: buildSchemaGenerico('ocra', 'OCRA'),
}

export function getExportSchema(moduloId: string | undefined): ExportSchema | undefined {
  if (!moduloId) return undefined
  return EXPORT_SCHEMAS[moduloId]
}
