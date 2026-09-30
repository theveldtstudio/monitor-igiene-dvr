#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Movimentazione manuale dei carichi (docxtemplater) dal DVR
modello "DVR_MMC_XENIA_2026_TBM1_corretto.docx" (cartella DVR/Modelli).

Uso:
    python3 tools/dvr/costruisci_template_mmc.py <modello.docx> public/templates/dvr/mmc.docx

Il capitolo 6 diventa un ciclo sulle attività: per ognuna titolo, metodo, descrizione e il blocco di
calcolo del metodo (tabella NIOSH, indice composto, Snook e Ciriello o check list OCRA), ricavati
dalle sezioni 6.3 (NIOSH e composto), 6.4 (Snook) e 6.11 (OCRA) del modello.
Correzioni: logo Xenia in copertina e intestazioni → logo del cliente; firme tolte; testo del ciclo
che parlava di "esposizione alle vibrazioni" sostituito dal ciclo di lavoro dell'app; capitolo 4.6 → 4.3.
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


def solo_contenuto(els):
    return [e for e in els if e.tag in (W + 'p', W + 'tbl')]


def togli_vmerge(tr):
    for v in list(tr.iter(W + 'vMerge')):
        v.getparent().remove(v)


def paragrafi_ciclo(p, nome):
    imposta_testo(p, '{.}')
    p.addprevious(paragrafo_tag(p, '{#%s}' % nome))
    p.addnext(paragrafo_tag(p, '{/%s}' % nome))


def salto_pagina(rif, condizione):
    """Paragrafo con solo un salto pagina, dentro la condizione (es. {#nonUltima})."""
    p = paragrafo_tag(rif, '')
    r = p.find(W + 'r')
    r.find(W + 't').text = '{#%s}' % condizione
    br = etree.SubElement(p, W + 'r')
    etree.SubElement(br, W + 'br').set(W + 'type', 'page')
    fine = etree.SubElement(p, W + 'r')
    etree.SubElement(fine, W + 't').text = '{/%s}' % condizione
    return p


def togli_colore(tc):
    """Toglie lo sfondo colorato fisso del modello (la fascia la dice il testo)."""
    for shd in list(tc.iter(W + 'shd')):
        shd.getparent().remove(shd)


def legato_al_successivo(p):
    ppr = p.find(W + 'pPr')
    if ppr is None:
        ppr = etree.SubElement(p, W + 'pPr')
        p.insert(0, ppr)
    if ppr.find(W + 'keepNext') is None:
        k = etree.Element(W + 'keepNext')
        st = ppr.find(W + 'pStyle')
        if st is not None:
            st.addnext(k)
        else:
            ppr.insert(0, k)


def tabella_niosh(t):
    rr = righe(t)
    atteso(rr[0], 'COSTANTE DI PESO')

    def titolo(i, frammento, nuovo):
        c = celle(atteso(rr[i], frammento))[1]
        cella(c, nuovo)

    titolo(3, 'ALTEZZA DA TERRA', 'ALTEZZA DA TERRA DELLE MANI ALL’INIZIO DEL SOLLEVAMENTO: {vAltezza} cm')
    titolo(6, 'DISTANZA VERTICALE', 'DISTANZA VERTICALE DI SPOSTAMENTO DEL PESO TRA INIZIO E FINE SOLLEVAMENTO: {vDislocazione} cm')
    titolo(9, 'DISTANZA MASSIMA', 'DISTANZA MASSIMA DEL PESO DAL CORPO DURANTE IL SOLLEVAMENTO: {vDistanza} cm')
    titolo(12, 'DISLOCAZIONE ANGOLARE', 'DISLOCAZIONE ANGOLARE DEL PESO: {vAsimmetria}°')
    titolo(15, 'FREQUENZA', 'FREQUENZA DEI GESTI: {vFrequenza} atti/minuto, {vDurata}')
    titolo(20, 'PRESA', 'GIUDIZIO SULLA PRESA DEL CARICO: {vPresa}')
    titolo(23, 'PERSONE', 'N. DI PERSONE CHE MOVIMENTANO IL CARICO: {vPersone}{testoMano}')
    for i, tag in ((4, '{fA}'), (7, '{fB}'), (10, '{fC}'), (13, '{fD}'), (16, '{fE}'), (21, '{fF}')):
        cella(celle(rr[i])[-2], tag)
    cella(celle(rr[24])[3], '{fPersone}')
    r27 = celle(atteso(rr[27], 'Kg di peso'))
    cella(r27[1], '{pesoTesto}')
    cella(r27[3], '{plrAdulti}')
    cella(celle(atteso(rr[28], 'Peso Limite'))[3], '{plrAnziani}')
    r30 = celle(atteso(rr[30], 'I.S.'))
    togli_colore(r30[3])
    togli_colore(celle(rr[32])[3])
    cella(r30[3], '{isAdulti}')
    cella(r30[4], '({rischioAdulti})')
    r32 = celle(atteso(rr[32], 'I.S.'))
    cella(r32[3], '{isAnziani}')
    cella(r32[4], '({rischioAnziani})')


def tabella_composto(t):
    rr = righe(t)
    atteso(rr[0], 'Tipo di elemento')
    a, b = rr[2], rr[3]
    for tc, c in zip(celle(a), ['{#compiti}{descrizione}', '{fA}', '{fB}', '{fC}', '{fD}', '{fE}']):
        cella(tc, c)
    for tc, c in zip(celle(b), ['', '{vA}', '{vB}', '{vC}', '{vD}', '{vE}{/compiti}']):
        cella(tc, c)
    for r in rr[4:]:
        rimuovi(r)


def tabella_isc(t):
    rr = righe(t)
    cs = celle(atteso(rr[0], 'I.S.C.'))
    togli_colore(cs[1])
    togli_colore(celle(rr[1])[1])
    cella(cs[1], '{iscAdulti}')
    cella(cs[3], 'Calcolato per uomini adulti (18 anni < età < 45 anni): {rischioAdulti}')
    cella(cs[4], '')
    cs = celle(rr[1])
    cella(cs[1], '{iscAnziani}')
    cella(cs[3], 'Calcolato per uomini giovani (età < 18 anni) e anziani (età > 45 anni): {rischioAnziani}')
    cella(cs[4], '')


def tieni_insieme(t):
    """La tabella non si spezza tra due pagine (righe indivisibili e paragrafi legati al successivo)."""
    rr = righe(t)
    for i, tr in enumerate(rr):
        trpr = tr.find(W + 'trPr')
        if trpr is None:
            trpr = etree.Element(W + 'trPr')
            tr.insert(1 if tr.find(W + 'tblPrEx') is not None else 0, trpr)
        if trpr.find(W + 'cantSplit') is None:
            trpr.insert(0, etree.Element(W + 'cantSplit'))
        if i == len(rr) - 1:
            continue
        for p in tr.iter(W + 'p'):
            ppr = p.find(W + 'pPr')
            if ppr is None:
                ppr = etree.Element(W + 'pPr')
                p.insert(0, ppr)
            if ppr.find(W + 'keepNext') is None:
                k = etree.Element(W + 'keepNext')
                st = ppr.find(W + 'pStyle')
                if st is not None:
                    st.addnext(k)
                else:
                    ppr.insert(0, k)


def tabella_snook(t):
    rr = righe(t)
    h = celle(atteso(rr[0], 'Attività'))
    cella(h[5], '{etichettaValore}')
    cella(h[6], '{etichettaLimite}')
    for tc, c in zip(celle(rr[1]), ['{titolo}', '{azioneTesto}', '{vAltezza}', '{vDistanza}', '{vFrequenza}', '{valoreTesto}', '{limiteTesto}']):
        cella(tc, c)


def tabella_indice_snook(t):
    rr = righe(t)
    cs = celle(atteso(rr[0], 'Indice sintetico'))
    cella(cs[1], '{etichettaNumeratore}')
    togli_colore(cs[3])
    cella(cs[3], '{indice}')
    cella(celle(rr[1])[1], '{etichettaDenominatore}')


def tabella_ocra(t):
    rr = righe(t)
    cs = celle(atteso(rr[0], 'CHECK LIST OCRA'))
    cella(cs[0], '{titoloMaiuscolo}')
    for x in rr[1:]:
        for tc in celle(x):
            togli_colore(tc)
    cs = celle(rr[1])
    for tc, c in zip(cs, ['', 'Sinistra = {sx}', '{sxIndice}', '{sxRischio}', '{minuti} minuti']):
        if c:
            cella(tc, c)
    cs = celle(rr[2])
    for tc, c in zip(cs[1:4], ['Destra = {dx}', '{dxIndice}', '{dxRischio}']):
        cella(tc, c)


def trasforma_documento(doc):
    body = doc.getroot().find(W + 'body')
    B = list(body)

    # --- Copertina
    t0 = B[0]
    ps = celle(righe(t0)[0])[1].findall(W + 'p')
    imposta_testo(atteso(ps[0], 'COMUNE DI'), 'COMUNE DI {comuneMaiuscolo}')
    imposta_testo(atteso(ps[1], 'PROVINCIA DI'), 'PROVINCIA DI {provinciaMaiuscolo}')
    imposta_testo(atteso(ps[3], 'LINEA FERROVIARIA'), '{operaMaiuscolo}')
    imposta_testo(atteso(ps[4], 'TBM2'), '{denominazioneMaiuscolo}')
    ps = celle(righe(t0)[1])[0].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Caruso'), '{datoreLavoro}')
    imposta_testo(atteso(ps[3], 'Auria'), '{rspp}')
    imposta_testo(atteso(ps[5], 'Cioffi'), '{medicoCompetente}')
    imposta_testo(atteso(ps[7], 'Pellegrino'), '{#rls}')
    imposta_testo(atteso(ps[8], 'Parisi'), '{.}')
    imposta_testo(atteso(ps[9], 'Granato'), '{/rls}')

    r = righe(B[4])
    cella(celle(r[0])[3], '{integrazioneTesto}')
    cella(celle(r[1])[3], '{dataEmissioneTesto}')
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

    # firme scansionate (image3-5)
    firme = {'rId10', 'rId11', 'rId12'}
    for d in list(doc.iter(W + 'drawing')):
        if any(b.get(R_EMBED) in firme for b in d.iter(A_BLIP)):
            run = d.getparent()
            run.getparent().remove(run)

    t6 = B[6]
    riga_ciclo(t6, 1, ['{rev}', '{data}', '{descrizione}', '{collaborazione}', '{redatto}', '{verificato}', '{approvato}'],
               'revisioniCopertina', da_eliminare=[2, 3, 4, 5])
    r = righe(t6)
    cella(celle(atteso(r[-2], 'FILE NAME'))[0], 'FILE NAME: {nomeFile}')
    cella(celle(atteso(r[-1], 'REV'))[1], 'REV {revisioneCodice}')

    # --- Indice: le voci delle attività si rigenerano aggiornando i campi
    atteso(B[23], '6.1')
    atteso(B[40], '6.19')
    rimuovi(*B[23:41])
    sostituisci(atteso(B[20], '4.6'), '4.6', '4.3')

    # --- 1. Introduzione
    imposta_testo(atteso(B[47], 'In applicazione'), '{intro1}')
    imposta_testo(atteso(B[62], 'ECO-TER'), 'I sopralluoghi, la raccolta dei dati e l’elaborazione delle informazioni sono stati effettuati dalla {studioEsecutore}.')

    # --- 4.1 Ciclo lavorativo
    imposta_testo(atteso(B[249], 'La realizzazione della galleria'), '{testo}')
    imposta_testo(atteso(B[252], 'Scavo'), '{.}')
    B[249].addprevious(paragrafo_tag(B[249], '{#cicloBlocchi}'))
    B[252].addprevious(paragrafo_tag(B[249], '{#punti}'))
    chiusura = paragrafo_tag(B[249], '{/punti}')
    B[252].addnext(chiusura)
    chiusura.addnext(paragrafo_tag(B[249], '{/cicloBlocchi}'))
    rimuovi(B[250], B[251], *solo_contenuto(B[253:260]))

    # --- 4.2 Mansioni
    sostituisci(atteso(B[268], 'Mansioni impiegate'), 'Mansioni impiegate in galleria (avanzamento e rivestimenti)', 'Mansioni e gruppi omogenei per la valutazione')
    riga_ciclo(B[269], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')

    # --- 4.3 Attività con movimentazione manuale
    sostituisci(atteso(B[275], '4.6'), '4.6', '4.3')
    riga_ciclo(B[279], 1, ['{numero}', '{titolo}', '{sintesi}', '{mansioniTesto}'], 'elencoAttivita')

    # --- 5. Analisi dei dati acquisiti
    imposta_testo(atteso(B[285], 'Tra tutte le movimentazioni'), '{testoAnalisi}')

    # --- 6. Valutazione per attività: blocco ripetuto
    atteso(B[300], 'Valutazione del rischio per attività')
    titolo = copy.deepcopy(atteso(B[356], '6.3'))
    imposta_testo(titolo, '{numeroSezione} {titolo}')
    metodo = copy.deepcopy(atteso(B[357], 'Metodo di valutazione'))
    imposta_testo(metodo, 'Metodo di valutazione del rischio dell’attività: {metodoTesto}')
    descr = copy.deepcopy(atteso(B[360], 'montaggio a paramento'))
    tit_niosh = copy.deepcopy(atteso(B[368], 'INDICE DI SOLLEVAMENTO'))
    imposta_testo(tit_niosh, 'INDICE DI SOLLEVAMENTO CALCOLATO PER: {titoloMaiuscolo}')
    legato_al_successivo(tit_niosh)
    t_niosh = copy.deepcopy(B[369])
    tabella_niosh(t_niosh)
    tieni_insieme(t_niosh)
    intro_comp = copy.deepcopy(atteso(B[385], 'fattori moltiplicativi'))
    imposta_testo(intro_comp, 'Si riportano, nella tabella che segue, i fattori moltiplicativi dei singoli compiti e l’indice di sollevamento composto.')
    t_comp = copy.deepcopy(B[388])
    tabella_composto(t_comp)
    t_isc = copy.deepcopy(B[391])
    tabella_isc(t_isc)
    t_snook = copy.deepcopy(B[404])
    tabella_snook(t_snook)
    t_isnook = copy.deepcopy(B[406])
    tabella_indice_snook(t_isnook)
    esito_snook = copy.deepcopy(metodo)
    imposta_testo(esito_snook, 'Indice sintetico di rischio {indice}: {rischio}.')
    t_ocra = copy.deepcopy(B[507])
    tabella_ocra(t_ocra)
    vuoto = lambda: paragrafo_tag(B[389], '')  # noqa: E731
    tag = lambda s: paragrafo_tag(B[389], s)  # noqa: E731

    blocco = [tag('{#attivita}'), titolo, metodo]
    blocco += [tag('{#paragrafi}'), descr, tag('{/paragrafi}')]
    imposta_testo(descr, '{.}')
    blocco += [tag('{#isNiosh}'), tit_niosh, t_niosh, vuoto(), tag('{/isNiosh}')]
    blocco += [tag('{#isComposto}'), intro_comp, t_comp, vuoto(), t_isc, vuoto(), tag('{/isComposto}')]
    blocco += [tag('{#isSnook}'), t_snook, vuoto(), t_isnook, esito_snook, tag('{/isSnook}')]
    blocco += [tag('{#isOcra}'), t_ocra, vuoto(), tag('{/isOcra}')]
    blocco += [salto_pagina(B[389], 'nonUltima'), tag('{/attivita}')]
    # segnalibri copiati dal modello: nel ciclo sarebbero duplicati
    for e in blocco:
        for b in list(e.iter(W + 'bookmarkStart')) + list(e.iter(W + 'bookmarkEnd')):
            b.getparent().remove(b)
    ancora = B[300]
    for e in blocco:
        ancora.addnext(e)
        ancora = e
    atteso(B[591], '7. Analisi dei dati')
    rimuovi(*solo_contenuto(B[301:590]))

    # --- 7. Riepilogo per mansione
    t = B[593]
    rr = righe(t)
    doppio = copy.deepcopy(atteso(rr[6], 'Niosh'))
    singolo = copy.deepcopy(atteso(rr[15], 'snook'))
    non_esp = copy.deepcopy(atteso(rr[2], 'NON ESPOSTO'))
    for x in (doppio, singolo, non_esp):
        togli_vmerge(x)
    for tc, c in zip(celle(doppio), ['{#riepilogo}{#doppio}{numero}', '{mansione}', '{attivita}', '{metodo}', '{indiceAdulti}', '{indiceAnziani}', '{rischioAdulti}', '{rischioAnziani}{/doppio}']):
        cella(tc, c)
    for tc, c in zip(celle(singolo), ['{#singolo}{numero}', '{mansione}', '{attivita}', '{metodo}', '{indice}', '{rischio}{/singolo}']):
        cella(tc, c)
    for tc, c in zip(celle(non_esp), ['{#nonEsposto}{numero}', '{mansione}', 'NON ESPOSTO{/nonEsposto}{/riepilogo}']):
        cella(tc, c)
    for x in rr[2:]:
        rimuovi(x)
    t.append(doppio)
    t.append(singolo)
    t.append(non_esp)

    # --- 8. Conclusioni
    atteso(B[597], 'Dall’analisi della tabella')
    paragrafi_ciclo(B[597], 'conclusioni')
    rimuovi(B[598], B[599], B[600], B[601])

    # --- 9. Piano
    imposta_testo(atteso(B[607], 'Sulla base delle criticità'), '{testoPiano}')

    riga_ciclo(B[638], 1, ['{rev}', '{integrazione}', '{data}', '{descrizione}', '{redatto}', '{verificato}', '{approvato}'], 'revisioni')


def trasforma_piede(d):
    for p in d.iter(W + 'p'):
        s = testo(p).strip()
        if s == '00':
            imposta_testo(p, '{revisioneCodice}')
        elif s == '\\':
            imposta_testo(p, '{integrazioneTesto}')
        elif re.match(r'^(Luglio|Agosto)\s*2026$', s):
            imposta_testo(p, '{dataEmissioneTesto}')
        elif s.lower() == 'consorzio xenia':
            imposta_testo(p, '{impresa}')
        elif s in ('TBM 2', 'TBM2'):
            imposta_testo(p, '{denominazione}')
        elif s.startswith('DVR_MMC'):
            ts = list(p.iter(W + 't'))
            ts[0].text = '{nomeFile}'
            for t in ts[1:]:
                t.text = ''


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

    normalizza_loghi(lavoro, clienti={'media/image1.png', 'media/image14.png'}, da_eliminare=('image14.png',))

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
