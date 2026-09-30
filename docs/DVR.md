# Modulo DVR – pacchetto Monitoraggi + DVR

Stato al 30 settembre 2026: completi (dati, calcolo, Word) i DVR Rumore, Vibrazioni, Posture incongrue, Movimentazione manuale dei carichi, Microclima, ROA, Agenti chimici, Fumi di saldatura, Agenti cancerogeni Campi elettromagnetici, Amianto, IPA, Agenti biologici e il monitoraggio delle acque: tutti i moduli di misura dell'app hanno il loro documento. Il tipo di DVR si sceglie nella pagina DVR del cantiere (menu “Rischio del nuovo DVR”).

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

## Vibrazioni (src/dvr/vibrazioni)

- A(8) = √(Σ a²·T / 480), con a = A(w)max (corpo intero, già pesato 1,4 sugli assi orizzontali da seduti nel modulo WBV) o A(w)sum (mano-braccio).
- Esposizione giornaliera = A(8) × 1,2 (incremento del 20% per l'incertezza, linee guida INAIL), arrotondata al centesimo.
- Valori per il calcolo: misure ripetute sulla stessa macchina, fase e regime → media + deviazione standard (di popolazione); utensili con doppia impugnatura → impugnatura con la vibrazione più alta.
- Fasce art. 201: trascurabile (nessuna macchina/utensile), sotto azione, oltre azione (> 0,5 / 2,5 m/s²), oltre limite (> 1 / 5 m/s²). Le soglie vanno "superate" (art. 203-204): 0,50 resta sotto.
- Riproduce le 45 TAV e la tabella dei valori medi del DVR Vibrazioni Xenia 2026.
- Nella matrice dei tempi ogni riga ha il tipo (WBV/HAV); una mansione senza righe di un tipo ha esposizione trascurabile per quel tipo.
- Template: `tools/dvr/costruisci_template_vibrazioni.py` → `public/templates/dvr/vibrazioni.docx` (loghi COCIV/CTG del modello sostituiti dal logo cliente, firme tolte, "arrotondati per eccesso" corretto).

## Posture incongrue (src/dvr/posture)

- Metodo OWAS: ogni postura ha un codice schiena-braccia-gambe-carico; la classe 1–4 viene dalla tabella standard (`src/data/owasLookup.ts`, la stessa del modulo di misura, verificata cella per cella sulla Tabla 6 di Ergonautas – UPV).
- Per mansione una o più **giornate tipo** (righe di `dvr_tempi` con `valori.giornata`, `valori.attivita`, `valori.classe`; classe 0 = operazioni ordinarie ripartite in parti uguali sulle quattro classi).
- Indice I = (a·1 + b·2 + c·3 + d·4)·100 con a…d frazioni del tempo in classe 1…4; alla mansione si assegna la giornata più gravosa. Fasce: 100 assente, fino a 200 lieve, fino a 300 medio, oltre elevato.
- Catalogo delle attività (capitoli 5 e 6) in `dvr_documenti.contenuti.catalogoPosture`: gruppo/tabella, fase, attività, descrizione, mansioni, posture con codice OWAS. Si può importare dalle misure OWAS delle campagne (`posture_owas`); le righe delle giornate collegate a una misura ricalcolano la classe dal codice.
- Riproduce le 61 TAV (150 giornate) del DVR Posture Castagnola 2025; differenze del modello documentate nei test (riepiloghi non aggiornati in 13 TAV, Tabella 17 diversa in 5 mansioni, 3 posture con classe diversa dalla tabella standard, Figura 2 con 5 celle di colore diverso).
- Template: `tools/dvr/costruisci_template_posture.py` → `public/templates/dvr/posture.docx`. Le celle "Fase lavorativa"/"Attività" uguali si uniscono in verticale dopo la compilazione (`src/dvr/comune/unisciCelle.ts`: i dati marcano le celle con `unibile(chiave, testo)`).

## Movimentazione manuale dei carichi (src/dvr/mmc)

- Una **attività** per ogni movimentazione valutata, con le mansioni che la svolgono (`dvr_documenti.contenuti.attivitaMmc`); le mansioni senza attività sono "non esposte". Si possono importare dalle misure MMC e OCRA delle campagne.
- **NIOSH** (UNI ISO 11228-1): PLR = CP × A × B × C × D × E × F (× 0,85 in più persone, × 0,6 con una mano), CP 25 kg adulti e 20 kg giovani/over 45; PLR a 0,1 kg, IS = peso per persona / PLR a 0,01. Fattori: valori della tabella del DVR nei punti della tabella, formule della norma tra un punto e l'altro, frequenza interpolata per durata. Fasce: ≤ 0,85 verde, fino a 0,99 gialla, da 1 rossa.
- **NIOSH composto**: ISC = IS del compito più gravoso + Σ ISIF·(1/E cumulata − 1/E precedente).
- **Snook e Ciriello** (UNI ISO 11228-2): tabelle maschili del DVR; colonna con distanza uguale o superiore e frequenza uguale o più frequente (a favore di sicurezza); spinta/traino col peggiore tra forza iniziale e di mantenimento. Fasce: ≤ 0,75 verde, fino a 1,25 gialla, oltre rossa, oltre 3 viola.
- **Check list OCRA** (UNI ISO 11228-3): punteggio dal modulo di misura OCRA, fasce 7,5 / 11 / 14 / 22,5 e indice OCRA equivalente (2,2 / 3,5 / 4,5 / 9).
- Riproduce le 20 valutazioni del DVR MMC Xenia 2026 (differenze del modello documentate nei test).
- Template: `tools/dvr/costruisci_template_mmc.py` → `public/templates/dvr/mmc.docx`; il capitolo 6 è un ciclo sulle attività con il blocco del metodo.

## Microclima (src/dvr/microclima)

- Quattro **scenari**, come i DVR modello: galleria inverno (PMV/PPD sui rilievi), galleria estate (WBGTi sui rilievi), esterno estate (PMV/PPD sulle medie meteo mensili + WBGTe nella giornata più gravosa), esterno inverno (PMV/PPD sulle medie + IREQ, DLE e WCI nelle giornate peggiori). Tutto in `dvr_documenti.contenuti.microclima` (parametri, rilievi, lavorazioni, vestiario, misure, piano); i rilievi si importano dalle misure delle campagne microclima.
- **PMV/PPD** UNI EN ISO 7730 (algoritmo dell'Allegato D); in galleria la temperatura radiante si ricava dal globotermometro in convezione forzata con il diametro indicato (i PMV del DVR Castagnola si riproducono con 0,05 m). Categorie A–D dal PMV a 0,1.
- **WBGT** UNI EN ISO 7243: WBGTi = 0,7 Tuvn + 0,3 Tg, WBGTe = 0,7 Tuvn + 0,2 Tg + 0,1 Ta; limiti per classe metabolica (≤ 65, 130, 200, 260 W/m²) acclimatati 33/30/28/25/23, non acclimatati 32/29/26/22/18 (aria ferma).
- **IREQ** UNI EN ISO 11079 (IREQmin/IREQneu iterativi, DLE con Qlim 144 kJ/m²) e **WCI** = 1,16 (10,45 + 10√Va − Va)(33 − Ta) con la tabella degli effetti.
- Test sui quattro DVR modello (Castagnola 2025 galleria inverno ed estate, CTG 2025 esterno estate, Xenia 2026 esterno inverno) con le differenze del modello documentate.
- Template: `tools/dvr/costruisci_template_microclima.py` (base galleria inverno, tabelle degli altri scenari copiate dai rispettivi modelli) → `public/templates/dvr/microclima.docx`. Didascalie numerate dal generatore in base alle sezioni accese.

## Radiazioni ottiche artificiali (src/dvr/roa)

- **Sorgenti** censite (macchine, lampade, laser) in `dvr_documenti.contenuti.roa`, importabili dalle misure ROA. Giustificabili dalla classificazione: macchine di categoria 0 (UNI EN 12198), lampade del gruppo esente (CEI EN 62471), laser di classe 1 e 2 (CEI EN 60825-1); saldature e tagli termici mai giustificabili; il tecnico può forzare la scelta (segnalata negli avvisi).
- Per le **non giustificabili**: analisi della situazione lavorativa (spettro, distanza, tempo, esposti diretti e indebiti, necessità di misure).
- **Luminanza** Lv = Ev / ω dalle misure di illuminamento, limite 10.000 cd/m².
- **DPI per saldatura** (UNI EN 169): numeri di graduazione richiesti nel campo di corrente o portata (prospetti II, III e IV), adeguato se per ogni numero richiesto c'è un filtro pari o di un grado più scuro.
- Conclusioni e piano proposti dal calcolo, modificabili. Test sul DVR ROA Castagnola 2026.
- Template: `tools/dvr/costruisci_template_roa.py` → `public/templates/dvr/roa.docx`; le didascalie restano numerate con i campi SEQ del modello.

## Agenti chimici, Fumi di saldatura, Agenti cancerogeni (src/dvr/chimico)

- Tre rischi (`chimico`, `fumi_saldatura`, `cancerogeno`) con lo stesso motore e lo stesso editor; gli agenti (colonne delle tabelle) sono fissi per tipo, limiti TLV/STEL e gravità modificabili nel documento.
- **Ambienti di lavoro** (fase + postazione) con le misure in `dvr_documenti.contenuti.chimico`, importabili dalle campagne polveri, gas e carbonio EC (raggruppate per fase e postazione); concentrazione = media delle misure, anche storiche (asterisco). Metalli e polveri inalabili si scrivono a mano.
- **Modello Regione Piemonte** (chimico e fumi di saldatura): E dal rapporto C/TLV e dal numero di misure, D dai minuti nella matrice dei tempi (o scelto), P dalla matrice, IR = P × M, classi irrilevante … molto alto.
- **Esposizione per mansione**: righe di `dvr_tempi` con `valori.ambiente` (concentrazioni dell'ambiente) o `valori.concentrazioni` (a mano); TWA sulle 8 ore (UNI EN 689), O₂ come minimo.
- Test sui DVR Chimico Castagnola 2026, Fumi di saldatura II sem. 2025 e Cancerogeno II sem. 2025 (segnalano le medie e i totali sbagliati dei modelli).
- Template: `tools/dvr/costruisci_template_{chimico,fumi_saldatura,cancerogeno}.py` (parti comuni in `chimico_comune.py`) → `public/templates/dvr/*.docx`; didascalie con campi SEQ, titoli su un solo elenco numerato, piè di pagina degli allegati corretti.

## Amianto e IPA (src/dvr/chimico, senza modello)

Due tipi in più della famiglia chimica (`amianto`, `ipa`): stesso motore ed editor (ambienti con le misure, giornata tipo, esposizione sulle 8 ore), senza il modello Regione Piemonte. Struttura e testi sono una proposta da far rivedere a Davide.

- **Amianto** (Titolo IX, Capo III): fibre di amianto SEM (`conc_amianto`) e fibre aerodisperse totali MOCF (`conc_fibre_totali`, solo indicatore) in ff/L, importate dalla campagna amianto (se il valore è sotto il limite di rilevabilità si usa il limite e lo si scrive nelle note). Confronto con il valore limite dell'art. 254 (100 ff/L) e con il livello ESEDI di 10 ff/L (art. 249 c. 2): conclusioni per mansione ESEDI / esposti (notifica, sorveglianza, registro) / oltre il limite.
- **IPA** (Titolo IX, Capo II): IPA totali, benzo[a]pirene e BaP equivalente (TEF Nisbet e LaGoy) in ng/m³, scritti a mano dai rapporti di prova (le misure della campagna IPA si importano senza valori). Nessun VLEP: riferimento indicativo TRGS 910 (70 ng/m³ accettazione, 700 tolleranza) e valore obiettivo per l'aria ambiente 1 ng/m³ (D.Lgs. 155/2010) come fondo.
- Template: `tools/dvr/costruisci_template_amianto_ipa.py public/templates/dvr/cancerogeno.docx public/templates/dvr` (parte dal template Agenti cancerogeni; va rigenerato se cambia quello).

## Campi elettromagnetici (src/dvr/cem)

Scritto senza DVR modello: struttura e testi sono una proposta da far rivedere a Davide.

- **Sorgenti** in `dvr_documenti.contenuti.cem`, per categoria (17): giustificabili secondo la CEI EN 50499 tab. 1 (PC, utensili, caricabatterie, radio e telefoni CE, impianti BT ≤ 100 A…) oppure da valutare (saldatura, induzione, cabine e quadri di potenza, motori e TBM, gruppi elettrogeni, magneti, trasmettitori RF, radar). Il tecnico può forzare la giustificazione.
- **Misure** per sorgente (postazione, distanza, frequenza, E, B o H), importabili dalle misure CEM delle campagne (collegate alla sorgente con lo stesso nome; se manca, la sorgente si crea con la categoria probabile dal nome).
- **Confronto** con i valori di azione dell'Allegato XXXVI (D.Lgs. 159/2016 = Dir. 2013/35/UE: VA inferiori e superiori per E, VA per B e VA per gli arti, effetti termici da 100 kHz, campi statici) e con i livelli per la popolazione della Racc. 1999/519/CE. Zone: 0 entro i livelli per la popolazione, 1 oltre la popolazione ma entro i VA (con sotto-casi), 2 oltre i VA superiori. Distanza di rispetto = distanza minima misurata entro i livelli per la popolazione.
- Esito per mansione dalle sorgenti a cui lavora vicino; conclusioni e piano proposti dal calcolo (segnaletica di zona, art. 210 e sorveglianza sanitaria oltre i VA, cavi di saldatura, detonatori in galleria tradizionale con radio/RF, magneti), modificabili. Paragrafo sui lavoratori particolarmente sensibili (portatori di dispositivi impiantati, gravidanza).
- Template: `tools/dvr/costruisci_template_cem.py public/templates/dvr/roa.docx public/templates/dvr/cem.docx` (parte dal template ROA per copertina, stili e piè di pagina).

## Agenti biologici (src/dvr/biologico, senza modello)

- Titolo X, esposizione potenziale (art. 271 c. 4). **Agenti potenziali** in `contenuti.biologico` (elenco proposto secondo gli ambiti: tetano, leptospira, legionella, enterobatteri/epatite A, muffe, HBV/HCV/HIV per il primo soccorso, zecche per le opere all'esterno), con gruppo (allegato XLVI), probabilità P 1–4, danno D dal gruppo (modificabile), R = P × D: 1–2 trascurabile, 3–4 basso, 6–8 medio, 9–16 alto. Un agente senza mansioni indicate riguarda tutte le mansioni.
- **Carica microbica dell'aria** (SAS): batteri a 22 °C e 36 °C, muffe e lieviti in UFC/m³, importati dalle campagne `biologico_sas`, classificati con le categorie indicative ECA report n. 12 (1993) per ambienti non industriali (non sono limiti di legge).
- Template: `tools/dvr/costruisci_template_biologico.py public/templates/dvr/cem.docx public/templates/dvr/biologico.docx`.

## Monitoraggio delle acque (src/dvr/acqua, senza modello)

- Rischio `acqua`: relazione di monitoraggio delle acque di cantiere (non una valutazione di esposizione). **Punti** con destinazione (consumo umano D.Lgs. 18/2023: pH 6,5–9,5 e conducibilità ≤ 2500 µS/cm; scarico in acque superficiali o in fognatura D.Lgs. 152/2006 tab. 3: pH 5,5–9,5; solo monitoraggio senza limiti) e limiti modificabili per punto (prescrizioni dell'autorizzazione). **Misure** di pH, conducibilità, temperatura dell'acqua e dell'aria, ossigeno disciolto importate dalle campagne `monitoraggio_acqua` e raggruppate per punto (destinazione proposta dal nome del punto).
- Template: `tools/dvr/costruisci_template_acqua.py public/templates/dvr/cem.docx public/templates/dvr/acqua.docx`.
- Biologico e acqua usano `tools/dvr/scheletro.py`: copertina, indice, intestazioni e stili del template CEM con il corpo scritto da una lista di blocchi (titoli, paragrafi, elenchi, tabelle, condizioni). Se cambia il template CEM vanno rigenerati.

## Testi secondo gli ambiti

`rumore/testiPredefiniti.ts`: il ciclo di lavoro predefinito ha un blocco per ogni tipo di ambito del documento (galleria TBM o tradizionale, viadotto, opere in esterno, piazzale, officina, campo base, uffici) nell'ordine delle lavorazioni (`cicloPredefinito`); la zonizzazione del rumore è quella della galleria o, per viadotti e opere in esterno, quella delle lavorazioni all'aperto (`zonizzazionePredefinita`); `luoghiLavoro` scrive dove operano i lavoratori ("sulla TBM, sul piazzale e in officina"). Negli altri DVR (`comune/ambiti.ts`, `contestoAmbiti`):
- chimico, cancerogeno, amianto: misure adottate e piano distinti per scavo tradizionale (bagnatura del marino dopo la volata e del fronte, personale al fronte durante scavo, smarino e spritz), TBM (condizionamento del terreno nella camera di scavo, nastro bagnato o chiuso, depolverazione della TBM, personale nelle zone della testa e dei nastri) e opere all'aperto (piste, perforazioni per pali, gas di scarico dispersi all'aperto);
- posture: luogo e "operazioni ordinarie" per galleria tradizionale (tubazioni, ventilazione, centine), TBM (nastro, pulizia del back-up, cambio utensili) o cantiere all'aperto (casseri, viabilità, segnaletica);
- vibrazioni: sorgenti al corpo intero dell'analisi preliminare (mezzi, macchine di scavo in galleria tradizionale, TBM con lavoratori in piedi sulle piattaforme, sollevatori, rulli e macchine per pali all'aperto);
- CEM, biologico e acque usano già gli ambiti (detonatori in galleria tradizionale, zecche nelle opere all'aperto, gestione delle acque di galleria).
Tutti i testi restano modificabili nel documento.

## Template Word

`tools/dvr/costruisci_template_rumore.py <DVR modello.docx> public/templates/dvr/rumore.docx` ricava il template dal DVR Rumore Xenia 2026. Correzioni applicate al modello: IEC 651/804 → IEC 61672, SIT → ACCREDIA, disuguaglianze delle fasce, sezione piè di pagina dell'Allegato 1, logo CTG nell'Allegato 3, firme scansionate tolte dalla copertina, numerazione tabelle automatica, art. 196 per la sorveglianza sanitaria.

Il logo del cliente si carica nel documento (riquadro 198,45 × 52,6 pt); il logo ECO-TER è nel template.

## Da fare

- Rivedere con Davide struttura, testi e soglie dei DVR CEM, Amianto, IPA, Biologico e della relazione Acque (nessun modello ECO-TER).
- Rivedere con Davide i testi predefiniti per ambito (`rumore/testiPredefiniti.ts`).
- Logo dello studio configurabile (per la vendita ad altri professionisti) e multi-tenancy (Fase K).
