/**
 * DVR ROA con Supabase finto in memoria: sorgenti importate dalle misure, DPI UNI EN 169, luminanza, Word.
 */
import { expect, test } from '@playwright/test'
import PizZip from 'pizzip'
import { readFileSync } from 'node:fs'
import { installaSupabaseFinto, type Tabelle } from './helpers/supabaseFinto'

const PIN_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
const CANTIERE = '11111111-1111-4111-8111-111111111111'
const CAMP = '22222222-2222-4222-8222-222222222222'
const ORA = '2026-09-10T08:00:00Z'

function datiIniziali(): Tabelle {
  const misura = (n: number, dati: Record<string, unknown>) => ({ id: `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`, campagna_id: CAMP, numero: n, dati, note: '', sync_pending: false, created_at: ORA, updated_at: ORA })
  return {
    cantieri: [{ id: CANTIERE, nome: 'Castagnola', indirizzo: 'Fraconalto', committente: 'CTG', stato: 'aperto', created_at: ORA, updated_at: ORA }],
    campagne: [{ id: CAMP, cantiere_id: CANTIERE, tipo_campionamento: 'roa', data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA }],
    misure: [
      misura(1, { sorgente: 'Saldatrice ad elettrodo', banda: 'UV-C', fase_nome: 'Saldatura in officina', distanza: 0.5 }),
      misura(2, { sorgente: 'Stazione totale Leica TS16', banda: 'Laser', fase_nome: 'Rilievi topografici in esterno' }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Terzo Valico dei Giovi', denominazione: 'Castagnola', impresa: 'Consorzio Tunnel Giovi', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_mansioni: [{ id: '44444444-4444-4444-8444-000000000001', cantiere_id: CANTIERE, nome: 'Saldatore', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA }],
  }
}

test('DVR ROA: sorgenti, DPI e luminanza fino al Word', async ({ page }) => {
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
  await page.getByLabel('Rischio del nuovo DVR').selectOption('roa')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Radiazioni ottiche artificiali – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'roa', campagne_ids: [CAMP] })

  await page.getByLabel('Data di emissione').fill('2026-09-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  const sorg = page.locator('section', { hasText: 'SORGENTI DI ROA' })
  await sorg.getByRole('button', { name: 'Importa dalle misure (2)' }).click()
  const laser = sorg.getByRole('group', { name: 'Sorgente Stazione totale Leica TS16' })
  await laser.getByLabel(/Classe/).selectOption('3R')
  await expect(laser).toContainText('Non giustificabile')
  const lampada = page.locator('section', { hasText: 'SORGENTI DI ROA' })
  await lampada.getByLabel('Tipo della nuova sorgente').selectOption('lampada')
  await lampada.getByRole('button', { name: '+ Sorgente' }).click()
  const nuova = sorg.getByRole('group', { name: 'Sorgente nuova' })
  await nuova.getByLabel('Descrizione', { exact: true }).fill('Fari a paramento')
  const fari = sorg.getByRole('group', { name: 'Sorgente Fari a paramento' })
  await fari.getByLabel(/Gruppo/).selectOption('RG1')
  await fari.getByLabel('servono misure').check()

  const mis = page.locator('section', { hasText: 'MISURE DI ILLUMINAMENTO' })
  await mis.getByRole('button', { name: '+ Misura' }).click()
  const r = mis.getByRole('group', { name: 'Rilievo 1' })
  await r.getByLabel('Sorgente').fill('Fari a paramento in galleria')
  await mis.getByRole('group', { name: 'Rilievo Fari a paramento in galleria' }).getByLabel('Illuminamento Ev').fill('35')
  await mis.getByRole('group', { name: 'Rilievo Fari a paramento in galleria' }).getByLabel('Angolo solido').fill('0,0277')
  await expect(mis).toContainText(/Lv 1\.?264 cd\/m²/)

  const dpi = page.locator('section', { hasText: 'DPI PER SALDATURA' })
  await dpi.getByRole('button', { name: '+ DPI' }).click()
  const d = dpi.getByRole('group', { name: /DPI Saldatura ad elettrodo/ })
  await d.getByLabel('Filtri in dotazione').fill('10-11')
  await expect(d).toContainText('→ adeguati')
  await sorg.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Dati del DVR ROA salvati')).toBeVisible()

  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo).toContainText('3 sorgenti: 0 giustificabili, 3 non giustificabili')
  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-roa.png`, fullPage: true })

  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_ROA_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('Saldatrice ad elettrodo')
  expect(testo).toContain('Laser classe 3R')
  expect(testo).toMatch(/1\.?264/)
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})
