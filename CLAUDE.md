# Monitor Igiene — Contesto progetto

App web per **RSPP** per raccolta misure di campionamento ai sensi del **D.Lgs. 81/08**. Single-user. Mobile + desktop.

Repo: `https://github.com/theveldtstudio/monitor-igiene.git`

---

## Stack

- React 19 + Vite + TypeScript strict
- Supabase (DB + Storage + RLS)
- TanStack Query v5
- ExcelJS (export Excel)
- jsPDF 4.2.1 + jspdf-autotable 5.0.7 (export PDF)
- CSS-in-JS inline + design tokens in `src/styles/globals.css`

NO Tailwind, NO CSS modules, NO styled-components.

---

## Moduli misura — 16/16 completati

rumore, vibrazioni-wbv, vibrazioni-hav, microclima, cem, roa, polveri, carbonio-elementare, gas, ipa, amianto, biologico-sas, acqua, mmc, owas, ocra

---

## Regole critiche

### CSS-in-JS
MAI usare shorthand `border:`, `padding:`, `margin:` quando ci sono override condizionali su singole direzioni. Sempre longhand (`borderWidth`, `borderStyle`, `borderColor`).

### TypeScript
- `verbatimModuleSyntax: true` -> usa `import type` per type-only imports
- `noUnusedLocals` + `noUnusedParameters` attivi
- `erasableSyntaxOnly: true` -> no enum runtime, usa union types o `as const`
- No `any`

### Naming
- DB e dati: `snake_case`
- TypeScript: `camelCase`
- Eccezione storica: schema OWAS in camelCase (debt noto da normalizzare)

### Routing
Solo React Router DOM v7. Non aggiungere alternativi.

---

## Architettura — pattern consolidati

### Modali misura (16x identico)
Tutti usano `MisuraModalShell` come wrapper. Lo shell gestisce open/close/dirty/validation/saving/error. Il modulo specifico fornisce il form come `children` e implementa `handleSubmit`.

Entry nel registry `src/data/moduliRegistry.ts`:'<modulo-id>': {
modalComponent: MisuraXxxModal,
subtitleBuilder: subtitleXxx,
}
NON modificare `MisuraModalShell` per esigenze di un singolo modulo.

### Foto allegate (16x identico)
Pattern uniforme su tutti i modali:
- State `misuraIdCorrente` deriva da `misuraDaModificare?.id ?? null`
- `useEffect` su `[open, misuraDaModificare?.id]` per sync
- `isModifica = misuraIdCorrente != null`
- Dopo CREATE: valorizza state, NON chiude
- Dopo UPDATE: chiude
- `<FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />` dopo Note

### Foto storage (Supabase privato)
- Bucket `misure-foto` (privato, 5MB max, MIME image/jpeg/png/webp)
- Download: SEMPRE `createSignedUrl(path, 300)` + `fetch(url).blob()`
- MAI `.download(path)` diretto (fallisce silenziosamente con RLS)
- Compressione upload: 1280px lato lungo, JPEG q0.7
- Compressione export: 800px, q0.6 via OffscreenCanvas

### Export Excel
- Schemi in `src/data/exportSchemas.ts`
- 3 schemi specifici (rumore, wbv, hav) + 13 generici via `applyDataGenerico`
- `ExportContext` arricchito con `RisorsaCantiere[]`
- Strategia ibrida: prima `_nome` denormalizzato, fallback ID->nome lookup

### Export PDF
- Engine in `lib/pdf/` (orchestratore + 16 moduli + helpers + appendice foto)
- Usa autotable, NO coordinate manuali
- NON mettere logica PDF dentro componenti React

### Fix template Excel (numFmt)
Bug ExcelJS: condivisione `xfId` tra colonne -> `numFmt` "bleed".
Root-cause fix: script Python in `tools/` che assegnano `numFmt` distinti per colonna direttamente nel `.xlsx`.
NON fare workaround code-level.

### Foto-row Excel
Foto-row "vuote" (solo `addImage`, nessuna cella scritta) NON vengono materializzate nell'XML -> `row.height` ignorata.
Fix: dopo `row.height = N` fare anche `row.getCell(1).value = null`.
ATTENZIONE: `getRow()` e 1-indexed, `addImage` `tl.row` e 0-indexed: off-by-one.

---

## Regole di autonomia (Claude Code)

### Procede da solo se:
- Fix di bug evidente con causa chiara
- Refactor interno senza cambio API
- Implementa task con design gia concordato
- Scrive test

### Si ferma e chiede se:
- Serve scelta di design/UX/colore/naming
- Cambio API o schema DB
- Test fallisce in modo non ovvio
- Bug ricorrente (>2 tentativi falliti) -> STOP, richiedere prompt di diagnosi

---

## Git

- Conventional Commits obbligatorio
- Feature branches -> merge in `main`
- `git push` BLOCCATO nelle deny rules -> va fatto manualmente dall'utente
- MAI `git reset --hard`, MAI `git clean -fd`

---

## File di contesto

- `.claude/current-state.md` -> milestone + focus corrente (consultare sempre)
- `.claude/playbooks/patterns.md` -> 4 pattern consolidati dettagliati
- `.claude/playbooks/pdf-engine.md` -> architettura `lib/pdf/`
- `.claude/playbooks/regression-checklist.md` -> checklist cross-modulo (invocare prima di toccare modali/export/PDF)

---

## Anti-pattern (NON fare mai)

- Shorthand CSS con override condizionali
- Workaround code-level per bug template Excel
- `.download()` su bucket Supabase privato
- Modificare `MisuraModalShell` per un singolo modulo
- Logica PDF dentro componenti React
- Prompt monolitici che toccano molti file insieme
- Fix alla cieca senza diagnosi quando un bug ritorna
