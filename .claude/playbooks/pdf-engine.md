# PDF Engine — architettura e regole

Invocare quando si lavora su `lib/pdf/`.

---

## Stack

- jsPDF 4.2.1
- jspdf-autotable 5.0.7

---

## Architettura `lib/pdf/`

Struttura:

- `core.ts` -> Orchestratore + PdfTabellaStatica / PdfTabellaAdattiva
- `_helpers.ts` -> Spacing, header, footer, formatters
- `fotoAppendix.ts` -> Appendice foto in coda al PDF
- `index.ts` -> Barrel export
- `moduli/` -> 16 file, uno per modulo (rumore.ts, wbv.ts, ..., ocra.ts)

### Responsabilita

- `core.ts`: orchestratore. Riceve `Misura[]` + `ExportContext`, sceglie strategia (statica/adattiva), invoca modulo specifico.
- `_helpers.ts`: utility riusabili (margini, font, header anagrafica, formattazione durate, ecc.).
- `moduli/<nome>.ts`: definisce schema tabella per quel modulo (head, body, colSpan, larghezze colonne).
- `fotoAppendix.ts`: aggiunge foto in coda (max 2/riga, ~120x90mm, compressione 800px q0.6).

---

## Regole

### Usa sempre autotable

Pattern:
- `import { autoTable } from "jspdf-autotable"`
- Invoca `autoTable(doc, { head, body, startY, margin, styles, columnStyles })`

### NON usare coordinate manuali

NIENTE `doc.text("Header", 50, 30)` o `doc.rect(10, 25, 200, 10)`.
Causano overflow, page break sbagliati, non si scalano su altri moduli.

### Usa helpers riusabili

Quando aggiungi una funzione di spacing/formattazione che potrebbe servire altrove, mettila in `_helpers.ts`.

### NON mettere logica PDF in componenti React

Tutta la logica sta in `lib/pdf/`. Il componente React chiama solo la funzione export.

---

## Tipi: PdfTabellaStatica vs PdfTabellaAdattiva

### Statica

Numero righe fisso (rispecchia template Excel).
Esempi: Rumore (32 slot), OWAS (8 slot).

### Adattiva

Numero righe variabile.
Esempi: polveri, carbonio-elementare, amianto, biologico-sas (strategia cantiere/lab).

Scelta automatica in `core.ts` in base al modulo.

---

## Header multi-row (caso MMC)

Per moduli con group row sopra header (vedi MMC step A su xlsx):

- Tipo `RowInput = (string | { content: string, colSpan?: number })[]`
- Head e array di RowInput (NON solo string[][])
- Esempio MMC: prima row con colSpan 1+6+4+1=12 per gruppi "Sollevamento (NIOSH)" e "Spinta/Traino/Trasporto (Snook-Ciriello)"; seconda row con header standard 12 colonne.

`core.ts` ora supporta `head: RowInput[]` (non piu solo `string[][]`).

---

## Foto in PDF (fotoAppendix.ts)

- Layout 2 foto per riga
- Dimensione ~120x90mm
- Header per ogni misura: `Misura #N - Postazione - Fase/Mansione/Macchina`
- Compressione export 800px / q0.6
- Download via `createSignedUrl` + `fetch` (vedi `patterns.md`)
- Skip + placeholder su errore singola foto

---

## Page setup standard

- A4 landscape
- Margini: 10mm sx/dx, 15mm top/bottom
- Font: Helvetica (default jsPDF)
- Footer: firma vuota per stampa + numerazione pagine

---

## Strategie note

### Adattiva cantiere/lab

Per moduli con doppia compilazione (polveri, carbonio, amianto, biologico-sas):
- Sezione cantiere: dati rilevati in campo
- Sezione lab: dati post-analisi (oggi parziale, vedi `current-state.md` -> estensioni lab)

### Cache foto stale

`useFotoMisure` invalida per prefisso campagna, non solo per `misuraId`. Necessario perche export multi-misura altrimenti legge cache stale.
