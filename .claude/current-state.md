# Current State

> Aggiornato: 2026-09-28
> Aggiornare a OGNI milestone importante.

## In sintesi

App **funzionalmente completa per uso personale**, in produzione su Netlify e già testata in cantiere.
Ultimo sviluppo codice: 9 giu 2026. Da set 2026 l'obiettivo è **terminarla e venderla** ad altri professionisti,
in due pacchetti: **Monitoraggi** (standalone) e **Monitoraggi + DVR** (copia collegata a un software DVR esterno).

---

## Completato

### Fondamenta
- Fasi A-E (setup, schema DB, navigazione, foglio campagna, UX sotto-step)
- Refactor R1+R2+R3 (modal shell + card generica + registry)

### Moduli — 16/16
Tutti i moduli misura completi (elenco in `CLAUDE.md`).

### Accesso
- Phase H — PIN locale 4 cifre (SHA-256 in localStorage), lock all'apertura, bottone lock solo in Home, reset "Hai dimenticato il PIN?"
- **Login Supabase email+password** come gate pre-PIN (`AuthContext`, `LoginScreen`, `AuthGate`) — 9 giu 2026
- Bypass AuthGate per E2E con doppia guardia DEV+flag, inerte in prod — 9 giu 2026

### Phase G — Foto
- Bucket privato `misure-foto`, pattern uniforme 16 modali, compressione 1280px/q0.7, max 5 foto/misura

### Phase J — Export (solo Excel — PDF rimosso 21 mag 2026)
- Excel 16/16 moduli con `ExportContext` arricchito, foto in foglio dedicato
- Paginazione multi-foglio (overflow -> "Misure X-Y")
- Export multi-campagna (1 foglio per campagna) — 5 giu 2026
- Export cantiere completo in zip
- Footer strumentazione/tecnico e committente su rumore/wbv/hav; label normative MMC

### Fase I — Offline + sync + PWA
- Dexie + sync queue FK-ordered + pull cloud->locale + PWA con avviso aggiornamento
- **LWW nel pull su `updated_at`** (step 1-3, 8 giu 2026): confronto numerico in `lwwMerge.ts`, guard `sync_pending`
- Safety net su update di record cancellati

### Qualità / UX
- Sistema toast custom; `humanizeError`; `AppErrorBoundary` resettato per route
- Dirty-guard + focus automatico su NuovaCampagnaModal / NuovoCantiereModal
- Perf: route code-splitting (`React.lazy`), vendor split `manualChunks`, ExcelJS lazy (entry ~12 kB gzip)
- Deps aggiornate per vulnerabilità npm audit (8 giu 2026)
- Lint 0 errori/0 warning emessi; `tsc` pulito (verificato 28 set 2026)

### Test E2E — 18 spec, ultima run verde (9 giu 2026)
- `home`, `rumore-modal` (UI)
- 16/16 `export-<modulo>`: seed su DB Supabase di TEST via service-key -> export -> parse xlsx -> assert; teardown globale
- Playwright avvia il dev server puntato al DB di test (mai prod)

### Deploy
- Netlify (`netlify.toml`: `npm run build`, publish `dist`, redirect SPA)

---

## Focus corrente

**Fase K — Preparazione alla vendita** (vedi `docs/06_TODO_completa.md`).
Primo passo da decidere con Davide: modello di distribuzione (un progetto Supabase per cliente vs. multi-tenant condiviso con `org_id` + RLS).

---

## Prossimi fronti

1. **Multi-tenancy + RLS per utente/organizzazione** — bloccante per vendere
2. **Registrazione/onboarding cliente, licenze/abbonamenti**
3. **Aspetti legali**: EULA/termini, privacy e DPA (Art. 28 GDPR), fatturazione
4. **Confine dati verso DVR**: contratto di export/API per il pacchetto Monitoraggi + DVR
5. **Validazione E2E offline/sync** — ancora zero test automatici su drain/pull/conflitti
6. Debt minore: naming OWAS camelCase, cosmetici export Bucket C, refactor set-state-in-effect

---

## Debt noto

- Naming OWAS camelCase -> da normalizzare a snake_case
- 49 `react-hooks/set-state-in-effect` silenziati con disable-line (bug runtime già risolto)
- Push sync: vince l'ultimo che scrive (LWW solo nel pull)
- Branch locale `backup/pre-rdp-removal-20260603` residuo (tenere o cancellare a scelta)
- `src/pages/Cantiere.tsx` non più importato da nessuna route (codice morto dopo rimozione route legacy)

---

## NON aprire (task chiusi)

- PDF: rimosso 21 mag 2026, non reintrodurre senza decisione esplicita
- RdP (Rapporti di Prova): cancellati 3 giu 2026
- Estensioni lab M1/M2/M3: non necessarie (dati lab nei referti)
- Granularità J4: "tutte va bene"
- B1 overflow >32 misure: risolto con paginazione multi-foglio
- Workflow OCRA: UI digitale nativa (no OCR cartaceo)
- Regression numFmt OWAS: risolto via Python script
- Bug committente vuoto WBV/HAV/Rumore: risolto
- Data HAV come stringa: risolto
- Label `DURATA` Rumore: risolto (durata in minuti interi, retrocompat hh:mm:ss)
- DurationPicker OWAS: chiuso 6 maggio
- Route legacy `/cantiere/:id`: rimossa 3 giu 2026
- Code-split bundle: fatto 8 giu 2026
