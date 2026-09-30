/**
 * Monitoraggio delle acque con Supabase finto in memoria: misure importate per punto, limiti, Word.
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
    campagne: [{ id: CAMP, cantiere_id: CANTIERE, tipo_campionamento: 'monitoraggio_acqua', data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA }],
    misure: [
      misura(1, { punto_monitoraggio: 'Uscita vasca di decantazione', ph: 8.1, conducibilita: 1200, t_acqua: 14.2, t_ambiente: 18, o2_perc: 90, o2_mg_l: 9.1 }),
      misura(2, { punto_monitoraggio: 'Uscita vasca di decantazione', ph: 10.2, conducibilita: 1850 }),
      misura(3, { punto_monitoraggio: 'Acque di galleria', ph: 11.6, conducibilita: 2900 }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Terzo Valico dei Giovi', denominazione: 'Castagnola', impresa: 'Consorzio Tunnel Giovi', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_ambiti: [{ id: '55555555-5555-4555-8555-000000000001', cantiere_id: CANTIERE, nome: 'Galleria di linea', tipo: 'galleria_tradizionale', ordine: 0, created_at: ORA, updated_at: ORA }],
    dvr_mansioni: [{ id: '44444444-4444-4444-8444-000000000001', cantiere_id: CANTIERE, nome: 'Minatore', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA }],
  }
}

test('Monitoraggio delle acque: punti, limiti e Word', async ({ page }) => {
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
  await page.getByLabel('Rischio del nuovo DVR').selectOption('acqua')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /Monitoraggio delle acque – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'acqua', campagne_ids: [CAMP] })
  await page.getByLabel('Data di emissione').fill('2026-09-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  const sez = page.locator('section', { hasText: 'PUNTI DI MONITORAGGIO E MISURE' })
  await sez.getByRole('button', { name: 'Importa dalle misure (3)' }).click()
  const vasca = sez.getByRole('group', { name: 'Punto Uscita vasca di decantazione' })
  await expect(vasca.getByLabel('Destinazione')).toHaveValue('scarico_superficiale')
  await expect(sez.getByRole('group', { name: 'Punto Acque di galleria' }).getByLabel('Destinazione')).toHaveValue('monitoraggio')
  await expect(vasca).toContainText('non conforme (pH)')
  await sez.getByRole('button', { name: '+ Punto' }).click()
  const nuovo = sez.getByRole('group', { name: 'Punto nuovo' })
  await nuovo.getByLabel('Punto di monitoraggio').fill('Rubinetto spogliatoi')
  const rub = sez.getByRole('group', { name: 'Punto Rubinetto spogliatoi' })
  await rub.getByLabel('Destinazione').selectOption('consumo_umano')
  await rub.getByRole('button', { name: '+ Misura' }).click()
  await rub.getByLabel('pH misura 1').fill('7,4')
  await rub.getByLabel('Cond. [µS/cm] misura 1').fill('450')
  await expect(rub).toContainText('conforme')
  await sez.getByRole('button', { name: 'Salva' }).first().click()
  await expect(page.getByText('Dati del monitoraggio salvati')).toBeVisible()

  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo).toContainText('3 punti · 4 misure · 1 punti non conformi')
  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-acqua.png`, fullPage: true })

  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_Acqua_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('Uscita vasca di decantazione')
  expect(testo).toContain('Rubinetto spogliatoi')
  expect(testo).toContain('Non conforme')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(errori).toEqual([])
})
