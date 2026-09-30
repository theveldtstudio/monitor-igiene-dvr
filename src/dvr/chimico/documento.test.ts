import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import { generaDocx } from '../comune/generaDocx'
import { AMBIENTI_CASTAGNOLA, TAV_CASTAGNOLA } from './__fixtures__/castagnola2026'
import { AMBIENTI_FDS, MANSIONI_FDS, TEMPI_FDS } from './__fixtures__/fds2025'
import { AMBIENTI_CANC, TAV_CANC } from './__fixtures__/cancerogeno2025'
import { datiTemplateChimico, type DatiDvrChimico } from './documento'

export const BASE_CHIMICO: Omit<DatiDvrChimico, 'tipo' | 'ambienti' | 'tempi' | 'mansioni'> = {
  anagrafica: {
    comune: 'Fraconalto',
    provincia: 'Alessandria',
    opera: 'Tratta AV/AC Terzo Valico dei Giovi',
    denominazione: 'Castagnola',
    impresa: 'Consorzio Tunnel Giovi (CTG)',
    datore_lavoro: 'Ing. Dario Vizzino',
    rspp: 'Per. Ind. Matteo Parolin',
    medico_competente: 'Dr. Andrea Lombroni',
    rls: ['Mirko Gencarelli'],
    gruppo_lavoro: ['Fabio Catano', 'Paola Ciuffreda', 'Davide Bettini'],
    redatto: 'Davide Bettini',
    verificato: 'Paola Ciuffreda',
    approvato: 'Fabio Catano',
  },
  documento: {
    periodoRiferimento: 'Luglio – Dicembre 2025',
    revisione: 0,
    integrazione: 10,
    dataEmissioneTesto: 'Gennaio 2026',
    anno: 2026,
    revisioni: [{ revisione: 0, integrazione: 10, data: 'Gennaio 2026', descrizione: 'Decima integrazione', redatto: 'Davide Bettini', verificato: 'Paola Ciuffreda', approvato: 'Fabio Catano' }],
    primaValutazione: false,
  },
  ambiti: [{ nome: 'Galleria di linea', tipo: 'galleria_tradizionale' }],
  macchine: [{ tipologia: 'Posizionatrice', marca_modello: 'CASAGRANDE PG85', alimentazione: 'Cingolato' }],
}

const senzaMedie = <T extends { medie: unknown }>({ medie, ...a }: T) => {
  void medie
  return a
}
const template = (tipo: DatiDvrChimico['tipo']) => resolve(__dirname, `../../../public/templates/dvr/${tipo}.docx`)
const testoDocx = (xml: string) =>
  xml
    .replace(/<w:sdt>.*?<\/w:sdt>/gs, '')
    .replace(/<w:p[ >]/g, '\n$&')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/** Castagnola: ambienti della tabella 6 e le 60 TAV dell'allegato 2 (concentrazioni scritte nelle TAV). */
export function datiCastagnola(): DatiDvrChimico {
  const mansioni = TAV_CASTAGNOLA.map((t, i) => ({ id: `m${i + 1}`, nome: t.nome, attivita: '' }))
  return {
    ...BASE_CHIMICO,
    tipo: 'chimico',
    mansioni,
    ambienti: AMBIENTI_CASTAGNOLA.map(senzaMedie),
    tempi: TAV_CASTAGNOLA.map((t, i) => ({
      mansioneId: `m${i + 1}`,
      periodi: t.periodi.map((p) => ({
        ...p,
        ambiente: AMBIENTI_CASTAGNOLA.find((a) => a.fase === p.fase && a.postazione === p.postazione)?.id ?? null,
      })),
    })),
  }
}

function genera(d: DatiDvrChimico, nome: string) {
  const { dati, valutazione } = datiTemplateChimico(d)
  const docx = generaDocx(readFileSync(template(d.tipo)), dati)
  if (process.env.DVR_OUT) writeFileSync(`${process.env.DVR_OUT}/${d.tipo}_${nome}.docx`, docx)
  const xml = new PizZip(docx).file('word/document.xml')!.asText()
  return { dati, valutazione, xml, testo: testoDocx(xml) }
}

describe('DVR Agenti chimici: generazione Word (Castagnola 2026)', () => {
  const { dati, xml, testo } = genera(datiCastagnola(), 'castagnola')

  it('nessun tag né marcatore rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
  })
  it('copertina e testi', () => {
    expect(testo).toContain('Cantiere Castagnola')
    expect(testo).toContain('Luglio – Dicembre 2025')
    expect(testo).toContain('Mirko Gencarelli')
    expect(testo).toContain('il metano o più comunemente denominato grisù')
    expect(testo).not.toMatch(/Cravasco|Gennaio - Giugno 2025|al di sotto dei limiti di rilevabilità strumentale/)
  })
  it('tabelle: dati rilevati, indici per ambiente, esposizioni e TAV', () => {
    expect(dati.misureAmbienti.length).toBeGreaterThan(90)
    expect(dati.ambientiIR).toHaveLength(AMBIENTI_CASTAGNOLA.length)
    expect(testo).toContain('Armatura calotta')
    expect(testo).toContain('INDICE DI RISCHIO')
    expect(testo).toContain('TAV. 60 MANSIONE:')
    expect(testo).toContain('CAPOSQUADRA/MINATORE')
    expect(testo).toContain('Limite TLV-TWA')
    expect(testo).toContain('min 18')
    expect((xml.match(/SEQ Tabella/g) ?? []).length).toBeGreaterThan(10)
  })
  it('conclusioni dal calcolo', () => {
    expect(dati.conclusioniAgenti.some((c) => c.startsWith('Biossido di azoto (NO₂)'))).toBe(true)
    expect(dati.conclusioniMansioni[0]).toMatch(/mansioni su 60/)
  })
})

describe('DVR Fumi di saldatura: generazione Word (Castagnola 2025)', () => {
  const { dati, valutazione, xml, testo } = genera(
    { ...BASE_CHIMICO, tipo: 'fumi_saldatura', ambiti: [{ nome: 'Officina', tipo: 'officina' }], macchine: [], mansioni: MANSIONI_FDS, ambienti: AMBIENTI_FDS, tempi: TEMPI_FDS },
    'castagnola',
  )

  it('nessun tag né marcatore rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
  })
  it('indici del modello Piemonte come le tabelle 7 e 8 (NO₂ con gravità 4 invece di 2)', () => {
    const ir = (amb: string, ag: string) => valutazione.ambienti.find((e) => e.ambiente.id === amb)!.indici.find((i) => i.agente.id === ag)!.ir
    expect(['polveri_resp', 'polveri_inal', 'ferro', 'rame_resp', 'rame_inal', 'silice', 'mn_resp', 'mn_inal'].map((a) => ir('f1', a))).toEqual([6, 9, 6, 6, 6, 30, 36, 36])
    expect(['co', 'no', 'co2'].map((a) => ir('f1', a))).toEqual([27, 15, 9])
    expect(ir('f1', 'no2')).toBe(48)
  })
  it('TWA come le TAV 1A e 1B', () => {
    const s = valutazione.mansioni[0].twa
    expect(s.polveri_resp).toBeCloseTo(0.096, 3)
    expect(s.co).toBeCloseTo(2.0, 2)
  })
  it('tabelle e classi per mansione', () => {
    expect(testo).toContain('TAV. 1A MANSIONE:')
    expect(testo).toContain('TAV. 2B MANSIONE:')
    expect(testo).toContain('Mansione: Saldatore')
    expect(dati.classiMansioni[0].polveri.map((r) => r.classe)).toEqual(['Irrilevante', 'Medio'])
    expect(testo).not.toMatch(/fresa|Esab Mig|fattore frequenza|TLW/)
  })
})

describe('DVR Agenti cancerogeni: generazione Word (Castagnola 2025)', () => {
  const mansioni = TAV_CANC.map((t, i) => ({ id: `c${i + 1}`, nome: t.nome, attivita: '' }))
  const { dati, valutazione, xml, testo } = genera(
    {
      ...BASE_CHIMICO,
      tipo: 'cancerogeno',
      mansioni,
      ambienti: AMBIENTI_CANC.map(senzaMedie),
      tempi: TAV_CANC.map((t, i) => ({ mansioneId: `c${i + 1}`, periodi: t.periodi })),
    },
    'castagnola',
  )

  it('nessun tag né marcatore rimasto', () => {
    expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
    expect(xml).not.toMatch(/[⁣⁤]/)
  })
  it('medie per ambiente come la tabella 6', () => {
    let uguali = 0
    const diverse: string[] = []
    valutazione.ambienti.forEach((e, i) => {
      ;['polveri_resp', 'silice', 'ec'].forEach((ag, k) => {
        const m = AMBIENTI_CANC[i].medie[k]
        const c = e.concentrazioni[ag].valore
        if (m == null || c == null) return
        if (Math.abs(c - m) > 0.0051 * Math.max(1, m * 10)) diverse.push(`${e.ambiente.fase} ${ag}: ${c.toFixed(3)} vs ${m}`)
        else uguali++
      })
    })
    // nel modello cinque medie non sono la media delle misure della riga (es. officina: silice 0,010 e
    // 0,010 mg/m³, media scritta 0,055)
    expect(diverse).toHaveLength(5)
    expect(diverse).toContain('Attività ordinaria di officina silice: 0.010 vs 0.055')
    expect(uguali).toBeGreaterThan(50)
  })
  it('TWA come le TAV (silice e carbonio elementare)', () => {
    let uguali = 0
    const scarti: string[] = []
    valutazione.mansioni.forEach((m, i) => {
      for (const ag of ['silice', 'ec']) {
        const x = m.twa[ag]
        const y = TAV_CANC[i].totale[ag]
        if (x == null || y == null) continue
        if (Math.abs(x - y) <= 0.0015) uguali++
        else scarti.push(`${m.mansione.nome} ${ag}: ${x.toFixed(4)} vs ${y}`)
      }
    })
    expect(scarti).toEqual([])
    expect(uguali).toBeGreaterThan(100)
  })
  it('tabelle, analisi e piano', () => {
    expect(testo).toContain('TAV. 61 MANSIONE:')
    expect(dati.analisiAmbienti.some((s) => s.startsWith('Silice libera cristallina'))).toBe(true)
    expect(dati.pianoTabelle[0].righe[0].n).toBe('1.1')
    expect(testo).not.toMatch(/Turmo|CARBO EFFETTUATE|Dicembre 2026|non viene riprodotto/)
  })
})
