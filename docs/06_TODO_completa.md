# Monitor Igiene — TODO al 2026-06-05

Backlog reale dopo tagliato il deprecato.

> **Storia**: la versione del 13 mag 2026 era scaduta. Cancellati: A1/A2 (PDF rimosso 21 mag), A3 J4 granularità (Davide 3 giu: "tutte va bene"), M1/M2/M3 lab (Davide 3 giu: "non servono"), T1 Vitest (superato da Playwright), RdP (cancellati 3 giu). Vedi `HANDOVER-app-monitoraggi.md` per fotografia attuale.

---

## ✅ COMPLETATI (5 giu 2026)

### Fase I — Offline + Sync + PWA  ✅ COMPLETATA E PUSHATA
Architettura reale in `src/lib/offline/`:
- Offline-first con **Dexie** (`db.ts`)
- **Sync queue FK-ordered** (`syncQueue.ts` + `syncExecutor.ts`): drain record poi foto (`fotoSyncExecutor.ts`)
- **Pull cloud→locale** (`pullExecutor.ts`) con local-wins guard su `sync_pending`
- `initSync` su `online` + `visibilitychange` (`initSync.ts`, `useOnlineStatus.ts`, `OfflineBanner.tsx`)
- queryClient `networkMode: 'offlineFirst'`
- **PWA completa**: vite-plugin-pwa, service worker, manifest, avviso aggiornamento nuova versione
- **Conflict resolution**: NO LWW (manca `updated_at` su 7 tabelle) → **last-pusher-wins**, LWW rimandato a commercializzazione

### UX3 — Sistema toast  ✅ COMPLETATO
- `src/lib/toast/` (ToastProvider, toastApi, useToast, styles, types, index)
- API imperativa `toast.success/error/warning/info`, nessuna libreria esterna

### B1 — Overflow >32 misure  ✅ RISOLTO
- Paginazione multi-foglio: overflow genera fogli "Misure X-Y" via `cloneSheet` (`src/lib/exportPaginazione.ts`), niente perdita dati

### B2 — Cosmetici export (parziale)  ✅
- Fix committente vuoto su rumore/wbv/hav
- Strumentazione + label tecnico nel footer su rumore/wbv/hav

### Estensioni lab M1/M2/M3  ✅ CHIUSE — non necessarie
- Verifica fogli campagna vs moduli app: copertura **100%** (acqua 8/8, IPA 11/11, biologico 8/8)
- I fogli non contengono campi lab di concentrazione/microbiologici: quei dati stanno nei **referti**, non nell'app. Chiuse come non necessarie.

---

## MEDIO — Refactor setState-in-effect

50 errori lint `react-hooks/set-state-in-effect` sui modali (tutti i 16 `Misura*Modal.tsx` + `MisuraModalShell.tsx` + alcuni hook).

Bug runtime già RISOLTO 7 mag 2026 con pattern split useEffect, ma l'antipattern resta nel codice come "lavoro che funziona ma il linter non approva".

**Approccio possibile:**
- Refactor pattern in `MisuraModalShell` per esporre callback invece di state-in-effect
- Propagare a tutti i 16 modali

Sforzo: medio. Decisione architetturale prima di iniziare.

---

## BASSO — UX

### UX1 — Conferma chiusura modali fuori da MisuraModalShell
Pattern dirty-guard già presente in MisuraModalShell. Da applicare a NuovoCantiereModal, NuovaCampagnaModal, eventuali altri.

### UX2 — Focus management
Primo input focus su open. Ritorno focus al trigger su close. ESC ovunque.

### UX3 — Sistema toast  ✅ COMPLETATO (vedi sezione COMPLETATI sopra)

### UX4 — Strategy unificata error React Query
Retry automatici, error boundary, toast su 5xx — definire pattern.

---

## BASSO — Cosmetici export (Bucket C)

**Non urgente** (Davide 3 giu: "non ora"). Parzialmente chiuso: footer rumore/wbv/hav fatto (vedi B2 sopra).

- ~~Strumento Rumore hardcoded~~ → fatto su rumore/wbv/hav (footer strumentazione)
- ~~Label "Tecnico rilevatore"~~ → fatto su rumore/wbv/hav (footer label tecnico)
- Data WBV scritta come stringa anziché Date
- Statistiche WBV per gruppo (medie/max calcolate in export)
- Numerazione HAV blocchi
- Decimali OWAS

---

## TEST — Opzionali, da fare se serviranno

### T2 — Smoke test export manuale
Cantiere demo + 16 moduli + 1 export per modulo + checklist su `SMOKE_TEST.md`.

### T3 — E2E con DB cleanup
Quando un flusso save di modale diventa critico da proteggere:
- Aggiungere `E2E_SUPABASE_SERVICE_KEY` in `.env.local`
- Test che salvano + cleanup automatico
- Replicare pattern Rumore agli altri 15 modali

### T5 — Test E2E export (Excel parse)
Idea: Playwright scarica file → parser xlsx (openpyxl) → assert contenuto (incluso overflow paginazione multi-foglio).
Stima: 2-3 giornate. Da fare se bug export diventano ricorrenti.

---

## COMMERCIALIZZAZIONE — Futuro lontano

Non iniziato. Quando si vorrà distribuire l'app oltre uso personale:
- EULA
- GDPR / Art. 28 (DPA)
- Multi-tenancy (oggi single-user)
- Supabase Auth
- License management
- Modello business da scegliere

---

## DEBT NOTO RESIDUO (non urgente)

1. **Naming OWAS** — schema usa wording non uniforme rispetto agli altri (verifica TS type vs Supabase). Da indagare se necessario.
2. **Build warning chunk size** 1.895 MB (gzip 487 KB) — code splitting dinamico. Pre-esistente, non bloccante.

---

## ANTI-PATTERN — DA NON FARE

Riferimento rapido (vedi `HANDOVER` per dettagli):

- ❌ Shorthand `border:`, `padding:`, `margin:` con override condizionali
- ❌ Workaround code-level per bug template Excel (risolvere nel `.xlsx` con Python in `tools/`)
- ❌ `.download(path)` diretto su bucket Supabase privato (sempre `createSignedUrl` + `fetch`)
- ❌ Foto-row Excel "vuote": dopo `row.height = N` fare anche `row.getCell(1).value = null`
- ❌ Modificare `MisuraModalShell` per esigenze di un singolo modulo
- ❌ Tailwind / styled-components / CSS modules / routing diverso da React Router v7
- ❌ Prompt monolitici che modificano molti file insieme
- ❌ Aggiungere `data-testid` sparsi nel codice — solo dove servono per E2E stabili
- ❌ Modificare un test E2E "per farlo passare" senza capire il fallimento

---

## Prossimi fronti reali

Fase I, toast, B1, B2 (parziale) e estensioni lab sono CHIUSI (vedi sopra). Fronti aperti:

1. **Validazione end-to-end offline/sync** — ZERO test oggi: verificare drain queue, pull cloud→locale, comportamento offline→online su scenario reale
2. **Copertura E2E** — solo 2 spec su 16 moduli (home + rumore-modal)
3. **Code-split bundle** — ~2MB (gzip ~487KB) senza code splitting dinamico
4. **Debt minore** — routing legacy `/cantiere/:id`, naming OWAS camelCase
