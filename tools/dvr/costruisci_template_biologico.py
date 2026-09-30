#!/usr/bin/env python3
"""
Template Word del DVR Agenti biologici (Titolo X D.Lgs. 81/08). Non esiste un DVR modello ECO-TER:
il documento è scritto da zero sullo scheletro del template CEM (vedi scheletro.py):

    python3 tools/dvr/costruisci_template_biologico.py public/templates/dvr/cem.docx public/templates/dvr/biologico.docx
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from scheletro import costruisci  # noqa: E402

BLOCCHI = [
    ('h1', 'Introduzione', True),
    ('p', '{intro1}'),
    ('p', 'La valutazione ha l’obiettivo di individuare gli agenti biologici a cui i lavoratori possono essere esposti durante le '
          'lavorazioni, di stimare il rischio per ciascuna mansione e di definire le misure di prevenzione e protezione, le '
          'vaccinazioni e la sorveglianza sanitaria.'),
    ('p', 'Il presente elaborato è redatto dalla {studioEsecutore}.'),
    ('p', 'Lo studio ha validità nelle condizioni riscontrate al momento dell’indagine e descritte nel documento; eventuali modifiche '
          'successive, relative all’organizzazione del lavoro, ai luoghi e agli impianti, saranno valutate secondo il programma di '
          'igiene del lavoro.'),
    ('p', 'Il presente documento è integrativo al POS dell’Impresa per questo cantiere. I risultati e i metodi di valutazione verranno '
          'condivisi con il medico competente e con il rappresentante dei lavoratori per la sicurezza.'),
    ('h1', 'Normativa di riferimento'),
    ('p', 'L’indagine è stata condotta sulla base di riferimenti normativi e norme di buona tecnica, in particolare:'),
    ('elenco', 'normativa'),
    ('h1', 'Agenti biologici', True),
    ('paragrafi', 'caratteristiche'),
    ('tabella', 'Classificazione degli agenti biologici (art. 268 D.Lgs. 81/08).', ['Gruppo', 'Caratteristiche'], ['{gruppo}', '{descrizione}'], 'gruppi', [15, 85]),
    ('h1', 'Metodologia'),
    ('p', 'Al fine di effettuare la valutazione del rischio si è proceduto secondo i seguenti passi:'),
    ('elenco', 'metodologia'),
    ('h2', 'Stima del rischio'),
    ('p', 'Per ogni agente l’indice di rischio R è il prodotto della probabilità di esposizione P (da 1 a 4) per il danno D (da 1 a 4). '
          'L’indice è classificato come segue.'),
    ('tabella', 'Classi di rischio.', ['Indice R = P × D', 'Classe di rischio', 'Azioni'], ['{r}', '{classe}', '{azioni}'], 'classi', [20, 20, 60]),
    ('h2', 'Misura della carica microbica dell’aria'),
    ('paragrafi', 'campionamento'),
    ('tabella', 'Categorie indicative della carica microbica dell’aria negli ambienti non industriali (ECA, report n. 12, 1993), UFC/m³.',
     ['Categoria', 'Batteri', 'Muffe e lieviti'], ['{categoria}', '{batteri}', '{funghi}'], 'categorieAria', [34, 33, 33]),
    ('h1', 'Acquisizione dati', True),
    ('h2', 'Organizzazione delle attività lavorative'),
    ('ciclo_lavoro',),
    ('mansioni',),
    ('figure',),
    ('h2', 'Misure preventive adottate'),
    ('p', 'Nel cantiere sono adottate le seguenti misure:'),
    ('elenco', 'misurePreventive'),
    ('h1', 'Agenti biologici potenziali', True),
    ('p', 'Sulla base delle lavorazioni, dei luoghi di lavoro e dei dati di letteratura sono stati individuati gli agenti biologici a cui i '
          'lavoratori possono essere esposti, riportati nella tabella seguente.'),
    ('tabella', 'Agenti biologici potenziali, vie di trasmissione e mansioni esposte.',
     ['N°', 'Agente', 'Gruppo', 'Malattia', 'Trasmissione', 'Attività', 'Mansioni'],
     ['{numero}', '{nome}', '{gruppo}', '{malattia}', '{trasmissione}', '{attivita}', '{mansioni}'], 'agenti', [5, 17, 8, 13, 22, 20, 15]),
    ('h1', 'Valutazione del rischio'),
    ('p', 'Per ogni agente sono riportati la probabilità, il danno, l’indice di rischio, la classe e il vaccino disponibile.'),
    ('tabella', 'Valutazione del rischio per agente.', ['N°', 'Agente', 'P', 'D', 'R', 'Classe', 'Vaccino'],
     ['{numero}', '{nome}', '{p}', '{d}', '{r}', '{classe}', '{vaccino}'], 'valutazioni', [5, 30, 6, 6, 6, 14, 33]),
    ('h1', 'Carica microbica dell’aria'),
    ('se', 'conMisure'),
    ('p', 'Nella tabella seguente sono riportati i risultati delle misure eseguite con il campionatore SAS.'),
    ('tabella', 'Carica microbica dell’aria (UFC/m³).', ['N°', 'Postazione', 'Fase', 'Data', 'Batteri 22 °C', 'Batteri 36 °C', 'Muffe e lieviti'],
     ['{numero}', '{postazione}', '{fase}', '{data}', '{c22}', '{c36}', '{muffe}'], 'misure', [5, 22, 22, 11, 13, 13, 14]),
    ('tabella', 'Categorie della carica microbica (ECA, 1993).', ['N°', 'Postazione', 'Batteri 22 °C', 'Batteri 36 °C', 'Muffe e lieviti'],
     ['{numero}', '{postazione}', '{c22}', '{c36}', '{muffe}'], 'classiMisure', [6, 34, 20, 20, 20]),
    ('fine', 'conMisure'),
    ('se_non', 'conMisure'),
    ('p', 'Nel periodo di riferimento non sono state eseguite misure della carica microbica dell’aria.'),
    ('fine', 'conMisure'),
    ('h1', 'Esposizione per mansione'),
    ('se', 'conMansioni'),
    ('p', 'Per ogni mansione si riportano gli agenti biologici a cui può essere esposta e la classe di rischio più alta.'),
    ('tabella', 'Esposizione agli agenti biologici per mansione.', ['Mansione', 'Agenti (classe di rischio)', 'Classe'],
     ['{nome}', '{agenti}', '{classe}'], 'esitiMansioni', [28, 54, 18]),
    ('fine', 'conMansioni'),
    ('h1', 'Vaccinazioni e sorveglianza sanitaria'),
    ('paragrafi', 'sorveglianza'),
    ('h1', 'Conclusioni', True),
    ('p', 'Sulla base delle valutazioni fatte all’interno del documento, si può concludere che:'),
    ('elenco', 'conclusioni'),
    ('p', 'La valutazione vale per le lavorazioni e i luoghi di lavoro descritti: nuove lavorazioni o modifiche richiedono l’aggiornamento.'),
    ('h1', 'Piano di contenimento dei rischi', True),
    ('p', 'In base ai risultati ottenuti, occorre applicare tutte le misure di contenimento del rischio qui di seguito riportate.'),
    ('piano',),
]

if __name__ == '__main__':
    costruisci(sys.argv[1], sys.argv[2],
               'Documento di valutazione del rischio di esposizione dei lavoratori ad agenti biologici',
               '(D.lgs. 81/08 e s.m.i. – Titolo X)',
               'VALUTAZIONE DEL RISCHIO DI ESPOSIZIONE DEI LAVORATORI AD AGENTI BIOLOGICI',
               BLOCCHI)
