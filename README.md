# Monitor Igiene

App web (PWA, offline-first) per la raccolta in cantiere delle misure di igiene del lavoro ai sensi del D.Lgs. 81/08, con export nei fogli di campagna Excel.

**16 moduli di misura**: rumore, vibrazioni WBV e HAV, microclima, CEM, ROA, polveri, carbonio elementare, gas, IPA, amianto, biologico (SAS), acqua, MMC, OWAS, OCRA.

## Funzionalità

- Anagrafiche: cantieri, risorse di cantiere (postazioni, fasi, macchine), strumenti, tecnici
- Campagne di misura per modulo, con fino a 5 foto per misura
- Export Excel sui template dei fogli di campagna: per campagna, multi-campagna, cantiere completo (zip)
- Funziona senza rete: dati locali (IndexedDB) e sincronizzazione automatica con Supabase al ritorno online
- Installabile come app (PWA) su telefono e desktop
- Accesso con login + PIN locale

## Stack

React 19 · Vite 8 · TypeScript · Supabase (DB, Auth, Storage) · TanStack Query · Dexie · ExcelJS · vite-plugin-pwa · Playwright

## Avvio in locale

```bash
npm install
# .env.local con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev          # http://localhost:5173
```

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Dev server Vite |
| `npm run build` | Typecheck + build di produzione in `dist/` |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Test Playwright (usa il DB di test da `.env.test`, mai la produzione) |
| `npm run test:e2e:ui` | Test in modalità interattiva |

## Deploy

Netlify: build `npm run build`, cartella `dist`, redirect SPA configurati in `netlify.toml`. Le variabili `VITE_SUPABASE_*` di produzione sono impostate su Netlify.

## Documentazione

- `CLAUDE.md` — regole e architettura per chi sviluppa (anche agenti AI; `AGENTS.md` è la copia per Codex)
- `.claude/current-state.md` — stato attuale e focus
- `docs/HANDOVER-app-monitoraggi.md` — fotografia completa del progetto
- `docs/06_TODO_completa.md` — backlog e roadmap verso la vendita

