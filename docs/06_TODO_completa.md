# Monitor Igiene — TODO al 2026-05-13

Audit incrociato: chat history, memoria persistente, codice attuale di `app-web/`.

> **Nota storica**: la versione precedente di questo file conteneva sezioni CRITICO/ALTO ormai chiuse (corruzione `exportSchemas.ts`, regression numFmt OWAS, decisione workflow OCRA). Tutte risolte. Vedi `HANDOVER-app-monitoraggi.md` per la fotografia attuale.

---

## ALTO — In corso o prossimo step

### A1. MMC step B — labels normative su PDF

**Contesto:** lo step A è chiuso (8 mag 2026): aggiunte etichette "(NIOSH)" su Sollevamento e "(Snook-Ciriello)" su Spinta/Traino/Trasporto in `MisuraMmcModal` UI + template `mmc.xlsx`. Da fare lo stesso sul PDF.

**File da toccare:** `src/lib/pdf/moduli/mmc.ts`

**Da decidere insieme a Davide:**
- Posizionamento labels nel PDF (group row sopra header come nell'xlsx? Inline negli header? In nota a piè di tabella?)

**Stima:** 1 ora di lavoro, 1 prompt singolo per Claude Code.

### A2. J3b — PDF narrativo (caso B)

**Contesto:** J3a chiuso 8 mag 2026 con strategia Lean C (solo caso A: stampa fronte FC). Caso B = PDF narrativo con tabella + commenti + valutazioni discorsive, rimandato a dopo.

**Da decidere insieme:**
- Struttura del PDF narrativo (sezioni, ordine, commenti per misura vs riassuntivi)
- Quali moduli supportano caso B (tutti? Solo alcuni?)
- Come si triggera dall'UI (toggle accanto al pulsante PDF? Pulsante separato?)

**Stima:** fronte da pianificare in più step (mockup → architettura → implementazione modulo pilota → estensione 16/16).

### A3. J4 — Granularità export

**Contesto:** oggi l'export è per singola campagna. Da implementare: 1 campagna / tutto il cantiere / personalizzato (selezione campagne).

**Da decidere insieme:**
- UI di selezione (modal con checkbox? Pagina dedicata?)
- File output: 1 file unico vs 1 file per campagna in zip
- Nome file output

**Stima:** medio, dipende dalla decisione UI.

---

## MEDIO — Estensioni modello dati lab

Tutte e 3 implicano: modale + DB schema (migration Supabase) + `exportSchemas.ts` + `lib/pdf/moduli/*.ts`.

### M1. IPA — campi lab

Oggi: nessun campo lab persistito. Da aggiungere campi per analisi IPA in laboratorio (concentrazioni, soglie, esito).

### M2. Acqua — microbiologici

Oggi: solo fisico-chimico. Da aggiungere coliformi totali, E. coli, enterococchi (e altri parametri microbiologici da concordare con normativa).

### M3. Biologico-SAS — espliciti + specie

Oggi: scheletro. Da aggiungere campi espliciti + identificazione specie individuate.

**Riferimento:** audit Cowork 7 maggio 2026 (chimici + biologici).

---

## BASSO — Bucket B/C audit export

### B1. Bucket B (R-4) — overflow >32 misure

Aperto da chat 04 (5 mag). Gestire il caso in cui un cantiere genera più di 32 campionamenti per un modulo (Rumore, Polveri, Amianto, IPA, ecc.).

**Decisione di design da prendere:**
- Split file numerati (`_part1.xlsx`, `_part2.xlsx`)
- Foglio multipagina dentro lo stesso file
- Limite hard 32 con warning utente e doppia campagna

### B2. Bucket C — cosmetici export

Differiti, non bloccanti:

- Strumento Rumore hardcoded → leggere da `ctx.strumento`
- Label "Tecnico rilevatore" inconsistenti tra moduli
- Data WBV scritta come stringa anziché Date
- Statistiche WBV per gruppo (medie/max calcolate in export)
- Numerazione HAV blocchi
- Decimali OWAS (al momento integer, valutare se servono decimali)

---

## BACKLOG UX — Bassa priorità

### UX1. Conferma chiusura modale con dati non salvati

Pattern già implementato in `MisuraModalShell` (dialog "Hai scritto dei dati. Vuoi davvero scartarli?"). Verificare se va applicato anche fuori dai modali misura (es. NuovoCantiereModal, NuovaCampagnaModal).

### UX2. Focus management

Apertura modali → primo input focus. Chiusura modali → ritorno focus al trigger. Esc per chiudere ovunque.

### UX3. Sistema toast

**Decisioni di design da prendere prima di implementare:**
- Posizione (top-right? bottom-center?)
- Durata di default (3s? 5s?)
- Tipi (success / error / info / warning)
- Stack policy (max N visibili? code?)

### UX4. Pattern error state pagine

`<ErrorState />` già implementato. Da definire **strategy unificata** lato React Query (retry automatici? boundary? toast su 5xx?).

---

## TEST — Stato infrastruttura

### T1. Smoke test pagine — Vitest (NON FATTO)

Test con `screen.getBy*` per: Home, Anagrafica, ListaCampagne, PaginaCantiere, FoglioCampagna. Mock supabase + react-query.

**Nota 13 mag**: dopo aver introdotto Playwright (T3), Vitest perde priorità. Smoke pagine fatti meglio da Playwright. Tenere Vitest solo per **logica pura** (utility, parser, helper). Riconsiderare scope.

### T2. Smoke test export FC manuale

Esiste `SMOKE_TEST.md` (untracked al momento). Pianifica run: 1 cantiere demo + 16 moduli + 1 export per modulo + checklist.

**Nota 13 mag**: potenzialmente automatizzabile via Playwright (download → parse → assert su contenuto file generato). Vedi T5.

### T3. Playwright E2E ✅ — base attiva (13 maggio 2026)

Setup completato. 2 test attivi:
- `e2e/home.spec.ts` (smoke Home, ~2s)
- `e2e/rumore-modal.spec.ts` (flusso UI completo Rumore, no save, ~3.4s)

Comandi: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:report`

**Da aggiungere quando serviranno** (NON ora, no value senza un trigger):
- Test E2E con salvataggio + cleanup DB (richiede `E2E_SUPABASE_SERVICE_KEY`)
- Test E2E per altri 15 modali (replicare pattern Rumore)
- Test export Excel/PDF (download → parse → assert) — vedi T5

### T4. Chrome DevTools MCP ✅ (13 maggio 2026)

Configurato scope user di Claude Code. Usabile per diagnostica live di `localhost:5173`. Nessun follow-up.

Esempi d'uso:
- "Apri localhost:5173, vai sulla Home, dimmi se ci sono errori console"
- "Apri il modale Rumore e fammi screenshot"
- "Verifica che la richiesta a Supabase per `cantieri` ritorni 200"

### T5. Test E2E export (futuro)

Idea: estendere Playwright a test che scaricano file Excel/PDF dall'app, li parsano (xlsx via openpyxl, PDF via pypdf) e verificano contenuto. Coprirebbe regressioni numFmt, foto sovrapposte, paginazione, ecc.

Stima: complesso, ~2-3 giornate. Da fare quando i bug di export diventano ricorrenti.

---

## REPO HOUSEKEEPING

### H1. Stato git al 13 maggio 2026

✅ Pushato su `main` il setup Playwright + Chrome DevTools MCP + 2 test E2E (commit `a161d6a`).

Stato pulito. Nessun branch attivo dimenticato al momento.

⚠️ Le deny rules in `.claude/settings.json` impediscono a Claude Code di fare `git push`. Va fatto manualmente in PowerShell separata.

### H2. Anomalie debt note

1. **Routing legacy**: rimuovere `/cantiere/:id` (singolare) da `App.tsx` quando sicuri non sia usato
2. **Naming OWAS camelCase** → normalizzare a snake_case come gli altri schemi
3. Cartella `Monitor Igiene/` (vuota?) dentro `app-web/` da eliminare se ancora presente
4. **Lint pre-esistente** `react-hooks/set-state-in-effect` su numerosi modali. Pre-bug-fix sistemico. Non bloccante. Da pulire in round di refactor.

---

## ANTI-PATTERN — DA NON FARE

Riferimento rapido (vedi `HANDOVER` per dettagli):

- ❌ Shorthand `border:`, `padding:`, `margin:` con override condizionali
- ❌ Workaround code-level per bug template Excel (risolvere nel `.xlsx` con Python)
- ❌ `.download(path)` diretto su bucket Supabase privato (sempre `createSignedUrl` + `fetch`)
- ❌ Foto-row Excel "vuote": dopo `row.height = N` fare anche `row.getCell(1).value = null`
- ❌ Modificare `MisuraModalShell` per esigenze di un singolo modulo
- ❌ Tailwind / styled-components / CSS modules / routing diverso da React Router v7
- ❌ Prompt monolitici che modificano molti file insieme
- ❌ Aggiungere `data-testid` sparsi nel codice — solo dove servono per E2E stabili
- ❌ Modificare un test E2E "per farlo passare" senza capire il fallimento

---

## Ordine consigliato di esecuzione

1. **A1** — MMC step B PDF (chiusura del task A già aperto)
2. **A2** — J3b PDF narrativo (mockup + design prima del codice)
3. **A3** — J4 granularità export
4. **M1-M3** — Estensioni modello dati lab (uno per volta, partendo da quello con più urgenza pratica)
5. **B1, B2** — Audit Bucket B/C
6. **UX1-UX4** — Backlog UX
7. **T1, T2, T5** — Test (solo se serviranno davvero — Playwright copre già il grosso)
8. **Phase I** — Offline + sync (per ULTIMA, dopo che tutto J è validato)
