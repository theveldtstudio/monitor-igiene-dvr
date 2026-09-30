#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Vibrazioni (docxtemplater) dal DVR modello
"DVR_Vibrazioni_XENIA_2026_TBM1_rev01_CORRETTO.docx" (cartella DVR/Modelli).

Uso:
    python3 tools/dvr/costruisci_template_vibrazioni.py <modello.docx> public/templates/dvr/vibrazioni.docx

Oltre ai tag e ai cicli, lo script corregge il modello:
- loghi di altri clienti nelle intestazioni (COCIV con collegamento, CTG) → logo del cliente;
- firme scansionate tolte dalla copertina;
- "arrotondati per eccesso" → arrotondamento al centesimo (è quello che fanno davvero le TAV);
- testi legati alla galleria resi validi anche per viadotti e opere all'aperto.
Lavora per posizione sugli elementi del modello e controlla il testo atteso a ogni passaggio.
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
    trasforma_piede,
)

A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
# Riquadro del logo cliente: 198,45 × 52,6 pt (come nel DVR Rumore)
LOGO_CX, LOGO_CY = 2520315, 668020


def e_pagina(p):
    return p.tag == W + 'p' and any(b.get(W + 'type') == 'page' for b in p.iter(W + 'br'))


def salto_condizionato(p):
    """Il salto pagina dopo una TAV vale solo se non è l'ultima."""
    run = next(b for b in p.iter(W + 'br') if b.get(W + 'type') == 'page').getparent()
    a = etree.Element(W + 'r')
    etree.SubElement(a, W + 't').text = '{#nonUltima}'
    c = etree.Element(W + 'r')
    etree.SubElement(c, W + 't').text = '{/nonUltima}'
    run.addprevious(a)
    run.addnext(c)


def tav(tbl, sotto_etichetta):
    rr = righe(tbl)
    cella(celle(rr[0])[0], '{titolo}')
    if len(celle(rr[0])) > 1:
        cella(celle(rr[0])[1], '')
    cs = celle(rr[2])
    cella(cs[0], '{#periodi}{minuti}')
    cella(cs[1], '{fase}')
    cella(cs[2], '{macchina}')
    cella(cs[3], '{a}')
    cella(celle(rr[3])[1], sotto_etichetta + ': {dettaglio}{/periodi}')
    fine = [r for r in rr if testo(r).startswith('A(8)')][0]
    i = rr.index(fine)
    for r in rr[4:i]:
        rimuovi(r)
    cella(celle(rr[i])[-1], '{a8}')
    cella(celle(rr[i + 1])[-1], '{esposizione}')
    cella(celle(rr[i + 2])[-1], '{azione}')
    cella(celle(rr[i + 3])[-1], '{limite}')


def ciclo_tav(B, i_tbl, fine_esclusa, nome, sotto_etichetta, nota=None):
    """B[i_tbl] è la prima TAV; tutto fino a fine_esclusa (escluso) viene sostituito dal ciclo."""
    tbl = B[i_tbl]
    tav(tbl, sotto_etichetta)
    j = i_tbl + 1
    while not e_pagina(B[j]):
        j += 1
    salto = B[j]
    salto_condizionato(salto)
    tbl.addprevious(paragrafo_tag(B[j], '{#%s}' % nome))
    if nota is not None:
        salto.addprevious(nota)
    salto.addnext(paragrafo_tag(B[j], '{/%s}' % nome))
    rimuovi(*[e for e in B[j + 1:fine_esclusa]])


def elenco_in_cella(tc, nome):
    """Paragrafi di una cella → ciclo {#nome}{.}{/nome} (una voce per paragrafo)."""
    ps = tc.findall(W + 'p')
    imposta_testo(ps[0], '{#%s}' % nome)
    imposta_testo(ps[1], '{.}')
    chiusura = copy.deepcopy(ps[1])
    imposta_testo(chiusura, '{/%s}' % nome)
    ps[1].addnext(chiusura)
    for p in ps[2:]:
        rimuovi(p)


def trasforma_documento(doc):
    body = doc.getroot().find(W + 'body')
    B = list(body)

    # --- Copertina
    t0 = B[0]
    ps = celle(righe(t0)[0])[1].findall(W + 'p')
    imposta_testo(atteso(ps[0], 'COMUNE DI'), 'COMUNE DI {comuneMaiuscolo}')
    imposta_testo(atteso(ps[1], 'PROVINCIA DI'), 'PROVINCIA DI {provinciaMaiuscolo}')
    imposta_testo(atteso(ps[3], 'LINEA FERROVIARIA'), '{operaMaiuscolo}')
    imposta_testo(atteso(ps[4], 'TBM'), '{denominazione}')
    ps = celle(righe(t0)[1])[0].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Caruso'), '{datoreLavoro}')
    imposta_testo(atteso(ps[3], 'Auria'), '{rspp}')
    imposta_testo(atteso(ps[5], 'Cioffi'), '{medicoCompetente}')
    imposta_testo(atteso(ps[7], 'Pellegrino'), '{#rls}')
    imposta_testo(atteso(ps[8], 'Parisi'), '{.}')
    imposta_testo(atteso(ps[9], 'Granato'), '{/rls}')

    r = righe(B[4])
    ps = celle(r[0])[0].findall(W + 'p')
    imposta_testo(atteso(ps[3], 'Periodo'), 'Periodo: {periodoRiferimento}')
    cella(celle(r[0])[3], '{integrazioneTesto}')
    cella(celle(r[1])[3], '{dataEmissioneTesto}')
    cella(celle(r[2])[3], '{redatto}')
    ps = celle(r[3])[1].findall(W + 'p')
    imposta_testo(atteso(ps[2], 'Società'), '{studioDescrizione}')
    ps = celle(r[3])[2].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Catano'), '{#gruppoLavoro}')
    imposta_testo(ps[2], '{.}')
    imposta_testo(ps[3], '{/gruppoLavoro}')
    rimuovi(ps[4])
    cella(celle(atteso(r[4], 'Verificato'))[5], '{verificato}')
    cella(celle(atteso(r[5], 'Approvato'))[5], '{approvato}')

    t6 = B[6]
    for d in list(t6.iter(W + 'drawing')):
        d.getparent().getparent().remove(d.getparent())
    riga_ciclo(t6, 4, ['{rev}', '{data}', '{descrizione}', '{collaborazione}', '{redatto}', '{verificato}', '{approvato}'],
               'revisioniCopertina', da_eliminare=[1, 2, 3])
    r = righe(t6)
    cella(celle(atteso(r[-2], 'FILE NAME'))[0], 'FILE NAME: {nomeFile}')
    cella(celle(atteso(r[-1], 'REV'))[1], 'REV {revisioneCodice}')

    # --- Introduzione e ciclo di lavoro
    imposta_testo(atteso(B[36], 'In applicazione'), '{intro1}')
    atteso(B[87], 'La realizzazione della galleria')
    imposta_testo(B[87], '{testo}')
    imposta_testo(atteso(B[90], 'Scavo'), '{.}')
    B[87].addprevious(paragrafo_tag(B[87], '{#cicloBlocchi}'))
    B[90].addprevious(paragrafo_tag(B[87], '{#punti}'))
    chiusura_punti = paragrafo_tag(B[87], '{/punti}')
    B[90].addnext(chiusura_punti)
    chiusura_punti.addnext(paragrafo_tag(B[87], '{/cicloBlocchi}'))
    rimuovi(B[88], B[89], *B[91:97])

    imposta_testo(atteso(B[105], 'Tabella 2'), 'Tabella {tabMansioni}. Mansioni e gruppi omogenei.')
    riga_ciclo(B[106], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')
    sostituisci(atteso(B[109], 'in galleria al momento'), 'in galleria al momento', 'in cantiere al momento')
    imposta_testo(atteso(B[110], 'Tabella 3'), 'Tabella {tabMacchine}. Principali mezzi presenti e utilizzati in cantiere.')
    riga_ciclo(B[111], 1, ['{tipologia}', '{marcaModello}', '{alimentazione}'], 'macchine')
    imposta_testo(atteso(B[113], 'Tabella 4'), 'Tabella {tabAttrezzature}. Attrezzature presenti e utilizzate in cantiere.')
    riga_ciclo(B[114], 1, ['{tipologia}', '{alimentazione}'], 'attrezzature')

    # --- Analisi preliminare
    imposta_testo(atteso(B[117], 'mano-braccio'), '{testoAnalisiHav}')
    # sorgenti di vibrazioni al corpo intero secondo gli ambiti (il modello elenca solo mezzi e sollevatori)
    imposta_testo(atteso(B[119], 'Macchine semoventi'), '{.}')
    B[119].addprevious(paragrafo_tag(B[119], '{#sorgentiWbv}'))
    B[119].addnext(paragrafo_tag(B[119], '{/sorgentiWbv}'))
    rimuovi(atteso(B[120], 'Sollevatori'))
    imposta_testo(atteso(B[129], 'Mansioni esposte'), 'Tabella {tabEsposte}. Mansioni esposte e non esposte a vibrazioni.')
    rr = righe(B[130])
    for tc, nome in zip(celle(rr[1]), ['esposteHav', 'esposteWbv', 'nonEsposte']):
        elenco_in_cella(tc, nome)

    # --- Strumentazione e incertezza
    imposta_testo(atteso(B[145], 'HVM'), '{.}')
    B[145].addprevious(paragrafo_tag(B[145], '{#strumenti}'))
    B[145].addnext(paragrafo_tag(B[145], '{/strumenti}'))
    rimuovi(B[146], B[147])
    sostituisci(atteso(B[157], 'per eccesso'), 'arrotondati per eccesso e corretti', 'arrotondati al centesimo e corretti')
    sostituisci(atteso(B[165], 'per eccesso'), 'approssimato per eccesso e corretto', 'arrotondato al centesimo e corretto')

    # --- Elaborazione dati
    imposta_testo(atteso(B[173], 'Dall’analisi'), '{testoElaborazione}')
    imposta_testo(atteso(B[176], 'corpo intero'), 'Tabella {tabValoriWbv}. Valori di accelerazione per il calcolo dell’esposizione – corpo intero (WBV).')
    riga_ciclo(B[177], 1, ['{macchina}', '{fase}', '{n}', '{valore}'], 'valoriWbv')
    imposta_testo(atteso(B[180], 'mano-braccio'), 'Tabella {tabValoriHav}. Valori di accelerazione per il calcolo dell’esposizione – sistema mano-braccio (HAV).')
    riga_ciclo(B[181], 1, ['{macchina}', '{dettaglio}', '{fase}', '{n}', '{valore}'], 'valoriHav')

    # --- Conclusioni
    imposta_testo(atteso(B[185], 'Dal calcolo'), '{conclusione1}')
    imposta_testo(atteso(B[186], 'Corpo intero'), '{conclusioneWbv}')
    imposta_testo(atteso(B[187], 'Mano-braccio'), '{conclusioneHav}')
    imposta_testo(atteso(B[190], 'restanti'), '{conclusioneFinale}')
    # Schemi riepilogativi: stessa struttura per le 8 tabelle (quella del modello a 199 è annidata)
    modello_schema = copy.deepcopy(B[217])
    for i, nome in ((194, 'hav0'), (199, 'hav1'), (205, 'hav2'), (211, 'hav3'), (217, 'wbv0'), (221, 'wbv1'), (232, 'wbv2'), (236, 'wbv3')):
        t = copy.deepcopy(modello_schema)
        B[i].addprevious(t)
        rimuovi(B[i])
        rr = righe(t)
        for r in rr[2:]:
            rimuovi(r)
        tc = celle(rr[1])[0]
        ps = tc.findall(W + 'p')
        for extra in ps[1:]:
            rimuovi(extra)
        # tabella a una colonna: il ciclo ripete i paragrafi dentro la cella (una riga per mansione)
        imposta_testo(ps[0], '{#%s}' % nome)
        voce = copy.deepcopy(ps[0])
        imposta_testo(voce, '{.}')
        fine = copy.deepcopy(ps[0])
        imposta_testo(fine, '{/%s}' % nome)
        ps[0].addnext(voce)
        voce.addnext(fine)

    # --- Piano di contenimento: testi validi anche fuori galleria
    imposta_testo(atteso(B[250], 'fondo della galleria'),
                  'Mantenere il più regolari possibile le piste di cantiere e, in galleria, il piano di scorrimento su cui si muovono i mezzi.')
    sostituisci(atteso(B[255], 'in galleria'), 'utilizzati in galleria', 'utilizzati in cantiere')

    riga_ciclo(B[263], 1, ['{rev}', '{integrazione}', '{data}', '{descrizione}', '{redatto}', '{verificato}', '{approvato}'], 'revisioni')

    # --- Allegato 1: TAV corpo intero e mano-braccio
    nota = copy.deepcopy(atteso(B[382], 'campagne precedenti'))
    imposta_testo(nota, '{#haStorici}*Misure ottenute da campagne precedenti in condizioni di lavoro simili.{/haStorici}')
    atteso(B[284], 'WBV - TAV 1')
    atteso(B[400], 'TABELLE RIASSUNTIVE')
    i_salto_hav = max(i for i in range(390, 400) if e_pagina(B[i]))
    ciclo_tav(B, 284, i_salto_hav, 'tavWbv', 'Regime', nota)
    atteso(B[411], 'HAV - TAV 1')
    atteso(B[506], 'ALLEGATO 2')
    i_salto_all2 = max(i for i in range(496, 506) if e_pagina(B[i]))
    nota_hav = copy.deepcopy(nota)
    ciclo_tav(B, 411, i_salto_all2, 'tavHav', 'Impugnatura', nota_hav)

    # --- Allegato 2: rapporti di prova
    for i, prefisso, colonne, nome in (
        (522, 'Wbv', ['{codice}', '{macchina}', '{matricola}', '{posizione}', '{trazione}', '{utensile}', '{fase}', '{dettaglio}', '{a}', '{asse}', '{note}', '{temperatura}'], 'rilieviWbv'),
        (526, 'Hav', ['{codice}', '{macchina}', '{matricola}', '{dettaglio}', '{alimentazione}', '{accessorio}', '{fase}', '{a}', '{note}', '{temperatura}'], 'rilieviHav'),
    ):
        t = B[i]
        rr = righe(t)
        cella(celle(atteso(rr[0], 'RAPPORTO'))[1], '{rapporto%s}' % prefisso)
        cs = celle(atteso(rr[2], 'Committente'))
        cella(cs[1], '{impresa}')
        cella([c for c in cs if 'Misure effettuate' in testo(c)][0], 'Misure effettuate nel periodo: {periodoRiferimento}')
        cs = celle(atteso(rr[4], 'Cantiere'))
        cella([c for c in cs if testo(c).strip() and 'Cantiere' not in testo(c)][0], '{cantiereRilievi}')
        riga_ciclo(t, 7, colonne, nome)
        t.addprevious(paragrafo_tag(B[521], '{#%sPresenti}' % nome))
        t.addnext(paragrafo_tag(B[521], '{/%sPresenti}' % nome))


def normalizza_loghi(lavoro: Path, clienti=None, da_eliminare=('image7.png', 'image10.png')):
    """Nelle intestazioni e in copertina ogni logo di cliente (Xenia, COCIV, CTG) diventa image1.png
    in un riquadro fisso e senza ritagli; si toglie il collegamento al sito COCIV."""
    if clienti is None:
        clienti = {'media/image1.png', 'media/image7.png', 'media/image10.png'}
    parti = [lavoro / 'word' / 'document.xml'] + sorted((lavoro / 'word').glob('header*.xml'))
    for parte in parti:
        rels_path = parte.parent / '_rels' / (parte.name + '.rels')
        if not rels_path.exists():
            continue
        rels = etree.parse(str(rels_path))
        rid_cliente = set()
        for rel in rels.getroot():
            if rel.get('Target') in clienti:
                rel.set('Target', 'media/image1.png')
                rid_cliente.add(rel.get('Id'))
            if rel.get('Type', '').endswith('/hyperlink') and 'cociv' in rel.get('Target', ''):
                rels.getroot().remove(rel)
        rels.write(str(rels_path), xml_declaration=True, encoding='UTF-8', standalone=True)
        if not rid_cliente:
            continue
        d = etree.parse(str(parte))
        for blip in d.iter('{%s}blip' % A_NS):
            if blip.get('{%s}embed' % R_NS) not in rid_cliente:
                continue
            contenitore = blip
            while contenitore is not None and contenitore.tag not in ('{%s}anchor' % WP_NS, '{%s}inline' % WP_NS):
                contenitore = contenitore.getparent()
            if contenitore is None:
                continue
            est = contenitore.find('{%s}extent' % WP_NS)
            est.set('cx', str(LOGO_CX))
            est.set('cy', str(LOGO_CY))
            for ext in contenitore.iter('{%s}ext' % A_NS):
                if ext.get('cx') is not None:
                    ext.set('cx', str(LOGO_CX))
                    ext.set('cy', str(LOGO_CY))
            for sr in contenitore.iter('{%s}srcRect' % A_NS):
                for k in list(sr.attrib):
                    del sr.attrib[k]
        for h in list(d.iter('{%s}hlinkClick' % A_NS)):
            h.getparent().remove(h)
        d.write(str(parte), xml_declaration=True, encoding='UTF-8', standalone=True)
    from PIL import Image
    Image.new('RGBA', (794, 210), (255, 255, 255, 0)).save(lavoro / 'word' / 'media' / 'image1.png')
    for f in da_eliminare:
        (lavoro / 'word' / 'media' / f).unlink(missing_ok=True)


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
        for p in d.iter(W + 'p'):
            s = testo(p).strip()
            if s == '/':
                imposta_testo(p, '{integrazioneTesto}')
            elif s == 'TBM 1':
                imposta_testo(p, '{denominazione}')
            elif re.match(r'^Luglio\s*20\s*2\s*6$', s):
                imposta_testo(p, '{dataEmissioneTesto}')
            elif 'DVR_Vibrazioni' in s:
                ts = list(p.iter(W + 't'))
                ts[0].text = '{nomeFile}'
                for t in ts[1:]:
                    t.text = ''
        d.write(str(piede), xml_declaration=True, encoding='UTF-8', standalone=True)

    normalizza_loghi(lavoro)

    # firme tolte: via anche file e relazioni non più usati dal documento
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
