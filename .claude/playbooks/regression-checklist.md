# Regression Checklist — cross-modulo

Invocare PRIMA di modificare:
- `MisuraModalShell`
- `exportSchemas.ts` / `exportExcel.ts` / `exportPaginazione.ts`
- `FotoUploader`
- `src/lib/offline/` (sync queue, pull, repositories)
- Hook condivisi (`useFotoMisure`, `useRisorseCantiere`, ecc.)

---

## Step 1 — Identifica moduli impattati

Una modifica a uno dei file sopra impatta TUTTI i 16 moduli. Lista da scorrere:

rumore, vibrazioni-wbv, vibrazioni-hav, microclima, cem, roa, polveri, carbonio-elementare, gas, ipa, amianto, biologico-sas, acqua, mmc, owas, ocra

---

## Step 2 — Checklist modali

Per ogni modulo toccato, verifica:

- [ ] CREATE flow: apre modale vuoto, compila, salva, modale resta aperto in modalita modifica
- [ ] EDIT flow: apre modale con dati, modifica, salva, modale chiude
- [ ] Close behavior: chiusura senza salvare resetta state
- [ ] Foto persistence: foto caricate dopo CREATE rimangono associate alla misura
- [ ] Validazione: errori si resettano all'apertura
- [ ] Sync form: cambio `misuraDaModificare` aggiorna i campi (split useEffect)

---

## Step 3 — Checklist Excel

- [ ] Header anagrafica (committente, data, cantiere) popolato correttamente — committente NON vuoto su rumore/wbv/hav
- [ ] Footer: strumentazione + label tecnico presenti su rumore/wbv/hav
- [ ] numFmt rispettato per colonna: durata `[hh:mm:ss]`, numerici `0` o `0.0`, testo `General`
- [ ] Merges: i merge del template sono preservati
- [ ] Foglio Foto: foto presenti, layout 2/riga, header per ogni misura
- [ ] Slave-cells: formule `=+C1` etc. nei blocchi 2-4 funzionano (no reset!)
- [ ] Risorse: postazioni/fasi/macchine risolte via `_nome` o lookup
- [ ] **Paginazione multi-foglio**: con misure oltre il limite del foglio si generano fogli "Misure X-Y" (`exportPaginazione.ts` / `cloneSheet`), nessun dato perso, ogni foglio mantiene header/footer/merges

---

## Step 4 — Checklist offline / sync

- [ ] **Drain queue**: operazioni create offline vengono sincronizzate al reconnect, in ordine FK (record poi foto)
- [ ] **Pull cloud→locale**: i dati remoti aggiornano Dexie SENZA sovrascrivere record con `sync_pending` (local-wins guard)
- [ ] **Offline→online**: `initSync` parte su evento `online` + `visibilitychange`; `OfflineBanner` riflette lo stato
- [ ] **Foto sync**: le foto pendenti salgono dopo il drain dei record (FK-ordered)
- [ ] **Conflitti**: nel pull vince il record con `updated_at` più recente (LWW, tie -> remoto), salvo record locali `sync_pending`; nel push vince chi scrive per ultimo

---

## Step 5 — Checklist mobile

- [ ] Scroll: modale scrollabile, sticky actions in fondo restano visibili
- [ ] Keyboard overlap: input non coperti dalla tastiera
- [ ] Touch targets: bottoni >=44px

---

## Step 6 — Smoke test consigliato

Dopo modifica cross-modulo, su 3 moduli rappresentativi:
1. Rumore (schema specifico, 4 pagine)
2. OWAS (schema specifico, slot fissi)
3. Acqua o gas (schema generico)

Per ciascuno:
1. Crea cantiere demo + campagna
2. Aggiungi 2 misure (1 con foto, 1 senza)
3. Modifica una misura
4. Export Excel -> apri -> verifica header + dati + foto + footer
5. Se modifica tocca offline: vai offline, crea/modifica misura, torna online -> verifica sync

---

## File ad alto rischio regressione

Modifiche a questi file richiedono SEMPRE smoke test sui 3 moduli rappresentativi:

- `src/components/MisuraModalShell.tsx`
- `src/data/moduliRegistry.ts`
- `src/data/exportSchemas.ts`
- `src/lib/exportExcel.ts`
- `src/lib/exportFotoSheet.ts`
- `src/lib/exportPaginazione.ts`
- `src/lib/offline/syncExecutor.ts`
- `src/lib/offline/pullExecutor.ts`
- `src/lib/offline/repositories/`
- `src/hooks/useFotoMisure.ts`
- `src/hooks/useRisorseCantiere.ts`
- `src/components/FotoUploader.tsx`

---

## Output atteso da Claude Code

Quando un prompt invoca questa skill, Claude Code deve produrre:

1. Lista moduli impattati: quali dei 16 vengono toccati
2. Risk assessment: livello (basso/medio/alto) per ogni area (modali/Excel/offline-sync/mobile)
3. Smoke test plan: quali dei 3 moduli rappresentativi testare
4. Patch: con commit message Conventional Commits
