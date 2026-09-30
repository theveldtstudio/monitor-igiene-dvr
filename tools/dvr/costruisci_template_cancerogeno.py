#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Agenti cancerogeni (silice libera cristallina e carbonio
elementare, docxtemplater) dal DVR modello "DVR_Giugno_2025_Cancerogeno_Castagnola.docx" (cartella
DVR/Modelli):

    python3 tools/dvr/costruisci_template_cancerogeno.py DVR_Giugno_2025_Cancerogeno_Castagnola.docx public/templates/dvr/cancerogeno.docx

Le tabelle dei dati rilevati, delle medie per ambiente (una sola tabella al posto delle quattro
per zona), delle esposizioni per mansione, del piano (priorità e misure), dell'allegato 1 e le TAV
dell'allegato 2 diventano cicli; le didascalie diventano campi SEQ.
Correzioni del modello: "Turmo" → tolta la riga del turno più gravoso, "CARBO" → carbonio
elementare, Luglio – Dicembre 2026 (data sbagliata nell'allegato 1), paragrafi di integrazione
("non viene riprodotto il capitolo…") tolti.
"""
import copy
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from chimico_comune import (  # noqa: E402
    W,
    altezza_minima,
    apri,
    atteso,
    avvolgi,
    cella,
    celle,
    ciclo_blocchi,
    copertina,
    didascalia,
    imposta_testo,
    inizio_livello,
    numera_titolo,
    intestazione_ripetuta,
    nuova_pagina,
    paragrafi_cella,
    paragrafi_ciclo,
    paragrafo_tag,
    rimuovi,
    riga_ciclo,
    righe,
    salti_in_interruzioni,
    salto_pagina,
    salva,
    testo,
    togli_vmerge,
)
from costruisci_template_mmc import solo_contenuto, tieni_insieme  # noqa: E402
from costruisci_template_microclima import larghezze  # noqa: E402
from costruisci_template_rumore import sostituisci  # noqa: E402

TITOLO_PIEDE = 'Documento di valutazione del rischio di esposizione dei lavoratori alla silice libera cristallina ed ai gas di scarico dei motori diesel'
AGENTI = ['polveri_resp', 'silice', 'ec']


def trasforma_documento(doc, lavoro):
    body = doc.getroot().find(W + 'body')
    B = list(body)
    rif = B[46]
    tag = lambda s: paragrafo_tag(rif, s)  # noqa: E731

    def se(primo, ultimo, nome):
        avvolgi(primo, ultimo, nome, rif=rif)

    copertina(B, '01', 'Gennaio 2026', 'Luglio - Dicembre 2025', tag_periodo='Periodo di riferimento: {periodoRiferimento}')

    # titoli: un solo elenco numerato (il modello ne usa quindici, con numeri di partenza scritti a mano)
    inizio_livello(lavoro, 5, 0, 1)
    for livello, indici in ((0, (44, 57, 65, 247, 301, 354, 396, 412)),
                            (1, (73, 99, 207, 210, 213, 216, 224, 231, 236, 257, 307, 355, 381)),
                            (2, (269, 272, 283, 308, 338))):
        for i in indici:
            numera_titolo(B[i], livello, num_id='5')

    # --- 1. Introduzione
    paragrafi_ciclo(atteso(B[45], 'In applicazione'), 'intro')
    rimuovi(atteso(B[48], 'Per la redazione'))
    imposta_testo(atteso(B[52], 'Eco-Ter'), 'Le misure e la redazione del presente elaborato sono state effettuate dalla {studioEsecutore}.')
    rimuovi(atteso(B[54], 'integrazione del rapporto precedente'))

    # --- Metodologia e acquisizione dati
    sostituisci(atteso(B[58], 'alla silice libera cristallina'), 'alla silice libera cristallina', 'alla silice libera cristallina e al carbonio elementare')
    imposta_testo(atteso(B[60], 'Campionamento'), 'Campionamento ed analisi della silice libera cristallina e del carbonio elementare;')
    imposta_testo(atteso(B[67], 'produttività'), 'produttività del cantiere e avanzamento dei lavori nel periodo di riferimento;')
    imposta_testo(atteso(B[68], 'tempi per ogni'), 'durata delle fasi lavorative svolte da ciascuna mansione;')
    ciclo_blocchi(atteso(B[74], 'Castagnola'), atteso(B[76], 'Perforazione'), solo_contenuto(B[75:99]))

    # Mansioni
    atteso(B[100], 'classificati in gruppi')
    rimuovi(*solo_contenuto(B[101:189]))
    didascalia(atteso(B[189], 'Mansioni impiegate'), 'Mansioni e gruppi omogenei per la valutazione.')
    riga_ciclo(B[190], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')
    intestazione_ripetuta(B[190])
    rimuovi(*solo_contenuto(B[191:207]))
    imposta_testo(atteso(B[208], 'Lombroni'), '{medicoCompetente}')
    imposta_testo(atteso(B[211], 'Parolin'), '{rspp}')
    paragrafi_ciclo(atteso(B[214], 'Gencarelli'), 'rls')

    # Macchine, DPI, ventilazione, misure preventive
    didascalia(atteso(B[221], 'Principali mezzi'), 'Principali mezzi presenti e utilizzati in cantiere.')
    riga_ciclo(B[222], 1, ['{tipologia}', '{modello}', '{alimentazione}', '{utensile}'], 'macchine')
    intestazione_ripetuta(B[222])
    se(atteso(B[219], 'elenco delle principali macchine'), B[222], 'conMacchine')
    paragrafi_ciclo(atteso(B[225], 'dispositivi di protezione'), 'testiDpi')
    rimuovi(*B[226:230])
    se(atteso(B[231], 'Ventilazione'), atteso(B[234], 'aria fresca'), 'galleria')
    atteso(B[237], 'Al fine di contenere')
    paragrafi_ciclo(atteso(B[238], 'ventilazione'), 'misurePreventive')
    rimuovi(*B[239:246])

    # --- Campionamento
    imposta_testo(atteso(B[247], 'Campionamento silice'), 'Campionamento')
    paragrafi_ciclo(atteso(B[248], 'principali postazioni'), 'testiCampionamento')
    rimuovi(*B[249:256])
    paragrafi_ciclo(atteso(B[259], 'TESTO'), 'strumenti')
    rimuovi(*solo_contenuto(B[260:269]))
    imposta_testo(atteso(B[295], 'In particolare'), 'Nel corso di questa campagna di monitoraggio sono state effettuate le misure indicate di seguito.')
    didascalia(atteso(B[296], 'Campionamento'), 'Sintesi dei campionamenti effettuati nel periodo.')
    t = B[297]
    paragrafi_cella(celle(righe(t)[0])[0], ['Fasi lavorative principali durante le quali sono state effettuate le misure'])
    togli_vmerge(righe(t)[1])
    riga_ciclo(t, 1, ['{fase}', '{postazione}'], 'sintesi')
    intestazione_ripetuta(t)
    se(atteso(B[299], 'campagne di misura precedenti'), B[299], 'conStorici')

    # --- Elaborazione dei dati
    paragrafi_ciclo(atteso(B[302], 'I dati acquisiti'), 'testiTempi')
    rimuovi(B[303], B[304])
    se(atteso(B[305], 'scavo galleria'), B[305], 'galleria')
    imposta_testo(atteso(B[310], 'Per valutare i tempi'),
                  'Per valutare i tempi di esposizione media giornaliera sono state utilizzate le informazioni fornite dall’impresa sulle fasi '
                  'lavorative svolte da ciascuna mansione nella giornata tipo, riportate nelle tabelle dell’Allegato 2.')
    rimuovi(*solo_contenuto(B[311:338]))
    imposta_testo(atteso(B[339], 'Nella tabella che segue'), 'Nella tabella che segue vengono riportati i dati rilevati{periodoNelTesto} nel cantiere {denominazione}.')
    se(atteso(B[340], 'campagna di misure precedente'), B[340], 'conStorici')
    rimuovi(atteso(B[341], 'limite di rilevabilità'))
    didascalia(atteso(B[345], 'Dati del monitoraggio'), 'Dati del monitoraggio delle polveri, della silice e del carbonio elementare usati per il calcolo delle esposizioni.')
    t = B[346]
    togli_vmerge(righe(t)[1])
    riga_ciclo(t, 1, ['{attivita}', '{fronte}', '{avanzamento}'] + ['{c_%s}' % a for a in AGENTI] + ['{m_%s}' % a for a in AGENTI], 'misureAmbienti')
    altezza_minima(righe(t)[1], 280)
    larghezze(t, [18, 11, 9, 11, 11, 11, 10, 10, 10])
    intestazione_ripetuta(t)
    rimuovi(*solo_contenuto(B[347:353]))
    # paragrafo di fine sezione con lo stile Titolo 1 (numerato ma vuoto): diventa un paragrafo normale
    ppr = B[353].find(W + 'pPr')
    for x in ppr.findall(W + 'pStyle') + ppr.findall(W + 'numPr'):
        ppr.remove(x)

    # --- Analisi dei dati per ambiente
    imposta_testo(atteso(B[356], 'I risultati delle misure'), 'Nella tabella seguente sono riportate le concentrazioni medie per ambiente di lavoro.')
    rimuovi(*solo_contenuto(B[357:361]))
    didascalia(atteso(B[361], 'zona fronte'), 'Valori medi rilevati per ambiente di lavoro.')
    t = B[362]
    cella(celle(righe(t)[0])[1], 'Cantiere {denominazione}')
    riga_ciclo(t, 2, ['{attivita}'] + ['{m_%s}' % a for a in AGENTI], 'medieAmbienti')
    larghezze(t, [34, 22, 22, 22])
    intestazione_ripetuta(t, 2)
    rimuovi(*solo_contenuto(B[363:373]))
    atteso(B[374], 'Dall’analisi dei dati')
    paragrafi_ciclo(atteso(B[375], 'generalmente inferiori'), 'analisiAmbienti')
    rimuovi(*B[376:381])

    # --- Esposizione per mansione
    lim = righe(B[384])[2]
    for tc, a in zip(celle(lim), ['ec', 'silice']):
        cella(tc, '{tlv_%s}' % a)
    didascalia(atteso(B[391], 'Livelli di esposizione'), 'Livelli di esposizione per mansione.')
    riga_ciclo(B[392], 2, ['{numero}', '{nome}', '{t_ec}', '{t_silice}'], 'esposizioni')
    intestazione_ripetuta(B[392], 2)
    rimuovi(*solo_contenuto(B[393:396]))

    # --- Conclusioni
    imposta_testo(atteso(B[397], 'In applicazione'),
                  'In applicazione del Titolo IX, Capo II del D.Lgs. 81/08 e s.m.i., sono stati effettuati dei rilievi al fine di valutare il rischio '
                  'ed i livelli di esposizione alla silice libera cristallina e al carbonio elementare per i lavoratori operanti nel cantiere {denominazione}.')
    rimuovi(*B[398:402])
    atteso(B[402], 'In base ai risultati')
    paragrafi_ciclo(atteso(B[403], 'mansioni operative'), 'conclusioniMansioni')
    rimuovi(*B[404:410])

    # --- Piano: una tabella priorità/misura per voce
    imposta_testo(atteso(B[414], 'In relazione'),
                  'In relazione alle concentrazioni di silice libera cristallina e di carbonio elementare riscontrate e ai valori di esposizione '
                  'dei lavoratori, si suggerisce di applicare tutte le misure di seguito riportate, in ordine di priorità.')
    imposta_testo(atteso(B[417], 'Controllo e informazione'), '{testo}')
    t = B[418]
    riga_ciclo(t, 1, ['{n}', '{testo}'], 'righe')
    intestazione_ripetuta(t)
    spazio = copy.deepcopy(B[415])
    t.addnext(spazio)
    B[417].addprevious(tag('{#pianoTabelle}'))
    spazio.addnext(tag('{/pianoTabelle}'))
    rimuovi(atteso(B[416], 'organizzative indirette'), *solo_contenuto(B[419:441]))

    # --- Indice delle revisioni
    riga_ciclo(B[442], 1, ['{rev}', '{integrazione}', '{data}', '{descrizione}', '{redatto}', '{verificato}', '{approvato}'], 'revisioni')

    # --- Allegato 1
    imposta_testo(atteso(B[454], 'Nelle tabelle seguenti'),
                  'Nelle tabelle seguenti sono riportate le sintesi delle misure di polveri, silice e carbonio elementare eseguite{periodoNelTesto} presso il cantiere {denominazione}.')
    cella(celle(righe(B[457])[0])[0], 'SINTESI DEI RISULTATI DELLE MISURE DI POLVERI, SILICE E CARBONIO ELEMENTARE – CANTIERE {denominazioneMaiuscolo}')
    t = B[461]
    cella(atteso(celle(righe(t)[0])[0], 'Codice'), 'Data')
    cella(celle(righe(t)[0])[6], 'Polveri respirabili [mg/m³]')
    cella(celle(righe(t)[0])[7], 'Silice [mg/m³]')
    riga_ciclo(t, 1, ['{data}', '{postazione}', '{fase}', '{macchine}', '{tipo}', '{note}', '{c_polveri_resp}', '{c_silice}'], 'allegatoPolveri')
    altezza_minima(righe(t)[1], 400)
    intestazione_ripetuta(t)
    se(atteso(B[459], 'Polveri e silice'), t, 'conPolveri')
    t = B[468]
    cella(atteso(celle(righe(t)[0])[0], 'Codice'), 'Data')
    cella(celle(righe(t)[0])[6], 'Pompa utilizzata [l/min]')
    cella(celle(righe(t)[0])[7], 'Carbonio elementare [mg/m³]')
    riga_ciclo(t, 1, ['{data}', '{postazione}', '{fase}', '{macchine}', '{tipo}', '{note}', '{pompa}', '{c_ec}'], 'allegatoEc')
    altezza_minima(righe(t)[1], 400)
    intestazione_ripetuta(t)
    se(atteso(B[466], 'carbonio elementare'), t, 'conEc')
    rimuovi(*B[469:473])

    # --- Allegato 2: TAV per mansione
    imposta_testo(atteso(B[490], 'ad ogni singola fase'),
                  'Per il calcolo dei livelli di esposizione dei lavoratori, ad ogni singola fase è stato associato il valore di concentrazione '
                  'risultante dalla media dei rilievi eseguiti durante la stessa operazione.')
    se(atteso(B[491], 'campagna precedente'), B[491], 'conStorici')
    t = B[494]
    rr = righe(t)
    cs = celle(rr[0])
    cella(atteso(cs[0], 'TAV. 1'), 'TAV. {numero} MANSIONE:')
    cella(atteso(cs[1], 'Castagnola'), 'Cantiere {denominazione}')
    cella(celle(rr[1])[0], '{nome}')
    atteso(rr[2], 'maggiormente gravoso')
    a, b = rr[4], rr[5]
    for tc, c in zip(celle(a), ['{#righe}{fase}', '{minuti}', '{v_ec}', '{v_silice}']):
        cella(tc, c)
    cs = celle(b)
    cella(cs[1], '{postazione}')
    cella(cs[-1], '{/righe}')
    tot = next(r for r in rr if testo(r).startswith('LIVELLO'))
    for tc, c in zip(celle(tot)[1:], ['{minutiTotali}', '{tot_ec}', '{tot_silice}']):
        cella(tc, c)
    lim = next(r for r in rr if testo(r).startswith('LIMITE TLV-TWA'))
    for tc, a_ in zip(celle(lim)[2:], ['ec', 'silice']):
        cella(tc, '{tlv_%s}' % a_)
    rimuovi(rr[2], *[r for r in rr[6:] if r is not tot and r is not lim])
    tieni_insieme(t)
    t.addprevious(tag('{#tav}'))
    fine = salto_pagina(rif, 'nonUltima')
    t.addnext(fine)
    fine.addnext(tag('{/tav}'))
    allegato3 = next(i for i in range(495, len(B)) if testo(B[i]).strip() == 'ALLEGATO 3')
    rimuovi(*solo_contenuto(B[495:allegato3]))
    nuova_pagina(B[allegato3], togli_prima=False)
    nuova_pagina(atteso(B[396], 'Conclusioni'), togli_prima=False)


def main():
    modello, uscita = sys.argv[1], sys.argv[2]
    lavoro, doc, doc_path = apri(modello)
    trasforma_documento(doc, lavoro)
    salti_in_interruzioni(doc.getroot().find(W + 'body'))
    salva(lavoro, doc, doc_path, uscita, TITOLO_PIEDE)


if __name__ == '__main__':
    main()
