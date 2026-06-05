# Current State

> Aggiornato: 2026-06-05
> Aggiornare a OGNI milestone importante.

## Completato

### Fondamenta
- Fasi A-E (setup, schema DB, navigazione, foglio campagna, UX sotto-step)
- Refactor R1+R2+R3 (modal shell + card generica + registry)

### Moduli — 16/16
Tutti i moduli misura completi (vedi `CLAUDE.md` per elenco).

### Phase H — PIN/Auth
- PIN locale 4 cifre, SHA-256 in localStorage
- Lock auto all'apertura/refresh
- Bottone lock SOLO nella Home (scelta di design esplicita)
- Reset via "Hai dimenticato il PIN?"

### Phase G — Foto
- Bucket Supabase privato `misure-foto`
- Pattern uniforme su tutti i 16 modali
- Compressione client 1280px/q0.7
- Max 5 foto/misura

### Phase J — Export (Excel-only — PDF rimosso 21 mag 2026)
- J1 + J1-bis: Excel 16/16 moduli con `ExportContext` arricchito
- J2 + J2.1: foto in Excel (foglio dedicato, 16/16 moduli)
- Paginazione multi-foglio: overflow misure genera fogli "Misure X-Y" via `cloneSheet` (`src/lib/exportPaginazione.ts`)
- Fix committente vuoto + strumentazione/label tecnico footer su rumore/wbv/hav
- MMC step A: labels normative xlsx ("(NIOSH)", "(Snook-Ciriello)")
- PDF: RIMOSSO completamente (engine cancellato sotto `src/lib`, i pacchetti PDF fuori da package.json). Branch backup conserva la history.

### Fase I — Offline + sync + PWA  ✅ COMPLETATA E PUSHATA
- Offline-first con Dexie (`src/lib/offline/db.ts`)
- Sync queue FK-ordered (syncQueue.ts + syncExecutor.ts): drain record poi foto (fotoSyncExecutor.ts)
- Pull cloud->locale (pullExecutor.ts) con local-wins guard su `sync_pending`
- `initSync` su online + visibilitychange; `useOnlineStatus` + `OfflineBanner`
- queryClient networkMode `offlineFirst`
- PWA completa: vite-plugin-pwa, service worker, manifest, avviso aggiornamento nuova versione
- Conflict resolution: last-pusher-wins (NO LWW — manca `updated_at` su 7 tabelle); LWW rimandato a commercializzazione

### UX3 — Sistema toast  ✅ COMPLETATO
- `src/lib/toast/` (ToastProvider, toastApi, useToast, styles, types, index)
- API imperativa `toast.success/error/warning/info`, nessuna libreria esterna

### Lint  ✅
- 0 errori. 49 warning `react-hooks/set-state-in-effect` silenziati con `disable-line` mirati (bug runtime già risolto col pattern split useEffect)

### Bug fix sistemici
- Bug modali risolto su 15 modali residui (split useEffect)

---

## Focus corrente

**Nessun task attivo.** In attesa di scelta utente sul prossimo fronte.

---

## Prossimi fronti reali

1. **Validazione end-to-end offline/sync** — zero test oggi: verificare drain queue, pull cloud->locale, comportamento offline->online su scenario reale
2. **Copertura E2E** — solo 2 spec su 16 moduli (home + rumore-modal)
3. **Code-split bundle** — ~2MB, nessun code splitting dinamico
4. **Debt minore** — routing legacy `/cantiere/:id`, naming OWAS camelCase

---

## Debt noto (da pulire)

- Routing legacy `/cantiere/:id` (singolare) da rimuovere
- Naming OWAS camelCase -> da normalizzare a snake_case
- Bundle ~2MB senza code-split dinamico

---

## NON aprire (task chiusi)

- PDF: rimosso 21 mag 2026, non reintrodurre senza decisione esplicita
- Conflict resolution LWW: rimandato a commercializzazione (manca `updated_at`)
- Estensioni lab M1/M2/M3: chiuse non-necessarie (copertura fogli campagna 100%, dati lab nei referti)
- B1 overflow >32 misure: risolto con paginazione multi-foglio
- Workflow OCRA: deciso UI digitale nativa (no OCR cartaceo)
- Regression numFmt OWAS: risolto via Python script
- Bug committente vuoto WBV/HAV/Rumore: risolto
- Data HAV come stringa: risolto (template `mm-dd-yy` -> `dd/mm/yyyy`)
- Label `DURATA [SEC.]` Rumore: risolto (-> `[hh:mm:ss]`)
- DurationPicker OWAS: chiuso 6 maggio (gia su main, non riaprire)
