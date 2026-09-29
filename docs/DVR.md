# Modulo DVR – pacchetto Monitoraggi + DVR

Stato al 28 settembre 2026: **DVR Rumore** completo (dati, calcolo, Word). Gli altri rischi seguiranno lo stesso schema.

## Flusso d'uso

1. Dal cantiere → pulsante **DVR**.
2. Prima volta: compilare l'**anagrafica DVR** (comune, provincia, opera, datore di lavoro, RSPP, MC, RLS…). Resta modificabile.
3. **Ambiti** (galleria tradizionale, TBM, viadotto, piazzale…): scelgono testi e metodi (es. la zonizzazione esiste solo in galleria).
4. **Mansioni**: ogni aggiunta/modifica/disattivazione chiede conferma e va nello storico (`dvr_mansioni_modifiche`), da riportare nella revisione successiva.
5. **DPI udito** (H, M, L, β, ottave), **macchine**, **tarature** degli strumenti (comuni a tutti i cantieri).
6. **Nuovo DVR Rumore** → scegliere campagne e ambiti, riempire la **matrice dei tempi** (480 min per mansione: misure dell'app, dati storici marcati con *, valori convenzionali come la pausa a 65 dB(A)).
7. **Riepilogo e controlli** → **Genera DVR Word**. Il Word resta modificabile prima della firma.
8. Dopo l'emissione: **Nuova revisione** copia documento, mansioni e tempi.

## Calcolo (src/dvr/rumore)

- LEX,8h = 10·log10(Σ Tm·10^(LAeq,m/10) / 480).
- Incertezza (UNI EN ISO 9612 app. C, metodo per compiti): u² = Σ cm²·(uL² + us²) + uc², con uL = 1,0 dB, us = 0,7 dB, uc = 0,5 dB. Riproduce il foglio di calcolo ECO-TER su tutte le 23 mansioni del DVR Xenia 2026. **Da confermare con Davide il significato di uc.**
- Fasce art. 189 su valore arrotondato a 0,1 dB, soglie incluse: ≥ 80 → 2ª, ≥ 85 → 3ª (anche per picco 135/137 dB(C)). Opzione `valore_piu_incertezza` per il criterio cautelativo.
- DPI: attenuazione reale = β × H/M/L (UNI 9432: 0,5 inserti, 0,75 cuffie); livello all'orecchio con metodo HML (UNI EN ISO 4869-2); protezione secondo UNI 9432 prospetto C.5; verifica del valore limite 87 dB(A) con i DPI.
- Controlli: giornata ≠ 480 min, mansioni duplicate, stessa postazione con livelli diversi tra mansioni, dati storici, casi al confine con l'incertezza, refusi nelle schede DPI.

## Template Word

`tools/dvr/costruisci_template_rumore.py <DVR modello.docx> public/templates/dvr/rumore.docx` ricava il template dal DVR Rumore Xenia 2026. Correzioni applicate al modello: IEC 651/804 → IEC 61672, SIT → ACCREDIA, disuguaglianze delle fasce, sezione piè di pagina dell'Allegato 1, logo CTG nell'Allegato 3, firme scansionate tolte dalla copertina, numerazione tabelle automatica, art. 196 per la sorveglianza sanitaria.

Il logo del cliente si carica nel documento (riquadro 198,45 × 52,6 pt); il logo ECO-TER è nel template.

## Da fare

- Altri rischi: vibrazioni (stesso schema), chimico/cancerogeno (servono i risultati di laboratorio), microclima, MMC, posture, ROA; DVR mancanti da scrivere da zero (CEM, amianto, IPA, biologico, acqua).
- Varianti dei testi per galleria tradizionale e viadotti da rivedere con Davide.
- Logo dello studio configurabile (per la vendita ad altri professionisti) e multi-tenancy (Fase K).
