import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import type { ClasseOwas } from './calcolo'
import { datiTemplatePosture, type DatiDvrPosture } from './documento'
import { TAV_CASTAGNOLA } from './__fixtures__/castagnola2025'
import { CATALOGO_CASTAGNOLA } from './__fixtures__/catalogoCastagnola'

const DATI: DatiDvrPosture = {
  anagrafica: {
    comune: 'Fraconalto',
    provincia: 'Alessandria',
    opera: 'Tratta A.V./A.C. Terzo Valico dei Giovi',
    denominazione: 'Castagnola',
    impresa: 'CTG',
    datore_lavoro: 'Ing. Dario Vizzini',
    rspp: 'Per. Ind. Matteo Parolin',
    medico_competente: 'Dott. Andrea Lombroni',
    rls: ['Mirko Gencarelli'],
    gruppo_lavoro: ['Fabio Catano', 'Paola Ciuffreda', 'Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: 'Paola Ciuffreda',
    approvato: 'Fabio Catano',
  },
  documento: {
    periodoRiferimento: 'Gennaio – Dicembre 2025',
    revisione: 0,
    integrazione: 4,
    dataEmissioneTesto: 'Dicembre 2025',
    anno: 2025,
    revisioni: [{ revisione: 0, integrazione: null, data: 'Gennaio 2021', descrizione: 'Prima emissione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' }],
  },
  ambiti: [{ nome: 'Gallerie Castagnola', tipo: 'galleria_tradizionale' }],
  mansioni: TAV_CASTAGNOLA.map((t, i) => ({
    id: String(i),
    nome: t.nome,
    giornate: t.giornate.map((g) => ({
      titolo: g.titolo,
      righe: g.righe.map(([fase, attivita, minuti, classe]) => ({ fase, attivita, minuti, classe: classe as ClasseOwas })),
    })),
  })),
  catalogo: CATALOGO_CASTAGNOLA,
}

const TEMPLATE = resolve(__dirname, '../../../public/templates/dvr/posture.docx')
const xmlDocx = (docx: Uint8Array) => new PizZip(docx).file('word/document.xml')!.asText()
const testoDocx = (xml: string) => xml.replace(/<w:p[ >]/g, '\n$&').replace(/<[^>]+>/g, '')

describe('DVR Posture: generazione Word', () => {
  const { dati, valutazione } = datiTemplatePosture(DATI)
  const docx = generaDocx(readFileSync(TEMPLATE), dati)
  const xml = xmlDocx(docx)
  const testo = testoDocx(xml)
  if (process.env.DVR_OUT) writeFileSync(process.env.DVR_OUT, docx)

  it('nessun tag né marcatore rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
  })

  it('copertina e introduzione con i dati del cantiere', () => {
    expect(testo).toContain('COMUNE DI FRACONALTO')
    expect(testo).toContain('CANTIERE CASTAGNOLA')
    expect(testo).toContain('per i lavoratori di CTG operanti nelle gallerie del cantiere Castagnola')
    expect(testo).not.toContain('Pavimental')
  })

  it('una TAV per mansione, 150 giornate', () => {
    expect(testo.match(/TAV \d+: /g)).toHaveLength(61)
    expect(testo).toContain('TAV 61: ELETTRICISTA')
    expect(dati.tav.reduce((s, t) => s + t.giornate.length, 0)).toBe(150)
  })

  it('riepilogo con la giornata più gravosa e il tipo di rischio', () => {
    expect(dati.riepilogo).toHaveLength(61)
    const cs = dati.riepilogo[0]
    expect(cs).toMatchObject({ mansione: 'CAPOSQUADRA/MINATORE', f1: '21,9', f2: '65,6', f3: '12,5', f4: '-', indice: '190,6', tipo: 'Lieve' })
    expect(valutazione.perFascia[0]).toHaveLength(7)
    expect(valutazione.perFascia[1]).toHaveLength(54)
    expect(dati.tipiRischio.map((t) => t.tipo)).toEqual(['Lieve', 'Assente'])
  })

  it('catalogo: tabelle dei capitoli 5 e 6 con le classi calcolate dal codice OWAS', () => {
    expect(dati.gruppiAttivita.map((g) => g.titolo)).toEqual([
      'Consolidamento del fronte',
      'Avanzamento (scavo con volata e con martellone)',
      'Getto murette',
      'Armatura e getto della calotta',
      'Arco rovescio',
      'Attività a servizio del cantiere',
    ])
    const posture = dati.gruppiClassi.flatMap((g) => g.posture)
    expect(posture).toHaveLength(94)
    // il modello aveva 3 classi diverse dalla tabella standard: il documento usa quelle calcolate
    const diverse = CATALOGO_CASTAGNOLA.flatMap((a, i) => a.classiModello.filter((c, k) => c !== valutazione.classiCatalogo[i][k]))
    expect(diverse).toHaveLength(3)
  })

  it('celle unite: la fase compare una volta per gruppo di righe', () => {
    const unite = xml.match(/<w:vMerge w:val="restart"\/>/g) ?? []
    expect(unite.length).toBeGreaterThan(100)
  })

  it('conclusioni e piano coerenti con l’esito', () => {
    expect(testo).toContain('il rischio da posture incongrue risulta lieve per 54 mansioni e assente per 7 mansioni')
    expect(testo).toContain('Le posture che comportano maggior rischio (classe 4)')
    expect(testo).toContain('Attivare la sorveglianza sanitaria sui lavoratori che ne facciano richiesta')
    expect(testo).toContain('RISCHIO LIEVE')
    expect(testo).toContain('RISCHIO ASSENTE')
  })

  it('le operazioni ordinarie ripartite diventano quattro righe nell’allegato', () => {
    const d = datiTemplatePosture({
      ...DATI,
      mansioni: [{ id: 'x', nome: 'Minatore', giornate: [{ titolo: 'Giornata tipo', righe: [
        { fase: 'Scavo', attivita: 'Assistenza', minuti: 300, classe: 1 },
        { fase: 'Operazioni ordinarie', attivita: 'Varie', minuti: 180, classe: 'ripartita' },
      ] }] }],
    }).dati
    const righe = d.tav[0].giornate[0].righe
    expect(righe).toHaveLength(5)
    expect(righe.slice(1).map((r) => [r.minuti, r.classe])).toEqual([['45', '1'], ['45', '2'], ['45', '3'], ['45', '4']])
    expect(d.riepilogo[0].indice).toBe('156,3')
  })
})
