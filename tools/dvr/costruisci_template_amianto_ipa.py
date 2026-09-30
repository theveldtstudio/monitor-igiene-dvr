#!/usr/bin/env python3
"""
Costruisce i template Word dei DVR Amianto e IPA (docxtemplater). Non esistono DVR modello ECO-TER:
i due template partono da quello del DVR Agenti cancerogeni (stesso motore: ambienti con le misure,
esposizione per mansione sulle 8 ore, allegati con le misure e le TAV) e ne riscrivono testi,
intestazioni e colonne degli agenti:

    python3 tools/dvr/costruisci_template_amianto_ipa.py public/templates/dvr/cancerogeno.docx public/templates/dvr

Colonne degli agenti (chiavi di src/dvr/chimico/agenti.ts):
- amianto: fibre (fibre totali MOCF) e amianto (fibre di amianto SEM), la terza colonna si toglie;
- ipa: ipa_tot, bap, bapeq; nell'allegato 1 si aggiunge la colonna del BaP equivalente.
L'indice si rigenera all'apertura in Word.
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
from chimico_comune import W, cella, celle, didascalia, imposta_testo, paragrafi_cella, rimuovi, righe, testo  # noqa: E402
from costruisci_template_microclima import larghezze  # noqa: E402
from costruisci_template_mmc import solo_contenuto  # noqa: E402

PIEDE_CANCEROGENO = 'Documento di valutazione del rischio di esposizione dei lavoratori alla silice libera cristallina ed ai gas di scarico dei motori diesel'

TIPI = {
    'amianto': {
        'oggetto': 'Documento di valutazione del rischio di esposizione dei lavoratori all’amianto',
        'capo': '(D.lgs. 81/08 e s.m.i. – Titolo IX, capo III)',
        'intro': [
            'L’amianto è classificato cancerogeno per l’uomo (IARC gruppo 1). La protezione dei lavoratori è disciplinata dal Titolo IX, '
            'Capo III del D.Lgs. 81/08, che si applica a tutte le attività in cui i lavoratori possono essere esposti a fibre di amianto, '
            'comprese le attività di scavo in terreni e rocce che possono contenere amianto di origine naturale.',
            'La valutazione è stata effettuata confrontando l’esposizione media ponderata sulle 8 ore con il valore limite dell’art. 254 '
            'del D.Lgs. 81/08: 0,1 fibre per centimetro cubo di aria ({tlv_amianto} ff/L).',
            'Il livello di 10 ff/L sulle 8 ore individua le esposizioni sporadiche e di debole intensità (ESEDI, art. 249 c. 2), per le '
            'quali non si applicano la notifica, la sorveglianza sanitaria e il registro di esposizione, se anche la frequenza e la durata '
            'degli interventi rientrano nei criteri ESEDI.',
            'Le fibre aerodisperse totali (conteggio in microscopia ottica) sono riportate come indicatore della polverosità fibrosa '
            'dell’ambiente; l’esposizione ad amianto è valutata sulle fibre identificate in microscopia elettronica.',
        ],
        'metodo': 'Per effettuare la valutazione del rischio di esposizione dei lavoratori all’amianto, si è proceduto secondo i seguenti passi successivi:',
        'campionamento': 'Campionamento delle fibre aerodisperse e analisi in microscopia ottica (MOCF) ed elettronica (SEM);',
        'acquisizione': 'misure preventive adottate per limitare il rischio e l’esposizione dei lavoratori alle fibre di amianto.',
        'macchine': [
            'L’utilizzo di macchine e attrezzature (escavatori, frese, martelli demolitori, pale, autocarri, ecc.) su terreni, rocce o '
            'materiali che possono contenere amianto costituisce un elemento di pericolo per la dispersione di fibre nell’aria.',
            'Le cabine dei mezzi presenti in cantiere permettono di lavorare con i finestrini chiusi, proteggendo gli operatori dalle '
            'fibre aerodisperse.',
        ],
        'preventive': 'Al fine di contenere la dispersione di fibre e di limitare il più possibile l’esposizione dei lavoratori, vengono adottate le seguenti misure preventive:',
        'analisi_titolo': 'Determinazione delle fibre aerodisperse',
        'analisi': [
            'Le fibre raccolte su membrana sono conteggiate in microscopia ottica in contrasto di fase (MOCF) secondo il D.M. 6 settembre '
            '1994, allegato 2: il conteggio comprende tutte le fibre con lunghezza superiore a 5 µm, diametro inferiore a 3 µm e rapporto '
            'lunghezza/diametro superiore a 3, senza distinguerne la natura.',
            'Le fibre di amianto sono identificate e conteggiate in microscopia elettronica a scansione con microanalisi a dispersione di '
            'energia (SEM-EDS), che riconosce la composizione chimica delle singole fibre.',
        ],
        'rilevabilita': 'Quando sul filtro non sono individuate fibre di amianto, la concentrazione è calcolata con il limite di rilevabilità '
                        'del campione (numero minimo di fibre conteggiabili riportato sul volume d’aria campionato).',
        'didascalia_dati': 'Dati del monitoraggio delle fibre aerodisperse usati per il calcolo delle esposizioni.',
        # colonne delle tabelle dei dati e delle medie: (chiave, nome, unità) al posto di polveri_resp, silice, ec
        'colonne': [('fibre', 'fibre totali (MOCF)', '[ff/L]'), ('amianto', 'fibre di amianto (SEM)', '[ff/L]'), None],
        # colonne delle esposizioni, dei limiti e delle TAV: al posto di ec, silice
        'esposizione': [('amianto', 'Fibre di amianto', '[ff/L]'), ('fibre', 'Fibre totali', '[ff/L]')],
        'limite': 'Valore limite (art. 254)',
        'unita_esposizione': '[ff/L]',
        'conclusioni': 'In applicazione del Titolo IX, Capo III del D.Lgs. 81/08 e s.m.i., sono stati effettuati dei rilievi al fine di valutare '
                       'il rischio ed i livelli di esposizione alle fibre di amianto per i lavoratori operanti nel cantiere {denominazione}.',
        'piano': 'In relazione alle concentrazioni di fibre riscontrate e ai valori di esposizione dei lavoratori, si suggerisce di applicare '
                 'tutte le misure di seguito riportate, in ordine di priorità.',
        'allegato': 'Nelle tabelle seguenti sono riportate le sintesi delle misure di fibre aerodisperse eseguite{periodoNelTesto} presso il cantiere {denominazione}.',
        'allegato_titolo': 'SINTESI DEI RISULTATI DELLE MISURE DI FIBRE AERODISPERSE – CANTIERE {denominazioneMaiuscolo}',
        'allegato_tabella': 'Tabella misure fibre aerodisperse totali e fibre di amianto',
        'allegato_colonne': [('fibre', 'Fibre totali [ff/L]'), ('amianto', 'Fibre di amianto [ff/L]')],
    },
    'ipa': {
        'oggetto': 'Documento di valutazione del rischio di esposizione dei lavoratori agli idrocarburi policiclici aromatici (IPA)',
        'capo': '(D.lgs. 81/08 e s.m.i. – Titolo IX, capo II)',
        'intro': [
            'Gli idrocarburi policiclici aromatici (IPA) si formano nella combustione incompleta di sostanze organiche: nei cantieri le '
            'sorgenti principali sono i gas di scarico dei motori diesel e i fumi dei prodotti bituminosi e catramosi.',
            'Il benzo[a]pirene è classificato cancerogeno per l’uomo (IARC gruppo 1) ed è usato come marcatore degli IPA cancerogeni; i '
            'lavori che comportano esposizione a miscele di IPA, in particolare quelle contenenti benzo[a]pirene, sono nell’allegato XLII '
            'del D.Lgs. 81/08 (D.M. 11 febbraio 2021, recepimento della direttiva (UE) 2019/130).',
            'Il D.Lgs. 81/08 non fissa un valore limite di esposizione professionale per gli IPA: l’esposizione deve essere ridotta al '
            'livello più basso tecnicamente possibile (art. 235).',
            'Come riferimento si usa per il benzo[a]pirene la concentrazione di accettazione della TRGS 910 tedesca ({tlv_bap} ng/m³ sulle '
            '8 ore; concentrazione di tolleranza 700 ng/m³), applicata anche al benzo[a]pirene equivalente; il valore obiettivo per '
            'l’aria ambiente (1 ng/m³, D.Lgs. 155/2010) indica il fondo non professionale.',
        ],
        'metodo': 'Per effettuare la valutazione del rischio di esposizione dei lavoratori agli idrocarburi policiclici aromatici (IPA), si è proceduto secondo i seguenti passi successivi:',
        'campionamento': 'Campionamento della frazione particellare e della fase vapore e analisi degli IPA in laboratorio;',
        'acquisizione': 'misure preventive adottate per limitare il rischio e l’esposizione dei lavoratori agli IPA.',
        'macchine': [
            'L’utilizzo di macchine e attrezzature con motore diesel (escavatori, pale, autocarri, sollevatori, ecc.) e delle macchine '
            'per la stesa dei conglomerati bituminosi costituisce un elemento di pericolo per l’esposizione agli IPA.',
            'Le cabine dei mezzi presenti in cantiere sono dotate di aria condizionata con la possibilità di tenere chiusi i finestrini, '
            'con relativa protezione degli operatori dai gas di scarico.',
        ],
        'preventive': 'Al fine di contenere le concentrazioni di IPA e di limitare il più possibile l’esposizione dei lavoratori, vengono adottate le seguenti misure preventive:',
        'analisi_titolo': 'Determinazione degli IPA',
        'analisi': [
            'La membrana e la fiala sono estratte con solvente e analizzate per gascromatografia con spettrometria di massa (GC-MS) o per '
            'cromatografia liquida ad alta prestazione (HPLC) con rivelatore a fluorescenza; sono determinati gli IPA prioritari, tra cui '
            'il benzo[a]pirene. La concentrazione si ottiene dividendo la massa di ciascun IPA per il volume d’aria campionato.',
            'Il benzo[a]pirene equivalente è la somma delle concentrazioni dei singoli IPA moltiplicate per i fattori di tossicità '
            'equivalente (TEF) di Nisbet e LaGoy (1992), che attribuiscono al benzo[a]pirene il valore 1.',
        ],
        'rilevabilita': 'Per gli IPA inferiori al limite di rilevabilità del metodo è usata la concentrazione corrispondente al limite di '
                        'rilevabilità, riportato sul volume d’aria campionato.',
        'didascalia_dati': 'Dati del monitoraggio degli IPA usati per il calcolo delle esposizioni.',
        'colonne': [('ipa_tot', 'IPA totali', '[ng/m³]'), ('bap', 'benzo[a]pirene', '[ng/m³]'), ('bapeq', 'BaP equivalente', '[ng/m³]')],
        'esposizione': [('bap', 'Benzo[a]pirene', '[ng/m³]'), ('bapeq', 'BaP equivalente', '[ng/m³]')],
        'limite': 'Valore di riferimento (TRGS 910)',
        'unita_esposizione': '[ng/m³]',
        'conclusioni': 'In applicazione del Titolo IX, Capo II del D.Lgs. 81/08 e s.m.i., sono stati effettuati dei rilievi al fine di valutare '
                       'il rischio ed i livelli di esposizione agli idrocarburi policiclici aromatici (IPA) per i lavoratori operanti nel '
                       'cantiere {denominazione}.',
        'piano': 'In relazione alle concentrazioni di IPA riscontrate e ai valori di esposizione dei lavoratori, si suggerisce di applicare '
                 'tutte le misure di seguito riportate, in ordine di priorità.',
        'allegato': 'Nelle tabelle seguenti sono riportate le sintesi delle misure di IPA eseguite{periodoNelTesto} presso il cantiere {denominazione}.',
        'allegato_titolo': 'SINTESI DEI RISULTATI DELLE MISURE DI IPA – CANTIERE {denominazioneMaiuscolo}',
        'allegato_tabella': 'Tabella misure IPA',
        'allegato_colonne': [('ipa_tot', 'IPA totali [ng/m³]'), ('bap', 'Benzo[a]pirene [ng/m³]'), ('bapeq', 'BaP eq. [ng/m³]')],
    },
}


# ---------------------------------------------------------------- utilità
def trova(B, frammento, da=0):
    for i in range(da, len(B)):
        if B[i].getparent() is not None and frammento in testo(B[i]):
            return i
    raise SystemExit(f'Non trovato: {frammento!r}')


def span(tc):
    gs = tc.find(W + 'tcPr/' + W + 'gridSpan')
    return int(gs.get(W + 'val')) if gs is not None else 1


def cella_colonna(tr, col):
    pos = 0
    for tc in celle(tr):
        n = span(tc)
        if pos <= col < pos + n:
            return tc, n
        pos += n
    return None, 0


def togli_colonna(t, col):
    """Toglie la colonna `col` della griglia (le celle unite in orizzontale si restringono)."""
    for tr in righe(t):
        tc, n = cella_colonna(tr, col)
        if tc is None:
            continue
        if n > 1:
            gs = tc.find(W + 'tcPr/' + W + 'gridSpan')
            if n == 2:
                gs.getparent().remove(gs)
            else:
                gs.set(W + 'val', str(n - 1))
        else:
            tr.remove(tc)
    griglia = t.find(W + 'tblGrid')
    griglia.remove(griglia.findall(W + 'gridCol')[col])


def aggiungi_colonna(t, col):
    """Duplica la colonna `col` (la copia viene subito dopo)."""
    for tr in righe(t):
        tc, n = cella_colonna(tr, col)
        if tc is None:
            continue
        if n > 1:
            tc.find(W + 'tcPr/' + W + 'gridSpan').set(W + 'val', str(n + 1))
        else:
            tc.addnext(copy.deepcopy(tc))
    g = t.find(W + 'tblGrid').findall(W + 'gridCol')[col]
    g.addnext(copy.deepcopy(g))


# ---------------------------------------------------------------- documento
def trasforma(doc, c):
    body = doc.getroot().find(W + 'body')
    B = list(body)

    # copertina
    ps = list(B[4].iter(W + 'p'))
    imposta_testo(next(p for p in ps if 'silice libera cristallina' in testo(p)), c['oggetto'])
    imposta_testo(next(p for p in ps if 'Titolo IX, capo' in testo(p)), c['capo'])

    # indice: si rigenera in Word
    toc = B[11]
    for h in toc.findall(W + 'hyperlink'):
        toc.remove(h)
    r = etree.SubElement(toc, W + 'r')
    etree.SubElement(r, W + 't').text = 'Indice da aggiornare: in Word fare clic sull’indice e premere F9.'
    rimuovi(*B[12:39])

    # introduzione (quattro paragrafi del modello: silice, carbonio, definizione, limiti)
    i = trova(B, 'direttiva (UE) 2017/2398')
    for p, s in zip(B[i:i + 4], c['intro']):
        imposta_testo(p, s)

    imposta_testo(B[trova(B, 'Per effettuare la valutazione')], c['metodo'])
    imposta_testo(B[trova(B, 'Campionamento ed analisi della silice')], c['campionamento'])
    imposta_testo(B[trova(B, 'misure preventive adottate per limitare')], c['acquisizione'])
    i = trova(B, 'costituisce un elemento di pericolo')
    imposta_testo(B[i], c['macchine'][0])
    imposta_testo(B[i + 1], c['macchine'][1])
    imposta_testo(B[trova(B, 'Al fine di contenere')], c['preventive'])

    # determinazioni di laboratorio
    i = trova(B, 'Determinazione quantitativa della silice')
    imposta_testo(B[i], c['analisi_titolo'])
    imposta_testo(B[i + 1], c['analisi'][0])
    imposta_testo(B[i + 2], c['analisi'][1])
    j = trova(B, 'Limiti di rilevabilità strumentali', i)
    rimuovi(*solo_contenuto(B[i + 3:j]))
    imposta_testo(B[j + 1], c['rilevabilita'])

    # dati rilevati e medie per ambiente
    didascalia(B[trova(B, 'Dati del monitoraggio delle polveri')], c['didascalia_dati'])
    agenti = ['polveri_resp', 'silice', 'ec']
    t = B[trova(B, 'Fronte su cui è stata')]
    for k, col in enumerate(c['colonne']):
        if col is None:
            continue
        chiave, nome, unita = col
        paragrafi_cella(celle(righe(t)[0])[3 + k], ['Concentrazione di ' + nome, unita])
        paragrafi_cella(celle(righe(t)[0])[6 + k], ['Media delle concentrazioni di ' + nome, unita])
    dati = [tc for tc in celle(righe(t)[1])]
    for k, col in enumerate(c['colonne']):
        if col is None:
            continue
        for base, pref in ((3, 'c'), (6, 'm')):
            s = testo(dati[base + k]).replace('{%s_%s}' % (pref, agenti[k]), '{%s_%s}' % (pref, col[0]))
            cella(dati[base + k], s)
    t_medie = B[trova(B, 'Cantiere {denominazione}Media')]
    for k, col in enumerate(c['colonne']):
        if col is None:
            continue
        paragrafi_cella(celle(righe(t_medie)[1])[1 + k], ['Media delle concentrazioni di ' + col[1], col[2]])
        tc = celle(righe(t_medie)[2])[1 + k]
        cella(tc, testo(tc).replace('{m_%s}' % agenti[k], '{m_%s}' % col[0]))
    if c['colonne'][2] is None:
        # la chiusura del ciclo passa alla colonna precedente
        for tabella, riga in ((t, 1), (t_medie, 2)):
            cs = celle(righe(tabella)[riga])
            cella(cs[-2], testo(cs[-2]) + testo(cs[-1]).replace('{m_ec}', ''))
        togli_colonna(t, 8)
        togli_colonna(t, 5)
        larghezze(t, [22, 14, 10, 13, 13, 14, 14])
        togli_colonna(t_medie, 3)
        larghezze(t_medie, [40, 30, 30])

    # esposizione per mansione: colonne ec e silice
    (a1, n1, u1), (a2, n2, u2) = c['esposizione']
    t = B[trova(B, 'Limite TLV-TWA')]
    cella(celle(righe(t)[0])[0], c['limite'])
    paragrafi_cella(celle(righe(t)[1])[0], [n1, u1])
    paragrafi_cella(celle(righe(t)[1])[1], [n2, u2])
    cella(celle(righe(t)[2])[0], '{tlv_%s}' % a1)
    cella(celle(righe(t)[2])[1], '{tlv_%s}' % a2)
    t = B[trova(B, 'MANSIONIESPOSIZIONE')]
    for tc in celle(righe(t)[0])[1:]:
        paragrafi_cella(tc, ['ESPOSIZIONE', c['unita_esposizione']])
    cella(celle(righe(t)[1])[1], n1)
    cella(celle(righe(t)[1])[2], n2)
    cs = celle(righe(t)[2])
    cella(cs[2], '{t_%s}' % a1)
    cella(cs[3], '{t_%s}{/esposizioni}' % a2)

    # conclusioni e piano
    imposta_testo(B[trova(B, 'sono stati effettuati dei rilievi al fine di valutare')], c['conclusioni'])
    imposta_testo(B[trova(B, 'si suggerisce di applicare tutte le misure')], c['piano'])

    # allegato 1
    imposta_testo(B[trova(B, 'Nelle tabelle seguenti sono riportate le sintesi')], c['allegato'])
    cella(celle(righe(B[trova(B, 'SINTESI DEI RISULTATI')])[0])[0], c['allegato_titolo'])
    imposta_testo(B[trova(B, 'Tabella misure Polveri')], c['allegato_tabella'])
    t = B[trova(B, '{#allegatoPolveri}')]
    if len(c['allegato_colonne']) == 3:
        aggiungi_colonna(t, 7)
    for k, (chiave, titolo) in enumerate(c['allegato_colonne']):
        cella(celle(righe(t)[0])[6 + k], titolo)
        s = '{c_%s}' % chiave + ('{/allegatoPolveri}' if k == len(c['allegato_colonne']) - 1 else '')
        cella(celle(righe(t)[1])[6 + k], s)
    larghezze(t, [9, 15, 18, 15, 8, 14] + [21 // len(c['allegato_colonne'])] * len(c['allegato_colonne']))
    # tabella del carbonio elementare: non serve
    i = trova(B, '{#conEc}')
    j = trova(B, '{/conEc}', i)
    rimuovi(*B[i:j + 1])
    i = trova(B, 'Per alcune lavorazioni non è stato possibile misurare')
    imposta_testo(B[i], 'Per alcune lavorazioni non è stato possibile misurare le concentrazioni nel corso di questa campagna. Per il calcolo '
                        'dell’esposizione sono stati utilizzati i dati della campagna precedente, contrassegnati da un asterisco.')

    # allegato 2: TAV
    t = B[trova(B, 'TAV. {numero}')]
    rr = righe(t)
    cs = celle(rr[2])
    paragrafi_cella(cs[2], [f'{n1} {u1}'])
    paragrafi_cella(cs[3], [f'{n2} {u2}'])
    cs = celle(rr[3])
    cella(cs[2], '{v_%s}' % a1)
    cella(cs[3], '{v_%s}' % a2)
    cs = celle(rr[5])
    cella(cs[2], '{tot_%s}' % a1)
    cella(cs[3], '{tot_%s}' % a2)
    cs = celle(rr[6])
    cella(cs[0], c['limite'].upper())
    cella(cs[2], '{tlv_%s}' % a1)
    cella(cs[3], '{tlv_%s}' % a2)


def main():
    sorgente, cartella = sys.argv[1], Path(sys.argv[2])
    for nome, c in TIPI.items():
        lavoro = Path(tempfile.mkdtemp())
        with zipfile.ZipFile(sorgente) as z:
            z.extractall(lavoro)
        doc_path = lavoro / 'word' / 'document.xml'
        doc = etree.parse(str(doc_path))
        trasforma(doc, c)
        doc.write(str(doc_path), xml_declaration=True, encoding='UTF-8', standalone=True)
        for f in sorted((lavoro / 'word').glob('*.xml')):
            if re.match(r'(header|footer)\d+\.xml', f.name):
                s = f.read_text(encoding='utf-8')
                if PIEDE_CANCEROGENO in s:
                    f.write_text(s.replace(PIEDE_CANCEROGENO, c['oggetto']), encoding='utf-8')
        uscita = cartella / f'{nome}.docx'
        if uscita.exists():
            uscita.unlink()
        with zipfile.ZipFile(uscita, 'w', zipfile.ZIP_DEFLATED) as z:
            for f in sorted(lavoro.rglob('*')):
                if f.is_file():
                    z.write(f, f.relative_to(lavoro).as_posix())
        shutil.rmtree(lavoro)
        print('Template scritto in', uscita)


if __name__ == '__main__':
    main()
