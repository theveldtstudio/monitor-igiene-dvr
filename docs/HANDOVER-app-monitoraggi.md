# 🤝 HANDOVER — App Monitoraggi 81/08

**Stato al 13 maggio 2026**
Documento di passaggio di consegne / fotografia attuale del progetto.

---

## 📌 Cos'è il progetto

App web per RSPP (Responsabile Servizio Prevenzione e Protezione) per la raccolta in cantiere di misure di campionamento ai sensi del **D.Lgs. 81/08**. 16 moduli di campionamento (rumore, polveri, vibrazioni, OWAS, MMC, OCRA, CEM, ecc.).

Utente: **un singolo RSPP** (non multi-utente). App personale per uso in cantiere, mobile + desktop.

Repository: `https://github.com/theveldtstudio/monitor-igiene.git`
Cartella di lavoro Claude Code: `monitor-igiene/app-web`

---

## 🛠 Stack tecnico

- **React 19 + Vite + TypeScript**
- **React Router DOM v7** (BrowserRouter)
- **TanStack Query v5** (state server, in `src/hooks/use*`)
- **Supabase** (DB cloud + Storage + RLS) — client in `src/lib/supabase.ts`
- **CSS-in-JS inline** (oggetti `styles: Record<string, React.CSSProperties>`) + design tokens CSS custom properties in `src/styles/globals.css`
- **ExcelJS** per export `.xlsx`
- **jsPDF 4.2.1 + jspdf-autotable 5.0.7** per export PDF
- **Playwright 1.60+** per test E2E (solo Chromium, headless, scope `e2e/`)
- **Chrome DevTools MCP** (ufficiale Google) configurato scope user di Claude Code per diagnostica live: aprire app, leggere console/network, ispezionare DOM, screenshot
- ESLint configurato, no Prettier

⚠️ **NO Tailwind, NO CSS modules, NO styled-components.**

⚠️ Su Windows servono **due PowerShell aperte** durante lo sviluppo: una per `npm run dev` (dev server :5173) e una per `claude` (Claude Code). Eventualmente una terza per i git push manuali (impediti a Claude Code dalle deny rules).

---

## 📁 Struttura progetto

```
src/
├── components/      33+ componenti TSX (modali misura + UI condivisa)
├── pages/           7 pagine
├── hooks/           21+ hook custom TanStack Query
├── data/            6 file (moduliRegistry, moduliCampionamento, cardSubtitles,
│                            owasLookup, exportSchemas, ocraChecklistData)
├── contexts/        AppLockContext (PIN/lock app)
├── utils/           pinStorage, fotoStorage
├── lib/
│   ├── supabase.ts
│   ├── exportExcel.ts          (orchestratore Excel)
│   ├── exportFotoSheet.ts      (foglio foto Excel)
│   └── pdf/
│       ├── core.ts             (orchestratore + PdfTabellaStatica/Adattiva)
│       ├── _helpers.ts
│       ├── fotoAppendix.ts
│       ├── moduli/             (16 moduli .ts)
│       └── index.ts            (barrel)
├── types/           index.ts (Cantiere, Campagna, Misura, RisorsaCantiere, FotoMisura, ...)
├── constants/       campionamenti.ts
├── styles/          globals.css (design tokens)
└── assets/

e2e/                 (Playwright)
├── home.spec.ts             (smoke test Home)
└── rumore-modal.spec.ts     (flusso UI modale Rumore, no save no DB)
playwright.config.ts

public/
└── templates/       16 template .xlsx per export

tools/               script Python per fix template .xlsx (numFmt, build)
```

---

## ✅ Stato avanzamento

### 🧱 Fondamenta (completo)
- A: setup base + Supabase client
- B: schema DB + tipi TS
- C: navigazione + Home cantieri
- D: foglio campagna + cards misure
- E: 4 sotto-step di UX foglio campagna
- **R1+R2+R3** (refactor cruciale): pattern `MisuraModalShell` + `CardMisuraGenerica` + `MODULI_REGISTRY` — ha permesso F2-F15 al primo colpo

### 📊 Moduli misura — 16/16 ✅

| ID modulo                | Categoria  | Stato |
|--------------------------|------------|-------|
| rumore                   | fisici     | ✅    |
| vibrazioni-wbv           | fisici     | ✅    |
| vibrazioni-hav           | fisici     | ✅    |
| microclima               | fisici     | ✅    |
| cem                      | fisici     | ✅    |
| roa                      | fisici     | ✅    |
| polveri                  | chimici    | ✅    |
| carbonio-elementare      | chimici    | ✅    |
| gas                      | chimici    | ✅    |
| ipa                      | chimici    | ✅    |
| amianto                  | chimici    | ✅    |
| biologico-sas            | biologici  | ✅    |
| acqua                    | biologici  | ✅    |
| mmc                      | ergonomia  | ✅    |
| owas                     | ergonomia  | ✅    |
| ocra                     | ergonomia  | ✅ (livello 4: form + calcolo live + lookup) |

### 🔐 Fase H — PIN/Auth ✅
- PIN locale 4 cifre, hash SHA-256 in `localStorage`
- Lock automatico all'apertura/refresh
- Bottone manuale 🔒 "Blocca app" **SOLO nella Home** (scelta esplicita di design)
- Reset PIN via dialog "Hai dimenticato il PIN?"
- File: `src/utils/pinStorage.ts`, `src/contexts/AppLockContext.tsx`, `src/components/PinKeypad.tsx`, `src/components/PinScreen.tsx`

⚠️ I campi `pin_tecnico` e `pin_osservatore` su `Campagna` sono **diversi** dal PIN-app: sono PIN di firma metrologica della campagna.

### 📸 Fase G — Foto ✅
- Bucket Supabase Storage `misure-foto` (privato, 5MB max, MIME image/jpeg/png/webp)
- 3 RLS policies: SELECT/INSERT/DELETE per anon+authenticated
- Compressione client-side: 1280px lato lungo, JPEG qualità 0.7
- Tabella DB `foto_misura` (id, misura_id, path_locale, url_storage, sync_pending, created_at)
- Componente `FotoUploader` riusabile (max 5 foto/misura, camera + galleria, preview fullscreen, cancellazione con conferma)
- Pattern integrazione applicato a **tutti i 16 modali**: dopo CREATE il modale resta aperto in modalità modifica per consentire upload foto, dopo UPDATE chiude come prima
- File: `src/utils/fotoStorage.ts`, `src/hooks/useFotoMisure.ts`, `src/components/FotoUploader.tsx`
- `QueryClientProvider` configurato in `main.tsx` (staleTime 5min, retry 1, refetchOnWindowFocus false)

### 📊 Fase J — Export

**J1 ✅ + J1-bis ✅** — Export Excel su 16/16 moduli
- 3 schemi specifici (Rumore, WBV, HAV) con template `.xlsx` reali
- 13 schemi generici via `applyDataGenerico` + `buildSchemaGenerico` factory
- `ExportContext` arricchito con `RisorsaCantiere[]` (postazioni/fasi/macchine)
- Strategia ibrida in `applyDataGenerico`: prima campo `_nome` denormalizzato, fallback ID→nome lookup
- Naming snake_case ovunque tranne OWAS (camelCase, da normalizzare in futuro)
- WBV con singolo `macchina_id`/`macchina_nome`
- Risorse passate via 3× `useRisorseCantiere` + `useMemo` in `FoglioCampagna.tsx`

**J2 ✅ + J2.1 ✅** — Foto in export Excel su 16/16 moduli
- Foglio "Foto" separato, galleria 2 foto/riga ~120×90mm
- Header: `Misura #N — Postazione — Fase/Mansione/Macchina`
- Compressione export 800px / quality 0.6 via OffscreenCanvas
- Download seriale, skip + placeholder su errore
- File: `src/lib/exportFotoSheet.ts`
- ⚠️ **Learning**: foto-row "vuote" (solo `addImage`, nessuna cella scritta) NON vengono materializzate nell'XML → `row.height` non viene applicata e Excel usa default 1pt (foto sovrapposte). Fix: dopo `row.height = N` fare anche `row.getCell(1).value = null` per forzare la materializzazione. ExcelJS `getRow()` è 1-indexed, `addImage` `tl.row` è 0-indexed: attenzione off-by-one.
- ⚠️ **Learning download foto**: per scaricare da bucket Supabase privato (`misure-foto`), usare SEMPRE `createSignedUrl(path, 300)` + `fetch(url).blob()`, NON `.download(path)` diretto che fallisce silenziosamente con RLS standard. `queryKey` di `useFotoMisure` include `misureIdsKey` contro cache stale.

**J3a ✅** — Export PDF su 16/16 moduli (caso A: stampa fronte FC)
- Stack: jsPDF 4.2.1 + jspdf-autotable 5.0.7
- Architettura `lib/pdf/`: `core.ts` orchestratore + `PdfTabellaStatica`/`PdfTabellaAdattiva`, `_helpers.ts`, 16 moduli/*.ts, `fotoAppendix.ts`, `index.ts` barrel
- A4 landscape uniforme, firma vuota per stampa, appendice foto in coda
- `FoglioCampagna.tsx`: `MODULI_PDF_SUPPORTATI` 16 voci + switch 16 case
- Strategia adattiva cantiere/lab su polveri/carbonio/amianto/biologico-sas
- Fix bug cache foto stale in `useFotoMisure` (invalidazione prefisso campagna)

**MMC step A ✅** — Labels normative xlsx
- Etichette "(NIOSH)" e "(Snook-Ciriello)" in `MisuraMmcModal` sezioni form
- Group row in template `mmc.xlsx` (B-I e J-M con merge su 4 blocchi righe 3/17/31/45)
- Header multi-row in PDF `mmc.ts` (`RowInput[]` con colSpan 1+6+4+1=12)
- Modificati: `build-mmc-template.py` (PAGE_ROWS 13→14, +ROW_H_GROUP), `exportSchemas.ts` (headerRow shiftata di +1 su 4 blocchi), `core.ts` (head `string[][]` → `RowInput[]`)

### 🧪 Testing E2E ✅ (nuovo — 13 maggio 2026)

**Playwright** (solo chromium, headless) per smoke + flussi UI.

File:
- `playwright.config.ts` in root, `baseURL: http://localhost:5173`, `workers: 1` (test seriali, evita race future con Supabase), `headless: true`, reporter `list + html`
- `e2e/home.spec.ts`: smoke test Home — caricamento + nessun errore console (filtrati favicon/ServiceWorker/Manifest)
- `e2e/rumore-modal.spec.ts`: flusso UI completo Home → cantiere → modulo Rumore → campagna → modale → compila Leq dB(A) → verifica UI (titolo, 4 input, bottone Salva enabled). **NON salva, NON tocca DB esplicitamente**

Comandi:
- `npm run test:e2e` — esecuzione (~10-15s totali)
- `npm run test:e2e:ui` — modalità UI interattiva
- `npm run test:e2e:report` — apre l'ultimo HTML report

**Bypass PIN AppLock** via `page.addInitScript` che inietta `app_pin_hash` (SHA-256 di "1234" = `03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4`) + `app_locked='0'` in localStorage prima del `goto`. Helper riusabile `bypassPinLock(page)` definito nello spec stesso.

**Selettori stabili**: data-testid aggiunti in:
- `Home.tsx` riga 215: `data-testid="cantiere-card"` sui Link cantieri
- `PaginaCantiere.tsx` riga 64: `data-testid="modulo-card-${modulo.id}"` sui Link moduli

**Pattern dirty-guard MisuraModalShell**: alla chiusura del modale se il form è dirty appare dialog "Hai scritto dei dati. Vuoi davvero scartarli?". Il test gestisce esplicitamente cliccando "Scarta" dopo "Annulla".

**Strategia "no DB cleanup"** (scelta consapevole): i cantieri `TEST_E2E_<timestamp>` creati dai test restano nel DB tra run. Pulizia manuale occasionale dalla Supabase dashboard (~10 run = 5 sec di housekeeping). Quando servirà un test che salva davvero in DB, useremo `E2E_SUPABASE_SERVICE_KEY` (non ancora configurata).

**Chrome DevTools MCP** (Google ufficiale) registrato scope user di Claude Code:
```
claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest --no-usage-statistics
```
Usato per diagnostica live (es. "apri localhost:5173 e leggi errori console", "fai screenshot del modale Rumore", "ispeziona DOM della Home"). Non avvia il dev server: il dev server deve essere già attivo su `:5173`.

---

## ⏸️ Cosa resta da fare

### Priorità alta
1. **MMC step B** — labels normative su PDF (posizionamento da decidere insieme)
2. **J3b** — PDF narrativo (caso B): tabella + commenti + valutazioni discorsive
3. **J4** — Granularità export (1 campagna / tutto cantiere / personalizzato)

### Priorità media (estensioni modello dati lab)
4. **IPA lab** — oggi nessun campo lab persistito
5. **Acqua lab** — oggi solo fisico-chimico, mancano microbiologici (coliformi, E. coli, enterococchi)
6. **Biologico-SAS** — espliciti + specie identificate

Tutte e 3 implicano: modale + DB schema + exportSchemas + PDF.

### Priorità bassa
7. **Fase I — Offline + sync** (SQLite locale ↔ Supabase) — la più rischiosa, da fare per ULTIMA dopo che J ha validato tutti gli output
8. **Test E2E con salvataggio DB** — aggiungere `E2E_SUPABASE_SERVICE_KEY` in `.env.local`, scrivere test che salvano misure e fanno cleanup automatico. Da fare quando il flusso save di un modale è critico da proteggere
9. **Test E2E altri 15 modali** — replicare pattern di `rumore-modal.spec.ts`. Solo quando serve davvero (quando si toccano i modali in modo invasivo)

---

## 🎨 Convenzioni stilistiche IMPORTANTI

### CSS-in-JS — REGOLA CRITICA

**MAI usare la shorthand `border:` negli oggetti `styles`** se altri stili condizionali (es. `*Open`, `*Selected`) modificano una sola direzione (`borderBottom`, `borderColor`). Sempre **longhand**:

```ts
// ❌ NO
const styles = {
  base: { border: '1px solid #ccc' },
  open: { borderBottom: 'none' },  // bug: "Removing/Updating a style property during rerender"
};

// ✅ SÌ
const styles = {
  base: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ccc',
  },
  open: {
    borderBottomWidth: 0,
  },
};
```

Stesso vale per `padding`, `margin` con override su singole direzioni. **Default: longhand sempre.**

### Design tokens

Usare le CSS custom properties di `src/styles/globals.css`:
- `--bg-app`, `--bg-card`, `--accent`
- `--text-primary/secondary/tertiary`
- `--border`, `--radius-card/toggle-outer/badge`
- `--space-page-x/section-gap`
- `--font-sans`, `--skeleton-bg`, `--error-bg`

### TypeScript

- `verbatimModuleSyntax: true` → usa **`import type`** per type-only imports
- `noUnusedLocals` + `noUnusedParameters` attivi
- `erasableSyntaxOnly: true` → no enum runtime, usa union types o `as const`

### data-testid

Aggiungere SOLO dove servono per test E2E stabili. Convenzione:
- Card di entità di lista: `data-testid="<entita>-card"` (es. `cantiere-card`)
- Card multiple della stessa entità in stessa pagina: includere ID nel testid (es. `modulo-card-rumore`)

---

## 🧩 Pattern principali consolidati

### Pattern modale misura (16 moduli identici)

Ogni `MisuraXxxModal.tsx` usa `MisuraModalShell` come wrapper. Lo shell gestisce open/close/dirty/validation/saving/error. Il modulo specifico fornisce il form come `children` e implementa `handleSubmit`.

Entry nel registry `src/data/moduliRegistry.ts`:
```ts
'<modulo-id>': {
  modalComponent: MisuraXxxModal,
  subtitleBuilder: subtitleXxx,
}
```

### Pattern bug sistemico modali (RISOLTO 7 mag 2026)

Tutti i 15 modali residui (oltre Rumore già OK) avevano lo stesso bug di sync form. Pattern del fix: **split `useEffect` form-sync in due**:
1. `[open, initialSnapshot]` → sync form
2. `[open, resetError]` → reset error

Varianti note: OWAS con `else={1,1,1,1}`, OCRA con `setRisposte({})`.

### Pattern foto allegate (uniforme su tutti i 16 moduli)

```ts
// 1. State interno per misuraId (transita da null a uuid dopo primo salvataggio)
const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(misuraDaModificare?.id ?? null);
const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(misuraDaModificare?.numero);

// 2. useEffect sync su open + misuraDaModificare
useEffect(() => {
  if (open) {
    setMisuraIdCorrente(misuraDaModificare?.id ?? null);
    setNumeroMisuraCorrente(misuraDaModificare?.numero);
  } else {
    setMisuraIdCorrente(null);
    setNumeroMisuraCorrente(undefined);
  }
}, [open, misuraDaModificare?.id, misuraDaModificare?.numero]);

// 3. isModifica deriva da state interno
const isModifica = misuraIdCorrente != null;

// 4. handleSubmit: dopo CREATE valorizza state e NON chiude; dopo UPDATE chiude
if (result) {
  onSaved(result);
  if (!misuraIdCorrente) {
    setMisuraIdCorrente(result.id);
    setNumeroMisuraCorrente(result.numero);
  } else {
    onClose();
  }
}

// 5. <FotoUploader misuraId={misuraIdCorrente} maxFoto={5} /> dopo Note
```

### Risorse cantiere

`RisorsaCantiere` è entità unificata con `tipo: 'macchina' | 'fase' | 'postazione'`. Hook: `useRisorseCantiere(cantiereId, tipo)`. Non esistono tabelle separate.

### Schema dati misura

`Misura.dati: Record<string, unknown>` — payload JSON libero per-modulo. Nessuna validazione TS sui campi interni. Ogni modulo costruisce e legge il proprio `dati`.

### Pattern fix template Excel (numFmt)

Bug noto ExcelJS: condivisione `xfId` tra colonne adiacenti → `numFmt` "bleed" cross-colonna.

**Root-cause fix**: script Python in `tools/` che assegnano `numFmt` distinti per gruppo di colonne direttamente nel `.xlsx` template. Pattern replicabile, applicato a:
- `tools/fix-owas-template.py` (`D='[hh]:mm:ss'`, `E-I='0'`, `B/C/J='General'`)
- `tools/fix-wbv-template.py` (17 merges + col N=12)
- `tools/fix-rumore-template.py` (`B='[hh]:mm:ss'`, `F/G/H='0.0'`)

Evitare workaround code-level.

### Pattern test E2E Playwright (nuovo)

Per scrivere un test E2E di un modale `MisuraXxxModal`:

1. **Bypass PIN** con helper `bypassPinLock(page)` in `addInitScript` (vedi `rumore-modal.spec.ts`)
2. **Selettori preferenziali**, in ordine: `getByTestId` > `locator('#id-html-stabile')` > `getByRole('button'/'link', {name: 'Testo esatto'})` > `getByText` (ultima scelta, fragile)
3. **Nomi cantieri test**: prefisso `TEST_E2E_<Date.now()>` per riconoscibilità
4. **Pattern dirty-guard**: dopo `Annulla` su modale con form compilato, cliccare `Scarta` per chiudere il dialog di conferma
5. **Non salvare** finché non c'è `E2E_SUPABASE_SERVICE_KEY` configurata: limitarsi a verificare UI fino al bottone Salva

### Sync offline-first (preparato, non attivo)

Tipi `Misura`, `Campagna`, `FotoMisura`, `RisorsaCantiere` hanno già `sync_pending: boolean`. Sincronizzazione effettiva = Fase I.

---

## 🤝 Working style con l'utente

L'utente lavora con **due Claude in parallelo** + 2 strumenti diagnostici:
1. **Claude (chat)** — discute design/UX/mockup, scrive prompt strutturati
2. **Claude Code** — esegue i prompt sul filesystem locale del progetto
3. **Cowork** (occasionale) — audit codice, test su file binari (.xlsx aperti), ispezioni filesystem locale Windows
4. **Claude Chrome extension** (occasionale) — ispezione DOM, screenshot, test web app live
5. **Chrome DevTools MCP** (in Claude Code, dal 13 mag 2026) — diagnostica live di `localhost:5173`
6. **Playwright** (dal 13 mag 2026) — test E2E riproducibili

Flusso standard:
1. Utente solleva esigenza
2. Claude chat: discussione → mockup → pro/contro → raccomandazione motivata
3. Claude chat: scrive prompt copia-incollabile (in blocco di codice)
4. Utente copia-incolla in Claude Code (o Cowork/Chrome ext quando appropriato)
5. Esecuzione, riporto
6. Utente testa
7. Si itera

### Regole stabilite

- **Italiano informale "tu"**, non "lei"
- **Mockup prima del codice** per ogni decisione visiva/UX
- **Pro/contro motivati** quando si presentano alternative + raccomandazione esplicita
- **Onestà tecnica**: dire se qualcosa è rischioso, side effect noti, complessità nascoste
- **Niente yes-man**: se l'utente chiede qualcosa che non funziona, dirlo
- **Prompt < ~150 righe** → blocco unico
- **Prompt > ~150 righe** → divisi in step copia-incollabili autonomi, con report intermedio
- **`ask_user_input_v0`** per scelte discrete (l'utente preferisce tappare bottoni)
- **Diagnosi prima del fix** quando un bug ritorna più volte
- **Memorie**: aggiornare `memory_user_edits` quando ci sono milestone/decisioni importanti
- **Conventional Commits** ovunque
- **Delega a Cowork/Chrome ext/Chrome DevTools MCP/Playwright**: quando un compito può essere fatto da uno di questi tool, fornire direttamente il prompt da copiare al tool appropriato invece di chiedere a Davide di fare il test manualmente

### Delega di Claude chat sulle scelte

L'utente delega le decisioni tecniche routine (quale fase/step affrontare prima, ordine delle fasi). Claude chat sceglie autonomamente seguendo il proprio ragionamento. Continua a chiedere conferma su scelte di design, UX, naming, colori.

---

## 🚦 Anti-pattern da NON fare

- ❌ NON usare `border:`, `padding:`, `margin:` shorthand quando ci sono override condizionali
- ❌ NON aggiungere Tailwind, styled-components, CSS modules
- ❌ NON aggiungere routing diverso da React Router DOM v7
- ❌ NON modificare `MisuraModalShell` per esigenze di un singolo modulo
- ❌ NON usare `import` non-`type` per type-only (errore `verbatimModuleSyntax`)
- ❌ NON fare prompt "monolitici" che modificano molti file insieme — preferire step piccoli e testabili
- ❌ NON fare workaround code-level per bug template Excel — risolvere alla radice nel `.xlsx` con script Python in `tools/`
- ❌ NON usare `.download(path)` diretto su bucket Supabase privato — sempre `createSignedUrl` + `fetch`
- ❌ NON aggiungere data-testid sparsi nel codice — solo dove serve per test E2E stabili
- ❌ NON modificare un test E2E "per farlo passare" senza capire perché fallisce — diagnosi prima

---

## 📂 Project files (file di campagna originali RSPP)

L'utente ha caricato 9 file `.xlsm` come Project files (i suoi fogli di campagna storici, da cui derivare struttura e calcoli):
- `Foglio di campagna rumore1.xlsx`
- `VIBR20.xlsm` (vibrazioni)
- `Foglio campagna EmissInAtm.xlsm`
- `Foglio di campagna carbonio elementare.xlsm`
- `FC_gas_.xlsm`
- `FC_Monitoraggio Acqua.xlsm`
- `Foglio di campagna biologico.xlsm`
- `Foglio di campagna MMC.xlsx`

Sono read-only di riferimento.

---

## 🔑 Anomalie note (debt da pulire in futuro)

1. **Routing legacy**: coesistono `/cantiere/:id` (singolare, vecchio) e `/cantieri/:id` (plurale, nuovo) in `App.tsx`. Da rimuovere il legacy quando sicuri non sia usato.
2. **Naming OWAS camelCase**: tutti gli altri schemi usano snake_case, OWAS è camelCase. Da normalizzare.
3. **Bucket B audit (R-4)**: overflow >32 misure per modulo. Decisione di design pendente: split file numerati / multi-pagina dentro stesso file / limite hard 32 con warning.
4. **Bucket C audit cosmetici**: strumento Rumore hardcoded → leggere da `ctx.strumento`; label "Tecnico rilevatore" inconsistenti tra moduli; statistiche WBV per gruppo; numerazione HAV blocchi; decimali OWAS.
5. **Lint warning `react-hooks/set-state-in-effect`** (al 13 mag 2026) su numerosi modali (MisuraAcquaModal, MisuraAmiantoModal, MisuraModalShell, MisuraOcraModal, MisuraOwasModal e altri). Pre-esistenti, non bloccanti, bug runtime già risolto col pattern split useEffect. Da pulire quando si fa giro di linting/refactor.

---

## 📝 Comandi utili

```bash
npm run dev               # Avvia dev server (Vite, port 5173)
npm run build             # tsc -b + vite build
npm run lint              # ESLint check
npm run preview           # Preview build
npm run test:e2e          # Playwright headless (~10-15s)
npm run test:e2e:ui       # Playwright UI interattiva
npm run test:e2e:report   # Apri HTML report ultima run
```

PowerShell Windows — apri localhost: `start http://localhost:5173`

Git workflow: feature branches → merge in `main` → `git push origin main`. Le deny rules in `.claude/settings.json` impediscono a Claude Code di fare `git push`: va fatto manualmente in una PowerShell separata.

---

## 🎯 Quando inizi una nuova chat

**Prompt iniziale suggerito**:

> Ciao Claude. Lavoreremo a un progetto già avanzato: un'app web per RSPP per monitoraggi 81/08, sviluppata insieme con Claude Code. Sto allegando il file HANDOVER-app-monitoraggi.md che riassume tutto lo stato. Leggilo attentamente e applica le regole di working style indicate. Quando hai finito, rispondimi solo "Letto, pronto. Su quale fase procediamo?" e aspetta le mie istruzioni.

Allega questo file alla nuova chat (o caricalo come Project file per averlo permanente).

---

*Fine handover. Aggiornato 13 maggio 2026.*
