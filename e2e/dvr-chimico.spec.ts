/**
 * DVR Agenti chimici e Agenti cancerogeni con Supabase finto in memoria: misure di polveri e gas
 * importate negli ambienti, giornata tipo, classificazione Regione Piemonte, Word.
 */
import { expect, test, type Page } from '@playwright/test'
import PizZip from 'pizzip'
import { readFileSync } from 'node:fs'
import { installaSupabaseFinto, type Tabelle } from './helpers/supabaseFinto'

const PIN_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
const CANTIERE = '11111111-1111-4111-8111-111111111111'
const POLVERI = '22222222-2222-4222-8222-222222222221'
const GAS = '22222222-2222-4222-8222-222222222222'
const CARBONIO = '22222222-2222-4222-8222-222222222223'
const AMIANTO = '22222222-2222-4222-8222-222222222224'
const IPA = '22222222-2222-4222-8222-222222222225'
const ORA = '2026-09-10T08:00:00Z'

function datiIniziali(): Tabelle {
  let n = 0
  const misura = (campagna: string, dati: Record<string, unknown>) => {
    n++
    return { id: `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`, campagna_id: campagna, numero: n, dati, note: '', sync_pending: false, created_at: ORA, updated_at: ORA }
  }
  const campagna = (id: string, tipo: string) => ({ id, cantiere_id: CANTIERE, tipo_campionamento: tipo, data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA })
  return {
    cantieri: [{ id: CANTIERE, nome: 'Castagnola', indirizzo: 'Fraconalto', committente: 'CTG', stato: 'aperto', created_at: ORA, updated_at: ORA }],
    campagne: [campagna(POLVERI, 'polveri'), campagna(GAS, 'gas'), campagna(CARBONIO, 'carbonio_ec'), campagna(AMIANTO, 'amianto'), campagna(IPA, 'ipa')],
    misure: [
      misura(POLVERI, { fase_nome: 'Scavo', postazione_nome: 'A terra', tipo_misura: 'ambientale', conc_polveri: 1.8, conc_silice: 0.016, portata_q: 2.75 }),
      misura(POLVERI, { fase_nome: 'Smarino', postazione_nome: 'Interno cabina pala', tipo_misura: 'personale', conc_polveri: 0.09, conc_silice: 0.01 }),
      misura(GAS, { fase_nome: 'Scavo', postazione_nome: 'A terra', tipo_prelievo: 'ambientale', no: 2.9, no2: 1.39, co: 1, co2: 0.1, h2s: 0.1, o2: 20.9 }),
      misura(GAS, { fase_nome: 'Smarino', postazione_nome: 'Interno cabina pala', no: 0.2, no2: 0.1, co: 1, co2: 0.1, h2s: 0.1, o2: 20.9 }),
      misura(CARBONIO, { fase_nome: 'Scavo', postazione_nome: 'A terra', conc_ec: 0.044 }),
      misura(AMIANTO, { fase_nome: 'Scavo', postazione_nome: 'A terra', tipo_misura: 'ambientale', conc_fibre_totali: 42, conc_amianto: 18, codice_filtro: 'F01' }),
      misura(AMIANTO, { fase_nome: 'Scavo', postazione_nome: 'A terra', tipo_misura: 'personale', conc_fibre_totali: 30, conc_amianto: 1.1, conc_amianto_sotto_soglia: true }),
      misura(IPA, { fase_nome: 'Scavo', postazione_nome: 'A terra', tipo_misura: 'ambientale', codice_campione: 'IPA-01' }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Terzo Valico dei Giovi', denominazione: 'Castagnola', impresa: 'Consorzio Tunnel Giovi', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_mansioni: [{ id: '44444444-4444-4444-8444-000000000001', cantiere_id: CANTIERE, nome: 'Escavatorista', attivita: null, attiva: true, ordine: 0, created_at: ORA, updated_at: ORA }],
    dvr_ambiti: [{ id: '55555555-5555-4555-8555-000000000001', cantiere_id: CANTIERE, nome: 'Galleria di linea', tipo: 'galleria_tradizionale', ordine: 0, created_at: ORA, updated_at: ORA }],
  }
}

async function apri(page: Page, tabelle: Tabelle, rischio: string, titolo: RegExp) {
  await page.addInitScript(({ hash }) => {
    window.localStorage.setItem('app_pin_hash', hash)
    window.localStorage.setItem('app_locked', '0')
  }, { hash: PIN_HASH_1234 })
  await installaSupabaseFinto(page, tabelle)
  await page.goto(`/cantieri/${CANTIERE}/dvr`)
  await page.getByLabel('Rischio del nuovo DVR').selectOption(rischio)
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: titolo })).toBeVisible()
  await page.getByLabel('Data di emissione').fill('2026-09-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()
}

async function giornataTipo(page: Page, ambiente: string) {
  const matrice = page.locator('section', { hasText: 'MATRICE DEI TEMPI' })
  const mansione = matrice.getByRole('group', { name: 'Escavatorista' })
  await mansione.getByRole('button', { name: '+ Riga' }).click()
  await mansione.getByLabel('Ambiente').selectOption({ label: ambiente })
  await mansione.getByLabel('Minuti').fill('465')
  await mansione.getByRole('button', { name: '+ Pausa 15 min' }).click()
  await expect(mansione).toContainText('480 / 480 min')
  return mansione
}

async function scarica(page: Page) {
  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  return { nome: file.suggestedFilename(), xml, testo: xml.replace(/<[^>]+>/g, ' ') }
}

test('DVR Agenti chimici: ambienti dalle misure, giornata tipo, modello Piemonte e Word', async ({ page }) => {
  test.setTimeout(120_000)
  const tabelle = datiIniziali()
  const errori: string[] = []
  page.on('pageerror', (e) => errori.push(e.message))
  await apri(page, tabelle, 'chimico', /DVR Agenti chimici \(polveri e gas tossici\) – rev\. 00/)
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'chimico', campagne_ids: [POLVERI, GAS] })

  const amb = page.locator('section', { hasText: 'AMBIENTI DI LAVORO E MISURE' })
  await amb.getByRole('button', { name: 'Importa dalle misure (4)' }).click()
  const scavo = amb.getByRole('group', { name: 'Ambiente Scavo – A terra' })
  await expect(scavo.getByLabel('NO₂')).toHaveCount(2)
  await scavo.getByLabel('Mansioni maggiormente esposte').fill('Escavatorista')
  await amb.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Dati del DVR salvati')).toBeVisible()
  expect(tabelle.dvr_documenti?.[0].contenuti).toMatchObject({ chimico: { ambienti: [{ fase: 'Scavo' }, { fase: 'Smarino' }] } })

  const mansione = await giornataTipo(page, 'Scavo – A terra')
  await mansione.getByLabel('NO₂ riga 2').fill('0,02')
  await mansione.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Escavatorista')).toBeVisible()
  expect(tabelle.dvr_tempi?.length).toBe(2)

  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo).toContainText('2 ambienti · 1 mansioni con giornata tipo · 1 con esposizioni oltre il limite')
  await expect(riepilogo.getByRole('row', { name: /Scavo – A terra/ })).toContainText('molto alto')
  await expect(riepilogo).toContainText(/NO₂ 1,35 ppm/)
  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-chimico.png`, fullPage: true })

  const { nome, xml, testo } = await scarica(page)
  expect(nome).toBe('DVR_Chimico_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  expect(testo).toContain('Scavo')
  expect(testo).toContain('Interno cabina pala')
  expect(testo).toContain('TAV. 1 MANSIONE:')
  expect(testo).toContain('ESCAVATORISTA')
  expect(xml).toContain('SEQ Tabella')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})

test('DVR Agenti cancerogeni: silice e carbonio elementare fino al Word', async ({ page }) => {
  test.setTimeout(120_000)
  const tabelle = datiIniziali()
  const errori: string[] = []
  page.on('pageerror', (e) => errori.push(e.message))
  await apri(page, tabelle, 'cancerogeno', /DVR Agenti cancerogeni \(silice e carbonio elementare\) – rev\. 00/)
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'cancerogeno', campagne_ids: [POLVERI, CARBONIO] })

  const amb = page.locator('section', { hasText: 'AMBIENTI DI LAVORO E MISURE' })
  await amb.getByRole('button', { name: 'Importa dalle misure (3)' }).click()
  await amb.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Dati del DVR salvati')).toBeVisible()
  const mansione = await giornataTipo(page, 'Scavo – A terra')
  await mansione.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Escavatorista')).toBeVisible()

  const { nome, xml, testo } = await scarica(page)
  expect(nome).toBe('DVR_Cancerogeno_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  expect(testo).toContain('Silice libera cristallina')
  expect(testo).toContain('TAV. 1 MANSIONE:')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})

test('DVR Amianto: fibre importate, ESEDI ed esposti fino al Word', async ({ page }) => {
  test.setTimeout(120_000)
  const tabelle = datiIniziali()
  const errori: string[] = []
  page.on('pageerror', (e) => errori.push(e.message))
  await apri(page, tabelle, 'amianto', /DVR Amianto – rev\. 00/)
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'amianto', campagne_ids: [AMIANTO] })

  const amb = page.locator('section', { hasText: 'AMBIENTI DI LAVORO E MISURE' })
  await amb.getByRole('button', { name: 'Importa dalle misure (2)' }).click()
  await expect(amb.getByRole('group', { name: 'Ambiente Scavo – A terra' }).getByLabel('Amianto', { exact: true })).toHaveCount(2)
  await amb.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Dati del DVR salvati')).toBeVisible()
  const mansione = await giornataTipo(page, 'Scavo – A terra')
  await mansione.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Escavatorista')).toBeVisible()

  const { nome, xml, testo } = await scarica(page)
  expect(nome).toBe('DVR_Amianto_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  expect(testo).toContain('Fibre di amianto')
  expect(testo).toContain('Campione F01')
  expect(testo).toMatch(/Esposizione non superiore a 10 ff\/L \(8 ore\): Escavatorista \(9,3 ff\/L\)/)
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})

test('DVR IPA: risultati del laboratorio scritti a mano fino al Word', async ({ page }) => {
  test.setTimeout(120_000)
  const tabelle = datiIniziali()
  const errori: string[] = []
  page.on('pageerror', (e) => errori.push(e.message))
  await apri(page, tabelle, 'ipa', /DVR Idrocarburi policiclici aromatici \(IPA\) – rev\. 00/)

  const amb = page.locator('section', { hasText: 'AMBIENTI DI LAVORO E MISURE' })
  await amb.getByRole('button', { name: 'Importa dalle misure (1)' }).click()
  const scavo = amb.getByRole('group', { name: 'Ambiente Scavo – A terra' })
  await scavo.getByLabel('IPA totali', { exact: true }).fill('850')
  await scavo.getByLabel('BaP', { exact: true }).fill('4,2')
  await scavo.getByLabel('BaP eq.', { exact: true }).fill('9,8')
  await amb.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Dati del DVR salvati')).toBeVisible()
  const mansione = await giornataTipo(page, 'Scavo – A terra')
  await mansione.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Escavatorista')).toBeVisible()

  const { nome, xml, testo } = await scarica(page)
  expect(nome).toBe('DVR_IPA_Consorzio_Tunnel_Giovi_2026_Castagnola_rev00.docx')
  expect(testo).toContain('Benzo[a]pirene')
  expect(testo).toContain('Campione IPA-01')
  expect(testo).toMatch(/Escavatorista \(4,07 ng\/m³\)/)
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9_]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})
