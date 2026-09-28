# Monitor Igiene — TODO al 2026-09-28

Backlog reale. Fotografia completa in `HANDOVER-app-monitoraggi.md`, stato sintetico in `.claude/current-state.md`.

> **Cambio di obiettivo (set 2026)**: l'app funziona ed è in produzione su Netlify, testata in cantiere.
> Ora va **terminata e resa vendibile** ad altri professionisti, in due pacchetti:
> **Monitoraggi** (standalone) e **Monitoraggi + DVR** (copia collegata a un software DVR esterno).

---

## ✅ COMPLETATI (dal 5 giu 2026 in poi)

- Export multi-campagna (1 foglio per campagna) — 5 giu
- UX1 dirty-guard + UX2 focus automatico su NuovaCampagnaModal / NuovoCantiereModal — 5 giu
- UX4 error handling: `AppErrorBoundary`, `humanizeError`, toast su CRUD/foto — 8 giu
- Code-split bundle: route lazy, vendor split, ExcelJS lazy — 8 giu
- LWW step 1-3 (`updated_at` nel pull, guard `sync_pending`) — 8 giu
- Deps: fix vulnerabilità npm audit — 8 giu
- Login Supabase email+password come gate pre-PIN — 9 giu
- Deploy Netlify (`netlify.toml`) — 9 giu
- T3/T5 E2E export con DB di test e parse xlsx: **16/16 moduli** — 9 giu (committati 28 set)

---

## 🔴 FASE K — Preparazione alla vendita (priorità alta)

### K0 — Decisione di architettura (da prendere PRIMA di scrivere codice)
Due strade per servire più clienti:

| Opzione | Come | Pro | Contro |
|---|---|---|---|
| **A. Un progetto Supabase per cliente** | Stesso codice, deploy/env diversi per cliente | Isolamento totale dei dati, quasi zero modifiche al codice, GDPR semplice | Costo e manutenzione crescono con i clienti, migrazioni da ripetere N volte |
| **B. Multi-tenant condiviso** | Colonna `org_id` su tutte le tabelle + RLS per organizzazione | Un solo deploy, scala bene, un solo DB da migrare | Refactor schema + RLS + sync offline + storage foto; errori RLS = fuga di dati |

Da discutere con Davide (con mockup/pro-contro prima del codice).

### K1 — Multi-tenancy e sicurezza dati
- Modello `organizzazioni` + `membri` (se opzione B)
- `org_id` (o `owner_id`) su cantieri, campagne, misure, risorse_cantiere, strumenti, tecnici, foto_misura
- Policy RLS per organizzazione su tutte le tabelle + bucket `misure-foto` (oggi aperto ad anon+authenticated)
- Dexie/sync: pull filtrato per tenant, pulizia dati locali al logout / cambio utente
- Test E2E di isolamento: utente A non vede dati di utente B

### K2 — Account, onboarding, licenze
- Registrazione cliente (oggi solo login di utenti creati a mano)
- Primo accesso guidato: dati azienda/professionista, strumenti, tecnici
- Gestione licenza/abbonamento per pacchetto (Monitoraggi / Monitoraggi + DVR), scadenze, blocco a licenza scaduta
- Personalizzazione export (logo e intestazione del professionista nei template)

### K3 — Legale e commerciale
- Termini d'uso / EULA
- Informativa privacy + DPA Art. 28 GDPR (Davide = responsabile del trattamento per i dati dei clienti)
- Listino, fatturazione, assistenza (canale e tempi)
- Backup e piano di ripristino documentato per i dati dei clienti

### K4 — Pacchetto Monitoraggi + DVR
- Scegliere/definire il software DVR a cui collegarsi
- Definire il **contratto dati** in uscita (quali misure, formato, identificativi cantiere/mansione/fase) — JSON/API o export dedicato
- Strategia repo: copia (fork) vs. stessa base di codice con feature flag per pacchetto (preferibile per non mantenere due app divergenti)

---

## 🟡 QUALITÀ (prima della vendita)

- **Validazione E2E offline/sync**: drain queue, pull, conflitti LWW, foto pendenti — oggi zero test automatici
- Verifica manuale su più dispositivi (Android/iOS, PWA installata) con dati reali
- Monitoraggio errori in produzione (es. Sentry o log Supabase)

---

## 🟢 BASSO — Refactor / UX / cosmetici

- Refactor `react-hooks/set-state-in-effect` (49 disable-line) — decisione architetturale su `MisuraModalShell`
- UX2 completamento: ritorno focus al trigger su close, ESC ovunque
- Cosmetici export (Bucket C): data WBV come Date, statistiche WBV per gruppo, numerazione HAV blocchi, decimali OWAS
- Naming OWAS camelCase -> snake_case
- Rimuovere `src/pages/Cantiere.tsx` (codice morto)
- Push sync: valutare LWW anche in push (oggi vince chi scrive per ultimo)

---

## ANTI-PATTERN — DA NON FARE

- ❌ Shorthand `border:`, `padding:`, `margin:` con override condizionali
- ❌ Workaround code-level per bug template Excel (risolvere nel `.xlsx` con Python in `tools/`)
- ❌ `.download(path)` diretto su bucket Supabase privato (sempre `createSignedUrl` + `fetch`)
- ❌ Foto-row Excel "vuote": dopo `row.height = N` fare anche `row.getCell(1).value = null`
- ❌ Modificare `MisuraModalShell` per esigenze di un singolo modulo
- ❌ Tailwind / styled-components / CSS modules / routing diverso da React Router v7
- ❌ Prompt monolitici che modificano molti file insieme
- ❌ `data-testid` sparsi — solo dove servono per E2E stabili
- ❌ Modificare un test E2E "per farlo passare" senza capire il fallimento
- ❌ Lanciare E2E contro il DB di produzione
- ❌ Vendere/dare accesso a terzi prima di K1 (dati non isolati)
