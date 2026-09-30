#!/usr/bin/env python3
"""
Template Word "da zero" per i DVR senza documento modello: copertina, indice, intestazioni, piè di
pagina e stili del template CEM (public/templates/dvr/cem.docx), corpo scritto da una lista di
blocchi. Usato da costruisci_template_biologico.py e costruisci_template_acqua.py.

Blocchi (tuple):
    ('h1', testo[, nuova_pagina])   titolo di capitolo numerato
    ('h2', testo) / ('h3', testo)   titoli di paragrafo
    ('p', testo)                    paragrafo di testo (può contenere {tag})
    ('paragrafi', nome)             un paragrafo per ogni voce del ciclo `nome` ({.})
    ('elenco', nome)                elenco puntato dal ciclo `nome`
    ('punti', [testi])              elenco puntato fisso
    ('se', nome) / ('se_non', nome) / ('fine', nome)   condizioni docxtemplater
    ('tabella', didascalia, intestazioni, campi, ciclo, pesi)
    ('ciclo_lavoro',)               ciclo di lavoro a blocchi ({#cicloBlocchi}) come nel CEM
    ('mansioni',)                   tabella delle mansioni del CEM
    ('figure',)                     medico competente, RSPP e RLS del CEM
    ('piano',)                      piano di contenimento a voci e sotto-voci del CEM
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
from chimico_comune import W, didascalia, imposta_testo, paragrafo_tag, rimuovi, salti_in_interruzioni, testo  # noqa: E402
from costruisci_template_cem import clona, nuova_tabella  # noqa: E402
from costruisci_template_mmc import tieni_insieme  # noqa: E402

TITOLO_CEM = 'VALUTAZIONE DEL RISCHIO DI ESPOSIZIONE DEI LAVORATORI AI CAMPI ELETTROMAGNETICI'


def _trova(B, frammento, stile=None):
    for e in B:
        if frammento in testo(e):
            if stile is None or (e.find(W + 'pPr/' + W + 'pStyle') is not None and e.find(W + 'pPr/' + W + 'pStyle').get(W + 'val') == stile):
                return e
    raise SystemExit(f'Non trovato nel template CEM: {frammento!r}')


def _intervallo(B, da, a):
    i, j = B.index(da), B.index(a)
    return B[i:j + 1]


def costruisci(sorgente, uscita, oggetto, capo, titolo_piede, blocchi):
    lavoro = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(sorgente) as z:
        z.extractall(lavoro)
    doc_path = lavoro / 'word' / 'document.xml'
    doc = etree.parse(str(doc_path))
    body = doc.getroot().find(W + 'body')
    B = list(body)

    # copertina
    ps = list(B[4].iter(W + 'p'))
    imposta_testo(next(p for p in ps if 'campi elettromagnetici' in testo(p)), oggetto)
    imposta_testo(next(p for p in ps if 'Titolo VIII' in testo(p)), capo)

    # prototipi
    h1_pagina = _trova(B, 'Introduzione', 'Titolo1')
    h1 = _trova(B, 'Normativa di riferimento', 'Titolo1')
    h2 = _trova(B, 'Valori di azione e livelli di riferimento', 'Titolo2')
    h3 = _trova(B, 'Dati acquisiti dal cantiere')
    corpo = _trova(B, '{intro1}')
    voce = _trova(B, '{#normativa}').getnext()
    didasc = _trova(B, 'Valori di azione per i campi magnetici statici')
    proto = _trova(B, '{#sorgenti}')
    ciclo = [copy.deepcopy(e) for e in _intervallo(B, _trova(B, '{#cicloBlocchi}'), _trova(B, '{/cicloBlocchi}'))]
    mansioni = [copy.deepcopy(e) for e in _intervallo(B, _trova(B, 'Mansioni', 'Titolo2'), _trova(B, '{#mansioni}'))]
    mc = _trova(B, 'medico competente', 'Titolo2')
    figure = [copy.deepcopy(e) for e in _intervallo(B, mc, _trova(B[B.index(mc):], '{/rls}'))]
    piano = [copy.deepcopy(e) for e in _intervallo(B, _trova(B, '{#piano}'), _trova(B, '{/piano}'))]

    # corpo del CEM: dal primo titolo al paragrafo con la sezione finale (escluso)
    fine = next(e for e in B[B.index(h1_pagina):] if e.find(W + 'pPr/' + W + 'sectPr') is not None)
    ancora = h1_pagina.getprevious()
    rimuovi(*B[B.index(h1_pagina):B.index(fine)])

    def metti(*els):
        nonlocal ancora
        for e in els:
            ancora.addnext(e)
            ancora = e

    tag = lambda s: paragrafo_tag(corpo, s)  # noqa: E731
    for b in blocchi:
        tipo = b[0]
        if tipo == 'h1':
            metti(clona(h1_pagina if len(b) > 2 and b[2] else h1, b[1]))
        elif tipo == 'h2':
            metti(clona(h2, b[1]))
        elif tipo == 'h3':
            metti(clona(h3, b[1]))
        elif tipo == 'p':
            metti(clona(corpo, b[1]))
        elif tipo == 'paragrafi':
            metti(tag('{#%s}' % b[1]), clona(corpo, '{.}'), tag('{/%s}' % b[1]))
        elif tipo == 'elenco':
            metti(paragrafo_tag(voce, '{#%s}' % b[1]), clona(voce, '{.}'), paragrafo_tag(voce, '{/%s}' % b[1]))
        elif tipo == 'punti':
            metti(*[clona(voce, s) for s in b[1]])
        elif tipo == 'se':
            metti(tag('{#%s}' % b[1]))
        elif tipo == 'se_non':
            metti(tag('{^%s}' % b[1]))
        elif tipo == 'fine':
            metti(tag('{/%s}' % b[1]))
        elif tipo == 'tabella':
            _, cap, intest, campi, nome, pesi = b
            d = copy.deepcopy(didasc)
            didascalia(d, cap)
            t = nuova_tabella(proto, intest, campi, nome, pesi)
            tieni_insieme(t)
            metti(d, t)
        elif tipo == 'ciclo_lavoro':
            metti(*[copy.deepcopy(e) for e in ciclo])
        elif tipo == 'mansioni':
            metti(*[copy.deepcopy(e) for e in mansioni])
        elif tipo == 'figure':
            metti(*[copy.deepcopy(e) for e in figure])
        elif tipo == 'piano':
            metti(*[copy.deepcopy(e) for e in piano])
        else:
            raise SystemExit(f'Blocco sconosciuto: {tipo}')
    metti(clona(corpo, ''))

    salti_in_interruzioni(body)
    doc.write(str(doc_path), xml_declaration=True, encoding='UTF-8', standalone=True)
    for f in sorted((lavoro / 'word').glob('*.xml')):
        if re.match(r'(header|footer)\d+\.xml', f.name):
            s = f.read_text(encoding='utf-8')
            if TITOLO_CEM in s:
                f.write_text(s.replace(TITOLO_CEM, titolo_piede), encoding='utf-8')
    Path(uscita).parent.mkdir(parents=True, exist_ok=True)
    if Path(uscita).exists():
        Path(uscita).unlink()
    with zipfile.ZipFile(uscita, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(lavoro.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(lavoro).as_posix())
    shutil.rmtree(lavoro)
    print('Template scritto in', uscita)
