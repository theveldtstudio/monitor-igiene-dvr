#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Fumi di saldatura (docxtemplater) dal DVR modello
"DVR_FdS_II_semestre_Castagnola.docx" (cartella DVR/Modelli):

    python3 tools/dvr/costruisci_template_fumi_saldatura.py DVR_FdS_II_semestre_Castagnola.docx public/templates/dvr/fumi_saldatura.docx

Le tabelle dei fattori del modello Regione Piemonte (polveri e metalli, gas), delle esposizioni per
mansione, delle classi per mansione e le TAV dell'allegato 1 (A polveri e metalli, B gas) diventano
cicli; le didascalie diventano campi SEQ. I testi sugli agenti (polveri, ferro, manganese, silice,
rame, gas) restano quelli del modello, senza i riferimenti al cantiere.
Correzioni del modello: "fattore frequenza" → fattore durata, TLW → TLV, CO₂ in % (non ppm) nelle
TAV, "Silicio" → silice, tolta la frase che escludeva la CO₂ dal calcolo (poi calcolata), la
numerazione delle pagine che ripartiva da 26.
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
    continua_numerazione,
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
    togli_vmerge,
)
from costruisci_template_mmc import solo_contenuto, tieni_insieme  # noqa: E402
from costruisci_template_rumore import sostituisci  # noqa: E402

TITOLO_PIEDE = 'Documento di valutazione del rischio di esposizione dei lavoratori ai fumi di saldatura'

IR_POLVERI = ['polveri_resp', 'polveri_inal', 'ferro', 'rame_resp', 'rame_inal', 'silice', 'mn_resp', 'mn_inal']
IR_GAS = ['no2', 'co', 'no', 'co2']
ESP_POLVERI = ['polveri_resp', 'polveri_inal', 'ferro', 'silice', 'rame_resp', 'rame_inal', 'mn_resp', 'mn_inal']
TAV_POLVERI = ['polveri_resp', 'polveri_inal', 'ferro', 'rame_inal', 'rame_resp', 'silice', 'mn_resp', 'mn_inal']
TAV_GAS = ['no2', 'co', 'co2', 'no']


def tabella_ir(t, agenti, nome, righe_blocco, separatore):
    """Blocco di righe per ambiente: valori, TLV, %, E, D, M, IR e classe."""
    rr = righe(t)
    b = rr[1:1 + righe_blocco]
    cs = celle(b[0])
    cella(cs[0], '{#%s}{titolo}' % nome)
    for tc, a in zip(cs[1:1 + len(agenti)], agenti):
        cella(tc, '{v_%s}' % a)
    cella(cs[1 + len(agenti)], '{mansioniEsposte}')
    for i, pref in zip(range(1, 8), ('tlv', 'pct', 'e', 'd', 'g', 'ir', 'cl')):
        cs = celle(b[i])
        if i == 1:
            cella(atteso(cs[0], 'TWA'), 'TLV-TWA')
        valori = cs[1:1 + len(agenti)]
        for tc, a in zip(valori, agenti):
            cella(tc, '{%s_%s}' % (pref, a))
    if separatore:
        sep = rr[1 + righe_blocco]
        cella(celle(sep)[0], '{/%s}' % nome)
        rimuovi(*rr[2 + righe_blocco:])
    else:
        ultima = celle(b[7])[len(agenti)]
        cella(ultima, '{cl_%s}{/%s}' % (agenti[-1], nome))
        rimuovi(*rr[1 + righe_blocco:])
    intestazione_ripetuta(t)


def tabella_esposizione(t, agenti, nome):
    rr = righe(t)
    cs = celle(rr[0])
    cella(atteso(cs[0], 'SALDATURA'), 'N°')
    togli_vmerge(rr[2])
    riga_ciclo(t, 2, ['{numero}', '{nome}'] + ['{t_%s}' % a for a in agenti], nome, da_eliminare=[3])
    lim = celle(atteso(righe(t)[-1], 'LIMITI'))
    for tc, a in zip(lim[1:], agenti):
        cella(tc, '{tlv_%s}' % a)
    intestazione_ripetuta(t, 2)


def tav(t, agenti, lettera, stel):
    rr = righe(t)
    cs = celle(rr[0])
    cella(atteso(cs[0], 'TAV.'), 'TAV. {numero}%s MANSIONE:' % lettera)
    cella(cs[1], 'Cantiere {denominazione}' + (' – polveri e metalli' if lettera == 'A' else ' – gas'))
    cella(celle(rr[1])[0], '{nome}')
    for tc, c in zip(celle(rr[3]), ['{#righe}{fase}', '{minuti}'] + ['{v_%s}' % a for a in agenti[:-1]] + ['{v_%s}{/righe}' % agenti[-1]]):
        cella(tc, c)
    tot = celle(atteso(rr[6], 'LIVELLO'))
    for tc, c in zip(tot[1:], ['{minutiTotali}'] + ['{tot_%s}' % a for a in agenti]):
        cella(tc, c)
    for tc, a in zip(celle(atteso(rr[7], 'TLV-TWA'))[2:], agenti):
        cella(tc, '{tlv_%s}' % a)
    if stel:
        for tc, a in zip(celle(atteso(rr[8], 'TLV-STEL'))[2:], agenti):
            cella(tc, '{stel_%s}' % a)
    rimuovi(rr[4], rr[5])


def tabella_classi(t, gruppo):
    rr = righe(t)
    cella(atteso(celle(rr[0])[0], 'Mansione'), 'Mansione: {mansione}')
    for r in rr[2:]:
        togli_vmerge(r)
    riga_ciclo(t, 2, ['{classe}', '{inquinanti}', '{misure}'], gruppo)
    tieni_insieme(t)


def trasforma_documento(doc, lavoro):
    body = doc.getroot().find(W + 'body')
    B = list(body)
    rif = B[39]
    tag = lambda s: paragrafo_tag(rif, s)  # noqa: E731

    def se(primo, ultimo, nome):
        avvolgi(primo, ultimo, nome, rif=rif)

    copertina(B, '06', 'Gennaio 2026', 'Luglio - Dicembre 2025', tag_periodo='Periodo di riferimento: {periodoRiferimento}')
    stile_didascalia = copy.deepcopy(atteso(B[263], 'Tabella 5'))

    # --- 1. Introduzione e caratteristiche degli agenti
    paragrafi_ciclo(atteso(B[37], 'In applicazione'), 'intro')
    imposta_testo(atteso(B[44], 'Eco-Ter'), 'Le misure e le analisi vengono effettuate dalla {studioEsecutore}.')
    rimuovi(atteso(B[45], 'Per la redazione'))
    imposta_testo(atteso(B[54], 'Sono di seguito riportate'),
                  'Sono di seguito riportate le caratteristiche degli agenti inquinanti che possono essere presenti nei fumi di saldatura, '
                  'individuati sulla base delle schede di sicurezza dei materiali utilizzati fornite dalla direzione di cantiere.')
    sostituisci(atteso(B[86], 'al servizio della fresa'), 'all’interno dell’officina al servizio della fresa', 'all’interno dell’officina')

    # --- 2. Metodologia
    sostituisci(atteso(B[220], 'fattore frequenza'), 'fattore frequenza, fattore gravità e fattore esposizione', 'fattore gravità, fattore durata e fattore esposizione')
    imposta_testo(atteso(B[225], 'Si riportano in Tabella 1'), 'Si riportano nella tabella seguente i fattori correlati agli effetti provocati sugli individui, alla durata delle fasi lavorative ed alla condizione operativa.')
    didascalia(atteso(B[227], 'Fattori di rischio'), 'Fattori di rischio (linee guida Regione Piemonte).', stile_da=stile_didascalia)
    didascalia(atteso(B[235], 'Matrice'), 'Matrice per la determinazione del fattore P (linee guida Regione Piemonte).', stile_da=stile_didascalia)
    didascalia(atteso(B[241], 'Classificazione del rischio'), 'Classificazione del rischio (linee guida Regione Piemonte).', stile_da=stile_didascalia)
    imposta_testo(atteso(B[245], 'Tavole allegate'), 'I risultati ottenuti dalle misure effettuate vengono associati alle specifiche fasi lavorative durante le quali sono stati eseguiti i campionamenti (vedi tavole allegate).')

    # --- 3. Acquisizione dati
    ciclo_blocchi(atteso(B[254], 'MIG/MAG'), atteso(B[188], 'ciclo lavorativo'), [B[255], B[257], B[258]])
    didascalia(atteso(B[263], 'Mansioni'), 'Mansioni.', stile_da=stile_didascalia)
    togli_vmerge(righe(B[264])[1])
    riga_ciclo(B[264], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')
    intestazione_ripetuta(B[264])
    imposta_testo(atteso(B[266], 'Lombroni'), '{medicoCompetente}')
    imposta_testo(atteso(B[269], 'Parolin'), '{rspp}')
    paragrafi_ciclo(atteso(B[272], 'Gencarelli'), 'rls')
    paragrafi_ciclo(atteso(B[276], 'Areazione'), 'misurePreventive')
    rimuovi(*B[277:280])
    paragrafi_ciclo(atteso(B[280], 'dispositivi di protezione'), 'testiDpi')
    rimuovi(B[281], B[282])

    # 3.x Campionamento
    stile = B[285].find(W + 'pPr')
    for x in stile.findall(W + 'numPr'):
        stile.remove(x)
    st = copy.deepcopy(B[260].find(W + 'pPr/' + W + 'pStyle'))
    stile.insert(0, st)
    paragrafi_ciclo(atteso(B[286], 'Al fine di valutare'), 'testiCampionamento')
    rimuovi(*B[287:292])
    imposta_testo(atteso(B[292], 'Nella tabella che segue'), 'Nella tabella che segue si riportano le determinazioni effettuate per ciascuna fase lavorativa.')
    didascalia(atteso(B[293], 'Tipi di saldatura'), 'Fasi lavorative e agenti determinati.', stile_da=stile_didascalia)
    t = B[294]
    cella(celle(righe(t)[0])[0], 'Fase lavorativa e postazione')
    cella(celle(righe(t)[0])[1], 'Determinazioni sulle polveri inalabili')
    cella(celle(righe(t)[0])[2], 'Determinazioni sulle polveri respirabili')
    riga_ciclo(t, 1, ['{fase} – {postazione}', '{inalabili}', '{respirabili}', '{gas}'], 'sintesi')
    intestazione_ripetuta(t)

    # --- 4. Elaborazione dei dati
    imposta_testo(atteso(B[298], 'Nella tabella seguente'), 'Nelle tabelle seguenti vengono calcolati i fattori e i relativi indici di rischio per ciascun agente chimico analizzato.')
    cap = copy.deepcopy(B[304])
    B[302].addprevious(cap)
    didascalia(cap, 'Calcolo dei fattori e degli indici di rischio (linee guida Regione Piemonte): polveri e metalli.', stile_da=stile_didascalia)
    imposta_testo(atteso(B[303], 'Tabella 7'), '')
    continua_numerazione(B[303])
    tabella_ir(B[302], IR_POLVERI, 'ambientiIRPolveri', 8, True)
    se(cap, B[302], 'conIRPolveri')
    didascalia(atteso(B[304], 'GAS'), 'Calcolo dei fattori e degli indici di rischio (linee guida Regione Piemonte): gas.', stile_da=stile_didascalia)
    tabella_ir(B[305], IR_GAS, 'ambientiIRGas', 8, False)
    se(B[304], B[305], 'conIRGas')

    didascalia(atteso(B[311], 'POLVERI'), 'Livelli di esposizione alle polveri e ai metalli.', stile_da=stile_didascalia)
    tabella_esposizione(B[312], ESP_POLVERI, 'esposizioni')
    didascalia(atteso(B[313], 'GAS'), 'Livelli di esposizione ai gas.', stile_da=stile_didascalia)
    tabella_esposizione(B[314], IR_GAS, 'esposizioni')

    # --- 5. Conclusioni
    imposta_testo(atteso(B[319], 'In applicazione'),
                  'In applicazione al Titolo IX, Capo I del D.Lgs. 81/08 e s.m.i., è stata effettuata una campagna di monitoraggio al fine di valutare '
                  'il rischio ed i livelli di esposizione ai fumi di saldatura per i lavoratori operanti nel cantiere {denominazione}.')
    imposta_testo(atteso(B[322], 'Utilizzando il modello'),
                  'Utilizzando il modello di calcolo proposto dalle linee guida della Regione Piemonte vengono individuate, per ciascuna mansione '
                  '(ambienti in cui lavora secondo la giornata tipo), le seguenti classi di rischio.')
    for cap, t, gruppo, frase, fine in ((B[325], B[326], 'polveri', 'polveri e metalli', B[327]), (B[343], B[344], 'gas', 'gas tossici', B[345])):
        didascalia(cap, 'Individuazione delle classi di rischio per %s: {mansione}.' % frase, stile_da=stile_didascalia)
        tabella_classi(t, gruppo)
        cap.addprevious(tag('{#classiMansioni}'))
        fine.addnext(tag('{/classiMansioni}'))
    paragrafi_ciclo(atteso(B[348], 'esposizione ai gas'), 'conclusioniAgenti')
    rimuovi(*solo_contenuto(B[328:341]), *solo_contenuto(B[346:348]), *solo_contenuto(B[349:354]))
    paragrafi_ciclo(atteso(B[357], 'analisi integrata'), 'conclusioniMansioni')
    rimuovi(*B[358:366])

    # --- 6. Piano
    piano(atteso(B[369], 'Misure generali'), atteso(B[371], 'Limitare'), solo_contenuto(B[370:381]))

    # --- Indice delle revisioni
    riga_ciclo(B[384], 1, ['{rev}', '{integrazione}', '{data}', '{descrizione}', '{redatto}', '{verificato}', '{approvato}'], 'revisioni')

    # --- Allegato 1: TAV per mansione
    imposta_testo(atteso(B[398], 'TABELLE DI SINTESI'), 'TABELLE DI SINTESI DEI LIVELLI DI ESPOSIZIONE DEI LAVORATORI AI FUMI DI SALDATURA')
    ta, tb = B[402], B[408]
    cella(atteso(celle(righe(ta)[2])[7], 'Silicio'), 'Silice [mg/m³]')
    cella(atteso(celle(righe(tb)[2])[4], 'CO'), 'CO₂ [%]')
    tav(ta, TAV_POLVERI, 'A', False)
    tav(tb, TAV_GAS, 'B', True)
    tieni_insieme(ta)
    tieni_insieme(tb)
    ta.addprevious(tag('{#tav}'))
    spazio = copy.deepcopy(B[403])
    ta.addnext(spazio)
    fine = salto_pagina(rif, 'nonUltima')
    tb.addnext(fine)
    fine.addnext(tag('{/tav}'))
    rimuovi(*solo_contenuto(B[403:408]), *solo_contenuto(B[409:422]))


def main():
    modello, uscita = sys.argv[1], sys.argv[2]
    lavoro, doc, doc_path = apri(modello)
    trasforma_documento(doc, lavoro)
    salti_in_interruzioni(doc.getroot().find(W + 'body'))
    salva(lavoro, doc, doc_path, uscita, TITOLO_PIEDE)


if __name__ == '__main__':
    main()
