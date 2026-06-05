import type { Worksheet, Workbook } from 'exceljs'

/**
 * Clona un foglio template in un nuovo foglio dello stesso workbook,
 * preservando layout: merge, larghezze colonne, stili, numFmt, pageSetup,
 * altezze riga e valori delle celle (incluse quelle "vuote" con solo
 * bordo/fill del template).
 *
 * Il foglio clonato è una copia IDENTICA al template (anche nei dati):
 * il chiamante sovrascrive poi le celle dati con la propria fetta di misure.
 *
 * IMPORTANTE: gli stili ExcelJS sono condivisi per riferimento. Si usa
 * SEMPRE clone profondo `JSON.parse(JSON.stringify(style))` per non
 * corrompere il template (root del numFmt bleed noto).
 *
 * @param wb       workbook di destinazione (lo stesso del template)
 * @param template foglio sorgente PRISTINO (clonare PRIMA di scriverci sopra)
 * @param newName  nome del nuovo foglio
 * @returns il nuovo Worksheet clonato
 */
export function cloneSheet(wb: Workbook, template: Worksheet, newName: string): Worksheet {
  const ws = wb.addWorksheet(newName, {
    properties: { ...template.properties },
    pageSetup: { ...template.pageSetup },
    headerFooter: { ...template.headerFooter },
    views: JSON.parse(JSON.stringify(template.views)),
  })

  for (let i = 1; i <= template.columnCount; i++) {
    ws.getColumn(i).width = template.getColumn(i).width
    ws.getColumn(i).style = JSON.parse(JSON.stringify(template.getColumn(i).style))
  }

  template.eachRow({ includeEmpty: true }, (row, rn) => {
    const dr = ws.getRow(rn)
    if (row.height != null) dr.height = row.height
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      const d = dr.getCell(cn)
      d.value = cell.value
      d.style = JSON.parse(JSON.stringify(cell.style))
      if (cell.numFmt) d.numFmt = cell.numFmt
    })
    dr.commit()
  })

  // I merge vanno ri-applicati DOPO aver scritto i valori.
  ;(template.model.merges || []).forEach((m: string) => ws.mergeCells(m))

  return ws
}
