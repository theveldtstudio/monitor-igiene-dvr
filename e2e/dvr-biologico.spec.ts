/**
 * DVR Agenti biologici con Supabase finto in memoria: agenti proposti, misure SAS importate, Word.
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
    campagne: [{ id: CAMP, cantiere_id: CANTIERE, tipo_campionamento: 'biologico_sas', data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA }],
    misure: [
      misura(1, { postazione_nome: 'Uffici', fase_nome: 'Attività d’ufficio', conta_22: 180, conta_36: 40, muffe_lieviti: 60, volume_aspirato: 500 }),
      misura(2, { postazione_nome: 'Galleria – fronte', fase_nome: 'Scavo', conta_22: 2400, conta_36: 350, muffe_lieviti: 900, volume_aspirato: 250 }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Terzo Valico dei Giovi', denominazione: 'Castagnola', impresa: 'Consorzio Tunnel Giovi', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_ambiti: [{ id: '55555555-5555-4555-8555-000000000001', cantiere_id: CANTIERE, nome: 'Galleria di linea', tipo: 'galleria_tradizionale', ordine: 0, created_at: ORA, updated_at: ORA }],
    dvr_mansioni: [{ id: '44444444-4444-4444-8444-000000000001', cantiere_id: CANTIERE, nome: 'Minatore', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA }],
  }
}

test('DVR Agenti biologici: agenti proposti, misure SAS e Word', async ({ page }) => {
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
  await page.getByLabel('Rischio del nuovo DVR').selectOption('biologico')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Agenti biologici – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'biologico', campagne_ids: [CAMP] })
  await page.getByLabel('Data di emissione').fill('2026-09-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  const ag = page.locator('section', { hasText: 'AGENTI BIOLOGICI POTENZIALI' })
  await ag.getByRole('button', { name: 'Carica l’elenco proposto' }).click()
  const lepto = ag.getByRole('group', { name: 'Agente Leptospira interrogans' })
  await lepto.getByLabel('Probabilità P').selectOption('3')
  await lepto.getByLabel('Minatore').check()
  await expect(lepto).toContainText('R = 3 × 2 = 6 · rischio medio')
  const sas = page.locator('section', { hasText: 'CARICA MICROBICA DELL’ARIA (SAS)' })
  await sas.getByRole('button', { name: 'Importa dalle misure (2)' }).click()
  await expect(sas.getByLabel('Postazione SAS 2')).toHaveValue('Galleria – fronte')
  await ag.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Dati del DVR biologico salvati')).toBeVisible()

  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo).toContainText('6 agenti · 1 a rischio medio o alto · 2 misure SAS')
  await expect(riepilogo.getByRole('row', { name: /Minatore/ })).toContainText('medio')
  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-biologico.png`, fullPage: true })

  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_Biologico_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('Leptospira interrogans')
  expect(testo).toContain('Galleria – fronte')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(errori).toEqual([])
})
