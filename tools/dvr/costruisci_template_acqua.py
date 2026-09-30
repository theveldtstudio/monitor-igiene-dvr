#!/usr/bin/env python3
"""
Template Word del monitoraggio delle acque di cantiere (pH, conducibilità, temperatura, ossigeno
disciolto) confrontati con i limiti della destinazione (D.Lgs. 152/2006 tab. 3, D.Lgs. 18/2023).
Non esiste un documento modello ECO-TER: è scritto da zero sullo scheletro del template CEM:

    python3 tools/dvr/costruisci_template_acqua.py public/templates/dvr/cem.docx public/templates/dvr/acqua.docx
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from scheletro import costruisci  # noqa: E402

BLOCCHI = [
    ('h1', 'Introduzione', True),
    ('p', '{intro1}'),
    ('p', 'Il monitoraggio ha l’obiettivo di verificare il funzionamento dei sistemi di raccolta e di trattamento delle acque, il '
          'rispetto dei limiti allo scarico e la qualità dell’acqua messa a disposizione dei lavoratori.'),
    ('p', 'Il presente elaborato è redatto dalla {studioEsecutore}.'),
    ('p', 'I risultati valgono per le condizioni riscontrate al momento delle misure; eventuali modifiche successive delle lavorazioni, '
          'delle venute d’acqua o degli impianti saranno valutate secondo il programma di monitoraggio.'),
    ('h1', 'Normativa di riferimento'),
    ('p', 'Il monitoraggio è stato condotto sulla base dei seguenti riferimenti normativi e metodi:'),
    ('elenco', 'normativa'),
    ('h1', 'Parametri monitorati', True),
    ('paragrafi', 'parametri'),
    ('h2', 'Valori di riferimento'),
    ('p', 'I limiti dipendono dalla destinazione dell’acqua di ciascun punto; le prescrizioni dell’autorizzazione allo scarico, se più '
          'restrittive, prevalgono e sono riportate nel confronto.'),
    ('tabella', 'Valori di riferimento per destinazione.', ['Destinazione', 'Parametro', 'Limite'], ['{destinazione}', '{parametro}', '{limite}'], 'limiti', [45, 30, 25]),
    ('h1', 'Metodologia'),
    ('paragrafi', 'metodologia'),
    ('h2', 'Strumentazione'),
    ('p', 'Le misure sono state eseguite con la seguente strumentazione:'),
    ('elenco', 'strumenti'),
    ('h1', 'Acquisizione dati', True),
    ('h2', 'Organizzazione delle attività lavorative'),
    ('ciclo_lavoro',),
    ('h2', 'Gestione delle acque di cantiere'),
    ('p', 'Nel cantiere sono adottate le seguenti misure:'),
    ('elenco', 'misurePreventive'),
    ('h1', 'Punti di monitoraggio'),
    ('p', 'I punti di monitoraggio e la destinazione delle acque sono riportati nella tabella seguente.'),
    ('tabella', 'Punti di monitoraggio.', ['N°', 'Punto', 'Descrizione', 'Destinazione', 'Misure'],
     ['{numero}', '{nome}', '{descrizione}', '{destinazione}', '{n}'], 'punti', [6, 24, 30, 30, 10]),
    ('h1', 'Risultati delle misure', True),
    ('se', 'conMisure'),
    ('tabella', 'Risultati delle misure di campo.', ['Punto', 'Data', 'pH', 'Conducibilità [µS/cm]', 'T acqua [°C]', 'T aria [°C]', 'O₂ [%]', 'O₂ [mg/L]', 'Esito'],
     ['{punto}', '{data}', '{ph}', '{conducibilita}', '{tAcqua}', '{tAmbiente}', '{o2Perc}', '{o2MgL}', '{esito}'], 'misure', [17, 14, 7, 12, 9, 9, 8, 9, 15]),
    ('h1', 'Confronto con i valori di riferimento'),
    ('p', 'Per ogni punto sono riportati l’intervallo dei valori misurati, il limite della destinazione e l’esito.'),
    ('tabella', 'Confronto con i valori di riferimento.', ['Punto', 'Parametro', 'Valori misurati', 'Limite', 'Esito'],
     ['{punto}', '{parametro}', '{valori}', '{limite}', '{esito}'], 'confronti', [26, 24, 18, 14, 18]),
    ('fine', 'conMisure'),
    ('se_non', 'conMisure'),
    ('p', 'Nel periodo di riferimento non sono state eseguite misure.'),
    ('fine', 'conMisure'),
    ('h1', 'Conclusioni', True),
    ('p', 'Sulla base dei risultati del monitoraggio si può concludere che:'),
    ('elenco', 'conclusioni'),
    ('h1', 'Piano di intervento e di monitoraggio', True),
    ('p', 'In base ai risultati ottenuti si indicano le seguenti misure.'),
    ('piano',),
]

if __name__ == '__main__':
    costruisci(sys.argv[1], sys.argv[2],
               'Relazione di monitoraggio delle acque di cantiere',
               '(D.Lgs. 152/2006 – D.Lgs. 18/2023)',
               'MONITORAGGIO DELLE ACQUE DI CANTIERE',
               BLOCCHI)
