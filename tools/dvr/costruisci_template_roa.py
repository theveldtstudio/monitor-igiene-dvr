#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Radiazioni ottiche artificiali (docxtemplater) dal DVR modello
"2026_DVR_ROA_CASTAGNOLA.docx" (cartella DVR/Modelli):

    python3 tools/dvr/costruisci_template_roa.py 2026_DVR_ROA_CASTAGNOLA.docx public/templates/dvr/roa.docx

Le tabelle delle sorgenti (censimento, giustificazione per macchine/lampade/laser, analisi delle non
giustificabili), dei rilievi di illuminamento e dei DPI per saldatura diventano cicli; le didascalie
restano numerate dai campi SEQ del modello (Word li aggiorna all'apertura).
Correzioni: "Cravasco"/"Pavimental" (refusi di altri cantieri) sostituiti dai dati del cantiere,
IEC 60285-1 → CEI EN 60825-1, IR-C fino a 1 mm, refusi della citazione ICNIRP e del piè di pagina,
logo CTG → logo del cliente, firme tolte.
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
from costruisci_template_mmc import legato_al_successivo, paragrafi_ciclo, solo_contenuto, togli_vmerge  # noqa: E402
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
    sostituisci,
    testo,
)
from costruisci_template_vibrazioni import normalizza_loghi  # noqa: E402

R_EMBED = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed'
A_BLIP = '{http://schemas.openxmlformats.org/drawingml/2006/main}blip'
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'


def didascalia_seq(p, nuovo):
    """Cambia il testo dopo il numero SEQ della didascalia, lasciando il campo."""
    runs = list(p.iter(W + 'r'))
    fine = max(i for i, r in enumerate(runs) if any(f.get(W + 'fldCharType') == 'end' for f in r.iter(W + 'fldChar')))
    ts = [t for r in runs[fine + 1:] for t in r.iter(W + 't')]
    assert ts, testo(p)
    ts[0].text = '. ' + nuovo
    ts[0].set(XML_SPACE, 'preserve')
    for t in ts[1:]:
        t.text = ''


def cella_due(tc, primo, secondo):
    """Cella con due paragrafi (es. "SI" e la motivazione)."""
    ps = tc.findall(W + 'p')
    imposta_testo(ps[0], primo)
    if len(ps) < 2:
        ps.append(copy.deepcopy(ps[0]))
        ps[0].addnext(ps[1])
    imposta_testo(ps[1], secondo)
    for p in ps[2:]:
        tc.remove(p)


def ciclo_due(t, indice, contenuti, nome):
    """Come riga_ciclo, ma l'ultima cella ha due paragrafi (esito e motivazione)."""
    tr = righe(t)[indice]
    togli_vmerge(tr)
    cs = celle(tr)
    assert len(cs) == len(contenuti) + 1, (len(cs), contenuti)
    for i, (tc, c) in enumerate(zip(cs, contenuti)):
        cella(tc, ('{#%s}' % nome if i == 0 else '') + c)
    cella_due(cs[-1], '{esito}', '{motivazione}{/%s}' % nome)
    rimuovi(*righe(t)[indice + 1:])


def trasforma_documento(doc):
    body = doc.getroot().find(W + 'body')
    B = list(body)
    tag = lambda s: paragrafo_tag(B[50], s)  # noqa: E731

    def avvolgi(primo, ultimo, nome):
        primo.addprevious(tag('{#%s}' % nome))
        ultimo.addnext(tag('{/%s}' % nome))

    # --- Copertina
    ps = celle(righe(B[0])[0])[1].findall(W + 'p')
    imposta_testo(atteso(ps[0], 'COMUNE DI'), 'COMUNE DI {comuneMaiuscolo}')
    imposta_testo(atteso(ps[1], 'PROVINCIA DI'), 'PROVINCIA DI {provinciaMaiuscolo}')
    imposta_testo(atteso(ps[3], 'TERZO VALICO'), '{operaMaiuscolo}')
    imposta_testo(atteso(ps[5], 'CASTAGNOLA'), 'CANTIERE {denominazioneMaiuscolo}')
    ps = celle(righe(B[0])[1])[0].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Servidei'), '{datoreLavoro}')
    imposta_testo(atteso(ps[4], 'Parolin'), '{rspp}')
    imposta_testo(atteso(ps[7], 'Lombroni'), '{medicoCompetente}')
    paragrafi_ciclo(atteso(ps[10], 'Gencarelli'), 'rls')

    r = righe(B[4])
    cella(celle(atteso(r[0], 'Integrazione'))[3], '{integrazioneTesto}')
    cella(celle(atteso(r[1], 'Data'))[3], '{dataEmissioneTesto}')
    ps = celle(r[3])[1].findall(W + 'p')
    imposta_testo(atteso(ps[2], 'Società'), '{studioDescrizione}')
    ps = celle(r[3])[2].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Catano'), '{#gruppoLavoro}')
    imposta_testo(ps[2], '{.}')
    imposta_testo(ps[3], '{/gruppoLavoro}')
    rimuovi(*ps[4:])
    cella(celle(atteso(r[3], 'Redatto'))[5], '{redatto}')
    cella(celle(atteso(r[4], 'Verificato'))[5], '{verificato}')
    cella(celle(atteso(r[5], 'Approvato'))[5], '{approvato}')

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

    # --- 1. Introduzione
    imposta_testo(atteso(B[49], 'In applicazione'), '{intro1}')
    imposta_testo(atteso(B[51], 'Eco-Ter'), 'Il presente elaborato è redatto dalla {studioEsecutore}.')

    # --- refusi del modello
    sostituisci(atteso(celle(righe(B[100])[7])[0], '3000 nm a 1 nm').findall(W + 'p')[-1], '1 nm', '1 mm')
    sostituisci(atteso(B[170], 'Guidalines'), 'Guidalines', 'Guidelines')
    sostituisci(B[170], 'inchoerent', 'incoherent')
    sostituisci(atteso(B[453], '60285'), 'IEC 60285-1', 'CEI EN 60825-1')
    sostituisci(atteso(B[216], 'stata verificata'), 'É', 'È')

    # --- 6.1 Organizzazione delle attività: ciclo di lavoro dell'app
    punto = copy.deepcopy(atteso(B[228], 'Perforazione'))
    imposta_testo(punto, '{.}')
    imposta_testo(atteso(B[226], 'Cravasco'), '{testo}')
    B[226].addprevious(tag('{#cicloBlocchi}'))
    B[226].addnext(tag('{/cicloBlocchi}'))
    B[226].addnext(tag('{/punti}'))
    B[226].addnext(punto)
    B[226].addnext(tag('{#punti}'))
    rimuovi(*solo_contenuto(B[227:252]))

    # --- 6.2 Mansioni
    atteso(B[254], 'classificati in gruppi')
    rimuovi(*solo_contenuto(B[255:344]))
    didascalia_seq(atteso(B[344], 'Mansioni impiegate'), 'Mansioni e gruppi omogenei per la valutazione')
    riga_ciclo(B[345], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')
    rimuovi(*solo_contenuto(B[346:401]))

    # --- 6.3–6.5 figure della sicurezza
    imposta_testo(atteso(B[402], 'Lombroni'), '{medicoCompetente}')
    imposta_testo(atteso(B[405], 'Parolin'), '{rspp}')
    paragrafi_ciclo(atteso(B[408], 'Gencarelli'), 'rls')
    rimuovi(*[x for x in B[410:426] if x.tag == W + 'p' and not testo(x).strip()])

    # --- 6.6 Misure preventive
    imposta_testo(atteso(B[428], 'dispositivi di protezione'), '{testoDpi}')
    paragrafi_ciclo(atteso(B[429], 'ripari'), 'dpiElenco')
    rimuovi(B[430], B[431], B[432])
    paragrafi_ciclo(atteso(B[437], 'saldatura'), 'organizzazione')
    rimuovi(B[438])

    # --- 6.7 Censimento delle sorgenti
    ciclo_riga = lambda t, i, c, n: (togli_vmerge(righe(t)[i]), riga_ciclo(t, i, c, n))  # noqa: E731
    ciclo_riga(B[445], 1, ['{tipo}', '{descrizione}', '{attivita}', '{funzionamento}', '{utilizzo}'], 'sorgenti')

    # --- 7.1 Giustificazione per tipo di sorgente
    didascalia_seq(atteso(B[455], 'macchine'), 'Sorgenti ROA non coerenti: macchine (UNI EN 12198)')
    ciclo_due(B[456], 1, ['{descrizione}', '{classe}', '{attivita}'], 'macchine')
    avvolgi(B[455], B[456], 'conMacchine')
    didascalia_seq(atteso(B[457], 'lampade'), 'Sorgenti ROA non coerenti: lampade (CEI EN 62471)')
    ciclo_due(B[458], 1, ['{descrizione}', '{classe}', '{attivita}'], 'lampade')
    avvolgi(B[457], B[458], 'conLampade')
    didascalia_seq(atteso(B[460], 'laser'), 'Sorgenti ROA coerenti: laser (CEI EN 60825-1)')
    ciclo_due(B[461], 1, ['{descrizione}', '{componente}', '{classe}', '{attivita}'], 'laser')
    avvolgi(B[460], B[461], 'conLaser')

    # --- 7.2 Analisi delle sorgenti non giustificabili
    nessuna = copy.deepcopy(B[467])
    imposta_testo(nessuna, 'Tutte le sorgenti censite sono giustificabili: la valutazione non richiede approfondimenti.')
    B[467].addprevious(tag('{#nessunaNonGiustificabile}'))
    B[467].addprevious(nessuna)
    B[467].addprevious(tag('{/nessunaNonGiustificabile}'))
    colonne = ['{descrizione}', '{spettro}', '{distanza}', '{tempo}', '{diretti}', '{indebiti}']
    for cap, t, nome, frase in ((B[468], B[469], 'ngMacchine', 'macchine'), (B[472], B[473], 'ngLampade', 'lampade'), (B[476], B[477], 'ngLaser', 'laser')):
        didascalia_seq(atteso(cap, 'Analisi sorgenti'), 'Analisi delle sorgenti ROA non giustificabili: ' + frase)
        ciclo_due(t, 1, colonne, nome)
        avvolgi(cap, t, 'con' + nome[0].upper() + nome[1:])
    avvolgi(B[467], B[477].getnext(), 'conNonGiustificabili')

    # --- 8. Rilievi in campo
    paragrafi_ciclo(atteso(B[480], 'Sulla base degli esiti'), 'rilieviTesti')
    rimuovi(B[481], B[482], B[483])
    didascalia_seq(atteso(B[485], 'Campionamento'), 'Misure di illuminamento delle sorgenti')
    t = B[486]
    cella(atteso(celle(righe(t)[1])[3], 'angolo'), 'ω: angolo solido sotteso dalla sorgente [sr]')
    riga_ciclo(t, 2, ['{sorgente}', '{ev}', '{distanza}', '{omega}'], 'campionamenti')
    avvolgi(B[485], B[486], 'conMisure')

    # --- 9. Elaborazione
    imposta_testo(atteso(B[490], 'luminanza'), '{elaborazioneTesto}')
    didascalia_seq(atteso(B[494], 'Elaborazioni'), 'Luminanza delle sorgenti e confronto con il limite')
    riga_ciclo(B[495], 1, ['{sorgente}', '{ev}', '{omega}', '{lv}', '{limite}', '{rispetta}'], 'luminanze')
    avvolgi(atteso(B[491], 'Lv = Ev'), B[495], 'conMisure')

    # --- 10. DPI per saldatura e taglio
    imposta_testo(atteso(B[498], 'verifiche'), 'Sui DPI messi a disposizione dei lavoratori per saldature e tagli termici sono state eseguite le verifiche dell’adeguatezza (UNI EN 169).')
    didascalia_seq(atteso(B[500], 'adeguatezza'), 'Verifica dell’adeguatezza dei DPI utilizzati durante saldature e tagli')
    t = B[501]
    togli_vmerge(righe(t)[1])
    riga_ciclo(t, 1, ['{processo}', '{campo}', '{dotazione}', '{condizioni}', '{richiesto}', '{verifica}'], 'dpiRighe')
    avvolgi(B[500], B[501], 'conDpi')
    nessun = copy.deepcopy(B[498])
    imposta_testo(nessun, 'Nel cantiere non si eseguono saldature o tagli termici: non ci sono DPI per saldatura da verificare.')
    B[498].addnext(tag('{/nessunDpi}'))
    B[498].addnext(nessun)
    B[498].addnext(tag('{#nessunDpi}'))
    avvolgi(B[498], B[498], 'conDpi')

    # --- 11–12
    imposta_testo(atteso(B[505], 'sensibili'), '{testoSensibili}')
    imposta_testo(atteso(B[508], 'fotosensibilizzanti'), '{testoFotosensibilizzanti}')

    # --- 13. Conclusioni
    paragrafi_ciclo(atteso(B[526], 'le uniche attività'), 'conclusioni')
    rimuovi(B[527], B[528])
    paragrafi_ciclo(atteso(B[530], 'dotato tutti'), 'precisazioni')
    rimuovi(B[531])
    avvolgi(atteso(B[529], 'Tuttavia'), B[530].getnext(), 'conPrecisazioni')

    # --- 14. Piano (l'ultimo paragrafo porta l'interruzione di sezione: resta vuoto)
    voce = atteso(B[535], 'esposizioni indebite')
    sotto = atteso(B[536], 'limitare l’accesso')
    imposta_testo(voce, '{testo}')
    imposta_testo(sotto, '{.}')
    spazio = copy.deepcopy(B[538])
    voce.addprevious(tag('{#piano}'))
    voce.addnext(tag('{#sotto}'))
    sotto.addnext(tag('{/piano}'))
    sotto.addnext(spazio)
    sotto.addnext(tag('{/sotto}'))
    rimuovi(*B[537:550])
    imposta_testo(B[550], '')
    for n in B[550].iter(W + 'numPr'):
        n.getparent().remove(n)

    # didascalie delle tabelle nei cicli: legate alla tabella
    for p in body.iter(W + 'p'):
        st = p.find(W + 'pPr/' + W + 'pStyle')
        if st is not None and st.get(W + 'val') == 'Didascalia' and testo(p).startswith('Tabella'):
            legato_al_successivo(p)


def trasforma_piede(d):
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
        elif s == 'CTG':
            imposta_testo(p, '{impresa}')
        elif s == 'Consorzio Tunnel Giovi':
            imposta_testo(p, '')
        elif s.startswith('Cantiere'):
            imposta_testo(p, 'Cantiere {denominazione}')
        elif 'OTTCHE' in s:
            imposta_testo(p, 'VALUTAZIONE DEL RISCHIO DI ESPOSIZIONE DEI LAVORATORI ALLE RADIAZIONI OTTICHE ARTIFICIALI')
        elif prec == 'File:':
            imposta_testo(p, '{nomeFile}')


def main(modello, uscita):
    lavoro = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(modello) as z:
        z.extractall(lavoro)
    doc_path = lavoro / 'word' / 'document.xml'
    doc = etree.parse(str(doc_path))
    trasforma_documento(doc)
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
    from avanzamento import aggiungi_avanzamento  # noqa: E402
    aggiungi_avanzamento(uscita)
    print('Template scritto in', uscita)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
