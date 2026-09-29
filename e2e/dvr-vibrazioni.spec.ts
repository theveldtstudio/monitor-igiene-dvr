/**
 * DVR Vibrazioni con Supabase finto in memoria: nuovo documento, matrice tempi WBV e HAV, Word.
 */
import { expect, test } from '@playwright/test'
import PizZip from 'pizzip'
import { readFileSync } from 'node:fs'
import { RILIEVI_VIB_XENIA } from '../src/dvr/vibrazioni/__fixtures__/xenia2026'
import { installaSupabaseFinto, type Tabelle } from './helpers/supabaseFinto'

const PIN_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
const CANTIERE = '11111111-1111-4111-8111-111111111111'
const CAMP_WBV = '22222222-2222-4222-8222-222222222222'
const CAMP_HAV = '22222222-2222-4222-8222-333333333333'
const ORA = '2026-05-20T08:00:00Z'

function datiIniziali(): Tabelle {
  const campagna = (id: string, tipo: string) => ({ id, cantiere_id: CANTIERE, tipo_campionamento: tipo, data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA })
  return {
    cantieri: [{ id: CANTIERE, nome: 'Xenia TBM1', indirizzo: 'Battipaglia', committente: 'Consorzio Xenia', stato: 'aperto', created_at: ORA, updated_at: ORA }],
    campagne: [campagna(CAMP_WBV, 'vibrazioni-wbv'), campagna(CAMP_HAV, 'vibrazioni-hav')],
    misure: RILIEVI_VIB_XENIA.map((r, i) => ({
      id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
      campagna_id: r.tipo === 'wbv' ? CAMP_WBV : CAMP_HAV,
      numero: i + 1,
      dati:
        r.tipo === 'wbv'
          ? { macchina_nome: r.macchina, fase_nome: r.fase, regime: r.dettaglio, aw_max: r.a, aw_max_asse: r.asse.toLowerCase(), posizione_operatore: r.posizione }
          : { utensile: r.macchina, fase_nome: r.fase, impugnatura: r.dettaglio.toLowerCase(), aw_sum: r.a, alimentazione: r.alimentazione },
      note: '',
      sync_pending: false,
      created_at: ORA,
      updated_at: ORA,
    })),
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Battipaglia', provincia: 'Salerno', opera: 'Linea AV Salerno-Reggio Calabria', denominazione: 'TBM1', impresa: 'Consorzio Xenia', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_mansioni: [
      { id: '44444444-4444-4444-8444-000000000001', cantiere_id: CANTIERE, nome: 'Operatore MSV', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA },
      { id: '44444444-4444-4444-8444-000000000002', cantiere_id: CANTIERE, nome: 'Meccanico TBM', attivita: null, attiva: true, ordine: 1, created_at: ORA, updated_at: ORA },
    ],
    dvr_tarature: [{ id: '55555555-5555-4555-8555-000000000001', strumento_id: null, componente: 'Analizzatore', costruttore: 'Larson-Davis', modello: 'HVM 100', matricola: '00925', data_taratura: null, certificato: null }],
  }
}

test('DVR Vibrazioni: matrice WBV e HAV fino al Word', async ({ page }) => {
  test.setTimeout(120_000)
  const tabelle = datiIniziali()
  await page.addInitScript(({ hash }) => {
    window.localStorage.setItem('app_pin_hash', hash)
    window.localStorage.setItem('app_locked', '0')
  }, { hash: PIN_HASH_1234 })
  await installaSupabaseFinto(page, tabelle)
  const errori: string[] = []
  page.on('pageerror', (e) => errori.push(e.message))

  await page.goto(`/cantieri/${CANTIERE}/dvr`)
  await page.getByLabel('Rischio del nuovo DVR').selectOption('vibrazioni')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Vibrazioni – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'vibrazioni', campagne_ids: [CAMP_WBV, CAMP_HAV] })

  await page.getByLabel('Periodo di riferimento').fill('Maggio – Giugno 2026')
  await page.getByLabel('Data di emissione').fill('2026-07-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  // Operatore MSV: come la TAV 3 del DVR Xenia (60 min basso regime, 340 alto, 65 a terra, 15 pausa)
  const msv = page.getByRole('group', { name: 'Operatore MSV' })
  await msv.getByRole('button', { name: '+ Riga WBV' }).click()
  await msv.getByRole('button', { name: '+ Riga WBV' }).click()
  await msv.getByRole('button', { name: '+ Riga WBV' }).click()
  const righe = msv.locator('tbody tr')
  await righe.nth(0).locator('input').first().fill('60')
  await righe.nth(0).locator('select').nth(1).selectOption({ label: 'MSV NDF New Dafang – Trasporto conci – basso (0,07 m/s², 1 misura)' })
  await righe.nth(1).locator('input').first().fill('340')
  await righe.nth(1).locator('select').nth(1).selectOption({ label: 'MSV NDF New Dafang – Trasporto conci – alto (0,64 m/s², 3 misure)' })
  await righe.nth(2).locator('input').first().fill('65')
  await righe.nth(2).locator('select').first().selectOption('convenzionale')
  await righe.nth(2).getByPlaceholder('Fase').fill('Operazioni a terra')
  await righe.nth(2).locator('input').last().fill('0,01')
  await msv.getByRole('button', { name: '+ Pausa 15 min' }).first().click()
  await expect(msv).toContainText('A(8) 0,54 · con +20% 0,65 m/s² · oltre azione')
  await msv.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Operatore MSV')).toBeVisible()

  // Meccanico: avvitatore 60 min (impugnatura peggiore) + resto convenzionale
  const mec = page.getByRole('group', { name: 'Meccanico TBM' })
  await mec.getByRole('button', { name: '+ Riga HAV' }).click()
  await mec.getByRole('button', { name: '+ Riga HAV' }).click()
  const rh = mec.locator('tbody tr')
  await rh.nth(0).locator('input').first().fill('60')
  await rh.nth(0).locator('select').nth(1).selectOption({ label: 'Avvitatore – Manutenzione – DX/SX (4,86 m/s², 2 misure)' })
  await rh.nth(1).locator('input').first().fill('420')
  await rh.nth(1).locator('select').first().selectOption('convenzionale')
  await rh.nth(1).getByPlaceholder('Fase').fill('Operazioni a terra')
  await rh.nth(1).locator('input').last().fill('0,01')
  await expect(mec).toContainText('A(8) 1,72 · con +20% 2,06 m/s² · sotto azione')
  await mec.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Meccanico TBM')).toBeVisible()

  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-vibrazioni.png`, fullPage: true })
  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo).toContainText('0,65 m/s² · oltre azione')
  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_Vibrazioni_Consorzio_Xenia_2026_TBM1_rev00.docx')
  const testo = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText().replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('WBV - TAV 1')
  expect(testo).toContain('HAV - TAV 1')
  expect(testo).toContain('Operatore MSV (0,65 m/s²)')
  expect(testo).toContain('VCI17')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(errori).toEqual([])
})
