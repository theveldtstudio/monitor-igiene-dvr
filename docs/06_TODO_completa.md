# Monitor Igiene — TODO al 2026-06-03

Backlog reale dopo tagliato il deprecato.

> **Storia**: la versione del 13 mag 2026 era scaduta. Cancellati: A1/A2 (PDF rimosso 21 mag), A3 J4 granularità (Davide 3 giu: "tutte va bene"), M1/M2/M3 lab (Davide 3 giu: "non servono"), B1 overflow >32 (Davide 3 giu: "mai capitato"), T1 Vitest (superato da Playwright), RdP (cancellati 3 giu). Vedi `HANDOVER-app-monitoraggi.md` per fotografia attuale.

---

## GROSSO — Fase I: Offline + Sync

Ultima fase del progetto. Non ancora iniziata.

**Decisioni preliminari (8 mag 2026):**
- Coda operazioni + Last-Write-Wins (LWW)
- Realtime Supabase incluso
- PWA installabile via vite-plugin-pwa
- Storage locale: Dexie raccomandato (SQLite WASM scartato, troppo pesante 600KB)
- Modello dati ha già `sync_pending` bool su Misura/Campagna/FotoMisura/RisorsaCantiere

**Da decidere prima di iniziare:**
- Conflict resolution strategy nei dettagli (LWW per quali campi? Merge su quali?)
- Comportamento UI in offline (banner? badge? blur?)
- Sync trigger (manuale? auto on reconnect? polling?)
- Foto: upload bucket Supabase + cache locale?

**Sotto-fasi previste:**
1. Setup Dexie + schema locale
2. Repository pattern (Supabase ↔ Dexie astrazione)
3. Service worker + PWA installabile
4. Coda operazioni offline
5. Sync engine + conflict resolution
6. Realtime Supabase channel
7. UI feedback (online/offline/pending)
8. Test E2E offline

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

### UX3 — Sistema toast
Decisioni design da prendere:
- Posizione (top-right? bottom-center?)
- Durata default (3s? 5s?)
- Tipi (success/error/info/warning)
- Stack policy

### UX4 — Strategy unificata error React Query
Retry automatici, error boundary, toast su 5xx — definire pattern.

---

## BASSO — Cosmetici export (Bucket C)

**Non urgente** (Davide 3 giu: "non ora").

- Strumento Rumore hardcoded → leggere da `ctx.strumento`
- Label "Tecnico rilevatore" inconsistenti tra moduli
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

### T5 — Test E2E export (Excel/PDF parse)
Idea: Playwright scarica file → parser xlsx (openpyxl) → assert contenuto. 
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

## Prossimo step

**Fase I — Offline + sync** (deciso 3 giu 2026).
Da iniziare con discussione decisioni di design prima del codice.
