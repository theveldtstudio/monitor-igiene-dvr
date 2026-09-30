# Monitor Igiene — Contesto progetto

App web (PWA) per la raccolta in cantiere delle misure di campionamento di igiene del lavoro ai sensi del **D.Lgs. 81/08**. Mobile + desktop, offline-first.

- Sviluppo: Davide Bettini
- Repo: `https://github.com/theveldtstudio/monitor-igiene.git`
- Produzione: Netlify (build `npm run build`, publish `dist`, redirect SPA in `netlify.toml`). Già testata in cantiere.

## Obiettivo di prodotto (da set 2026)

1. **Terminare l'app** e renderla vendibile ad altri professionisti (RSPP, consulenti sicurezza, laboratori).
2. Offerta in **due pacchetti**:
   - **Monitoraggi** — questa app, standalone.
   - **Monitoraggi + DVR** — QUESTO repository (`app-monitoraggi-dvr`): copia dell'app Monitoraggi con in più il modulo DVR (`src/dvr/`). Le correzioni comuni si fanno nell'app Monitoraggi (`../app-web`, remote git `monitoraggi`) e si portano qui con `git fetch monitoraggi && git merge monitoraggi/main`.
3. Conseguenze architetturali: servono multi-tenancy, gestione licenze/abbonamenti, un confine dati pulito verso il DVR. Vedi `.claude/current-state.md` e `docs/06_TODO_completa.md` (Fase K).

Oggi l'app è **single-tenant**: nessuna colonna `user_id`/`org_id` nelle tabelle, un solo progetto Supabase, policy storage foto aperte ad anon+authenticated. I dati non hanno un proprietario: più utenti sullo stesso progetto vedrebbero tutto. Non vendere a terzi finché la Fase K non è chiusa.

---

## Stack

- React 19 + Vite 8 + TypeScript strict
- Supabase (DB + Auth + Storage + RLS)
- TanStack Query v5 (networkMode `offlineFirst`)
- ExcelJS (export Excel — unico formato export; PDF rimosso 21 mag 2026), caricato in lazy
- Offline-first: Dexie + sync queue + PWA (vite-plugin-pwa) — `src/lib/offline/`
- Sistema toast custom — `src/lib/toast/`
- Playwright (E2E, Chromium, DB Supabase di TEST separato)
- CSS-in-JS inline + design tokens in `src/styles/globals.css`

NO Tailwind, NO CSS modules, NO styled-components.

---

## Moduli misura — 16/16 completati

rumore, vibrazioni-wbv, vibrazioni-hav, microclima, cem, roa, polveri, carbonio-elementare, gas, ipa, amianto, biologico-sas, acqua, mmc, owas, ocra

---

## Accesso (due livelli)

1. **Login Supabase** email+password (`src/contexts/AuthContext.tsx`, `LoginScreen`, `AuthGate` in `App.tsx`). Reset password via email.
2. **PIN locale** 4 cifre (SHA-256 in localStorage, `AppLockContext`) — lock all'apertura, bottone lock solo in Home.

Bypass E2E: `AuthGate` si salta solo se `import.meta.env.DEV && VITE_E2E_AUTH_BYPASS === 'true'` (inerte in build di produzione). NON rimuovere la doppia guardia.

NB: `pin_tecnico` / `pin_osservatore` su `Campagna` sono PIN di firma della campagna, non il PIN-app.

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
Solo React Router DOM v7. Route lazy (`React.lazy`) in `App.tsx`. Non aggiungere router alternativi.

---

## Architettura — pattern consolidati

### Modali misura (16x identico)
Tutti usano `MisuraModalShell` come wrapper. Lo shell gestisce open/close/dirty/validation/saving/error. Il modulo specifico fornisce il form come `children` e implementa `handleSubmit`.

Entry nel registry `src/data/moduliRegistry.ts`:
```ts
'<modulo-id>': {
  modalComponent: MisuraXxxModal,
  subtitleBuilder: subtitleXxx,
}
```
NON modificare `MisuraModalShell` per esigenze di un singolo modulo.

### Foto allegate (16x identico)
- State `misuraIdCorrente` deriva da `misuraDaModificare?.id ?? null`
- `useEffect` su `[open, misuraDaModificare?.id]` per sync
- `isModifica = misuraIdCorrente != null`
- Dopo CREATE: valorizza state, NON chiude. Dopo UPDATE: chiude
- `<FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />` dopo Note

### Foto storage (Supabase privato)
- Bucket `misure-foto` (privato, 5MB max, MIME image/jpeg/png/webp)
- Download: SEMPRE `createSignedUrl(path, 300)` + `fetch(url).blob()`
- MAI `.download(path)` diretto (fallisce silenziosamente con RLS)
- Compressione upload: 1280px lato lungo, JPEG q0.7. Export: 800px, q0.6 via OffscreenCanvas

### Export Excel (unico formato)
- Template in `public/templates/*.xlsx`, schemi in `src/data/exportSchemas.ts`
- 3 schemi specifici (rumore, wbv, hav) + 13 generici via `applyDataGenerico`
- `ExportContext` arricchito con `RisorsaCantiere[]`; strategia ibrida `_nome` denormalizzato -> fallback lookup ID
- Paginazione multi-foglio: overflow -> fogli "Misure X-Y" via `cloneSheet` (`src/lib/exportPaginazione.ts`)
- Export multi-campagna: 1 foglio per campagna (`exportMultiCampagne`), foto escluse
- Export cantiere completo in zip (`src/lib/exportCantiereZip.ts`)
- Regole dettagliate: `.claude/EXCEL_EXPORT_RULES.md`

### Offline-first + sync (`src/lib/offline/`)
- Dexie (`db.ts`) come store locale; repository per tabella in `repositories/`
- Sync queue FK-ordered (`syncQueue.ts` + `syncExecutor.ts`): drain record poi foto (`fotoSyncExecutor.ts`)
- Pull cloud->locale (`pullExecutor.ts`): **LWW su `updated_at`** (`lwwMerge.ts`, confronto numerico, tie -> remoto) + guard `sync_pending` (record con modifiche locali pendenti non vengono sovrascritti)
- Push: insert/update del record locale (in push vince chi scrive per ultimo)
- `initSync` su `online` + `visibilitychange`; `OfflineBanner` per feedback UI

### Errori e feedback
- `AppErrorBoundary` top-level, resettato a ogni cambio route
- `humanizeError` (`src/lib/humanizeError.ts`) per messaggi leggibili
- Toast imperativi `toast.success/error/warning/info` (`src/lib/toast/`)

### Fix template Excel (numFmt)
Bug ExcelJS: condivisione `xfId` tra colonne -> `numFmt` "bleed".
Root-cause fix: script Python in `tools/` che assegnano `numFmt` distinti per colonna direttamente nel `.xlsx`.
NON fare workaround code-level.

### Foto-row Excel
Foto-row "vuote" (solo `addImage`) NON vengono materializzate nell'XML -> `row.height` ignorata.
Fix: dopo `row.height = N` fare anche `row.getCell(1).value = null`.
ATTENZIONE: `getRow()` è 1-indexed, `addImage` `tl.row` è 0-indexed.

---

## Modulo DVR (solo in questa copia)

Vedi `docs/DVR.md`. In breve:
- `src/dvr/rumore/` motore di calcolo (LEX,8h, incertezza ISO 9612, fasce art. 189, DPI HML) + preparazione dati del Word; test `npm test` (vitest) sulle 23 TAV del DVR Xenia 2026.
- `src/dvr/vibrazioni/` motore WBV/HAV (A(8), +20% INAIL, fasce art. 201, media + dev. std) + Word; test sulle 45 TAV del DVR Vibrazioni Xenia 2026.
- `src/dvr/posture/` metodo OWAS (classe dal codice con `src/data/owasLookup.ts`, indice per giornata tipo, giornata più gravosa) + Word; test sulle 61 TAV del DVR Posture Castagnola 2025.
- `src/dvr/mmc/` NIOSH semplice e composto, Snook e Ciriello, check list OCRA per attività + Word; test sulle 20 valutazioni del DVR MMC Xenia 2026.
- `src/dvr/microclima/` PMV/PPD, WBGT, IREQ/DLE e WCI in quattro scenari (galleria o esterno, estate o inverno) + Word; test sui quattro DVR Microclima modello.
- `src/dvr/roa/` giustificazione delle sorgenti ROA, luminanza, filtri UNI EN 169 + Word; test sul DVR ROA Castagnola 2026.
- `src/dvr/chimico/` Agenti chimici, Fumi di saldatura e Agenti cancerogeni: ambienti con le misure, modello Regione Piemonte, TWA per mansione + Word; test sui tre DVR modello Castagnola.
- `src/dvr/chimico/` anche Amianto (fibre SEM/MOCF, valore limite art. 254, ESEDI) e IPA (benzo[a]pirene e BaP eq. dai rapporti di prova), senza modello: template da `costruisci_template_amianto_ipa.py`.
- `src/dvr/cem/` Campi elettromagnetici (senza modello): sorgenti giustificabili CEI EN 50499, misure E/B confrontate con i VA dell'Allegato XXXVI e con i livelli per la popolazione, zone 0/1/2 e distanze di rispetto + Word.
- `public/templates/dvr/*.docx` template docxtemplater, generati da `tools/dvr/costruisci_template_<rischio>.py` a partire dai DVR modello (non modificarli a mano: si rigenerano).
- Tabelle `dvr_*` (migrazione `supabase/migrations/20260928160000_dvr_schema.sql`), solo online, niente Dexie.
- Pagine: `/cantieri/:id/dvr` (anagrafica, ambiti, mansioni con conferma e storico, DPI, macchine, tarature, documenti) e `/cantieri/:id/dvr/:docId` (`EditorDvr` apre l'editor del rischio: Rumore, Vibrazioni, Posture, MMC, Microclima, ROA, la famiglia chimica (chimico, fumi di saldatura, cancerogeno, amianto, IPA) o CEM; parti comuni in `pagine/comuni.tsx`).
- E2E `e2e/dvr-rumore.spec.ts`, `e2e/dvr-vibrazioni.spec.ts`, `e2e/dvr-posture.spec.ts`, `e2e/dvr-mmc.spec.ts`, `e2e/dvr-microclima.spec.ts`, `e2e/dvr-roa.spec.ts`, `e2e/dvr-chimico.spec.ts` e `e2e/dvr-cem.spec.ts` usano un Supabase finto in memoria (`e2e/helpers/supabaseFinto.ts`): non tocca nessun database.

## Test

- `npm run test:e2e` — Playwright avvia da solo il dev server puntato al **DB di TEST** (`.env.test`, variabili `E2E_*`), mai alla produzione. Chiudere un eventuale `npm run dev` manuale sulla 5173 prima di lanciare.
- `npm test` — test unitari vitest dei motori DVR.
- 19 spec: `home`, `rumore-modal` (UI) + 16 `export-<modulo>` (seed via service-key -> export -> parse xlsx -> assert). Teardown globale pulisce i cantieri `TEST_E2E_*`.
- Prima di toccare modali/export/offline: `.claude/playbooks/regression-checklist.md`.

---

## Regole di autonomia (agente AI)

### Procede da solo se:
- Fix di bug evidente con causa chiara
- Refactor interno senza cambio API
- Implementa task con design già concordato
- Scrive test

### Si ferma e chiede se:
- Serve scelta di design/UX/colore/naming
- Cambio API o schema DB (incluse migrazioni Supabase e RLS)
- Test fallisce in modo non ovvio
- Bug ricorrente (>2 tentativi falliti) -> STOP, richiedere prompt di diagnosi

---

## Git

- Conventional Commits obbligatorio
- Feature branches -> merge in `main`
- `git push` va fatto manualmente dall'utente
- MAI `git reset --hard`, MAI `git clean -fd`

---

## File di contesto

- `.claude/current-state.md` -> stato + focus corrente (consultare sempre)
- `docs/06_TODO_completa.md` -> backlog e roadmap commercializzazione
- `docs/HANDOVER-app-monitoraggi.md` -> fotografia completa per nuove chat
- `.claude/playbooks/patterns.md` -> pattern consolidati dettagliati
- `.claude/playbooks/regression-checklist.md` -> checklist cross-modulo
- `.claude/EXCEL_EXPORT_RULES.md` -> regole template Excel
- `.claude/playbooks/_archive/pdf-engine-REMOVED.md` -> SOLO memoria storica
- `AGENTS.md` -> copia di questo file per Codex/altri agenti: tenerli allineati

---

## Anti-pattern (NON fare mai)

- Shorthand CSS con override condizionali
- Workaround code-level per bug template Excel
- `.download()` su bucket Supabase privato
- Modificare `MisuraModalShell` per un singolo modulo
- Prompt monolitici che toccano molti file insieme
- Fix alla cieca senza diagnosi quando un bug ritorna
- Lanciare gli E2E contro il DB di produzione
- Rimuovere la doppia guardia DEV+flag del bypass AuthGate
