/**
 * DVR Campi elettromagnetici con Supabase finto in memoria: misure CEM importate, zone, Word.
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
    campagne: [{ id: CAMP, cantiere_id: CANTIERE, tipo_campionamento: 'cem', data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA }],
    misure: [
      misura(1, { sorgente: 'Cabina MT/BT', frequenza: 50, unita_frequenza: 'Hz', distanza: 0.5, campo_e: 35, induzione_b: 180, postazione_nome: 'Fronte quadro BT' }),
      misura(2, { sorgente: 'Cabina MT/BT', frequenza: 50, unita_frequenza: 'Hz', distanza: 2, campo_e: 5, induzione_b: 12, postazione_nome: 'Fronte quadro BT' }),
      misura(3, { sorgente: 'Radio portatile', frequenza: 446, unita_frequenza: 'MHz', distanza: 0.1, campo_e: 15, postazione_nome: 'Galleria' }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Terzo Valico dei Giovi', denominazione: 'Castagnola', impresa: 'Consorzio Tunnel Giovi', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_mansioni: [{ id: '44444444-4444-4444-8444-000000000001', cantiere_id: CANTIERE, nome: 'Elettricista', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA }],
  }
}

test('DVR CEM: misure importate, zone e distanze fino al Word', async ({ page }) => {
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
  await page.getByLabel('Rischio del nuovo DVR').selectOption('cem')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Campi elettromagnetici – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'cem', campagne_ids: [CAMP] })

  await page.getByLabel('Data di emissione').fill('2026-09-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  const sorg = page.locator('section', { hasText: 'SORGENTI DI CAMPI ELETTROMAGNETICI' })
  await sorg.getByRole('button', { name: 'Importa dalle misure (3)' }).click()
  const cabina = sorg.getByRole('group', { name: 'Sorgente Cabina MT/BT' })
  await expect(cabina).toContainText('Zona 1')
  await cabina.getByLabel('Elettricista').check()
  await expect(sorg.getByRole('group', { name: 'Sorgente Radio portatile' })).toBeVisible()

  await sorg.getByLabel('Categoria della nuova sorgente').selectOption('saldatura')
  await sorg.getByRole('button', { name: '+ Sorgente' }).click()
  const nuova = sorg.getByRole('group', { name: 'Sorgente nuova' })
  await nuova.getByLabel('Descrizione', { exact: true }).fill('Saldatrice ad elettrodo')
  const sald = sorg.getByRole('group', { name: 'Sorgente Saldatrice ad elettrodo' })
  await sald.getByRole('button', { name: '+ Misura' }).click()
  await sald.getByLabel('Distanza misura 1').fill('0,3')
  await sald.getByLabel('B misura 1').fill('60')
  await sorg.getByRole('button', { name: 'Salva' }).first().click()
  await expect(page.getByText('Dati del DVR CEM salvati')).toBeVisible()

  // tempi per metro lineare di avanzamento (in tutti i DVR, dopo il ciclo di lavoro)
  const ciclo = page.locator('section', { hasText: 'ORGANIZZAZIONE DELLE ATTIVITÀ LAVORATIVE' })
  await ciclo.getByRole('button', { name: /ORGANIZZAZIONE DELLE ATTIVITÀ LAVORATIVE/ }).click()
  await ciclo.getByRole('button', { name: /\+ Tempi per metro lineare/ }).click()
  await ciclo.getByLabel('Smarino – martellone').fill('135')
  await ciclo.getByLabel('Posa centina – martellone').fill('75')
  await expect(ciclo).toContainText('210 min/m')
  await ciclo.getByRole('button', { name: '+ Metri scavati' }).click()
  await ciclo.getByLabel('Metri di avanzamento 1').fill('1053,4')
  await ciclo.getByLabel('Giorni di avanzamento 1').fill('285')
  await ciclo.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Salvato', { exact: true })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0].contenuti).toMatchObject({ avanzamento: { produzione: [{ metodo: 'martellone', metri: 1053.4, giorni: 285 }] } })

  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo).toContainText('3 sorgenti: 1 giustificabili, 2 da valutare · 4 misure')
  await expect(riepilogo).toContainText('Cabina MT/BTZona 1Entro i VA inferiori2 m')
  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-cem.png`, fullPage: true })

  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_CEM_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('Cabina MT/BT')
  expect(testo).toContain('Saldatrice ad elettrodo')
  expect(testo).toContain('Radio portatile')
  expect(testo).toContain('Fronte quadro BT')
  expect(testo).toContain('Totale per metro lineare')
  expect(testo).toContain('1.053,4 m di avanzamento con martellone in 285 giorni')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})
