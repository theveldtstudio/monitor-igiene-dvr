#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Campi elettromagnetici (docxtemplater). Non esiste un DVR CEM
modello ECO-TER: il template parte da quello ROA (stessa impaginazione, copertina, capitoli di
acquisizione dati, conclusioni e piano, Titolo VIII del D.Lgs. 81/08) e ne sostituisce i capitoli
specifici:

    python3 tools/dvr/costruisci_template_cem.py public/templates/dvr/roa.docx public/templates/dvr/cem.docx

Capitoli: introduzione, normativa, caratteristiche dei CEM e valori di azione (allegato XXXVI dal
D.Lgs. 159/2016, popolazione 1999/519/CE), giustificazione CEI EN 50499, metodologia e zone,
acquisizione dati, censimento delle sorgenti, sorgenti giustificabili e da valutare, misure,
confronto con i valori di riferimento, zone e distanze di rispetto, lavoratori sensibili,
conclusioni e piano. L'indice si rigenera all'apertura in Word.
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
from chimico_comune import W, atteso, cella, celle, didascalia, imposta_testo, intestazione_ripetuta, paragrafi_ciclo, paragrafo_tag, rimuovi, righe, salti_in_interruzioni, testo  # noqa: E402
from costruisci_template_microclima import larghezze  # noqa: E402
from costruisci_template_mmc import solo_contenuto, tieni_insieme  # noqa: E402
from costruisci_template_rumore import sostituisci  # noqa: E402

TITOLO_ROA = 'VALUTAZIONE DEL RISCHIO DI ESPOSIZIONE DEI LAVORATORI ALLE RADIAZIONI OTTICHE ARTIFICIALI'
TITOLO_CEM = 'VALUTAZIONE DEL RISCHIO DI ESPOSIZIONE DEI LAVORATORI AI CAMPI ELETTROMAGNETICI'


def nuova_tabella(prototipo, intestazioni, campi, nome, pesi):
    """Tabella con intestazione e una riga di ciclo, con le celle clonate dal prototipo (una tabella
    del template a 3+ colonne: si usa la cella centrale come modello)."""
    t = copy.deepcopy(prototipo)
    rr = righe(t)
    testa, dati = rr[0], rr[1]
    for r in rr[2:]:
        t.remove(r)
    for tr, testi, rif in ((testa, intestazioni, celle(testa)[1]), (dati, campi, celle(dati)[1])):
        modello = copy.deepcopy(rif)
        for x in modello.iter(W + 'gridSpan'):
            x.getparent().remove(x)
        for x in list(modello.iter(W + 'vMerge')):
            x.getparent().remove(x)
        for c in celle(tr):
            tr.remove(c)
        for i, s in enumerate(testi):
            c = copy.deepcopy(modello)
            if tr is dati:
                s = ('{#%s}' % nome if i == 0 else '') + s + ('{/%s}' % nome if i == len(testi) - 1 else '')
            cella(c, s)
            tr.append(c)
    griglia = t.find(W + 'tblGrid')
    totale = sum(int(g.get(W + 'w')) for g in griglia.findall(W + 'gridCol'))
    for g in griglia.findall(W + 'gridCol'):
        griglia.remove(g)
    for _ in intestazioni:
        etree.SubElement(griglia, W + 'gridCol').set(W + 'w', str(totale // len(intestazioni)))
    larghezze(t, pesi)
    intestazione_ripetuta(t)
    return t


def inserisci_dopo(ancora, elementi):
    for e in elementi:
        ancora.addnext(e)
        ancora = e
    return ancora


def clona(p, s):
    q = copy.deepcopy(p)
    for x in q.findall(W + 'pPr/' + W + 'sectPr'):
        x.getparent().remove(x)
    imposta_testo(q, s)
    return q


def ciclo_paragrafi(rif, nome):
    """{#nome}{.}{/nome} con lo stile del paragrafo `rif`."""
    p = clona(rif, '{.}')
    return [paragrafo_tag(rif, '{#%s}' % nome), p, paragrafo_tag(rif, '{/%s}' % nome)]


def trasforma_documento(doc):
    body = doc.getroot().find(W + 'body')
    B = list(body)
    corpo, elenco, didasc, tit2 = B[50], B[58], B[99], B[70]
    tag = lambda s: paragrafo_tag(corpo, s)  # noqa: E731
    cap = lambda s: (lambda p: (didascalia(p, s), p)[1])(copy.deepcopy(didasc))  # noqa: E731

    # --- copertina
    ps = [p for p in B[4].iter(W + 'p')]
    sostituisci(next(p for p in ps if 'radiazioni ottiche' in testo(p)), 'alle radiazioni ottiche artificiali', 'ai campi elettromagnetici')
    sostituisci(next(p for p in ps if 'capo V' in testo(p)), 'capo V', 'capo IV')

    # --- indice: si rigenera in Word (i titoli del modello ROA non valgono più)
    toc = atteso(B[9], 'Introduzione')
    for h in toc.findall(W + 'hyperlink'):
        toc.remove(h)
    r = etree.SubElement(toc, W + 'r')
    etree.SubElement(r, W + 't').text = 'Indice da aggiornare: in Word fare clic sull’indice e premere F9.'
    rimuovi(*B[10:47])

    # --- 1 Introduzione
    imposta_testo(atteso(B[50], 'obiettivo'),
                  'La valutazione ha l’obiettivo di individuare le sorgenti di campi elettromagnetici presenti nel cantiere, di stimare '
                  'l’esposizione dei lavoratori e di definire le misure di prevenzione e protezione, con particolare attenzione ai '
                  'lavoratori particolarmente sensibili al rischio.')

    # --- 2 Normativa
    paragrafi_ciclo(atteso(B[58], 'D.Lgs. 81/2008'), 'normativa')
    rimuovi(*B[59:67])

    # --- 3 Caratteristiche e valori di azione
    imposta_testo(atteso(B[68], 'Caratteristiche'), 'Caratteristiche dell’agente fisico')
    imposta_testo(atteso(B[70], 'Radiazioni Ottiche'), 'Campi elettromagnetici (CEM)')
    paragrafi_ciclo(atteso(B[71], 'radiazioni ottiche artificiali sono'), 'caratteristiche')
    rimuovi(*solo_contenuto(B[72:107]))
    proto = B[237]
    t_basse = nuova_tabella(proto, ['Frequenza f [Hz]', 'VA(E) inferiori [V/m]', 'VA(E) superiori [V/m]', 'VA(B) inferiori [µT]', 'VA(B) superiori [µT]',
                                    'VA(B) arti [µT]', 'Popolazione E [V/m]', 'Popolazione B [µT]'],
                            ['{frequenza}', '{eInf}', '{eSup}', '{bInf}', '{bSup}', '{bArti}', '{popE}', '{popB}'], 'vaBasse', [18, 11, 11, 11, 11, 11, 13, 13])
    t_alte = nuova_tabella(proto, ['Frequenza f [Hz]', 'VA(E) [V/m]', 'VA(B) [µT]', 'Popolazione E [V/m]', 'Popolazione B [µT]'],
                           ['{frequenza}', '{e}', '{b}', '{popE}', '{popB}'], 'vaAlte', [24, 18, 18, 20, 20])
    t_statici = nuova_tabella(proto, ['Rischio', 'VA(B₀) [mT]'], ['{rischio}', '{valore}'], 'vaStatici', [80, 20])
    for x in (t_basse, t_alte, t_statici):
        tieni_insieme(x)
    fine = B[71].getnext()  # {/caratteristiche}
    inserisci_dopo(fine, [
        clona(tit2, 'Valori di azione e livelli di riferimento'),
        clona(corpo, 'I valori di azione (allegato XXXVI del D.Lgs. 81/08, come sostituito dal D.Lgs. 159/2016) sono valori efficaci (rms) '
                     'del campo elettrico E e dell’induzione magnetica B nei punti occupati dal lavoratore. Le tabelle seguenti riportano '
                     'anche i livelli di riferimento per la popolazione (raccomandazione 1999/519/CE), che si applicano ai lavoratori '
                     'particolarmente sensibili al rischio.'),
        cap('Valori di azione per gli effetti non termici (1 Hz – 10 MHz) e livelli per la popolazione (f in Hz).'),
        t_basse,
        clona(corpo, '{va50}'),
        cap('Valori di azione per gli effetti termici (100 kHz – 300 GHz, medie su 6 minuti) e livelli per la popolazione (f in Hz).'),
        t_alte,
        clona(corpo, 'Tra 100 kHz e 10 MHz si applicano sia i valori per gli effetti non termici sia quelli per gli effetti termici: vale il '
                     'più restrittivo. Sopra 6 GHz si considera anche la densità di potenza (VA 50 W/m²).'),
        cap('Valori di azione per i campi magnetici statici.'),
        t_statici,
    ])

    # --- 4 Giustificazione (CEI EN 50499)
    imposta_testo(atteso(B[108], 'Classificazione delle sorgenti'), 'Giustificazione delle sorgenti (CEI EN 50499)')
    imposta_testo(atteso(B[109], 'possono essere classificate'),
                  'Secondo la norma CEI EN 50499 sono giustificabili, cioè conformi a priori ai livelli di riferimento per la popolazione se '
                  'installate e usate secondo le istruzioni del fabbricante, le attrezzature e le situazioni seguenti (tabella 1 della norma):')
    paragrafi_ciclo(atteso(B[110], 'SORGENTI NON COERENTI'), 'giustificabiliElenco')
    rimuovi(B[111])
    imposta_testo(atteso(B[112], 'Le attrezzature che emettono ROA'), 'Richiedono invece una valutazione specifica (tabella 2 della norma), tra le altre:')
    inserisci_dopo(B[112], ciclo_paragrafi(elenco, 'daValutareElenco'))
    rimuovi(*solo_contenuto(B[113:141]))

    # --- 5 Metodologia
    imposta_testo(atteso(B[143], 'Al fine di effettuare'), 'Al fine di effettuare la valutazione del rischio si è proceduto secondo i seguenti passi:')
    inserisci_dopo(B[143], ciclo_paragrafi(elenco, 'metodologia'))
    imposta_testo(atteso(B[150], 'ROA'), 'Schede tecniche e dichiarazioni di conformità delle attrezzature in grado di emettere campi elettromagnetici;')
    imposta_testo(atteso(B[151], 'DPI'), 'Cabine elettriche, quadri, gruppi elettrogeni e impianti di potenza presenti.')
    imposta_testo(atteso(B[155], 'ROA'), 'Censimento delle sorgenti di campi elettromagnetici e delle mansioni esposte;')
    imposta_testo(atteso(B[156], 'Modalità di utilizzo'), 'Modalità di utilizzo delle sorgenti, postazioni e distanze di lavoro.')
    imposta_testo(atteso(B[158], 'Analisi dei dati acquisiti'), 'Classificazione delle aree')
    imposta_testo(atteso(B[159], 'Dall’analisi'),
                  'Sulla base del confronto con i valori di azione e con i livelli di riferimento per la popolazione, le aree di lavoro sono '
                  'classificate come segue:')
    paragrafi_ciclo(atteso(B[160], 'giustificabili'), 'zoneTesti')
    rimuovi(*solo_contenuto(B[161:169]))
    imposta_testo(atteso(B[169], 'Rilevazioni in campo'), 'Criteri per le misure in campo')
    imposta_testo(atteso(B[170], 'Nel caso in cui'),
                  'Per le sorgenti che richiedono la valutazione specifica e per le quali i dati del fabbricante non sono sufficienti, si misurano '
                  'il campo elettrico e l’induzione magnetica nelle postazioni occupate dai lavoratori e alle distanze di lavoro, confrontando '
                  'i valori efficaci con i valori di riferimento alla frequenza della sorgente.')
    rimuovi(*solo_contenuto(B[171:179]))
    atteso(B[179], 'Elaborazione dei dati')
    imposta_testo(atteso(B[180], 'Sulla base'),
                  'Per ogni misura si calcola il rapporto tra il valore misurato e il valore di riferimento (livello per la popolazione, valore di '
                  'azione inferiore e superiore) per il campo elettrico e per l’induzione magnetica: l’esito è dato dal rapporto più alto. Per le '
                  'sorgenti misurate a distanze diverse si individua la distanza oltre la quale sono rispettati i livelli per la popolazione '
                  '(distanza di rispetto per i lavoratori particolarmente sensibili).')
    rimuovi(*solo_contenuto(B[181:215]))
    imposta_testo(atteso(B[216], 'verificata'),
                  'I lavoratori particolarmente sensibili al rischio (portatori di dispositivi medici impiantati o indossati, lavoratrici in '
                  'gravidanza) sono tutelati con i livelli di riferimento per la popolazione; la loro presenza è verificata con il medico competente.')
    rimuovi(*solo_contenuto(B[217:223]))

    # --- 6 Acquisizione dati: misure preventive
    imposta_testo(atteso(B[249], 'DPI utilizzati'), 'Misure tecniche e organizzative')
    imposta_testo(atteso(B[250], '{testoDpi}'), 'Nel cantiere sono adottate le seguenti misure:')
    imposta_testo(atteso(B[251], '{#dpiElenco}'), '{#misurePreventive}')
    imposta_testo(atteso(B[253], '{/dpiElenco}'), '{/misurePreventive}')

    # censimento delle sorgenti
    imposta_testo(atteso(B[263], 'Individuazione degli apparati'), 'Individuazione delle sorgenti di campi elettromagnetici')
    imposta_testo(atteso(B[264], 'Durante il sopralluogo'),
                  'Durante il sopralluogo in cantiere sono state individuate le sorgenti di campi elettromagnetici e le mansioni che lavorano '
                  'nelle loro vicinanze, riportate nella tabella seguente.')
    didascalia(atteso(B[266], 'Individuazione'), 'Sorgenti di campi elettromagnetici presenti nel cantiere.')
    t = nuova_tabella(proto, ['N°', 'Sorgente', 'Frequenza', 'Attività e postazione', 'Mansioni esposte'],
                      ['{numero}', '{descrizione}', '{frequenza}', '{attivita}', '{mansioni}'], 'sorgenti', [6, 30, 12, 28, 24])
    B[267].addnext(t)
    rimuovi(B[267])

    # --- 7 Giustificazione e valutazione delle sorgenti
    imposta_testo(atteso(B[269], 'Analisi dei dati acquisiti'), 'Giustificazione e valutazione delle sorgenti')
    imposta_testo(atteso(B[270], 'Analisi preliminare'), 'Sorgenti giustificabili')
    imposta_testo(atteso(B[271], 'Le sorgenti in grado'),
                  'Le sorgenti seguenti sono giustificabili secondo la norma CEI EN 50499: la valutazione non richiede approfondimenti.')
    rimuovi(*solo_contenuto(B[272:277]))
    imposta_testo(atteso(B[277], '{#conMacchine}'), '{#conGiustificabili}')
    didascalia(atteso(B[278], 'macchine'), 'Sorgenti giustificabili (CEI EN 50499).')
    t = B[279]
    for tc, s in zip(celle(righe(t)[0]), ['Sorgente', 'Riferimento', 'Attività lavorativa', 'Giustificazione']):
        cella(tc, s)
    for tc, s in zip(celle(righe(t)[1]), ['{#giustificabili}{descrizione}', '{riferimento}', '{attivita}', '{motivazione}{/giustificabili}']):
        cella(tc, s)
    for b in list(celle(righe(t)[1])[3].iter(W + 'b')) + list(celle(righe(t)[1])[3].iter(W + 'bCs')):
        b.getparent().remove(b)
    larghezze(t, [26, 22, 18, 34])
    imposta_testo(atteso(B[280], '{/conMacchine}'), '{/conGiustificabili}')
    rimuovi(*solo_contenuto(B[281:293]))
    imposta_testo(atteso(B[293], 'non giustificabili'), 'Sorgenti che richiedono la valutazione specifica')
    imposta_testo(atteso(B[294], '{#nessunaNonGiustificabile}'), '{#nessunaDaValutare}')
    imposta_testo(atteso(B[296], '{/nessunaNonGiustificabile}'), '{/nessunaDaValutare}')
    imposta_testo(atteso(B[297], '{#conNonGiustificabili}'), '{#conDaValutare}')
    imposta_testo(atteso(B[298], 'Nelle tabelle che seguono'),
                  'Nella tabella seguente sono riportate le sorgenti che richiedono la valutazione specifica, con le mansioni esposte e le '
                  'modalità di valutazione.')
    didascalia(atteso(B[300], 'macchine'), 'Sorgenti che richiedono la valutazione specifica.', stile_da=didasc)
    t = nuova_tabella(proto, ['Sorgente', 'Frequenza', 'Attività e postazione', 'Mansioni esposte', 'Valutazione', 'Note'],
                      ['{descrizione}', '{frequenza}', '{attivita}', '{mansioni}', '{modalita}', '{motivazione}'], 'daValutare', [20, 10, 20, 18, 14, 18])
    B[301].addnext(t)
    rimuovi(B[299], B[301], *solo_contenuto(B[302:315]))
    imposta_testo(atteso(B[315], '{/conNonGiustificabili}'), '{/conDaValutare}')

    # --- 8 Misure in campo
    imposta_testo(atteso(B[317], 'Esecuzione dei rilievi'), 'Misure in campo')
    didascalia(atteso(B[323], 'illuminamento'), 'Misure del campo elettrico e dell’induzione magnetica.', stile_da=didasc)
    t = nuova_tabella(proto, ['N°', 'Sorgente', 'Postazione', 'Distanza [m]', 'Frequenza', 'E [V/m]', 'B [µT]'],
                      ['{numero}', '{sorgente}', '{postazione}', '{distanza}', '{frequenza}', '{e}', '{b}'], 'misure', [6, 26, 24, 10, 12, 11, 11])
    B[324].addnext(t)
    rimuovi(B[324])

    # --- 9 Confronto con i valori di riferimento
    imposta_testo(atteso(B[328], 'Elaborazione dei rilievi'), 'Confronto con i valori di riferimento')
    imposta_testo(atteso(B[331], 'Lv = Ev'),
                  'Nella tabella seguente ogni misura è confrontata con i livelli di riferimento per la popolazione e con i valori di azione '
                  'inferiori e superiori alla sua frequenza (rapporto percentuale: oltre il 100% il valore è superato).')
    rimuovi(B[329], B[332])
    didascalia(atteso(B[334], 'Luminanza'), 'Confronto delle misure con i livelli per la popolazione e con i valori di azione.')
    t = B[335]
    for tc, s in zip(celle(righe(t)[0]), ['N° misura', 'Livello per la popolazione', 'VA inferiori', 'VA superiori', 'Esito', 'Zona']):
        cella(tc, s)
    for tc, s in zip(celle(righe(t)[1]), ['{#confronti}{numero}', '{popolazione}', '{inferiori}', '{superiori}', '{esito}', '{zona}{/confronti}']):
        cella(tc, s)
    larghezze(t, [10, 18, 15, 15, 30, 12])
    nessuna = clona(corpo, 'Non sono state eseguite misure in campo: non ci sono valori da confrontare.')
    B[336].addnext(tag('{/conMisure}'))
    B[336].addnext(nessuna)
    B[336].addnext(tag('{^conMisure}'))

    # --- 10 Zone e distanze di rispetto
    imposta_testo(atteso(B[338], 'adeguatezza'), 'Zone e distanze di rispetto')
    imposta_testo(atteso(B[340], 'Sui DPI'),
                  'Nella tabella seguente è riportata, per ogni sorgente, la zona in cui ricade l’area di lavoro, la distanza oltre la quale sono '
                  'rispettati i livelli per la popolazione e le condizioni di accesso.')
    didascalia(atteso(B[347], 'DPI'), 'Zone e distanze di rispetto.')
    t = nuova_tabella(proto, ['Sorgente', 'Zona', 'Esito', 'Distanza di rispetto', 'Accesso'],
                      ['{sorgente}', '{zona}', '{esito}', '{distanza}', '{accesso}'], 'zone', [28, 10, 22, 14, 26])
    B[348].addnext(t)
    mansioni_t = nuova_tabella(proto, ['Mansione', 'Sorgenti vicino alle quali lavora', 'Esito'], ['{nome}', '{sorgenti}', '{esito}'], 'esitiMansioni', [30, 45, 25])
    inserisci_dopo(t, [
        tag('{#conMansioni}'),
        clona(corpo, 'Per ogni mansione si riporta l’esito peggiore tra le sorgenti vicino alle quali lavora.'),
        cap('Esito della valutazione per mansione.'),
        mansioni_t,
        tag('{/conMansioni}'),
    ])
    rimuovi(B[339], B[341], B[342], B[343], B[344], B[346], B[348], B[349])

    # --- 12 fotosensibilizzanti: non esiste per i CEM
    rimuovi(*solo_contenuto(B[355:372]))


def main():
    modello, uscita = sys.argv[1], sys.argv[2]
    lavoro = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(modello) as z:
        z.extractall(lavoro)
    doc_path = lavoro / 'word' / 'document.xml'
    doc = etree.parse(str(doc_path))
    trasforma_documento(doc)
    salti_in_interruzioni(doc.getroot().find(W + 'body'))
    doc.write(str(doc_path), xml_declaration=True, encoding='UTF-8', standalone=True)
    for f in sorted((lavoro / 'word').glob('*.xml')):
        if re.match(r'(header|footer)\d+\.xml', f.name):
            s = f.read_text(encoding='utf-8')
            if TITOLO_ROA in s or 'radiazioni ottiche' in s.lower():
                s = s.replace(TITOLO_ROA, TITOLO_CEM)
                f.write_text(s, encoding='utf-8')
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
    main()
