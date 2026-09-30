#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Agenti chimici (polveri e gas tossici, docxtemplater) dal DVR
modello "DVR_Gennaio_2026_Chimico_ Castagnola.docx" (cartella DVR/Modelli):

    python3 tools/dvr/costruisci_template_chimico.py "DVR_Gennaio_2026_Chimico_ Castagnola.docx" public/templates/dvr/chimico.docx

Le tabelle dei dati rilevati, dei fattori del modello Regione Piemonte (una tabella per ambiente),
delle classi per agente, delle esposizioni per mansione, dell'allegato 1 e le TAV dell'allegato 2
diventano cicli; le didascalie (numerate a mano nel modello) diventano campi SEQ.
Correzioni del modello: unità delle polveri (ppm → mg/m³) e della CO₂ (ppm → %) nelle intestazioni,
tolto il paragrafo che dichiarava esclusi CO₂ e H₂S (poi calcolati), testo del campionamento con
tutti i gas misurati.
"""
import copy
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from chimico_comune import (  # noqa: E402
    W,
    apri,
    atteso,
    avvolgi,
    cella,
    celle,
    ciclo_blocchi,
    fissa_piede,
    usa_piede_di,
    pulisci_livello,
    numera_titolo,
    nuova_pagina,
    continua_numerazione,
    altezza_minima,
    piede_dedicato,
    copertina,
    didascalia,
    imposta_testo,
    intestazione_ripetuta,
    paragrafi_cella,
    paragrafi_ciclo,
    paragrafo_tag,
    piano,
    rimuovi,
    riga_ciclo,
    righe,
    salti_in_interruzioni,
    salto_pagina,
    salva,
    testo,
    togli_vmerge,
)
from costruisci_template_mmc import solo_contenuto, tieni_insieme, togli_colore  # noqa: E402
from costruisci_template_microclima import larghezze  # noqa: E402

TITOLO_PIEDE = 'Valutazione del rischio di esposizione dei lavoratori a polveri e gas tossici'

# ordine delle colonne degli agenti nelle tabelle del modello
MISURE = ['polveri_resp', 'no', 'co', 'co2', 'h2s', 'no2']
IR = ['polveri_resp', 'no', 'co', 'co2', 'no2', 'h2s']
MANSIONE = ['polveri_resp', 'no2', 'no', 'co', 'co2', 'h2s', 'o2']
GAS = ['no', 'co', 'co2', 'h2s', 'no2']


def trasforma_documento(doc, lavoro):
    body = doc.getroot().find(W + 'body')
    B = list(body)
    tag = lambda s: paragrafo_tag(B[50], s)  # noqa: E731

    def se(primo, ultimo, nome):
        avvolgi(primo, ultimo, nome, rif=B[50])

    copertina(B, '10', 'Gennaio 2026', 'Secondo semestre Luglio – Dicembre 2025')

    # titoli: un solo elenco numerato (il modello ne usa sette, con numeri di partenza scritti a mano)
    for i in (47, 59, 74, 268, 463, 536):
        numera_titolo(B[i], 0)
    numera_titolo(atteso(B[298], 'Elaborazione dei dati'), 0, modello=B[268])
    for r in B[298].findall(W + 'r'):
        if r.find(W + 'br') is not None:
            B[298].remove(r)
    for i in (83, 115, 226, 229, 232, 235, 243, 250, 258, 278, 360, 445, 464, 528):
        numera_titolo(B[i], 1)
    numera_titolo(atteso(B[304], 'Elaborazione dei dati acquisiti'), 1, stile='Titolo2')
    numera_titolo(B[305], 2)
    numera_titolo(B[334], 2)
    pulisci_livello(lavoro, 1, 1)
    for i in (74, 268, 298, 463, 536):
        nuova_pagina(B[i])
    for r in B[74].findall(W + 'r'):
        if r.find(W + 'br') is not None:
            B[74].remove(r)

    # --- 1. Introduzione
    paragrafi_ciclo(atteso(B[48], 'In applicazione'), 'intro')
    rimuovi(atteso(B[49], 'Per la redazione'))
    se(atteso(B[53], 'Considerate le sorgenti'), atteso(B[57], 'specifiche valutazioni'), 'galleria')

    # --- 2. Metodologia
    se(atteso(B[65], 'scavo galleria'), B[65], 'galleria')
    imposta_testo(atteso(B[72], 'Campionamento'), 'Campionamento: stima delle polveri in frazione respirabile e dei gas (CO, CO₂, NO, NO₂, H₂S e O₂).')

    # --- 3. Acquisizione dati
    imposta_testo(atteso(B[76], 'produttività'), 'produttività del cantiere e avanzamento dei lavori nel periodo di riferimento;')
    imposta_testo(atteso(B[77], 'tempi per ogni'), 'durata delle fasi lavorative svolte da ciascuna mansione;')
    ciclo_blocchi(atteso(B[84], 'Castagnola'), atteso(B[87], 'Perforazione'), solo_contenuto(B[85:115]))

    # 3.2 Mansioni
    atteso(B[116], 'classificati in gruppi')
    rimuovi(*solo_contenuto(B[117:206]))
    didascalia(atteso(B[206], 'Mansioni impiegate'), 'Mansioni e gruppi omogenei per la valutazione.')
    riga_ciclo(B[207], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')
    larghezze(B[207], [14, 30, 56])
    intestazione_ripetuta(B[207])
    rimuovi(*solo_contenuto(B[208:225]))

    # 3.3–3.5 figure della sicurezza
    imposta_testo(atteso(B[227], 'Lombroni'), '{medicoCompetente}')
    imposta_testo(atteso(B[230], 'Parolin'), '{rspp}')
    paragrafi_ciclo(atteso(B[233], 'Gencarelli'), 'rls')

    # 3.6 Macchine
    didascalia(atteso(B[239], 'Principali mezzi'), 'Principali mezzi presenti e utilizzati in cantiere.')
    riga_ciclo(B[240], 1, ['{tipologia}', '{modello}', '{alimentazione}', '{utensile}'], 'macchine')
    intestazione_ripetuta(B[240])
    se(atteso(B[238], 'elenco delle principali macchine'), B[240], 'conMacchine')

    # 3.7 DPI, 3.8 ventilazione, 3.9 misure preventive
    paragrafi_ciclo(atteso(B[244], 'dispositivi di protezione'), 'testiDpi')
    rimuovi(*B[245:249])
    se(atteso(B[250], 'Ventilazione'), atteso(B[253], 'aria fresca'), 'galleria')
    rimuovi(*B[254:257])
    atteso(B[259], 'Al fine di contenere')
    paragrafi_ciclo(atteso(B[260], 'ventilazione'), 'misurePreventive')
    rimuovi(*B[261:267])

    # --- 4. Campionamento
    paragrafi_ciclo(atteso(B[269], 'polveri in frazione respirabile'), 'testiCampionamento')
    rimuovi(*B[270:278])
    atteso(B[279], 'seguente strumentazione')
    paragrafi_ciclo(atteso(B[280], 'TESTO'), 'strumenti')
    rimuovi(*B[281:289])
    imposta_testo(atteso(B[289], 'In particolare'), 'Nel corso di questa campagna di monitoraggio sono state effettuate le misure riportate nella tabella seguente.')
    didascalia(atteso(B[290], 'Sintesi dei campionamenti'), 'Sintesi dei campionamenti effettuati nel periodo.')
    t = B[291]
    paragrafi_cella(celle(righe(t)[0])[0], ['Fasi lavorative principali durante le quali sono state effettuate le misure'])
    togli_vmerge(righe(t)[1])
    riga_ciclo(t, 1, ['{fase}', '{postazione}'], 'sintesi')
    intestazione_ripetuta(t)
    rimuovi(B[292], B[293])
    se(atteso(B[295], 'campagne di misura precedenti'), B[295], 'conStorici')

    # --- 5. Elaborazione dei dati
    paragrafi_ciclo(atteso(B[299], 'I dati acquisiti'), 'testiTempi')
    rimuovi(B[300], B[301])
    se(atteso(B[302], 'scavo galleria'), B[302], 'galleria')
    rimuovi(B[303])
    imposta_testo(atteso(B[307], 'Per valutare i tempi'),
                  'Per valutare i tempi di esposizione media giornaliera sono state utilizzate le informazioni fornite dall’impresa sulle fasi '
                  'lavorative svolte da ciascuna mansione nella giornata tipo, riportate nelle tabelle dell’Allegato 2.')
    rimuovi(*solo_contenuto(B[308:334]))

    # 5.1.2 dati rilevati
    imposta_testo(atteso(B[335], 'Nella tabella che segue'), 'Nella tabella che segue vengono riportati i dati rilevati{periodoNelTesto} nel cantiere {denominazione}.')
    se(atteso(B[336], 'campagna di misure'), B[336], 'conStorici')
    didascalia(atteso(B[339], 'Dati del monitoraggio'), 'Dati del monitoraggio delle polveri e dei gas tossici usati per il calcolo delle esposizioni.')
    t = B[340]
    paragrafi_cella(celle(righe(t)[0])[6], ['Concentrazione di CO₂', '[%]'])
    riga = righe(t)[1]
    togli_vmerge(riga)
    riga_ciclo(t, 1, ['{attivita}', '{fronte}', '{avanzamento}'] + ['{c_%s}' % a for a in MISURE] + ['{m_%s}' % a for a in MISURE], 'misureAmbienti')
    intestazione_ripetuta(t)
    rimuovi(*solo_contenuto(B[341:357]))
    se(atteso(B[357], 'asterisco'), B[357], 'conStorici')

    # 5.2 modello Regione Piemonte
    didascalia(atteso(B[369], 'Fattori di rischio'), 'Fattori di rischio (linee guida Regione Piemonte).')
    didascalia(atteso(B[379], 'Matrice'), 'Matrice per la determinazione del fattore P (linee guida Regione Piemonte).')
    didascalia(atteso(B[384], 'Classificazione del rischio'), 'Classificazione del rischio (linee guida Regione Piemonte).')
    rimuovi(atteso(B[390], 'semplificazioni'), atteso(B[391], 'anidride carbonica'), atteso(B[392], 'limite di rilevabilità'))
    atteso(B[393], 'Nelle tabelle seguenti')
    rimuovi(B[394], B[395])
    didascalia(atteso(B[396], 'Calcolo fattori'), 'Calcolo dei fattori e degli indici di rischio (linee guida Regione Piemonte) per ambiente di lavoro.')
    t = B[397]
    rr = righe(t)
    paragrafi_cella(celle(rr[0])[1], ['Polveri', 'mg/m³'])
    cs = celle(rr[1])
    cella(cs[0], '{titolo}')
    for tc, a in zip(cs[1:7], IR):
        cella(tc, '{v_%s}' % a)
    cella(cs[7], '{mansioniEsposte}')
    for i, pref in zip(range(2, 8), ('tlv', 'pct', 'e', 'd', 'g', 'ir')):
        for tc, a in zip(celle(rr[i])[1:7], IR):
            cella(tc, '{%s_%s}' % (pref, a))
    cella(celle(atteso(rr[7], 'CLASSE'))[0], 'INDICE DI RISCHIO')
    rimuovi(*rr[8:])
    tieni_insieme(t)
    spazio = copy.deepcopy(B[398])
    t.addprevious(tag('{#ambientiIR}'))
    t.addnext(tag('{/ambientiIR}'))
    t.addnext(spazio)
    rimuovi(*solo_contenuto(B[398:443]))

    # 5.3 esposizione per mansione
    didascalia(atteso(B[448], 'Livelli di esposizione'), 'Livelli di esposizione per mansione.', stile_da=B[339])
    t = B[449]
    riga_ciclo(t, 2, ['{numero}', '{nome}'] + ['{t_%s}' % a for a in MANSIONE], 'esposizioni', da_eliminare=[])
    rr = righe(t)
    limite = copy.deepcopy(rr[2])
    rr[3].addprevious(limite)
    for tc, s in zip(celle(limite), ['', 'Limite TLV-TWA'] + ['{tlv_%s}' % a for a in MANSIONE]):
        cella(tc, s)
    rimuovi(*righe(t)[4:])
    intestazione_ripetuta(t, 2)
    rimuovi(*solo_contenuto(B[450:462]))

    # --- 6. Conclusioni
    imposta_testo(atteso(B[465], 'Utilizzando il modello'),
                  'Utilizzando il modello di calcolo proposto dalle linee guida della Regione Piemonte vengono individuate, per gli ambienti '
                  'di lavoro del cantiere {denominazione}, le seguenti classi di rischio per ciascun agente.')
    imposta_testo(atteso(B[466], 'Polveri'), '{agente}')
    didascalia(atteso(B[467], 'Individuazione classi'), 'Individuazione delle classi di rischio: {agenteMinuscolo}.')
    t = B[468]
    riga_ciclo(t, 1, ['{classe}', '{attivita}', '{mansioniEsposte}', '{misure}'], 'righe')
    intestazione_ripetuta(t)
    spazio = copy.deepcopy(B[469])
    t.addnext(spazio)
    B[466].addprevious(tag('{#classiAgenti}'))
    spazio.addnext(tag('{/classiAgenti}'))
    rimuovi(*solo_contenuto(B[469:507]))
    imposta_testo(atteso(B[507], 'Dall’analisi delle tabelle'), 'Dall’analisi delle tabelle di valutazione del rischio emergono le seguenti considerazioni:')
    paragrafi_ciclo(atteso(B[509], 'maggior parte'), 'conclusioniAgenti')
    rimuovi(B[508], *B[510:528])
    paragrafi_ciclo(atteso(B[529], 'analisi comparata'), 'conclusioniMansioni')
    rimuovi(*B[530:535])

    # --- 7. Piano
    imposta_testo(atteso(B[537], 'In base a quanto previsto'),
                  'In base alle classi di rischio riscontrate nelle attività in corso presso il cantiere {denominazione} e alle esposizioni '
                  'calcolate, è necessario mettere in atto le misure generali di prevenzione del rischio e, per le attività a rischio '
                  'rilevante, anche le misure specifiche seguenti.')
    piano(atteso(B[538], 'Misure generali'), atteso(B[540], 'Limitare'), solo_contenuto(B[539:564]), spazio=B[545])

    # --- Indice delle revisioni
    rimuovi(B[566])
    continua_numerazione(B[573])
    riga_ciclo(B[569], 1, ['{rev}', '{integrazione}', '{data}', '{descrizione}', '{redatto}', '{verificato}', '{approvato}'], 'revisioni')

    # --- Allegato 1
    imposta_testo(atteso(B[585], 'Nelle tabelle seguenti'), 'Nelle tabelle seguenti sono riportate le misure di polveri e gas eseguite{periodoNelTesto} presso il cantiere {denominazione}.')
    t = B[587]
    togli_vmerge(righe(t)[2])
    riga_ciclo(t, 2, ['{fase}', '{postazione}', '{tempo}', '{tipo}', '{macchine}'] + ['{c_%s}' % a for a in GAS] + ['{note}'], 'allegatoGas')
    altezza_minima(righe(t)[2], 400)
    larghezze(t, [2000, 1500, 1000, 900, 2300, 750, 750, 750, 750, 750, 1900])
    intestazione_ripetuta(t, 2)
    t = B[600]
    cella(celle(righe(t)[0])[-1], 'Polveri respirabili [mg/m³]')
    cella(celle(righe(t)[0])[-2], 'Pompa utilizzata [l/min]')
    riga_ciclo(t, 1, ['{postazione}', '{fase}', '{macchine}', '{tipo}', '{temperatura}', '{velocita}', '{note}', '{pompa}', '{c_polveri_resp}'], 'allegatoPolveri')
    altezza_minima(righe(t)[1], 400)
    intestazione_ripetuta(t)
    B[587].addprevious(tag('{#conGas}'))
    B[587].addnext(tag('{/conGas}'))
    B[600].addprevious(tag('{#conPolveri}'))
    B[600].addnext(tag('{/conPolveri}'))
    rimuovi(*B[589:599], *B[601:605])
    # il modello usa per queste tabelle il piè di pagina dell'allegato 2
    piede_dedicato(lavoro, B[605], B[622], {
        'ALLEGATO 2 – TABELLE DI SINTESI DEI LIVELLI DI ESPOSIZIONE DEI LAVORATORI A': 'ALLEGATO 1 – TABELLE DI SINTESI DELLE MISURE',
        'POLVERI E GAS TOSSICI': '',
    })
    # le TAV usano il piè di pagina dell'allegato 4: passano a quello dell'allegato 2
    fissa_piede(body.find(W + 'sectPr'), B[1117])
    usa_piede_di(B[1117], B[622])

    # --- Allegato 2: una TAV per mansione
    imposta_testo(atteso(B[619], 'ad ogni singola fase'),
                  'Per il calcolo dei livelli di esposizione dei lavoratori, ad ogni singola fase è stato associato il valore di concentrazione '
                  'risultante dalla media dei rilievi eseguiti durante la stessa operazione.')
    se(atteso(B[620], 'asterisco'), B[620], 'conStorici')
    t = B[624]
    rr = righe(t)
    cs = celle(rr[0])
    cella(atteso(cs[0], 'TAV. 1'), 'TAV. {numero} MANSIONE:')
    cella(atteso(cs[1], 'Castagnola'), 'Cantiere {denominazione}')
    cella(celle(rr[1])[0], '{nome}')
    togli_colore(cs[-1])
    a, b = rr[3], rr[4]
    for tc, c in zip(celle(a), ['{#righe}{fase}', '{minuti}'] + ['{v_%s}' % x for x in MANSIONE]):
        cella(tc, c)
    cs = celle(b)
    cella(cs[0], 'Postazione: {postazione}')
    cella(cs[-1], '{/righe}')
    tot = celle(atteso(rr[21], 'LIVELLO DI ESPOSIZIONE'))
    for tc, c in zip(tot[1:], ['{minutiTotali}'] + ['{tot_%s}' % x for x in MANSIONE]):
        cella(tc, c)
    for tc, x in zip(celle(atteso(rr[22], 'TLV-TWA'))[2:], MANSIONE):
        cella(tc, '{tlv_%s}' % x)
    for tc, x in zip(celle(atteso(rr[23], 'TLV-STEL'))[2:], MANSIONE):
        cella(tc, '{stel_%s}' % x)
    rimuovi(*rr[5:21], rr[24])
    t.addprevious(tag('{#tav}'))
    fine = salto_pagina(B[50], 'nonUltima')
    t.addnext(fine)
    fine.addnext(tag('{/tav}'))
    rimuovi(*solo_contenuto(B[625:1117]))


def main():
    modello, uscita = sys.argv[1], sys.argv[2]
    lavoro, doc, doc_path = apri(modello)
    trasforma_documento(doc, lavoro)
    salti_in_interruzioni(doc.getroot().find(W + 'body'))
    salva(lavoro, doc, doc_path, uscita, TITOLO_PIEDE)


if __name__ == '__main__':
    main()
