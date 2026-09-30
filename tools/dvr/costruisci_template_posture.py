#!/usr/bin/env python3
"""
Costruisce il template Word del DVR Posture incongrue (docxtemplater) dal DVR modello
"2025_Posture Incongrue_Castagnola.docx" (cartella DVR/Modelli).

Uso:
    python3 tools/dvr/costruisci_template_posture.py <modello.docx> public/templates/dvr/posture.docx

Oltre ai tag e ai cicli, lo script corregge il modello:
- logo di un altro cliente (Pavimental) nell'intestazione → logo del cliente;
- firme scansionate tolte dalla copertina;
- Figura 2 (tabella ad entrata multipla) ricolorata secondo la tabella OWAS standard usata dal
  calcolo (nel modello 5 celle su 252 avevano un colore diverso);
- testi legati a CTG/Castagnola e alla sola galleria resi generali.
Le celle da unire in verticale (fase, attività) sono marcate dai dati: le unisce il generatore.
"""
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
from costruisci_template_vibrazioni import normalizza_loghi, salto_condizionato  # noqa: E402

RADICE = Path(__file__).resolve().parents[2]
R_EMBED = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed'
A_BLIP = '{http://schemas.openxmlformats.org/drawingml/2006/main}blip'
COLORI_CLASSE = {1: '33CC33', 2: 'FFFF00', 3: 'FFCC00', 4: 'FF6600'}


def tabella_owas():
    """Classi OWAS dalla stessa tabella usata dall'app (src/data/owasLookup.ts)."""
    s = (RADICE / 'src' / 'data' / 'owasLookup.ts').read_text(encoding='utf-8')
    t = {k: int(v) for k, v in re.findall(r"'(\d_\d_\d_\d)': (\d)", s)}
    assert len(t) == 252, len(t)
    return t


def solo_contenuto(els):
    """Paragrafi e tabelle (i segnalibri restano: chiudono quelli aperti altrove)."""
    return [e for e in els if e.tag in (W + 'p', W + 'tbl')]


def togli_vmerge(tr):
    for v in list(tr.iter(W + 'vMerge')):
        v.getparent().remove(v)


def paragrafi_ciclo(p, nome):
    """Il paragrafo p diventa {.} dentro il ciclo {#nome}…{/nome} (una voce per paragrafo)."""
    imposta_testo(p, '{.}')
    p.addprevious(paragrafo_tag(p, '{#%s}' % nome))
    p.addnext(paragrafo_tag(p, '{/%s}' % nome))


def trasforma_documento(doc):
    body = doc.getroot().find(W + 'body')
    B = list(body)

    # --- Copertina
    t0 = B[0]
    ps = celle(righe(t0)[0])[1].findall(W + 'p')
    imposta_testo(atteso(ps[0], 'COMUNE DI'), 'COMUNE DI {comuneMaiuscolo}')
    imposta_testo(atteso(ps[2], 'PROVINCIA DI'), 'PROVINCIA DI {provinciaMaiuscolo}')
    imposta_testo(atteso(ps[4], 'TERZO VALICO'), '{operaMaiuscolo}')
    imposta_testo(atteso(ps[6], 'CANTIERE'), 'CANTIERE {denominazioneMaiuscolo}')
    ps = celle(righe(t0)[1])[0].findall(W + 'p')
    imposta_testo(atteso(ps[1], 'Vizzin'), '{datoreLavoro}')
    imposta_testo(atteso(ps[3], 'Parolin'), '{rspp}')
    imposta_testo(atteso(ps[5], 'Lombroni'), '{medicoCompetente}')
    imposta_testo(atteso(ps[7], 'Gencarelli'), '{.}')
    ps[7].addprevious(paragrafo_tag(ps[7], '{#rls}'))
    ps[7].addnext(paragrafo_tag(ps[7], '{/rls}'))

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

    # firme scansionate (image3-5) in copertina
    firme = {'rId10', 'rId11', 'rId12'}
    for d in list(doc.iter(W + 'drawing')):
        if any(b.get(R_EMBED) in firme for b in d.iter(A_BLIP)):
            run = d.getparent()
            run.getparent().remove(run)
    t6 = B[6]
    riga_ciclo(t6, 1, ['{rev}', '{data}', '{descrizione}', '{collaborazione}', '{redatto}', '{verificato}', '{approvato}'],
               'revisioniCopertina', da_eliminare=[2, 3, 4])
    r = righe(t6)
    cella(celle(atteso(r[-1], 'FILE NAME'))[0], 'FILE NAME: {nomeFile}')

    # --- 1. Introduzione
    imposta_testo(atteso(B[18], 'In applicazione'), '{intro1}')
    imposta_testo(atteso(B[30], 'ECO-TER'), 'Il presente documento viene elaborato dalla {studioEsecutore}.')

    # --- 4.1 Organizzazione del cantiere: testo del ciclo di lavoro (modificabile nell'app)
    atteso(B[57], 'Per l’avanzamento delle gallerie')
    imposta_testo(B[57], '{testo}')
    imposta_testo(atteso(B[59], 'Perforazione'), '{.}')
    B[57].addprevious(paragrafo_tag(B[57], '{#cicloBlocchi}'))
    B[59].addprevious(paragrafo_tag(B[57], '{#punti}'))
    chiusura = paragrafo_tag(B[57], '{/punti}')
    B[59].addnext(chiusura)
    chiusura.addnext(paragrafo_tag(B[57], '{/cicloBlocchi}'))
    rimuovi(B[58], *solo_contenuto(B[60:84]))

    # --- 4.2 Mansioni
    atteso(B[86], 'gruppi o mansioni omogenei')
    rimuovi(*solo_contenuto(B[87:171]))
    imposta_testo(atteso(B[178], 'Tabella 1'), 'Tabella {tabMansioni}. Mansioni e gruppi omogenei per la valutazione.')
    riga_ciclo(B[180], 1, ['{numero}', '{nome}', '{attivita}'], 'mansioni')
    rimuovi(*solo_contenuto(B[181:190]))

    # --- 4.3–4.5 Medico competente, RSPP, RLS
    imposta_testo(atteso(B[192], 'Lombroni'), '{medicoCompetente}')
    imposta_testo(atteso(B[195], 'Parolin'), '{rspp}')
    paragrafi_ciclo(atteso(B[198], 'Gencarelli'), 'rls')

    # --- 5. Individuazione delle attività
    # i testi sulle operazioni ordinarie e sulle attività di servizio vanno prima delle tabelle
    sostituisci(atteso(B[241], 'in galleria vengono svolte'), 'in galleria vengono svolte', '{inLuogo} vengono svolte')
    imposta_testo(atteso(B[242], 'operazioni ordinarie in galleria'),
                  'Si tratta di tutte quelle attività che generalmente indichiamo come “operazioni ordinarie {inLuogo}” e che possono '
                  'essere {operazioniOrdinarie}.')
    sostituisci(atteso(B[246], 'in galleria e nei cantieri'), 'normalmente svolte in galleria e nei cantieri all’aperto', 'normalmente svolte {inLuogo}')
    ancora = atteso(B[206], 'Nelle tabelle che seguono')
    for e in (B[241], B[242], B[244], B[245], B[246], B[247]):
        ancora.addprevious(e)
    rif = B[209]
    imposta_testo(atteso(rif, 'Tabella 2'), 'Tabella {numero}. {titolo}.')
    t = B[210]
    togli_vmerge(righe(t)[1])
    riga_ciclo(t, 1, ['{fase}', '{attivita}', '{descrizione}', '{rischio}', '{mansioni}'], 'righe')
    rif.addprevious(paragrafo_tag(rif, '{#gruppiAttivita}'))
    vuoto = paragrafo_tag(B[207], '')
    t.addnext(vuoto)
    vuoto.addnext(paragrafo_tag(rif, '{/gruppiAttivita}'))
    rimuovi(*solo_contenuto(B[211:240]), *solo_contenuto(B[248:261]))

    # --- 6. Classificazione per singola attività
    ricolora_figura2(B[275])
    imposta_testo(atteso(B[278], 'con riferimento allo schema OWAS'),
                  'Per ogni attività individuata come potenzialmente a rischio dal punto di vista posturale, viene calcolata una classe '
                  'di rischio, con riferimento allo schema OWAS (Figura 1) ed alla tabella ad entrata multipla (Figura 2).')
    rif = B[280]
    imposta_testo(atteso(rif, 'Tabella 9'), 'Tabella {numero}. Valutazione del rischio – {titolo}.')
    t = B[281]
    rr = righe(t)
    atteso(rr[1], 'Schiena')
    a, b = rr[2], rr[3]
    ca, cb = celle(a), celle(b)
    for tc, c in zip(ca, ['{#posture}{fase}', '{attivita}', '{schienaTesto}', '{bracciaTesto}', '{gambeTesto}', '{caricoTesto}', '{classe}', '{mansioni}']):
        cella(tc, c)
    for tc, c in zip(cb, ['', '', '{schiena}', '{braccia}', '{gambe}', '{carico}', '', '{/posture}']):
        cella(tc, c)
    for r_ in rr[4:]:
        rimuovi(r_)
    rif.addprevious(paragrafo_tag(rif, '{#gruppiClassi}'))
    vuoto = paragrafo_tag(B[282], '')
    t.addnext(vuoto)
    vuoto.addnext(paragrafo_tag(rif, '{/gruppiClassi}'))
    rimuovi(*solo_contenuto(B[282:305]))
    sostituisci(atteso(B[306], 'operazioni ordinarie in galleria'), 'operazioni ordinarie in galleria', 'operazioni ordinarie {inLuogo}')
    rimuovi(*solo_contenuto(B[307:314]))

    # --- 7. Valutazione per mansione
    imposta_testo(atteso(B[334], 'Al fine di poter calcolare'), '{testoCalcoloMansioni}')
    imposta_testo(atteso(B[339], 'Tabella 17'), 'Tabella {tabRiepilogo}. Indice di rischio per mansione nella giornata maggiormente gravosa.')
    riga_ciclo(B[340], 1, ['{mansione}', '{f1}', '{f2}', '{f3}', '{f4}', '{indice}', '{tipo}'], 'riepilogo')
    ripeti_intestazione(B[340])
    rimuovi(*solo_contenuto(B[341:344]))

    # --- 8. Conclusioni
    imposta_testo(atteso(B[350], 'Tabella 18'), 'Tabella {tabClassificazione}. Classificazione del rischio.')
    imposta_testo(atteso(B[358], 'Tabella 19'), 'Tabella {tabTipi}. Tipo di rischio per mansione.')
    t = B[360]
    rr = righe(t)
    cs = celle(rr[1])
    cella(cs[0], '{#tipiRischio}{tipo}')
    ps = cs[1].findall(W + 'p')
    imposta_testo(ps[0], '{#mansioni}')
    imposta_testo(ps[1], '{.}')
    imposta_testo(ps[2], '{/mansioni}')
    rimuovi(*ps[3:])
    cella(cs[2], '{intervento}{/tipiRischio}')
    rimuovi(rr[2])
    for h in rr[1].iter(W + 'trHeight'):
        h.getparent().remove(h)
    atteso(B[363], 'Tutte le mansioni')
    paragrafi_ciclo(B[363], 'conclusioni')
    rimuovi(B[364], B[365], B[366])

    # --- 9. Piano di contenimento
    imposta_testo(atteso(B[369], 'Sulla base delle criticità'), '{testoPiano}')
    paragrafi_ciclo(atteso(B[370], 'formazione'), 'pianoPunti')
    rimuovi(B[371], B[372], B[373])

    # --- Allegato 1: una TAV per mansione, una tabella per giornata tipo
    titolo_tav = atteso(B[399], 'TAV 1')
    imposta_testo(titolo_tav, 'TAV {numero}: {nomeMaiuscolo}')
    titolo_tav.addprevious(paragrafo_tag(titolo_tav, '{#tav}'))
    titolo_g = atteso(B[401], 'Ciclo in avanzamento')
    imposta_testo(titolo_g, '{titolo}')
    titolo_g.addprevious(paragrafo_tag(titolo_g, '{#giornate}'))
    t = B[402]
    togli_vmerge(righe(t)[1])
    riga_ciclo(t, 1, ['{fase}', '{attivita}', '{minuti}', '{classe}'], 'righe')
    B[403].addnext(paragrafo_tag(titolo_g, '{/giornate}'))
    rimuovi(*solo_contenuto(B[404:413]))
    riga_ciclo(B[414], 1, ['{f1}', '{f2}', '{f3}', '{f4}', '{indice}'], 'riepilogo')
    fine = atteso(B[415], 'RISCHIO LIEVE')
    ts = [x for x in fine.iter(W + 't')]
    ts[0].text = 'RISCHIO {tipoMaiuscolo}'
    salto_condizionato(fine)
    fine.addnext(paragrafo_tag(titolo_tav, '{/tav}'))
    atteso(B[1089], 'TAV 61')
    rimuovi(*solo_contenuto(B[416:1098]))


def ripeti_intestazione(tbl):
    """La prima riga della tabella si ripete in cima a ogni pagina."""
    tr = righe(tbl)[0]
    trpr = tr.find(W + 'trPr')
    if trpr is None:
        trpr = etree.Element(W + 'trPr')
        tr.insert(1 if tr.find(W + 'tblPrEx') is not None else 0, trpr)
    if trpr.find(W + 'tblHeader') is None:
        etree.SubElement(trpr, W + 'tblHeader')


def ricolora_figura2(tbl):
    classi = tabella_owas()
    rr = righe(tbl)
    atteso(rr[0], 'SCHIENA')
    cambiate = 0
    for idx, r in enumerate(rr[2:23]):
        g, p = idx // 3 + 1, idx % 3 + 1
        valori = celle(r)[-12:]
        for k, tc in enumerate(valori):
            s, b = k // 3 + 1, k % 3 + 1
            shd = tc.find(W + 'tcPr/' + W + 'shd')
            colore = COLORI_CLASSE[classi[f'{s}_{b}_{g}_{p}']]
            if shd.get(W + 'fill') != colore:
                shd.set(W + 'fill', colore)
                cambiate += 1
    print('Figura 2: celle ricolorate', cambiate)


def trasforma_piede(d):
    for p in d.iter(W + 'p'):
        s = testo(p).strip()
        if s == '00':
            imposta_testo(p, '{revisioneCodice}')
        elif s == '04':
            imposta_testo(p, '{integrazioneTesto}')
        elif re.match(r'^(Gennaio|Dicembre)\s*20\s*2\s*[56]$', s):
            imposta_testo(p, '{dataEmissioneTesto}')
        elif s == 'CTG':
            imposta_testo(p, '{impresa}')
        elif s == 'Consorzio Tunnel Giovi':
            imposta_testo(p, '')
        elif s == 'Cantiere Castagnola':
            imposta_testo(p, 'Cantiere {denominazione}')
        elif s.endswith('.docx'):
            ts = list(p.iter(W + 't'))
            ts[0].text = '{nomeFile}'
            for t in ts[1:]:
                t.text = ''
            for x in list(p.iter(W + 'fldSimple')):
                x.getparent().remove(x)


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

    normalizza_loghi(lavoro, clienti={'media/image1.png', 'media/image6.jpeg'}, da_eliminare=('image6.jpeg',))

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
