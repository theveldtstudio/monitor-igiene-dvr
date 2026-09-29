/**
 * DVR MMC con Supabase finto in memoria: attività importate dalle misure, NIOSH, Snook, OCRA, Word.
 */
import { expect, test } from '@playwright/test'
import PizZip from 'pizzip'
import { readFileSync } from 'node:fs'
import { installaSupabaseFinto, type Tabelle } from './helpers/supabaseFinto'

const PIN_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
const CANTIERE = '11111111-1111-4111-8111-111111111111'
const CAMP_MMC = '22222222-2222-4222-8222-222222222222'
const CAMP_OCRA = '22222222-2222-4222-8222-333333333333'
const ORA = '2026-05-20T08:00:00Z'
const MANSIONE = (n: number) => `44444444-4444-4444-8444-00000000000${n}`

function datiIniziali(): Tabelle {
  const campagna = (id: string, tipo: string) => ({ id, cantiere_id: CANTIERE, tipo_campionamento: tipo, data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA })
  const misura = (n: number, campagna_id: string, dati: Record<string, unknown>, note = '') => ({ id: `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`, campagna_id, numero: n, dati, note, sync_pending: false, created_at: ORA, updated_at: ORA })
  return {
    cantieri: [{ id: CANTIERE, nome: 'Xenia TBM1', indirizzo: 'Battipaglia', committente: 'Consorzio Xenia', stato: 'aperto', created_at: ORA, updated_at: ORA }],
    campagne: [campagna(CAMP_MMC, 'mmc'), campagna(CAMP_OCRA, 'movimenti_ripetitivi_ocra')],
    misure: [
      misura(1, CAMP_MMC, { carico: 15, altezza_mani: 25, distanza_verticale: 50, distanza_peso_corpo: 30, dislocazione_angolare: 0, frequenza_gesti: 12, frequenza_unita: 'atti/turno', giudizio_presa: 'Buona' }, 'Sollevamento tubazioni'),
      misura(2, CAMP_OCRA, { punteggio_reale: 7.5, arto_valutato: 'DX', minuti_compito: 30, denominazione: 'Utilizzo cacciavite' }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Battipaglia', provincia: 'Salerno', opera: 'Linea AV Salerno-Reggio Calabria', denominazione: 'TBM1', impresa: 'Consorzio Xenia', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_mansioni: [
      { id: MANSIONE(1), cantiere_id: CANTIERE, nome: 'Impiantista', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA },
      { id: MANSIONE(2), cantiere_id: CANTIERE, nome: 'Elettricista', attivita: null, attiva: true, ordine: 1, created_at: ORA, updated_at: ORA },
      { id: MANSIONE(3), cantiere_id: CANTIERE, nome: 'Capo turno', attivita: null, attiva: true, ordine: 2, created_at: ORA, updated_at: ORA },
    ],
  }
}

test('DVR MMC: attività NIOSH, Snook e OCRA fino al Word', async ({ page }) => {
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
  await page.getByLabel('Rischio del nuovo DVR').selectOption('mmc')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Movimentazione manuale dei carichi – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'mmc', campagne_ids: [CAMP_MMC, CAMP_OCRA] })

  await page.getByLabel('Data di emissione').fill('2026-07-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  const sez = page.locator('section', { hasText: 'ATTIVITÀ CON MOVIMENTAZIONE' })
  await sez.getByRole('button', { name: 'Importa dalle misure (2)' }).click()

  // Sollevamento tubazioni: la misura non dice la durata, si imposta "fino a 1 ora" come nel DVR Xenia
  const tub = sez.getByRole('group', { name: 'Attività Sollevamento tubazioni' })
  await tub.getByLabel('Durata').selectOption('breve')
  await tub.getByLabel('Impiantista').check()
  await expect(tub).toContainText('IS adulti 0,93 (significativo) · giovani/anziani 1,17 (presente)')

  const cac = sez.getByRole('group', { name: 'Attività Utilizzo cacciavite' })
  await cac.getByLabel('Elettricista').check()
  await expect(cac).toContainText('DX 7,5 → OCRA 2,2 (accettabile)')

  // Nuova attività Snook: trasporto cassetta 20 kg, 15 m, ogni 8 h
  await sez.getByLabel('Metodo della nuova attività').selectOption('snook')
  await sez.getByRole('button', { name: '+ Attività' }).click()
  const nuova = sez.getByRole('group', { name: 'Attività nuova' })
  await nuova.getByLabel('Attività', { exact: true }).fill('Trasporto cassetta attrezzi')
  const cassa = sez.getByRole('group', { name: 'Attività Trasporto cassetta attrezzi' })
  await cassa.getByLabel('Peso trasportato').fill('20')
  await cassa.getByLabel('Elettricista').check()
  await expect(cassa).toContainText('indice 0,77 (significativo)')
  await sez.getByRole('button', { name: 'Salva attività' }).click()
  await expect(page.getByText('Attività salvate')).toBeVisible()

  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo.locator('tr', { hasText: 'Capo turno' })).toContainText('non esposta')
  await expect(riepilogo.locator('tr', { hasText: 'Impiantista' })).toContainText('presente')
  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-mmc.png`, fullPage: true })

  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_MMC_Consorzio_Xenia_2026_TBM1_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('6.1 Sollevamento tubazioni')
  expect(testo).toContain('NON ESPOSTO')
  expect(testo).toContain('1,17')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})
