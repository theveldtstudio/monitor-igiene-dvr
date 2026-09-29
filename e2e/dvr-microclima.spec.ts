/**
 * DVR Microclima con Supabase finto in memoria: rilievi importati dalle misure, PMV/PPD in galleria, Word.
 */
import { expect, test } from '@playwright/test'
import PizZip from 'pizzip'
import { readFileSync } from 'node:fs'
import { installaSupabaseFinto, type Tabelle } from './helpers/supabaseFinto'

const PIN_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
const CANTIERE = '11111111-1111-4111-8111-111111111111'
const CAMP = '22222222-2222-4222-8222-222222222222'
const ORA = '2024-12-20T08:00:00Z'
const MANSIONE = (n: number) => `44444444-4444-4444-8444-00000000000${n}`

function datiIniziali(): Tabelle {
  const misura = (n: number, dati: Record<string, unknown>) => ({ id: `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`, campagna_id: CAMP, numero: n, dati, note: '', sync_pending: false, created_at: ORA, updated_at: ORA })
  return {
    cantieri: [{ id: CANTIERE, nome: 'Castagnola', indirizzo: 'Fraconalto', committente: 'CTG', stato: 'aperto', created_at: ORA, updated_at: ORA }],
    campagne: [{ id: CAMP, cantiere_id: CANTIERE, tipo_campionamento: 'microclima', data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA }],
    misure: [
      misura(1, { fase_nome: 'Perforazione del fronte', postazione_nome: 'In prossimità', ambiente: 'indoor', ta: 23.5, tg: 25.4, tnw: 22.9, ur: 65.6, va: 0.33, attivita_metabolica: 'moderata' }),
      misura(2, { fase_nome: 'Smarino', postazione_nome: 'In prossimità', ambiente: 'indoor', ta: 24.3, tg: 25.5, tnw: 23.1, ur: 65.6, va: 0.18, attivita_metabolica: 'leggera' }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Terzo Valico dei Giovi', denominazione: 'Castagnola', impresa: 'Consorzio Tunnel Giovi', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_mansioni: [
      { id: MANSIONE(1), cantiere_id: CANTIERE, nome: 'Perforatore', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA },
      { id: MANSIONE(2), cantiere_id: CANTIERE, nome: 'Autista', attivita: null, attiva: true, ordine: 1, created_at: ORA, updated_at: ORA },
    ],
  }
}

test('DVR Microclima: rilievi in galleria, PMV/PPD fino al Word', async ({ page }) => {
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
  await page.getByLabel('Rischio del nuovo DVR').selectOption('microclima')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Microclima – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'microclima', campagne_ids: [CAMP] })

  await page.getByLabel('Data di emissione').fill('2025-01-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  const scenario = page.locator('section', { hasText: 'SCENARIO E PARAMETRI' })
  await scenario.getByLabel('Scenario').selectOption('galleria_inverno')
  await scenario.getByLabel('Diametro del globo').fill('0,05')

  const rilievi = page.locator('section', { hasText: 'RILIEVI MICROCLIMATICI' })
  await rilievi.getByRole('button', { name: 'Importa dalle misure (2)' }).click()
  await expect(rilievi.getByRole('group', { name: 'Rilievo MCR02' })).toBeVisible()

  const lav = page.locator('section', { hasText: 'LAVORAZIONI, DISPENDIO' })
  const perf = lav.getByRole('group', { name: 'Lavorazione Perforazione del fronte' })
  await perf.getByLabel('Dispendio').fill('2,2')
  await perf.getByLabel('Perforatore').check()
  await lav.getByRole('group', { name: 'Lavorazione Smarino' }).getByLabel('Autista').check()
  await lav.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Dati del DVR Microclima salvati')).toBeVisible()
  expect(tabelle.dvr_documenti?.[0].contenuti).toMatchObject({ microclima: { parametri: { scenario: 'galleria_inverno', diametroGlobo: 0.05 } } })

  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  // stesso rilievo del DVR Castagnola (MCR01): PMV 1,8 e PPD 66,6%
  await expect(riepilogo.locator('tr', { hasText: 'Perforazione del fronte' })).toContainText('PMV 1,8 · PPD 66,6% (cat. D)')
  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-microclima.png`, fullPage: true })

  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_Microclima_invernale_Consorzio_Tunnel_Giovi_2025_Castagnola_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('Valori di PMV e PPD')
  expect(testo).toContain('MCR02')
  expect(testo).toContain('66,6')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})
