#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Rumore (docxtemplater) a partire dal DVR modello
"DVR_Rumore_Xenia_2026_CORRETTO.docx" (cartella DVR/Modelli).

Uso:
    python3 tools/dvr/costruisci_template_rumore.py <modello.docx> public/templates/dvr/rumore.docx

Il modello conserva impaginazione, stili, intestazioni e piè di pagina ECO-TER; lo script:
- sostituisce i dati del cantiere con i tag {…} di docxtemplater;
- trasforma elenchi e tabelle in cicli ({#…}{/…});
- aggiorna i testi superati (IEC 651/804 → IEC 61672, SIT → ACCREDIA, disuguaglianze delle fasce);
- toglie le firme scansionate dalla copertina e il logo CTG rimasto nell'Allegato 3.

Lo script lavora per posizione sugli elementi del modello: se il modello cambia va riverificato
(ogni passaggio controlla il testo atteso e si ferma se non lo trova).
"""
import copy
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

from lxml import etree

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
W = '{%s}' % W_NS
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'


# ---------------------------------------------------------------- utilità XML

def testo(el):
    return ''.join(t.text or '' for t in el.iter(W + 't'))


def imposta_testo(p, nuovo):
    """Mette `nuovo` nel primo w:t del paragrafo e svuota gli altri (formattazione del primo run).
    Toglie i campi (es. SEQ delle didascalie): la numerazione la scrive il generatore."""
    for fs in list(p.iter(W + 'fldSimple')):
        fs.getparent().remove(fs)
    for r in list(p.iter(W + 'r')):
        if r.find(W + 'fldChar') is not None or r.find(W + 'instrText') is not None:
            r.getparent().remove(r)
    ts = list(p.iter(W + 't'))
    if not ts:
        r = etree.SubElement(p, W + 'r')
        t = etree.SubElement(r, W + 't')
        ts = [t]
    ts[0].text = nuovo
    ts[0].set(XML_SPACE, 'preserve')
    for t in ts[1:]:
        t.text = ''
    # tabulazioni e a capo residui non servono più
    for tag in ('tab', 'br'):
        for x in list(p.iter(W + tag)):
            if x.getparent().tag == W + 'r' and x.get(W + 'type') != 'page':
                x.getparent().remove(x)


def sostituisci(p, vecchio, nuovo):
    """Sostituisce dentro un singolo w:t se possibile, altrimenti riscrive il paragrafo."""
    for t in p.iter(W + 't'):
        if t.text and vecchio in t.text:
            t.text = t.text.replace(vecchio, nuovo)
            t.set(XML_SPACE, 'preserve')
            return
    intero = testo(p)
    if vecchio not in intero:
        raise SystemExit(f'Testo non trovato: {vecchio!r} in {intero[:80]!r}')
    imposta_testo(p, intero.replace(vecchio, nuovo))


def paragrafo_tag(riferimento, contenuto):
    """Paragrafo con solo un tag di ciclo/condizione (docxtemplater lo elimina in uscita)."""
    p = etree.Element(W + 'p')
    ppr = riferimento.find(W + 'pPr')
    if ppr is not None:
        ppr = copy.deepcopy(ppr)
        for x in ppr.findall(W + 'numPr') + ppr.findall(W + 'sectPr'):
            ppr.remove(x)
        p.append(ppr)
    r = etree.SubElement(p, W + 'r')
    t = etree.SubElement(r, W + 't')
    t.text = contenuto
    return p


def prima(el, tag_apertura, tag_chiusura=None, dopo=None):
    """Avvolge l'elemento (o l'intervallo el..dopo) tra due paragrafi-tag."""
    el.addprevious(paragrafo_tag(el if el.tag == W + 'p' else vicino_p(el), tag_apertura))
    fine = dopo if dopo is not None else el
    if tag_chiusura:
        fine.addnext(paragrafo_tag(el if el.tag == W + 'p' else vicino_p(el), tag_chiusura))


def vicino_p(el):
    x = el.getprevious()
    while x is not None and x.tag != W + 'p':
        x = x.getprevious()
    return x if x is not None else etree.Element(W + 'p')


def rimuovi(*els):
    for e in els:
        if e is not None and e.getparent() is not None:
            e.getparent().remove(e)


def cella(tc, contenuto):
    ps = tc.findall(W + 'p')
    imposta_testo(ps[0], contenuto)
    for p in ps[1:]:
        tc.remove(p)


def righe(tbl):
    return tbl.findall(W + 'tr')


def celle(tr):
    return tr.findall(W + 'tc')


def riga_ciclo(tbl, indice_modello, contenuti, nome, da_eliminare=None):
    """La riga `indice_modello` diventa la riga ripetuta del ciclo `nome`; le altre righe dati spariscono."""
    rs = righe(tbl)
    modello = rs[indice_modello]
    cs = celle(modello)
    assert len(cs) == len(contenuti), (len(cs), contenuti)
    for i, (tc, c) in enumerate(zip(cs, contenuti)):
        if i == 0:
            c = '{#%s}' % nome + c
        if i == len(cs) - 1:
            c = c + '{/%s}' % nome
        cella(tc, c)
    for i in (da_eliminare if da_eliminare is not None else range(indice_modello + 1, len(rs))):
        rimuovi(rs[i])


def atteso(el, frammento):
    if frammento not in testo(el):
        raise SystemExit(f'Atteso {frammento!r}, trovato {testo(el)[:100]!r}')
    return el


# ---------------------------------------------------------------- documento

def trasforma_documento(doc):
    body = doc.getroot().find(W + 'body')
    B = list(body)  # indici del modello originale

    # --- Copertina
    t0 = B[0]
    c = celle(righe(t0)[0])[1]
    ps = c.findall(W + 'p')
    imposta_testo(atteso(ps[0], 'COMUNE DI'), 'COMUNE DI {comuneMaiuscolo}')
    imposta_testo(atteso(ps[1], 'PROVINCIA DI'), 'PROVINCIA DI {provinciaMaiuscolo}')
    imposta_testo(atteso(ps[3], 'LINEA FERROVIARIA'), '{operaMaiuscolo}')
    imposta_testo(atteso(ps[4], 'TBM1'), '{denominazione}')
    ps = celle(righe(t0)[1])[0].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Caruso'), '{datoreLavoro}')
    imposta_testo(atteso(ps[3], 'Auria'), '{rspp}')
    imposta_testo(atteso(ps[5], 'Cioffi'), '{medicoCompetente}')
    imposta_testo(atteso(ps[7], 'Pellegrino'), '{#rls}')
    imposta_testo(atteso(ps[8], 'Parisi'), '{.}')
    imposta_testo(atteso(ps[9], 'Granato'), '{/rls}')

    t4 = B[4]
    r = righe(t4)
    ps = celle(r[0])[0].findall(W + 'p')
    imposta_testo(atteso(ps[4], 'Periodo di riferimento'), 'Periodo di riferimento: {periodoRiferimento}')
    cella(celle(r[0])[3], '{integrazioneTesto}')
    cella(celle(r[1])[3], '{dataEmissioneTesto}')
    cella(celle(r[2])[3], '{redatto}')
    ps = celle(r[3])[1].findall(W + 'p')
    imposta_testo(atteso(ps[2], 'Società di Ingegneria'), '{studioDescrizione}')
    ps = celle(r[3])[2].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Catano'), '{#gruppoLavoro}')
    imposta_testo(ps[2], '{.}')
    imposta_testo(ps[3], '{/gruppoLavoro}')
    rimuovi(ps[4])
    cella(celle(r[3])[5], '{verificato}')
    cella(celle(r[4])[5], '{approvato}')

    t6 = B[6]
    r = righe(t6)
    atteso(r[4], 'Prima Emissione')
    # firme scansionate: non si inseriscono in automatico
    for d in list(t6.iter(W + 'drawing')):
        run = d.getparent()
        run.getparent().remove(run)
    riga_ciclo(t6, 4, ['{rev}', '{data}', '{descrizione}', '{collaborazione}', '{redatto}', '{verificato}', '{approvato}'],
               'revisioniCopertina', da_eliminare=[1, 2, 3])
    r = righe(t6)
    cella(celle(atteso(r[-2], 'FILE NAME'))[0], 'FILE NAME: {nomeFile}')
    cella(celle(atteso(r[-1], 'REV'))[1], 'REV {revisioneCodice}')

    # --- 1 Introduzione
    imposta_testo(atteso(B[41], 'In applicazione'), '{intro1}')
    imposta_testo(atteso(B[42], 'Per la redazione'), '{intro2}')
    imposta_testo(atteso(B[44], 'Eco-Ter'), '{testoEsecutore}')

    # --- 2 Metodologia: zonizzazione solo se c'è il testo (galleria, viadotti, opere in esterno)
    sostituisci(atteso(B[54], 'Zonizzazione del rumore in galleria'), 'Zonizzazione del rumore in galleria', 'Zonizzazione del rumore')
    prima(B[54], '{#haZonizzazione}', '{/haZonizzazione}')

    # luoghi di lavoro del cantiere al posto di quelli del modello (TBM1 e piazzale)
    sostituisci(atteso(B[141], 'TBM1 e sul piazzale antistante'), 'i lavoratori operanti sulla TBM1 e sul piazzale antistante', 'i lavoratori operanti {luoghiLavoro}')
    sostituisci(atteso(B[278], 'svolte in galleria e nelle aree esterne di cantiere'), 'svolte in galleria e nelle aree esterne di cantiere', 'svolte {luoghiLavoro}')

    # --- 3 Acquisizione dati
    sostituisci(atteso(B[65], 'tabella 1'), 'tabella 1', 'Allegato 1')
    atteso(B[72], 'La realizzazione della galleria')
    imposta_testo(B[72], '{testo}')
    imposta_testo(atteso(B[75], 'Scavo'), '{.}')
    B[72].addprevious(paragrafo_tag(B[72], '{#cicloBlocchi}'))
    B[75].addprevious(paragrafo_tag(B[72], '{#punti}'))
    B[75].addnext(paragrafo_tag(B[72], '{/punti}'))
    rimuovi(B[73], B[74], B[76], B[77], B[78], B[79], B[80], B[81], B[82])
    # chiusura del ciclo dopo il {/punti}
    B[75].getnext().addnext(paragrafo_tag(B[72], '{/cicloBlocchi}'))

    # titoli 3.2-3.4: nel modello hanno il numero scritto a mano e stili diversi; li allineo a "Ciclo di lavoro"
    # (numerazione manuale come "3.2 Mansioni": lo stile Stile10 del 3.3 aggiungeva un "4." automatico)
    for i, titolo in ((94, '3.3 Macchine e attrezzature'), (99, '3.4 Dispositivi di protezione individuale')):
        atteso(B[i], titolo.split()[1])
        vecchio = B[i].find(W + 'pPr')
        if vecchio is not None:
            B[i].remove(vecchio)
        B[i].insert(0, copy.deepcopy(B[83].find(W + 'pPr')))
        rpr_modello = B[83].find(W + 'r/' + W + 'rPr')
        imposta_testo(B[i], titolo)
        primo = B[i].find(W + 'r')
        if rpr_modello is not None and primo is not None:
            if primo.find(W + 'rPr') is not None:
                primo.remove(primo.find(W + 'rPr'))
            primo.insert(0, copy.deepcopy(rpr_modello))
    imposta_testo(atteso(B[90], 'Tabella 2'), 'Tabella {tabMansioni}. Mansioni e gruppi omogenei.')
    riga_ciclo(B[91], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')

    sostituisci(atteso(B[95], 'in galleria al momento'), 'in galleria al momento', 'in cantiere al momento')
    imposta_testo(atteso(B[96], 'Tabella 3'), 'Tabella {tabMacchine}. Principali mezzi presenti e utilizzati in cantiere.')
    riga_ciclo(B[97], 1, ['{tipologia}', '{marcaModello}', '{alimentazione}'], 'macchine')

    imposta_testo(atteso(B[100], 'I dispositivi'),
                  'I dispositivi di protezione individuale dell’udito messi a disposizione dei lavoratori del cantiere '
                  '{denominazione} e utilizzati per ridurre l’esposizione al rumore sono:')
    imposta_testo(atteso(B[101], 'Coverguard'), '{nome}')
    imposta_testo(atteso(B[102], 'I cui valori'), 'I valori di attenuazione dichiarati dal costruttore sono:')
    imposta_testo(atteso(B[103], 'H = 38'), 'H = {h} dB')
    imposta_testo(atteso(B[104], 'M = 37'), 'M = {m} dB')
    imposta_testo(atteso(B[105], 'L = 35'), 'L = {l} dB')
    imposta_testo(atteso(B[111], 'I valori medi'), 'I valori medi di attenuazione alle varie frequenze dichiarati dal costruttore sono:')
    ott = B[112]
    rr = righe(ott)
    for tc, k in zip(celle(rr[1])[1:], ['125', '250', '500', '1000', '2000', '4000', '8000']):
        cella(tc, '{om%s}' % k)
    for tc, k in zip(celle(rr[2])[1:], ['125', '250', '500', '1000', '2000', '4000', '8000']):
        cella(tc, '{od%s}' % k)
    B[111].addprevious(paragrafo_tag(B[111], '{#haOttave}'))
    ott.addnext(paragrafo_tag(B[111], '{/haOttave}'))
    B[101].addprevious(paragrafo_tag(B[101], '{#dpi}'))
    B[113].addnext(paragrafo_tag(B[101], '{/dpi}'))
    rimuovi(*B[114:138])

    # --- 4 Caratteristiche e rilevazione
    imposta_testo(atteso(B[144], 'impulsivi'), '{testoImpulsivi}')
    imp = B[145]
    cella(celle(righe(imp)[0])[2], 'Lpeak [dB(C)]')
    riga_ciclo(imp, 1, ['{zona}', '{componente}', '{lpeak}'], 'impulsivi')
    imp.addprevious(paragrafo_tag(B[144], '{#haImpulsivi}'))
    imp.addnext(paragrafo_tag(B[144], '{/haImpulsivi}'))

    imposta_testo(atteso(B[155], 'LARSON DAVIS'), '{testoStrumenti}')
    imposta_testo(atteso(B[156], 'SIT'),
                  'Il fonometro, il microfono, il preamplificatore ed il calibratore sono tarati da laboratori '
                  'accreditati ACCREDIA (centri LAT) con periodicità biennale.')
    imposta_testo(atteso(B[158], 'Taratura'), 'Tabella {tabTaratura}. Taratura degli strumenti.')
    riga_ciclo(B[159], 1, ['{componente}', '{costruttore}', '{modello}', '{matricola}', '{dataTaratura}', '{certificato}'], 'tarature')
    imposta_testo(atteso(B[161], 'Fasi di lavoro monitorate'), 'Tabella {tabFasi}. Fasi di lavoro monitorate.')
    riga_ciclo(B[162], 1, ['{fase}', '{postazione}'], 'fasiMonitorate')
    imposta_testo(atteso(B[165], 'campagne di misura precedenti'),
                  'Per le misure che non è stato possibile effettuare nel corso di questa campagna di monitoraggi sono stati '
                  'utilizzati dati ottenuti nel corso di campagne di misura precedenti, in cantieri simili durante lo '
                  'svolgimento della medesima attività lavorativa e in condizioni lavorative ed ambientali il più possibile '
                  'simili alla condizione in esame. Nelle tabelle dell’Allegato 1 tali fasi sono contrassegnate con *.')
    prima(B[165], '{#haDatiStorici}', '{/haDatiStorici}')

    atteso(B[168], 'Zonizzazione')
    imposta_testo(atteso(B[169], 'distanze differenti'), '{testoZonizzazione}')
    rimuovi(B[171])
    B[168].addprevious(paragrafo_tag(B[169], '{#haZonizzazione}'))
    B[169].addnext(paragrafo_tag(B[169], '{/haZonizzazione}'))

    # --- 5 DPI
    imposta_testo(atteso(B[178], 'coefficiente'),
                  'Per tener conto della perdita di attenuazione dovuta ai numerosi elementi che, in campo, riducono '
                  'l’attenuazione dei DPI rispetto a quella misurata in laboratorio e dichiarata dal costruttore, i valori '
                  'di attenuazione dichiarati vengono moltiplicati per un coefficiente β che dipende dal tipo di dispositivo '
                  '(UNI 9432:2011): 0,5 per gli inserti auricolari, 0,75 per le cuffie.')
    att = B[180]
    rr = righe(att)
    cella(celle(rr[0])[1], 'Attenuazione dichiarata {nome} [dB]')
    cella(celle(rr[0])[2], 'Coefficiente β {tipoPlurale}')
    cella(celle(rr[0])[3], 'Attenuazione reale {nome} [dB]')
    cella(celle(rr[1])[1], '{h}')
    cella(celle(rr[1])[2], '{beta}')
    cella(celle(rr[1])[3], '{hr}')
    cella(celle(rr[2])[1], '{m}')
    cella(celle(rr[2])[3], '{mr}')
    cella(celle(rr[3])[1], '{l}')
    cella(celle(rr[3])[3], '{lr}')
    att.addprevious(paragrafo_tag(B[178], '{#dpi}'))
    B[181].addnext(paragrafo_tag(B[178], '{/dpi}'))
    rimuovi(*B[182:186])

    imposta_testo(atteso(B[188], 'Prospetto C.5'), 'Tabella {tabUni}. Prospetto C.5 della norma UNI 9432:2011.')
    imposta_testo(atteso(B[194], 'Tabella 7'), 'Tabella {numeroTabella}. Verifica dell’adeguatezza di {nome}.')
    ver = B[195]
    riga_ciclo(ver, 1, ['{fase}', '{postazione}', '{laeq}', '{livelloConDpi}', '{esito}', '{mansioni}'], 'righe')
    B[194].addprevious(paragrafo_tag(B[194], '{#verificheDpi}'))
    B[196].addnext(paragrafo_tag(B[194], '{/verificheDpi}'))
    rimuovi(*B[197:203])
    imposta_testo(atteso(B[205], 'Coverguard'), '{conclusioneDpi}')
    sostituisci(atteso(B[210], 'cantieristici in cantiere'), 'degli ambienti cantieristici in cantiere', 'degli ambienti di cantiere')
    imposta_testo(atteso(B[212], 'livello residuo'), '{efficaciaDpi1}')
    imposta_testo(atteso(B[213], 'Ne consegue'), '{efficaciaDpi2}')

    # --- 7 Incertezza (parametri del calcolo effettivo)
    imposta_testo(atteso(B[235], 'posizionamento'), 'L’incertezza da posizionamento dello strumento è stata stimata pari a {uPosizionamento} dB.')
    imposta_testo(atteso(B[236], 'strumentale'),
                  'L’incertezza strumentale sul rilievo dei livelli sonori continui è stata assunta pari a {uStrumento} dB '
                  '(fonometro di classe 1, UNI EN ISO 9612:2011 prospetto C.5).')
    imposta_testo(atteso(B[237], 'Pertanto'),
                  'Pertanto l’incertezza sul livello sonoro continuo equivalente, per tutte le misure effettuate, avendo '
                  'posto ua = 0, è pari a {uLaeq} dB.')
    imposta_testo(atteso(B[240], 'In particolare'),
                  'In particolare, nel calcolo dell’incertezza sul livello di esposizione si è tenuto conto dell’incertezza '
                  'su tutti i livelli continui equivalenti misurati, del numero di periodi acusticamente omogenei in cui è '
                  'stata suddivisa la giornata lavorativa di ciascuna mansione e della loro durata: '
                  'u²(LEX,8h) = Σ cm² · (uL² + us²) + uc², dove cm = (Tm/T0) · 10^((LAeq,m − LEX,8h)/10) è il '
                  'coefficiente di sensibilità del periodo m e uc = {uComune} dB è il contributo comune a tutti i periodi.')

    # --- 8 Segnali di avvertimento
    atteso(B[264], 'Ripristino piste')
    imposta_testo(B[264], 'Durante la fase di {fase} è stata misurata l’interazione tra il rumore di fondo e il segnale di avvertimento {sorgente}:')
    imposta_testo(atteso(B[265], 'ambiente'), 'livello di rumore ambiente: {ambiente} dB(A);')
    imposta_testo(atteso(B[266], 'cicalino'), 'livello del segnale di avvertimento: {segnale} dB(A).')
    imposta_testo(atteso(B[267], 'in questo caso'), '{esito}')
    B[264].addprevious(paragrafo_tag(B[264], '{#segnali}'))
    B[267].addnext(paragrafo_tag(B[264], '{/segnali}'))
    rimuovi(*B[268:276])
    B[260].addprevious(paragrafo_tag(B[260], '{#haSegnali}'))
    chiusura = paragrafo_tag(B[260], '{/haSegnali}')
    B[267].getnext().addnext(chiusura)
    alternativa = copy.deepcopy(B[260])
    imposta_testo(alternativa,
                  'Nel corso della campagna non sono state eseguite misure specifiche sui segnali acustici di avvertimento: '
                  'la loro udibilità nelle fasi più rumorose (in particolare dei cicalini di retromarcia dei mezzi) dovrà '
                  'essere verificata dal datore di lavoro.')
    chiusura.addnext(paragrafo_tag(B[260], '{^haSegnali}'))
    chiusura.getnext().addnext(alternativa)
    alternativa.addnext(paragrafo_tag(B[260], '{/haSegnali}'))

    # --- 9 Elaborazione dati: tabella riassuntiva
    imposta_testo(atteso(B[297], 'Tabella 13'), 'Tabella {tabEsposizioni}. Valori di esposizione del personale del cantiere.')
    t13 = B[298]
    cella(celle(righe(t13)[0])[4], 'Esposizione a sostanze ototossiche')
    riga_ciclo(t13, 2, ['{nome}', '{lex} ± {u}', '{picco}', '{vibrazioni}', '{ototossiche}'], 'esposizioni')

    # --- 10 Conclusioni
    imposta_testo(atteso(B[304], 'ppeak'), 'LEX,8h < 80 dB(A) e ppeak < 135 dB(C);')
    imposta_testo(atteso(B[305], 'ppeak'), '80 dB(A) ≤ LEX,8h < 85 dB(A) oppure 135 dB(C) ≤ ppeak < 137 dB(C);')
    imposta_testo(atteso(B[306], 'ppeak'), 'LEX,8h ≥ 85 dB(A) oppure ppeak ≥ 137 dB(C).')
    imposta_testo(atteso(B[308], 'otoprotettori'), '{conclusioneDpiBreve}')
    imposta_testo(atteso(B[310], '1°'), '1ª fascia – LEX,8h < 80 dB(A) e ppeak < 135 dB(C)')
    imposta_testo(atteso(B[325], '2°'), '2ª fascia – 80 dB(A) ≤ LEX,8h < 85 dB(A) oppure 135 dB(C) ≤ ppeak < 137 dB(C)')
    imposta_testo(atteso(B[346], '3°'), '3ª fascia – LEX,8h ≥ 85 dB(A) oppure ppeak ≥ 137 dB(C)')
    sostituisci(atteso(B[347], '3° fascia'), '3° fascia', '3ª fascia')

    def elenco_fascia(voce, da_togliere, nome):
        imposta_testo(voce, '{.}')
        voce.addprevious(paragrafo_tag(voce, '{#%s}' % nome))
        voce.addnext(paragrafo_tag(voce, '{/%s}' % nome))
        nessuna = copy.deepcopy(voce)
        imposta_testo(nessuna, 'Nessuna mansione appartiene a questa fascia.')
        fine = voce.getnext()
        fine.addnext(paragrafo_tag(voce, '{^%s}' % nome))
        fine.getnext().addnext(nessuna)
        nessuna.addnext(paragrafo_tag(voce, '{/%s}' % nome))
        rimuovi(*da_togliere)

    elenco_fascia(atteso(B[314], 'ASTRONAVE'), B[315:324], 'fascia1')
    elenco_fascia(atteso(B[331], 'CAPOSQUADRA'), B[332:344], 'fascia2')
    elenco_fascia(atteso(B[352], 'Nessuna mansione'), [], 'fascia3')
    imposta_testo(atteso(B[353], 'valore limite'), '{testoLimite}')

    # --- 11 Piano di contenimento
    imposta_testo(atteso(B[357], 'Sulla base'), '{pianoIntro}')
    imposta_testo(atteso(B[358], '1.Informare'), '{numero}. {testo}')
    B[358].addprevious(paragrafo_tag(B[358], '{#pianoPunti}'))
    B[358].addnext(paragrafo_tag(B[358], '{/pianoPunti}'))
    rimuovi(*B[359:369])

    # --- Indice delle revisioni
    riga_ciclo(B[372], 1, ['{rev}', '{integrazione}', '{data}', '{descrizione}', '{redatto}', '{verificato}', '{approvato}'], 'revisioni')

    # --- Allegato 1: una TAV per mansione
    titolo_tav = atteso(B[395], 'TAV.1')
    imposta_testo(titolo_tav, 'TAV. {numero} – {nomeMaiuscolo}')
    tav = B[396]
    rr = righe(tav)
    cs = celle(rr[2])
    cella(cs[0], '{#periodi}{minuti}')
    cella(cs[1], '{fase}')
    cella(cs[2], '{macchine}')
    cella(cs[3], '{laeq}')
    cella(cs[4], '{lpeak}')
    cella(celle(rr[3])[1], 'Postazione: {postazione}{/periodi}')
    for i in range(4, 22):
        rimuovi(rr[i])
    cella(celle(rr[22])[1], '{lex} ± {u}')
    cella(celle(rr[24])[2], '{picco}')
    # salto pagina tra una TAV e l'altra, non dopo l'ultima
    salto = atteso(B[400], '') if B[400].find('.//' + W + 'br') is not None else None
    assert salto is not None, 'salto pagina dopo TAV.1 non trovato'
    run_salto = salto.find('.//' + W + 'br').getparent()
    apertura = etree.Element(W + 'r')
    etree.SubElement(apertura, W + 't').text = '{#nonUltima}'
    chiusura_r = etree.Element(W + 'r')
    etree.SubElement(chiusura_r, W + 't').text = '{/nonUltima}'
    run_salto.addprevious(apertura)
    run_salto.addnext(chiusura_r)
    rimuovi(B[397], B[398], B[399])
    titolo_tav.addprevious(paragrafo_tag(titolo_tav, '{#tav}'))
    salto.addnext(paragrafo_tag(titolo_tav, '{/tav}'))
    rimuovi(*B[401:487])
    # Nel modello le TAV stanno nella sezione dell'Allegato 2 (piè di pagina sbagliato):
    # chiudo la sezione dopo l'ultima TAV con il piè di pagina dell'Allegato 1.
    fine_sezione = etree.Element(W + 'p')
    ppr = etree.SubElement(fine_sezione, W + 'pPr')
    ppr.append(copy.deepcopy(B[393].find(W + 'pPr').find(W + 'sectPr')))
    salto.getnext().addnext(fine_sezione)

    # --- Allegato 2: rilievi fonometrici
    ril = B[506]
    rr = righe(ril)
    cella(celle(atteso(rr[0], 'OPERA'))[0], 'OPERA: {operaMaiuscolo} – CANTIERE: {cantiereRilievi}')
    cella(celle(atteso(rr[1], 'Misure del periodo'))[0], 'Misure del periodo: {periodoRiferimento}')
    riga_ciclo(ril, 5, ['{codice}', '{fase}', '{postazione}', '{tempo}', '{laeq}', '{lceq}', '{lpeak}', '{macchine}', '{note}'], 'rilievi')


def trasforma_piede(doc):
    for p in doc.iter(W + 'p'):
        s = testo(p).strip()
        campi = p.findall('.//' + W + 'fldChar')
        if campi and 'DVR' in s:
            ts = list(p.iter(W + 't'))
            ts[0].text = '{nomeFile}'
            for t in ts[1:]:
                t.text = ''
        elif s == '00':
            imposta_testo(p, '{revisioneCodice}')
        elif s == '\\':
            imposta_testo(p, '{integrazioneTesto}')
        elif re.match(r'^Luglio\s*2026$', s):
            imposta_testo(p, '{dataEmissioneTesto}')
        elif re.search(r'(?i)^con[sz]orzio\s*xenia$', s):
            imposta_testo(p, '{impresa}')
        elif s == 'TBM1':
            imposta_testo(p, '{denominazione}')


def main(modello, uscita):
    lavoro = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(modello) as z:
        z.extractall(lavoro)
    doc_path = lavoro / 'word' / 'document.xml'
    doc = etree.parse(str(doc_path))
    trasforma_documento(doc)
    # segnalibri nascosti (_Hlk): dentro i cicli verrebbero duplicati con lo stesso id
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
        trasforma_piede(d)
        d.write(str(piede), xml_declaration=True, encoding='UTF-8', standalone=True)

    # Logo del cliente (image1): stesso riquadro 198,45 × 52,6 pt in copertina e intestazioni, senza ritagli.
    # Il generatore lo sostituisce con il logo caricato, già adattato a queste proporzioni (RAPPORTO_LOGO_CLIENTE).
    def logo_senza_ritaglio(percorso, rid):
        s = percorso.read_text(encoding='utf-8')
        s = re.sub(r'(<v:imagedata r:id="%s")[^>]*?(/>)' % rid, r'\1 o:title=""\2', s)
        percorso.write_text(s, encoding='utf-8')
    logo_senza_ritaglio(doc_path, 'rId8')
    logo_senza_ritaglio(lavoro / 'word' / 'header2.xml', 'rId1')
    logo_senza_ritaglio(lavoro / 'word' / 'header5.xml', 'rId1')
    h5 = lavoro / 'word' / 'header5.xml'
    h5.write_text(h5.read_text(encoding='utf-8').replace('width:150.8pt;height:69.75pt', 'width:198.45pt;height:52.6pt'), encoding='utf-8')
    from PIL import Image
    Image.new('RGBA', (794, 210), (255, 255, 255, 0)).save(lavoro / 'word' / 'media' / 'image1.png')

    # Allegato 3: logo CTG rimasto da un altro cantiere -> logo del cliente (image1)
    rels = lavoro / 'word' / '_rels' / 'header5.xml.rels'
    rels.write_text(rels.read_text(encoding='utf-8').replace('media/image6.png', 'media/image1.png'), encoding='utf-8')
    (lavoro / 'word' / 'media' / 'image6.png').unlink(missing_ok=True)

    # firme tolte dalla copertina: rimuovo anche i file e le relazioni
    drels = lavoro / 'word' / '_rels' / 'document.xml.rels'
    testo_rels = drels.read_text(encoding='utf-8')
    usati = set(re.findall(r'r:(?:embed|id)="([^"]+)"', doc_path.read_text(encoding='utf-8')))
    for rid, target in re.findall(r'<Relationship Id="([^"]+)" Type="[^"]+/image" Target="([^"]+)"/>', testo_rels):
        if rid not in usati:
            testo_rels = re.sub(r'<Relationship Id="%s" [^>]+/>' % rid, '', testo_rels)
            (lavoro / 'word' / target).unlink(missing_ok=True)
    drels.write_text(testo_rels, encoding='utf-8')

    # Word aggiorna sommario e numeri di pagina all'apertura
    settings = lavoro / 'word' / 'settings.xml'
    s = settings.read_text(encoding='utf-8')
    if '<w:updateFields' not in s:
        # ordine dello schema: updateFields va subito prima di hdrShapeDefaults/footnotePr/endnotePr/compat
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
    from avanzamento import aggiungi_avanzamento  # noqa: E402
    aggiungi_avanzamento(uscita)
    print('Template scritto in', uscita)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
