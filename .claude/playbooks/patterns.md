# Pattern consolidati — riferimento dettagliato

Invocare quando si lavora su modali, foto, export, template Excel.

---

## 1. Pattern modale misura

Ogni `MisuraXxxModal.tsx`:

- State form (campo1, campo2, ...)
- State per foto (transita da null a uuid dopo primo salvataggio):
  - `misuraIdCorrente` derivato da `misuraDaModificare?.id ?? null`
  - `numeroMisuraCorrente` derivato da `misuraDaModificare?.numero`

### SPLIT useEffect: form-sync separato da error-reset

`useEffect` #1 con deps `[open, misuraDaModificare?.id, misuraDaModificare?.numero]`:
- Se `open`: sync form da `misuraDaModificare`, sync `misuraIdCorrente`, sync `numeroMisuraCorrente`
- Se NOT `open`: reset form a default, reset `misuraIdCorrente` a null, reset `numeroMisuraCorrente` a undefined

`useEffect` #2 con deps `[open, resetError]`:
- Se `open`: `resetError()`

`isModifica = misuraIdCorrente != null`

### handleSubmit

Dopo `save(...)`:
- Se result OK:
  - `onSaved(result)`
  - Se NOT `misuraIdCorrente` (CREATE):
    - `setMisuraIdCorrente(result.id)`
    - `setNumeroMisuraCorrente(result.numero)`
    - NON chiamare `onClose()` (il modal resta aperto per upload foto)
  - Else (UPDATE):
    - `onClose()`

### FotoUploader

Dopo i campi form e dopo Note:
- Render condizionale: solo se `misuraIdCorrente != null`
- Props: `misuraId={misuraIdCorrente}`, `maxFoto={5}`

### Entry nel registry

`src/data/moduliRegistry.ts`:
- key: `<modulo-id>`
- value: `{ modalComponent: MisuraXxxModal, subtitleBuilder: subtitleXxx }`

### Varianti note

- OWAS: branch `else` con valori `{schiena:1, braccia:1, gambe:1, carico:1}`
- OCRA: `setRisposte({})` nel reset

---

## 2. Pattern foto allegate

### Upload

`uploadFoto({ file, misuraId, onProgress })` da `@/utils/fotoStorage`.

### Download (lettura)

MAI `.download(path)` diretto.

Pattern obbligatorio:
- `supabase.storage.from("misure-foto").createSignedUrl(path, 300)` -> `{ data: signed }`
- `fetch(signed.signedUrl)` -> `.blob()`

### Query

`useFotoMisure(campagnaId, misureIds)` -> hook include `misureIdsKey` nel queryKey per cache busting.

### Compressione

- Upload: 1280px lato lungo, JPEG q0.7
- Export: 800px, q0.6 via OffscreenCanvas

---

## 3. Pattern export Excel

### Schema in `src/data/exportSchemas.ts`

- 3 schemi specifici (rumore, wbv, hav) con template `.xlsx` reali
- 13 schemi generici via `buildSchemaGenerico` factory + `applyDataGenerico`

### Strategia ibrida risorse

Per leggere postazione/fase/macchina:
1. Prima prova campo `_nome` denormalizzato (es. `dati.postazione_nome`)
2. Fallback: lookup risorsa via ID (es. `risorse.find(r => r.id === dati.postazione_id)?.nome`)
3. Default: stringa vuota

### Passaggio risorse a FoglioCampagna

3 hook + `useMemo`:
- `useRisorseCantiere(cantiereId, "postazione")` -> postazioni
- `useRisorseCantiere(cantiereId, "fase")` -> fasi
- `useRisorseCantiere(cantiereId, "macchina")` -> macchine
- `useMemo` per combinare e passare a `ExportContext`

---

## 4. Pattern fix template Excel (numFmt)

### Sintomo

Cella mostra `0.0625` invece di `01:30:00`, oppure `0` su cella testo.

### Causa

ExcelJS condivide `xfId` tra colonne adiacenti -> `numFmt` cross-contamina.

### NON fare

Workaround code-level: settare `numFmt` cell-by-cell in TS. E fragile, si rompe al primo cambio template.

### Fix root-cause

Script Python in `tools/` con openpyxl che:
- Carica `public/templates/XXX.xlsx`
- Per ogni cella nelle righe dati, assegna `number_format` distinto per colonna
- Salva il template modificato

### Pattern gia applicato a

- `tools/fix-owas-template.py` (D `[hh]:mm:ss`, E-I `0`, B/C/J `General`)
- `tools/fix-wbv-template.py` (17 merges + col N=12)
- `tools/fix-rumore-template.py` (B `[hh]:mm:ss`, F/G/H `0.0`)

Replicabile per altri moduli con celle durata/numeriche.
