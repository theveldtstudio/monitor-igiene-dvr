#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Microclima (docxtemplater) a partire dai quattro DVR modello
(cartella DVR/Modelli):

    python3 tools/dvr/costruisci_template_microclima.py \\
        "25_01_DVR_Microclima_invernale_interno_galleria_Castagnola - Copia.docx" \\
        "25_11_DVR_Microclima_estivo_interno galleria_Castagnola.docx" \\
        "25_08_DVR_Microclima_estivo_2025_CTG.docx" \\
        "DVR_Microclima_Inv_Est_Xenia_2026_Opere_in_esterno_e_Viadotti.docx" \\
        public/templates/dvr/microclima.docx

La base è il DVR galleria inverno (PMV/PPD sui rilievi). Le tabelle degli altri scenari sono copiate
dai rispettivi modelli e accese dai flag del generatore:
- galleria estate: WBGTi e confronto con i limiti;
- esterno estate: dati meteo, PMV/PPD per mese, WBGTe nella giornata più gravosa;
- esterno inverno: dati meteo, PMV/PPD per mese, IREQ/DLE e WCI nelle giornate peggiori.
Correzioni: limite WBGT della classe 5 (23 °C, non 25), norme aggiornate nel capitolo 3, piè di
pagina degli allegati invertiti, logo CTG → logo del cliente, firme tolte.
"""
import copy
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

from lxml import etree

sys.path.insert(0, str(Path(__file__).parent))
from costruisci_template_mmc import legato_al_successivo, paragrafi_ciclo, solo_contenuto, tieni_insieme, togli_colore, togli_vmerge  # noqa: E402
from costruisci_template_rumore import (  # noqa: E402
    W,
    atteso,
    cella,
    celle,
    imposta_testo,
    paragrafo_tag,
    rimuovi,
    riga_ciclo,
    righe,
    testo,
)
from costruisci_template_vibrazioni import normalizza_loghi  # noqa: E402

R_EMBED = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed'
A_BLIP = '{http://schemas.openxmlformats.org/drawingml/2006/main}blip'


def corpo(percorso):
    with zipfile.ZipFile(percorso) as z:
        return list(etree.fromstring(z.read('word/document.xml')).find(W + 'body'))


def pulisci(el):
    """Copia senza segnalibri (nel ciclo sarebbero duplicati)."""
    el = copy.deepcopy(el)
    for b in list(el.iter(W + 'bookmarkStart')) + list(el.iter(W + 'bookmarkEnd')):
        b.getparent().remove(b)
    return el


def intestazione(t, riga, testi):
    for tc, s in zip(celle(righe(t)[riga]), testi):
        if s is not None:
            cella(tc, s)


def ciclo_riga(t, indice, contenuti, nome):
    togli_vmerge(righe(t)[indice])
    riga_ciclo(t, indice, contenuti, nome)


def ripeti_intestazione(t, n=1):
    """Le prime `n` righe della tabella si ripetono in cima a ogni pagina."""
    for tr in righe(t)[:n]:
        trpr = tr.find(W + 'trPr')
        if trpr is None:
            trpr = etree.Element(W + 'trPr')
            tr.insert(1 if tr.find(W + 'tblPrEx') is not None else 0, trpr)
        if trpr.find(W + 'tblHeader') is None:
            etree.SubElement(trpr, W + 'tblHeader')


def larghezze(t, pesi):
    """Ridistribuisce la larghezza totale della tabella sulle colonne della griglia secondo `pesi`."""
    griglia = t.find(W + 'tblGrid').findall(W + 'gridCol')
    assert len(griglia) == len(pesi), (len(griglia), pesi)
    totale = sum(int(g.get(W + 'w')) for g in griglia)
    ws = [round(totale * x / sum(pesi)) for x in pesi]
    for g, w in zip(griglia, ws):
        g.set(W + 'w', str(w))
    for tr in righe(t):
        col = 0
        for tc in celle(tr):
            gs = tc.find(W + 'tcPr/' + W + 'gridSpan')
            n = int(gs.get(W + 'val')) if gs is not None else 1
            tcw = tc.find(W + 'tcPr/' + W + 'tcW')
            if tcw is not None:
                tcw.set(W + 'w', str(sum(ws[col:col + n])))
                tcw.set(W + 'type', 'dxa')
            col += n


def inserisci_dopo(ancora, elementi):
    for e in elementi:
        ancora.addnext(e)
        ancora = e
    return ancora


def togli_numerazione(p):
    ppr = p.find(W + 'pPr')
    if ppr is not None:
        for n in ppr.findall(W + 'numPr'):
            ppr.remove(n)


def trasforma_documento(doc, GE, EE, EI):
    body = doc.getroot().find(W + 'body')
    B = list(body)
    tag = lambda s: paragrafo_tag(B[376], s)  # noqa: E731
    vuoto = lambda: paragrafo_tag(B[376], '')  # noqa: E731

    def didascalia(nome):
        p = copy.deepcopy(B[406])
        imposta_testo(p, '{%s}' % nome)
        legato_al_successivo(p)
        return p

    def paragrafo(s, rif=None):
        p = pulisci(rif if rif is not None else B[376])
        imposta_testo(p, s)
        return p

    def ciclo_paragrafi(nome, rif=None):
        p = paragrafo('{.}', rif)
        return [tag('{#%s}' % nome), p, tag('{/%s}' % nome)]

    # --- Copertina
    ps = celle(righe(B[0])[0])[1].findall(W + 'p')
    imposta_testo(atteso(ps[0], 'COMUNE DI'), 'COMUNE DI {comuneMaiuscolo}')
    imposta_testo(atteso(ps[1], 'PROVINCIA DI'), 'PROVINCIA DI {provinciaMaiuscolo}')
    imposta_testo(atteso(ps[3], 'TERZO VALICO'), '{operaMaiuscolo}')
    imposta_testo(atteso(ps[5], 'Castagnola'), '{denominazione} – {ambitoOggetto}')
    ps = celle(righe(B[0])[2])[0].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Vizzino'), '{datoreLavoro}')
    imposta_testo(atteso(ps[5], 'Parolin'), '{rspp}')
    imposta_testo(atteso(ps[8], 'Lombroni'), '{medicoCompetente}')
    paragrafi_ciclo(atteso(ps[11], 'Gencarelli'), 'rls')

    r = righe(B[4])
    ps = celle(r[0])[0].findall(W + 'p')
    imposta_testo(atteso(ps[2], 'microclimatici'), 'Documento di valutazione del rischio da fattori microclimatici negli ambienti di lavoro – {ambitoOggetto}')
    cella(celle(r[0])[3], '{integrazioneTesto}')
    cella(celle(atteso(r[1], 'Periodo invernale'))[0], '{stagioneTesto}')
    cella(celle(r[1])[3], '{dataEmissioneTesto}')
    ps = celle(r[4])[1].findall(W + 'p')
    imposta_testo(atteso(ps[3], 'Società'), '{studioDescrizione}')
    ps = celle(r[4])[2].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Catano'), '{#gruppoLavoro}')
    imposta_testo(ps[2], '{.}')
    imposta_testo(ps[3], '{/gruppoLavoro}')
    rimuovi(*ps[4:])
    cella(celle(atteso(r[4], 'Redatto'))[5], '{redatto}')
    cella(celle(atteso(r[5], 'Verificato'))[5], '{verificato}')
    cella(celle(atteso(r[6], 'Approvato'))[5], '{approvato}')

    firme = {'rId10', 'rId11', 'rId12'}
    for d in list(doc.iter(W + 'drawing')):
        if any(b.get(R_EMBED) in firme for b in d.iter(A_BLIP)):
            run = d.getparent()
            run.getparent().remove(run)

    t6 = B[6]
    riga_ciclo(t6, 1, ['{rev}', '{data}', '{descrizione}', '{collaborazione}', '{redatto}', '{verificato}', '{approvato}'],
               'revisioniCopertina', da_eliminare=[2, 3, 4, 5, 6])
    r = righe(t6)
    cella(celle(atteso(r[-2], 'FILE NAME'))[0], 'FILE NAME: {nomeFile}')
    cella(celle(atteso(r[-1], 'REV'))[1], 'REV {revisioneCodice}')

    # --- Indice
    imposta_testo(atteso(B[10], 'ALLEGATO 2'), '{allegato2Indice}')

    # --- 1. Introduzione
    paragrafi_ciclo(atteso(B[12], 'In applicazione'), 'intro')
    rimuovi(B[13])
    imposta_testo(atteso(B[14], 'ECO-TER'), 'I sopralluoghi, la raccolta dei dati e l’elaborazione delle informazioni sono stati effettuati dalla {studioEsecutore}.')
    imposta_testo(atteso(B[15], 'rapporti di prova'), '{testoAllegato}')

    # --- 2. Definizioni: didascalie numerate a mano, limite WBGT della classe 5 secondo la norma
    imposta_testo(atteso(B[77], 'WBGT limite'), 'Tabella 1. WBGT limite in funzione del consumo metabolico')
    cella(celle(atteso(righe(B[78])[6], '> 4,5'))[2], '23* - 25**')
    imposta_testo(atteso(B[148], 'Valori di riferimento'), 'Tabella 2. Valori di riferimento')
    imposta_testo(atteso(B[151], 'ambienti particolarmente severi'),
                  'Questo metodo è utilizzabile esclusivamente in ambienti particolarmente severi: non si applica all’interno delle gallerie, mentre è applicabile all’aperto nelle giornate più fredde e ventose.')

    # --- 3. Normativa
    B[154].addprevious(tag('{#galleria}'))
    B[154].addnext(tag('{/galleria}'))
    imposta_testo(atteso(B[155], '11079'),
                  'La valutazione dello stress in ambienti severi freddi viene effettuata mediante la procedura dell’“isolamento richiesto” (IREQ) descritta nella norma tecnica UNI EN ISO 11079, come indicato dalle linee guida del coordinamento tecnico delle regioni e delle province autonome.')
    imposta_testo(atteso(B[157], '7243'),
                  'Infine la norma tecnica UNI EN ISO 7243 riguarda la valutazione dello stress termico negli ambienti severi caldi, mediante l’indice WBGT (Wet Bulb Globe Temperature) che, una volta calcolato, viene confrontato con i limiti in funzione del dispendio metabolico dei lavoratori.')

    # --- 4. Metodologia
    imposta_testo(atteso(B[170], 'programmare'),
                  'Al fine di programmare l’indagine sono state considerate le caratteristiche generali dell’ambiente di lavoro, le mansioni, le fasi lavorative, la loro durata, le macchine e le attrezzature utilizzate ed il numero di operatori presenti durante ogni fase. Sono stati inoltre valutati il vestiario utilizzato e il dispendio metabolico tramite dati tabulati.')
    imposta_testo(atteso(B[172], 'misurati i seguenti'), '{testo42}')
    paragrafi_ciclo(atteso(B[173], 'Temperatura'), 'parametri42')
    for b in list(B[173].iter(W + 'b')) + list(B[173].iter(W + 'bCs')):
        b.getparent().remove(b)
    rimuovi(*B[174:179])
    imposta_testo(atteso(B[184], 'Campionamenti'), '4.3 {titolo43}')
    imposta_testo(atteso(B[185], 'campionamento'), '{testo43}')
    imposta_testo(atteso(B[187], 'Strumentazione'), '4.4 {titolo44}')
    imposta_testo(atteso(B[188], 'Centralina'), '{testo44}')
    paragrafi_ciclo(atteso(B[189], 'psicrometrica'), 'strumenti')
    rimuovi(*B[190:194])

    # --- capitoli 4 e 5 su pagina nuova: le righe vuote del modello diventano un salto pagina
    for da, a in ((158, 167), (200, 211)):
        vuoti = [x for x in B[da:a] if x.tag == W + 'p' and not testo(x).strip()]
        assert len(vuoti) == a - da, (da, a)
        br = etree.SubElement(etree.SubElement(vuoti[0], W + 'r'), W + 'br')
        br.set(W + 'type', 'page')
        rimuovi(*vuoti[1:])

    # --- 5.1 Aspetti organizzativi: ciclo di lavoro dell'app
    punto = pulisci(B[222])
    imposta_testo(atteso(B[214], 'direzione di cantiere'), '{testo}')
    imposta_testo(punto, '{.}')
    inserisci_dopo(B[214], [tag('{#punti}'), punto, tag('{/punti}'), tag('{/cicloBlocchi}')])
    B[214].addprevious(tag('{#cicloBlocchi}'))
    rimuovi(*B[215:218])

    # --- 5.2 Mansioni
    atteso(B[220], 'classificati in gruppi')
    rimuovi(*solo_contenuto(B[221:301]))
    imposta_testo(atteso(B[303], 'Nella tabella seguente'), 'Nella tabella seguente sono riportate le mansioni considerate nella valutazione, con una sintesi delle attività svolte.')
    rimuovi(*B[304:307])
    imposta_testo(atteso(B[310], 'Mansioni impiegate'), '{didMansioni}')
    riga_ciclo(B[311], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')
    rimuovi(B[312], B[316], B[318], *[x for x in B[313:324] if x.tag == W + 'p' and testo(x).strip()])

    # --- 5.3-5.5 figure della sicurezza
    # titoli 5.4 e 5.5 numerati da elenchi a sé nel modello (in LibreOffice diventano 5.4 e 5.7): testo fisso
    for i, titolo in ((332, '5.4 Dati identificativi del Responsabile del servizio di prevenzione e protezione'),
                      (335, '5.5 Dati identificativi dei Rappresentanti dei Lavoratori per la Sicurezza')):
        imposta_testo(atteso(B[i], 'Dati identificativi'), titolo)
        B[i].find(W + 'pPr/' + W + 'numPr/' + W + 'numId').set(W + 'val', '0')
    imposta_testo(atteso(B[330], 'Lombroni'), '{medicoCompetente}')
    imposta_testo(atteso(B[333], 'Parolin'), '{rspp}')
    paragrafi_ciclo(atteso(B[336], 'Gencarelli'), 'rls')

    # --- 5.6 Vestiario e dispendio metabolico
    imposta_testo(atteso(B[341], 'osservazioni'), '{testoVestiario}')
    B[342].addprevious(tag('{#conVestiario}'))
    imposta_testo(atteso(B[342], 'Isolamento termico'), '{didVestiario}')
    ciclo_riga(B[343], 1, ['{capo}', '{clo}', '{totale}'], 'vestiario')
    tieni_insieme(B[343])
    legato_al_successivo(B[342])
    B[343].addnext(tag('{/conVestiario}'))
    for br in list(atteso(B[345], 'Tuttavia').iter(W + 'br')):
        br.getparent().remove(br)
    rimuovi(B[348])
    imposta_testo(atteso(B[349], 'dispendio metabolico'), '{didMet}')
    ciclo_riga(B[350], 1, ['{periodo}', '{fase}', '{mansioni}', '{met}'], 'lavorazioniMet')
    rimuovi(atteso(B[354], 'Contìnua'), B[355])

    # --- 5.7 Misure preventive; ventilazione solo in galleria
    paragrafi_ciclo(atteso(B[359], 'indumenti da lavoro'), 'misure')
    rimuovi(B[360], B[361])
    B[366].addprevious(tag('{#galleria}'))
    atteso(B[370], 'Piano di Emergenza').addnext(tag('{/galleria}'))

    # --- 6. Dati
    paragrafi_ciclo(atteso(B[376], 'Le misure sono state eseguite'), 'datiIntro')
    rimuovi(B[377], B[380])
    B[378].addprevious(tag('{#conRilievi}'))
    imposta_testo(atteso(B[378], 'Risultati delle misure'), '{didRilievi}')
    ciclo_riga(B[379], 1, ['{fase}', '{sigla}', '{postazione}', '{ta}', '{va}', '{ur}', '{tnw}', '{trug}', '{tg}'], 'rilievi')
    meteo = pulisci(EI[263])
    intestazione(meteo, 0, ['Mese', 'T media\n(°C)', 'Valore min delle medie giornaliere (°C)', 'Valore max delle medie giornaliere (°C)', 'Urel media\n(%)', 'Va media\n(m/s)'])
    ciclo_riga(meteo, 1, ['{mese}', '{ta}', '{taMin}', '{taMax}', '{ur}', '{va}'], 'meteo')
    inserisci_dopo(B[379], [tag('{/conRilievi}'), tag('{#esterni}'), didascalia('didMeteo'), meteo, tag('{/esterni}')])

    # --- 7. Ambiente termico
    paragrafi_ciclo(atteso(B[384], 'classificare'), 'ambienteTermico')
    rimuovi(B[385], B[386])

    # --- 8. Elaborazione dati
    paragrafi_ciclo(atteso(B[400], 'compresa tra 10 e 30'), 'elaborazione')
    rimuovi(B[401])
    B[406].addprevious(tag('{#pmvRilievi}'))
    imposta_testo(atteso(B[406], 'PMV e PPD'), '{didPmv}')
    ciclo_riga(B[407], 1, ['{lavorazione}', '{mansioni}', '{clo}', '{met}', '{pmv}', '{ppd}'], 'pmvRighe')
    rimuovi(atteso(B[409], 'Continua'), B[410])
    wbgt = pulisci(GE[303])
    ciclo_riga(wbgt, 1, ['{lavorazione}', '{mansioni}', '{ta}', '{tg}', '{tnw}', '{met}', '{wbgt}'], 'wbgtRighe')
    pmv_mese = pulisci(EI[293])
    intestazione(pmv_mese, 0, ['Lavorazione', 'Mansioni coinvolte', None, None, None, None])
    ciclo_riga(pmv_mese, 1, ['{lavorazione}', '{mansioni}', '{clo}', '{met}', '{pmv}', '{ppd}'], 'righe')
    larghezze(pmv_mese, [30, 30, 10, 10, 10, 10])
    inserisci_dopo(B[407], [
        tag('{/pmvRilievi}'),
        tag('{#wbgtRilievi}'), didascalia('didWbgt'), wbgt, tag('{/wbgtRilievi}'),
        tag('{#pmvMesi}'), didascalia('didascalia'), pmv_mese, vuoto(), tag('{/pmvMesi}'),
    ])
    rimuovi(*[x for x in B[411:421] if x.tag == W + 'p' and not testo(x).strip()])
    paragrafi_ciclo(atteso(B[421], 'non è stato effettuato'), 'noteElaborazione')
    rimuovi(B[422], B[423], B[424], B[425])

    picco = pulisci(EE[298])
    intestazione(picco, 1, ['Tutte le attività in esterno', 'Tutte le mansioni che svolgono attività in esterno', '{piccoWbgt}'])
    ireq = pulisci(EI[314])
    intestazione(ireq, 0, [None, None, None, None, 'Confronto (Icl = {cloTesto} clo)', 'DLE stimata (ore)', None])
    ciclo_riga(ireq, 1, ['{mese}', '{met}', '{min}', '{neu}', '{confronto}', '{dle}', '{mansioni}'], 'ireqRighe')
    wci = pulisci(EI[324])
    intestazione(wci, 0, [None, 'Ta', 'Va', 'WCI [kcal/(h·m²)]'])
    ciclo_riga(wci, 1, ['{mese}', '{ta}', '{va}', '{wci}'], 'wci')
    punto_elenco = pulisci(B[189])
    imposta_testo(punto_elenco, '{.}')
    inserisci_dopo(B[421].getnext(), [
        tag('{#picco}'), *ciclo_paragrafi('piccoTesti'), didascalia('didPicco'), picco, vuoto(), tag('{/picco}'),
        tag('{#freddo}'), *ciclo_paragrafi('freddoTesti'), tag('{#peggiori}'), punto_elenco, tag('{/peggiori}'),
        paragrafo('{testoIreq}'), didascalia('didIreq'), ireq, vuoto(),
        paragrafo('{testoWci}'), didascalia('didWci'), wci, vuoto(), tag('{/freddo}'),
    ])

    # --- 9. Confronto con i limiti
    B[430].addprevious(tag('{#pmvRilievi}'))
    imposta_testo(atteso(B[430], 'Confronto'), '{didConfrontoPmv}')
    t = B[431]
    rr = righe(t)
    for tc, c in zip(celle(rr[2]), ['{#confrontoPmv}{lavorazione}', '{postazione}', '{mansioni}', '{pmv}', '-0,5 < PMV < +0,5']):
        cella(tc, c)
    for tc, c in zip(celle(rr[3])[3:], ['{ppd}', 'PPD < 10%{/confrontoPmv}']):
        cella(tc, c)
    rimuovi(*rr[4:])
    rimuovi(atteso(B[440], 'Continua'), B[441])

    confronto_wbgt = pulisci(GE[310])
    intestazione(confronto_wbgt, 0, [None, None, None, None, None, None, None, 'WBGTi limite (*)\n[°C]'])
    ciclo_riga(confronto_wbgt, 1, ['{lavorazione}', '{mansioni}', '{ta}', '{tg}', '{tnw}', '{met}', '{wbgt}', '{limite}'], 'wbgtRighe')
    confronto_mesi = pulisci(EI[293])
    intestazione(confronto_mesi, 0, ['Lavorazione', 'Mansioni coinvolte', 'Mese', 'PMV', 'PPD (%)', 'Categoria'])
    ciclo_riga(confronto_mesi, 1, ['{lavorazione}', '{mansioni}', '{mese}', '{pmv}', '{ppd}', '{categoria}'], 'confrontoMesi')
    larghezze(confronto_mesi, [28, 28, 12, 10, 10, 12])
    categorie = pulisci(EI[332])
    ciclo_riga(categorie, 1, ['{categoria}', '{nome}', '{pmv}', '{ppd}'], 'categorie')
    confronto_picco = pulisci(EE[311])
    ciclo_riga(confronto_picco, 2, ['{lavorazione}', '{mansioni}', '{met}', '{wbgt}', '{limiteAcc}', '{limiteNon}'], 'piccoRighe')
    larghezze(confronto_picco, [24, 30, 11, 11, 12, 12])
    classi = pulisci(EI[339])
    ciclo_riga(classi, 1, ['{confronto}', '{classe}', '{rischio}', '{misure}'], 'classiIreq')
    for x in (categorie, classi):
        for tc in celle(righe(x)[1]):
            togli_colore(tc)
    confronto_wci = pulisci(EI[343])
    ciclo_riga(confronto_wci, 1, ['{mese}', '{wci}', '{intervallo}', '{effetto}'], 'wci')
    inserisci_dopo(t, [
        tag('{/pmvRilievi}'),
        tag('{#wbgtRilievi}'), didascalia('didConfrontoWbgt'), confronto_wbgt, paragrafo('{notaWbgt}'), tag('{/wbgtRilievi}'),
        tag('{#esterni}'), didascalia('didConfrontoMesi'), confronto_mesi, vuoto(), didascalia('didCategorie'), categorie, vuoto(),
        tag('{#picco}'), didascalia('didConfrontoPicco'), confronto_picco, paragrafo('{notaWbgt}'), tag('{/picco}'),
        tag('{#freddo}'), didascalia('didClassiIreq'), classi, vuoto(), didascalia('didConfrontoWci'), confronto_wci, tag('{/freddo}'),
        tag('{/esterni}'),
    ])

    for x in (B[311], B[350], B[379], meteo, B[407], wbgt, pmv_mese, ireq, confronto_wbgt, confronto_mesi):
        ripeti_intestazione(x)
    ripeti_intestazione(B[431], 2)
    ripeti_intestazione(confronto_picco, 2)
    for x in (categorie, classi, confronto_wci, wci, picco):
        tieni_insieme(x)

    # --- 10. Conclusioni
    paragrafi_ciclo(atteso(B[445], 'Dai dati riportati'), 'conclusioni')
    rimuovi(B[446], B[447], B[450], B[451], B[452])

    # --- 11. Piano (l'ultimo paragrafo porta l'interruzione di sezione: resta vuoto)
    voce = atteso(B[458], 'formazione')
    sotto = atteso(B[460], 'battito')
    imposta_testo(voce, '{testo}')
    imposta_testo(sotto, '{.}')
    voce.addprevious(tag('{#piano}'))
    voce.addnext(tag('{#sotto}'))
    sotto.addnext(tag('{/piano}'))
    sotto.addnext(tag('{/sotto}'))
    rimuovi(B[459], *B[461:471])
    imposta_testo(B[471], '')
    togli_numerazione(B[471])

    # --- Allegati
    imposta_testo(atteso(B[485], 'CASTAGNOLA'), 'CANTIERE {denominazioneMaiuscolo}')
    imposta_testo(atteso(B[500], 'RAPPORTI DI PROVA'), '{titoloAllegato2}')


def trasforma_piede(d, nome):
    ps = [p for p in d.iter(W + 'p') if testo(p).strip()]
    for i, p in enumerate(ps):
        s = testo(p).strip()
        prec = testo(ps[i - 1]).strip() if i else ''
        if s == '00' and prec == 'Rev.:':
            imposta_testo(p, '{revisioneCodice}')
        elif prec == 'Integr.:':
            imposta_testo(p, '{integrazioneTesto}')
        elif prec == 'Data:':
            imposta_testo(p, '{dataEmissioneTesto}')
        elif s.startswith('Consorzio Tunnel Giovi') or s.startswith('Pavimental'):
            imposta_testo(p, '{impresa}')
        elif s == '(CTG)':
            imposta_testo(p, '')
        elif s.startswith('Cantiere'):
            imposta_testo(p, 'Cantiere {denominazione}')
        elif s.lower() == 'interno galleria':
            imposta_testo(p, '{ambitoOggetto}')
        elif s.startswith('Documento di valutazione di microclima') and 'ALLEGATO' in s:
            # nel modello le diciture dei due allegati sono invertite
            allegato = 'Allegato 1' if nome == 'footer6.xml' else 'Allegato 2'
            imposta_testo(p, 'Documento di valutazione di microclima – ' + allegato)
        elif prec == 'File:':
            imposta_testo(p, '{nomeFile}')


def main(base, galleria_estate, esterno_estate, esterno_inverno, uscita):
    lavoro = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(base) as z:
        z.extractall(lavoro)
    doc_path = lavoro / 'word' / 'document.xml'
    doc = etree.parse(str(doc_path))
    trasforma_documento(doc, corpo(galleria_estate), corpo(esterno_estate), corpo(esterno_inverno))
    ids = set()
    for b in list(doc.iter(W + 'bookmarkStart')):
        if (b.get(W + 'name') or '').startswith('_Hlk'):
            ids.add(b.get(W + 'id'))
            b.getparent().remove(b)
    for b in list(doc.iter(W + 'bookmarkEnd')):
        if b.get(W + 'id') in ids:
            b.getparent().remove(b)
    doc.write(str(doc_path), xml_declaration=True, encoding='UTF-8', standalone=True)

    for piede in sorted((lavoro / 'word').glob('footer*.xml')):
        d = etree.parse(str(piede))
        trasforma_piede(d, piede.name)
        d.write(str(piede), xml_declaration=True, encoding='UTF-8', standalone=True)

    normalizza_loghi(lavoro, clienti={'media/image1.png'}, da_eliminare=())

    drels = lavoro / 'word' / '_rels' / 'document.xml.rels'
    testo_rels = drels.read_text(encoding='utf-8')
    usati = set(re.findall(r'r:(?:embed|id)="([^"]+)"', doc_path.read_text(encoding='utf-8')))
    for rid, target in re.findall(r'<Relationship Id="([^"]+)" Type="[^"]+/image" Target="([^"]+)"/>', testo_rels):
        if rid not in usati:
            testo_rels = re.sub(r'<Relationship Id="%s" [^>]+/>' % rid, '', testo_rels)
            (lavoro / 'word' / target).unlink(missing_ok=True)
    drels.write_text(testo_rels, encoding='utf-8')

    settings = lavoro / 'word' / 'settings.xml'
    s = settings.read_text(encoding='utf-8')
    if '<w:updateFields' not in s:
        for successivo in ('<w:hdrShapeDefaults', '<w:footnotePr', '<w:endnotePr', '<w:compat'):
            if successivo in s:
                s = s.replace(successivo, '<w:updateFields w:val="true"/>' + successivo, 1)
                break
    settings.write_text(s, encoding='utf-8')

    Path(uscita).parent.mkdir(parents=True, exist_ok=True)
    if Path(uscita).exists():
        Path(uscita).unlink()
    with zipfile.ZipFile(uscita, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(lavoro.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(lavoro).as_posix())
    shutil.rmtree(lavoro)
    print('Template scritto in', uscita)


if __name__ == '__main__':
    if len(sys.argv) != 6:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
