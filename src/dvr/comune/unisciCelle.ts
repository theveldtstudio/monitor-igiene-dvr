/**
 * Unione verticale delle celle dopo la compilazione del template.
 *
 * docxtemplater ripete le righe delle tabelle ma non sa unire le celle uguali (es. la "Fase
 * lavorativa" che nel DVR occupa più righe). Il testo di una cella da unire comincia con
 * `unibile(chiave, testo)`: dopo la compilazione le celle consecutive della stessa colonna con la
 * stessa chiave diventano un'unica cella (w:vMerge) e il marcatore sparisce.
 * Le celle già unite nel template (vMerge "continue") restano parte della cella sopra.
 */
import { DOMParser, XMLSerializer, type Element as XmlElement } from '@xmldom/xmldom'

const INIZIO = '⁣'
const FINE = '⁤'
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const RE_MARCATORE = new RegExp(`${INIZIO}[^${FINE}]*${FINE}`, 'g')

/** Testo di una cella da unire con le celle sottostanti che hanno la stessa chiave. */
export const unibile = (chiave: string, testo: string) => `${INIZIO}${chiave.replace(/[⁣⁤]/g, '')}${FINE}${testo}`

const figli = (el: XmlElement, nome: string): XmlElement[] => {
  const out: XmlElement[] = []
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && (n as XmlElement).localName === nome && (n as XmlElement).namespaceURI === W) out.push(n as XmlElement)
  }
  return out
}

const discendenti = (el: XmlElement, nome: string): XmlElement[] => Array.from(el.getElementsByTagNameNS(W, nome)) as XmlElement[]

function proprieta(tc: XmlElement): XmlElement {
  let pr = figli(tc, 'tcPr')[0]
  if (!pr) {
    pr = tc.ownerDocument!.createElementNS(W, 'w:tcPr')
    tc.insertBefore(pr, tc.firstChild)
  }
  return pr
}

function vMerge(tc: XmlElement): 'restart' | 'continue' | null {
  const pr = figli(tc, 'tcPr')[0]
  const v = pr ? figli(pr, 'vMerge')[0] : undefined
  if (!v) return null
  return v.getAttributeNS(W, 'val') === 'restart' ? 'restart' : 'continue'
}

function impostaVMerge(tc: XmlElement, val: 'restart' | 'continue') {
  const pr = proprieta(tc)
  let v = figli(pr, 'vMerge')[0]
  if (!v) {
    v = tc.ownerDocument!.createElementNS(W, 'w:vMerge')
    // ordine dello schema: cnfStyle, tcW, gridSpan, hMerge, vMerge, …
    let dopo: XmlElement | undefined
    for (const nome of ['hMerge', 'gridSpan', 'tcW', 'cnfStyle']) {
      dopo = figli(pr, nome)[0]
      if (dopo) break
    }
    pr.insertBefore(v, dopo ? dopo.nextSibling : pr.firstChild)
  }
  if (val === 'restart') v.setAttributeNS(W, 'w:val', 'restart')
  else v.removeAttributeNS(W, 'val')
}

const span = (tc: XmlElement) => {
  const pr = figli(tc, 'tcPr')[0]
  const g = pr ? figli(pr, 'gridSpan')[0] : undefined
  return g ? Number(g.getAttributeNS(W, 'val')) || 1 : 1
}

/** Chiave del marcatore nella cella (null se la cella non è da unire). */
function chiave(tc: XmlElement): string | null {
  for (const t of discendenti(tc, 't')) {
    const s = t.textContent ?? ''
    const i = s.indexOf(INIZIO)
    if (i >= 0) {
      const j = s.indexOf(FINE, i)
      return j > i ? s.slice(i + 1, j) : null
    }
  }
  return null
}

function svuota(tc: XmlElement) {
  const ps = figli(tc, 'p')
  ps.slice(1).forEach((p) => tc.removeChild(p))
  for (const t of discendenti(tc, 't')) t.textContent = ''
}

function unisciTabella(tbl: XmlElement) {
  // per colonna della griglia: chiave della catena di celle in corso
  let sopra = new Map<number, string | null>()
  let cellaSopra = new Map<number, XmlElement>()
  for (const tr of figli(tbl, 'tr')) {
    const riga = new Map<number, string | null>()
    const celleRiga = new Map<number, XmlElement>()
    let col = 0
    for (const tc of figli(tr, 'tc')) {
      const stato = vMerge(tc)
      const k = chiave(tc)
      if (stato === 'continue') {
        riga.set(col, sopra.get(col) ?? null)
      } else if (k !== null && sopra.get(col) === k && cellaSopra.has(col)) {
        impostaVMerge(cellaSopra.get(col)!, vMerge(cellaSopra.get(col)!) === 'continue' ? 'continue' : 'restart')
        impostaVMerge(tc, 'continue')
        svuota(tc)
        riga.set(col, k)
      } else {
        riga.set(col, k)
        celleRiga.set(col, tc)
      }
      if (!celleRiga.has(col)) celleRiga.set(col, cellaSopra.get(col) ?? tc)
      col += span(tc)
    }
    sopra = riga
    cellaSopra = celleRiga
  }
}

/** Unisce le celle marcate in tutte le tabelle del documento e toglie i marcatori. */
export function unisciCelleMarcate(xml: string): string {
  if (!xml.includes(INIZIO)) return xml
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const tabelle = discendenti(doc.documentElement as unknown as XmlElement, 'tbl')
  // dalle più interne alle più esterne: l'ordine non cambia il risultato, le tabelle sono indipendenti
  tabelle.forEach(unisciTabella)
  for (const t of discendenti(doc.documentElement as unknown as XmlElement, 't')) {
    const s = t.textContent ?? ''
    if (s.includes(INIZIO)) t.textContent = s.replace(RE_MARCATORE, '')
  }
  return new XMLSerializer().serializeToString(doc)
}
