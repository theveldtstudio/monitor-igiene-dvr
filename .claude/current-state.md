# Current State

> Aggiornato: 2026-05-11
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

### Phase J — Export
- J1 + J1-bis: Excel 16/16 moduli con `ExportContext` arricchito
- J2 + J2.1: foto in Excel (foglio dedicato, 16/16 moduli)
- J3a: PDF caso A (stampa fronte FC), 16/16 moduli
- MMC step A: labels normative xlsx ("(NIOSH)", "(Snook-Ciriello)")
- J4 (prima implementazione): export cantiere completo come ZIP con UI progress + AbortController

### Bug fix sistemici
- Bug modali risolto su 15 modali residui (split useEffect)

### Recovery 2026-05-11
- Recuperati 9 file da working dir non committata dopo corruzione .git/
- 5 moduli PDF (gas, ipa, mmc, ocra, owas) -> completa J3a a 16/16
- 4 file feature J4 (exportCantiereZip, saveBlob, useEsportaCantiere, EsportaCantiereModal)

---

## Focus corrente

**Nessun task attivo.** In attesa di scelta utente sul prossimo fronte.

---

## Prossimi fronti (ordine consigliato)

1. **MMC step B** — labels normative su PDF (decisione di posizionamento da prendere)
2. **Validazione J4 end-to-end** — testare export ZIP cantiere su scenario reale
3. **J3b** — PDF narrativo (caso B: tabella + commenti + valutazioni)
4. **Estensioni lab** — IPA, acqua microbiologici, biologico-SAS specie
5. **Phase I — Offline + sync** (per ULTIMA, dopo che tutto J e validato)

---

## Debt noto (da pulire)

- Routing legacy `/cantiere/:id` (singolare) da rimuovere
- Naming OWAS camelCase -> da normalizzare a snake_case
- Bucket B audit: overflow >32 misure (decisione di design pendente)
- Bucket C cosmetici: strumento Rumore hardcoded, label tecnico inconsistenti, statistiche WBV per gruppo

---

## NON aprire (task chiusi)

- Workflow OCRA: deciso UI digitale nativa (no OCR cartaceo)
- Regression numFmt OWAS: risolto via Python script
- Bug committente vuoto WBV/HAV/Rumore: risolto (Bucket A audit)
- Data HAV come stringa: risolto (template `mm-dd-yy` -> `dd/mm/yyyy`)
- Label `DURATA [SEC.]` Rumore: risolto (-> `[hh:mm:ss]`)
- DurationPicker OWAS: chiuso 6 maggio (gia su main, non riaprire)
