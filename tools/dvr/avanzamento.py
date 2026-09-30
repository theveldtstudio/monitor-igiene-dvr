#!/usr/bin/env python3
"""
Tempi per metro lineare di avanzamento (scavo tradizionale, come nei DVR Castagnola): dopo il ciclo di
lavoro ({/cicloBlocchi}) si aggiunge, sotto la condizione {#conAvanzamento}, un paragrafo, la tabella
dei tempi medi per fase (esplosivo / martellone) e l'elenco dei metri scavati nel periodo.

Ogni costruttore di template chiama aggiungi_avanzamento(uscita) alla fine; l'operazione è
idempotente. I costruttori che partono da un altro template (CEM da ROA) tolgono prima il blocco con
togli_avanzamento(body), perché lavorano sugli indici dei paragrafi.

    python3 tools/dvr/avanzamento.py public/templates/dvr/*.docx
"""
import copy
import sys
import zipfile
from pathlib import Path

from lxml import etree

sys.path.insert(0, str(Path(__file__).parent))
from chimico_comune import W, celle, didascalia, imposta_testo, paragrafo_tag, righe, testo  # noqa: E402

INIZIO, FINE = '{#conAvanzamento}', '{/conAvanzamento}'
DIDASCALIA = 'Tempi medi delle operazioni per metro lineare di avanzamento.'


def togli_avanzamento(body):
    """Toglie il blocco dei tempi per metro lineare (se c'è)."""
    els = list(body)
    inizio = next((i for i, e in enumerate(els) if testo(e).strip() == INIZIO), None)
    if inizio is None:
        return
    fine = next(i for i in range(inizio, len(els)) if testo(els[i]).strip() == FINE)
    for e in els[inizio:fine + 1]:
        body.remove(e)


def _prototipo(els, da):
    """Prima tabella dopo il ciclo con almeno due righe di almeno due celle, e la sua didascalia."""
    for i in range(da, len(els)):
        t = els[i]
        if t.tag != W + 'tbl':
            continue
        rr = righe(t)
        if len(rr) >= 2 and len(celle(rr[0])) >= 2 and len(celle(rr[1])) >= 2:
            vicini = [els[j] for j in range(i - 1, max(da, i - 4), -1) if els[j].tag == W + 'p']
            stile = lambda p: (p.find(W + 'pPr/' + W + 'pStyle').get(W + 'val') if p.find(W + 'pPr/' + W + 'pStyle') is not None else '')  # noqa: E731
            cap = next((p for p in vicini if testo(p).strip().startswith('Tabella')), None)
            if cap is None:
                cap = next((p for p in vicini if stile(p).lower().startswith('didascalia')), None)
            return t, cap
    raise SystemExit('Nessuna tabella da usare come modello dopo il ciclo di lavoro')


def _tabella(proto):
    from costruisci_template_cem import nuova_tabella  # import tardivo: il modulo CEM importa questo
    return nuova_tabella(proto, ['Fase lavorativa', 'Avanzamento con esplosivo – tempi per metro lineare (min)', 'Avanzamento con martellone – tempi per metro lineare (min)'],
                         ['{fase}', '{esplosivo}', '{martellone}'], 'avanzamento', [40, 30, 30])


def inserisci(body):
    els = list(body)
    if any(testo(e).strip() == INIZIO for e in els):
        return False
    i = next(i for i, e in enumerate(els) if testo(e).strip() == '{/cicloBlocchi}')
    fine_ciclo = els[i]
    corpo = next((e for e in els[:i] if testo(e).strip() == '{testo}'), fine_ciclo)
    proto, cap = _prototipo(els, i + 1)

    def par(s):
        p = copy.deepcopy(corpo)
        for x in p.findall(W + 'pPr/' + W + 'sectPr'):
            x.getparent().remove(x)
        imposta_testo(p, s)
        return p

    nuovi = [paragrafo_tag(corpo, INIZIO), par('{avanzamentoTesto}')]
    if cap is not None:
        d = copy.deepcopy(cap)
        for x in d.findall(W + 'pPr/' + W + 'sectPr') + d.findall(W + 'pPr/' + W + 'pageBreakBefore'):
            x.getparent().remove(x)
        for br in list(d.iter(W + 'br')):
            if br.get(W + 'type') == 'page':
                br.getparent().remove(br)
        if 'SEQ' in etree.tostring(cap, encoding='unicode'):
            didascalia(d, DIDASCALIA[:-1])
        else:
            imposta_testo(d, DIDASCALIA)
        nuovi.append(d)
    t = _tabella(proto)
    nuovi += [t, paragrafo_tag(corpo, '{#conProduzione}'), par('{produzioneTesto}'), paragrafo_tag(corpo, '{#produzione}'), par('{.}'),
              paragrafo_tag(corpo, '{/produzione}'), paragrafo_tag(corpo, '{/conProduzione}'), paragrafo_tag(corpo, FINE)]
    a = fine_ciclo
    for e in nuovi:
        a.addnext(e)
        a = e
    return True


def aggiungi_avanzamento(percorso):
    percorso = Path(percorso)
    with zipfile.ZipFile(percorso) as z:
        voci = [(i, z.read(i.filename)) for i in z.infolist()]
    xml = dict((i.filename, b) for i, b in voci)['word/document.xml']
    doc = etree.fromstring(xml)
    if not inserisci(doc.find(W + 'body')):
        return
    nuovo = etree.tostring(doc, xml_declaration=True, encoding='UTF-8', standalone=True)
    tmp = percorso.with_suffix('.tmp')
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
        for info, dati in voci:
            z.writestr(info, nuovo if info.filename == 'word/document.xml' else dati)
    tmp.replace(percorso)


if __name__ == '__main__':
    for f in sys.argv[1:]:
        aggiungi_avanzamento(f)
        print('Tempi per metro lineare in', f)
