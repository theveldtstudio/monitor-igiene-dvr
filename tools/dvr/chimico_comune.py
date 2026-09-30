"""
Parti comuni ai costruttori dei template dei DVR Agenti chimici, Fumi di saldatura e Agenti
cancerogeni (tutti derivati dai DVR modello Castagnola): copertina, piè di pagina, cicli su righe e
tabelle, salvataggio del pacchetto.
"""
import copy
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

from lxml import etree

from costruisci_template_mmc import legato_al_successivo, paragrafi_ciclo, salto_pagina, togli_vmerge  # noqa: F401
from costruisci_template_rumore import W, atteso, cella, celle, imposta_testo, paragrafo_tag, rimuovi, riga_ciclo, righe, testo  # noqa: F401
from costruisci_template_vibrazioni import normalizza_loghi

A_BLIP = '{http://schemas.openxmlformats.org/drawingml/2006/main}blip'


def paragrafi(el):
    return [p for p in el.iter(W + 'p')]


def dopo(ps, i):
    """Primo paragrafo non vuoto dopo l'indice i."""
    for p in ps[i + 1:]:
        if testo(p).strip():
            return p
    raise AssertionError('nessun paragrafo dopo %d' % i)


def copertina(B, integrazione, data, periodo=None, tag_periodo='{periodoTesto}'):
    """Copertina dei DVR ECO-TER (tabelle 0, 4 e 6): i campi si trovano dal testo, non dalla posizione."""
    ps = paragrafi(B[0])
    for i, p in enumerate(ps):
        s = testo(p).strip()
        if s.startswith('COMUNE DI'):
            imposta_testo(p, 'COMUNE DI {comuneMaiuscolo}')
        elif s.startswith('PROVINCIA DI'):
            imposta_testo(p, 'PROVINCIA DI {provinciaMaiuscolo}')
        elif 'TERZO VALICO' in s:
            imposta_testo(p, '{operaMaiuscolo}')
        elif s.lower().startswith('cantiere'):
            imposta_testo(p, 'Cantiere {denominazione}')
    ps = paragrafi(B[0])
    etichette = {'Datore di lavoro': '{datoreLavoro}', 'RSPP': '{rspp}', 'Medico Competente': '{medicoCompetente}'}
    for i, p in enumerate(ps):
        s = testo(p).strip()
        if s in etichette:
            imposta_testo(dopo(ps, i), etichette[s])
        elif s == 'RLS':
            paragrafi_ciclo(dopo(ps, i), 'rls')
            break

    t4 = B[4]
    ps = paragrafi(t4)
    fatti = set()
    for i, p in enumerate(ps):
        s = testo(p).strip()
        if s == integrazione and 'i' not in fatti:
            imposta_testo(p, '{integrazioneTesto}')
            fatti.add('i')
        elif s == data and 'd' not in fatti:
            imposta_testo(p, '{dataEmissioneTesto}')
            fatti.add('d')
        elif periodo and periodo in s and 'p' not in fatti:
            imposta_testo(p, tag_periodo)
            fatti.add('p')
        elif s == 'Società di Ingegneria e di Servizi':
            imposta_testo(p, '{studioDescrizione}')
    assert fatti >= ({'i', 'd', 'p'} if periodo else {'i', 'd'}), fatti
    ps = paragrafi(t4)
    for i, p in enumerate(ps):
        s = testo(p).strip()
        if s == 'Gruppo di lavoro':
            nomi = []
            for q in ps[i + 1:]:
                if q.getparent() is not p.getparent():
                    break
                if testo(q).strip():
                    nomi.append(q)
            assert len(nomi) >= 3, len(nomi)
            imposta_testo(nomi[0], '{#gruppoLavoro}')
            imposta_testo(nomi[1], '{.}')
            imposta_testo(nomi[2], '{/gruppoLavoro}')
            rimuovi(*nomi[3:])
            break
    ps = paragrafi(t4)
    for etichetta, tag in (('Redatto', '{redatto}'), ('Verificato', '{verificato}'), ('Approvato', '{approvato}')):
        i = next(k for k, p in enumerate(ps) if testo(p).strip() == etichetta)
        imposta_testo(dopo(ps, i), tag)

    # firme scansionate: tutte le immagini di copertina tranne il logo dello studio
    for tabella in (B[4], B[6]):
        for d in list(tabella.iter(W + 'drawing')):
            tc = d
            while tc is not None and tc.tag != W + 'tc':
                tc = tc.getparent()
            if tc is not None and 'ELABORATO DA' in testo(tc):
                continue
            run = d.getparent()
            run.getparent().remove(run)

    t6 = B[6]
    rr = righe(t6)
    numeriche = [i for i, tr in enumerate(rr) if re.fullmatch(r'\d\d', testo(celle(tr)[0]).strip())]
    riga_ciclo(t6, numeriche[0], ['{rev}', '{data}', '{descrizione}', '{collaborazione}', '{redatto}', '{verificato}', '{approvato}'],
               'revisioniCopertina', da_eliminare=numeriche[1:])
    for tr in righe(t6):
        for tc in celle(tr):
            s = testo(tc).strip()
            if s.startswith('FILE NAME'):
                cella(tc, 'FILE NAME: {nomeFile}')
            elif re.fullmatch(r'REV \d\d', s):
                cella(tc, 'REV {revisioneCodice}')


def trasforma_piede(d, titolo=None):
    ps = [p for p in d.iter(W + 'p') if testo(p).strip()]
    for i, p in enumerate(ps):
        s = testo(p).strip()
        prec = testo(ps[i - 1]).strip() if i else ''
        if prec == 'Rev.:' and re.fullmatch(r'\d\d', s):
            imposta_testo(p, '{revisioneCodice}')
        elif s.startswith('Integr') and re.search(r'\d', s):
            imposta_testo(p, 'Integr.:' if i + 1 < len(ps) and testo(ps[i + 1]).strip() in ('/', '\\') else 'Integr.: {integrazioneTesto}')
        elif prec.startswith('Integr') and s in ('/', '\\') or (prec == 'Integr.:' and re.fullmatch(r'\d\d', s)):
            imposta_testo(p, '{integrazioneTesto}')
        elif prec == 'Data:':
            imposta_testo(p, '{dataEmissioneTesto}')
        elif s == 'CTG':
            imposta_testo(p, '{impresa}')
        elif s.startswith('Consorzio Tunnel Giovi') or s.startswith('Concorzio'):
            imposta_testo(p, '' if prec == 'CTG' or prec.startswith('{impresa') else '{impresa}')
        elif s.startswith('Cantiere'):
            imposta_testo(p, 'Cantiere {denominazione}')
        elif titolo and (s.startswith('Valutazione del rischio') or s.startswith('Documento di valutazione')):
            allegato = re.search(r'(ALLEGATO.*)$', s)
            imposta_testo(p, titolo + (' ' + allegato.group(1) if allegato else ''))
        elif prec == 'File:':
            imposta_testo(p, '{nomeFile}')


def ciclo_blocchi(testo_p, punto_p, da_togliere):
    """Ciclo di lavoro dell'app al posto del testo del modello."""
    tag = lambda s: paragrafo_tag(testo_p, s)  # noqa: E731
    punto = copy.deepcopy(punto_p)
    imposta_testo(punto, '{.}')
    imposta_testo(testo_p, '{testo}')
    testo_p.addprevious(tag('{#cicloBlocchi}'))
    testo_p.addnext(tag('{/cicloBlocchi}'))
    testo_p.addnext(tag('{/punti}'))
    testo_p.addnext(punto)
    testo_p.addnext(tag('{#punti}'))
    rimuovi(*da_togliere)


def avvolgi(primo, ultimo, nome, rif=None):
    rif = rif if rif is not None else (primo if primo.tag == W + 'p' else None)
    assert rif is not None
    primo.addprevious(paragrafo_tag(rif, '{#%s}' % nome))
    ultimo.addnext(paragrafo_tag(rif, '{/%s}' % nome))


def piano(voce, sotto, da_togliere, spazio=None):
    """Piano come voci con sotto-elenco: {#piano}{testo}{#sotto}{.}{/sotto}{/piano}."""
    tag = lambda s: paragrafo_tag(voce, s)  # noqa: E731
    imposta_testo(voce, '{testo}')
    sotto = copy.deepcopy(sotto)
    imposta_testo(sotto, '{.}')
    voce.addprevious(tag('{#piano}'))
    fine = [tag('{#sotto}'), sotto, tag('{/sotto}')] + ([copy.deepcopy(spazio)] if spazio is not None else []) + [tag('{/piano}')]
    ancora = voce
    for e in fine:
        ancora.addnext(e)
        ancora = e
    rimuovi(*da_togliere)


def togli_segnalibri(el):
    for b in list(el.iter(W + 'bookmarkStart')) + list(el.iter(W + 'bookmarkEnd')):
        b.getparent().remove(b)


def salva(lavoro, doc, doc_path, uscita, titolo_piede, clienti=frozenset({'media/image1.png'})):
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
        trasforma_piede(d, titolo_piede)
        d.write(str(piede), xml_declaration=True, encoding='UTF-8', standalone=True)

    normalizza_loghi(lavoro, clienti=set(clienti), da_eliminare=())

    drels = lavoro / 'word' / '_rels' / 'document.xml.rels'
    testo_rels = drels.read_text(encoding='utf-8')
    usati = set(re.findall(r'r:(?:embed|id)="([^"]+)"', doc_path.read_text(encoding='utf-8')))
    for rid, target in re.findall(r'<Relationship Id="([^"]+)" Type="[^"]+/image" Target="([^"]+)"/>', testo_rels):
        if rid not in usati:
            testo_rels = re.sub(r'<Relationship Id="%s" [^>]+/>' % rid, '', testo_rels)
            altri = [f for f in (lavoro / 'word' / '_rels').glob('*.rels') if f != drels and target in f.read_text(encoding='utf-8')]
            if not altri:
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


def apri(modello):
    lavoro = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(modello) as z:
        z.extractall(lavoro)
    doc_path = lavoro / 'word' / 'document.xml'
    return lavoro, etree.parse(str(doc_path)), doc_path


def didascalia(p, nuovo, etichetta='Tabella', stile_da=None):
    """Didascalia numerata da un campo SEQ (Word e LibreOffice la aggiornano), al posto del numero
    scritto a mano nel modello: "Tabella <SEQ>. nuovo"."""
    if stile_da is not None:
        vecchio = p.find(W + 'pPr')
        if vecchio is not None:
            p.remove(vecchio)
        p.insert(0, copy.deepcopy(stile_da.find(W + 'pPr')))
    rpr = next((r.find(W + 'rPr') for r in p.iter(W + 'r') if r.find(W + 'rPr') is not None), None)
    for e in list(p):
        if e.tag != W + 'pPr':
            p.remove(e)

    def run(s):
        r = etree.SubElement(p, W + 'r')
        if rpr is not None:
            r.append(copy.deepcopy(rpr))
        t = etree.SubElement(r, W + 't')
        t.text = s
        t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        return r

    run(etichetta + ' ')
    fld = etree.SubElement(p, W + 'fldSimple')
    fld.set(W + 'instr', ' SEQ %s \\* ARABIC ' % etichetta)
    fld.append(run('1'))
    run('. ' + nuovo)
    legato_al_successivo(p)


def intestazione_ripetuta(t, n=1):
    """Le prime n righe si ripetono in cima a ogni pagina."""
    for tr in righe(t)[:n]:
        trpr = tr.find(W + 'trPr')
        if trpr is None:
            trpr = etree.Element(W + 'trPr')
            tr.insert(1 if tr.find(W + 'tblPrEx') is not None else 0, trpr)
        if trpr.find(W + 'tblHeader') is None:
            etree.SubElement(trpr, W + 'tblHeader')


def paragrafi_cella(tc, testi):
    """Testo dei paragrafi di una cella (quelli in più si tolgono)."""
    ps = tc.findall(W + 'p')
    for p, s in zip(ps, testi):
        imposta_testo(p, s)
    for p in ps[len(testi):]:
        tc.remove(p)


def altezza_minima(tr, twips):
    """Altezza minima della riga (il modello ha righe dati alte 2–4 cm)."""
    h = tr.find(W + 'trPr/' + W + 'trHeight')
    if h is not None:
        h.set(W + 'val', str(twips))
        h.attrib.pop(W + 'hRule', None)


def continua_numerazione(p):
    """Toglie il "riparti da N" della numerazione pagine di una sezione (numeri scritti a mano nel modello)."""
    for n in p.iter(W + 'pgNumType'):
        n.attrib.pop(W + 'start', None)


R_ID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


def piede_dedicato(lavoro, sezione, seguente, sostituzioni):
    """La sezione `sezione` (paragrafo con sectPr) riceve una copia del suo piè di pagina con i testi
    cambiati (`sostituzioni`: testo di paragrafo → nuovo testo); la sezione `seguente` resta sul piè
    di pagina originale."""
    sp = sezione.find(W + 'pPr/' + W + 'sectPr')
    sq = seguente.find(W + 'pPr/' + W + 'sectPr')
    ref = sp.find(W + 'footerReference')
    rid = ref.get(R_ID)
    rels_path = lavoro / 'word' / '_rels' / 'document.xml.rels'
    rels = rels_path.read_text(encoding='utf-8')
    target = re.search(r'<Relationship Id="%s" [^>]*Target="([^"]+)"' % rid, rels) or re.search(r'<Relationship [^>]*Target="([^"]+)"[^>]* Id="%s"' % rid, rels)
    originale = target.group(1)
    n = 1
    while (lavoro / 'word' / ('footer%d.xml' % n)).exists():
        n += 1
    nuovo = 'footer%d.xml' % n
    d = etree.parse(str(lavoro / 'word' / originale))
    for p in d.iter(W + 'p'):
        s = testo(p).strip()
        if s in sostituzioni:
            imposta_testo(p, sostituzioni[s])
    d.write(str(lavoro / 'word' / nuovo), xml_declaration=True, encoding='UTF-8', standalone=True)
    rel_orig = lavoro / 'word' / '_rels' / (originale + '.rels')
    if rel_orig.exists():
        shutil.copy(rel_orig, lavoro / 'word' / '_rels' / (nuovo + '.rels'))
    nuovo_id = 'rIdPiede%d' % n
    rels = rels.replace('</Relationships>', '<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="%s"/></Relationships>' % (nuovo_id, nuovo))
    rels_path.write_text(rels, encoding='utf-8')
    ct_path = lavoro / '[Content_Types].xml'
    ct = ct_path.read_text(encoding='utf-8')
    ct = ct.replace('</Types>', '<Override PartName="/word/%s" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>' % nuovo)
    ct_path.write_text(ct, encoding='utf-8')
    if sq.find(W + 'footerReference') is None:
        sq.insert(0, copy.deepcopy(ref))
    ref.set(R_ID, nuovo_id)


def numera_titolo(p, livello, stile=None, num_id='1', modello=None):
    """Numerazione dei titoli da un unico elenco multilivello (il modello usa elenchi diversi con
    numeri iniziali scritti a mano). `modello`: paragrafo da cui copiare le proprietà."""
    if modello is not None:
        vecchio = p.find(W + 'pPr')
        if vecchio is not None:
            p.remove(vecchio)
        nuovo = copy.deepcopy(modello.find(W + 'pPr'))
        for x in nuovo.findall(W + 'sectPr'):
            nuovo.remove(x)
        p.insert(0, nuovo)
    ppr = p.find(W + 'pPr')
    if stile:
        st = ppr.find(W + 'pStyle')
        if st is None:
            st = etree.Element(W + 'pStyle')
            ppr.insert(0, st)
        st.set(W + 'val', stile)
        for x in ppr.findall(W + 'ind'):
            ppr.remove(x)
    for x in ppr.findall(W + 'numPr'):
        ppr.remove(x)
    num = etree.Element(W + 'numPr')
    etree.SubElement(num, W + 'ilvl').set(W + 'val', str(livello))
    etree.SubElement(num, W + 'numId').set(W + 'val', num_id)
    st = ppr.find(W + 'pStyle')
    (st.addnext if st is not None else (lambda e: ppr.insert(0, e)))(num)


def nuova_pagina(p, togli_prima=True):
    """Il paragrafo inizia una nuova pagina (pageBreakBefore) invece del paragrafo con il solo salto
    pagina che lo precede, che a fine pagina lasciava una pagina vuota."""
    ppr = p.find(W + 'pPr')
    if ppr.find(W + 'pageBreakBefore') is None:
        k = etree.Element(W + 'pageBreakBefore')
        st = ppr.find(W + 'pStyle')
        (st.addnext if st is not None else (lambda e: ppr.insert(0, e)))(k)
    if togli_prima:
        prec = p.getprevious()
        while prec is not None and prec.tag != W + 'p':
            prec = prec.getprevious()
        if prec is not None and not testo(prec).strip() and any(b.get(W + 'type') == 'page' for b in prec.iter(W + 'br')) \
                and prec.find(W + 'pPr/' + W + 'sectPr') is None:
            rimuovi(prec)


def pulisci_livello(lavoro, num_id, ilvl):
    """Formattazione del numero di un livello di elenco: nel modello il livello 2 dei titoli ha una
    formattazione corrotta (scala 0%, sfondo) e il numero appare come un rettangolo nero."""
    path = lavoro / 'word' / 'numbering.xml'
    n = etree.parse(str(path))
    num = next(x for x in n.getroot().findall(W + 'num') if x.get(W + 'numId') == str(num_id))
    aid = num.find(W + 'abstractNumId').get(W + 'val')
    a = next(x for x in n.getroot().findall(W + 'abstractNum') if x.get(W + 'abstractNumId') == aid)
    lvl = next(x for x in a.findall(W + 'lvl') if x.get(W + 'ilvl') == str(ilvl))
    for r in lvl.findall(W + 'rPr'):
        lvl.remove(r)
    rpr = etree.SubElement(lvl, W + 'rPr')
    etree.SubElement(rpr, W + 'rFonts').set(W + 'hint', 'default')
    n.write(str(path), xml_declaration=True, encoding='UTF-8', standalone=True)


def piede_sezione(sezione):
    """sectPr di un paragrafo di fine sezione (o l'ultimo sectPr del body)."""
    return sezione if sezione.tag == W + 'sectPr' else sezione.find(W + 'pPr/' + W + 'sectPr')


def usa_piede_di(sezione, altra):
    """La sezione usa lo stesso piè di pagina di `altra` (entrambe con footerReference)."""
    ref = piede_sezione(altra).find(W + 'footerReference')
    sp = piede_sezione(sezione)
    for r in sp.findall(W + 'footerReference'):
        sp.remove(r)
    sp.insert(0, copy.deepcopy(ref))


def fissa_piede(sezione, da):
    """La sezione riceve esplicitamente il piè di pagina che oggi eredita da `da`."""
    sp = piede_sezione(sezione)
    if sp.find(W + 'footerReference') is None:
        sp.insert(0, copy.deepcopy(piede_sezione(da).find(W + 'footerReference')))


def salti_in_interruzioni(body):
    """Ogni paragrafo vuoto con il solo salto pagina seguito da un paragrafo con testo diventa
    "inizia in una nuova pagina" su quel paragrafo: a fine pagina il salto lasciava una pagina vuota."""
    for p in list(body.iter(W + 'p')):
        if p.getparent() is not body or testo(p).strip() or p.find(W + 'pPr/' + W + 'sectPr') is not None:
            continue
        if not any(b.get(W + 'type') == 'page' for b in p.iter(W + 'br')):
            continue
        succ = p.getnext()
        vuoti = []
        while succ is not None and succ.tag == W + 'p' and not testo(succ).strip() and succ.find(W + 'pPr/' + W + 'sectPr') is None \
                and succ.find('.//' + W + 'drawing') is None and not any(b.get(W + 'type') == 'page' for b in succ.iter(W + 'br')):
            vuoti.append(succ)
            succ = succ.getnext()
        if succ is None or succ.tag != W + 'p' or not testo(succ).strip() or '{' in testo(succ):
            continue
        rimuovi(*vuoti)
        ppr = succ.find(W + 'pPr')
        if ppr is None:
            ppr = etree.Element(W + 'pPr')
            succ.insert(0, ppr)
        nuova_pagina(succ, togli_prima=False)
        rimuovi(p)


def inizio_livello(lavoro, num_id, ilvl, inizio=1):
    """Numero di partenza di un livello di elenco (nel modello i titoli partono da numeri scritti a mano)."""
    path = lavoro / 'word' / 'numbering.xml'
    n = etree.parse(str(path))
    num = next(x for x in n.getroot().findall(W + 'num') if x.get(W + 'numId') == str(num_id))
    aid = num.find(W + 'abstractNumId').get(W + 'val')
    a = next(x for x in n.getroot().findall(W + 'abstractNum') if x.get(W + 'abstractNumId') == aid)
    lvl = next(x for x in a.findall(W + 'lvl') if x.get(W + 'ilvl') == str(ilvl))
    lvl.find(W + 'start').set(W + 'val', str(inizio))
    n.write(str(path), xml_declaration=True, encoding='UTF-8', standalone=True)
