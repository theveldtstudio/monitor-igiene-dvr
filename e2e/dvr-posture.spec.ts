/**
 * DVR Posture con Supabase finto in memoria: catalogo dalle misure OWAS, giornate tipo, Word.
 */
import { expect, test } from '@playwright/test'
import PizZip from 'pizzip'
import { readFileSync } from 'node:fs'
import { installaSupabaseFinto, type Tabelle } from './helpers/supabaseFinto'

const PIN_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
const CANTIERE = '11111111-1111-4111-8111-111111111111'
const CAMP_OWAS = '22222222-2222-4222-8222-222222222222'
const ORA = '2026-05-20T08:00:00Z'

function datiIniziali(): Tabelle {
  const misura = (n: number, dati: Record<string, unknown>) => ({
    id: `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`,
    campagna_id: CAMP_OWAS,
    numero: n,
    dati,
    note: '',
    sync_pending: false,
    created_at: ORA,
    updated_at: ORA,
  })
  return {
    cantieri: [{ id: CANTIERE, nome: 'Castagnola', indirizzo: 'Fraconalto', committente: 'CTG', stato: 'aperto', created_at: ORA, updated_at: ORA }],
    campagne: [{ id: CAMP_OWAS, cantiere_id: CANTIERE, tipo_campionamento: 'posture_owas', data_ora: ORA, strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: ORA, updated_at: ORA }],
    misure: [
      // classe salvata con la tabella vecchia (3): il DVR la ricalcola dal codice
      misura(1, { mansione: 'Carpentiere', attivita: 'Armatura murette', durata: 240, schiena: 2, braccia: 1, gambe: 4, carico: 1, classe: 3 }),
      misura(2, { mansione: 'Carpentiere', attivita: 'Getto murette', durata: 150, schiena: 1, braccia: 1, gambe: 2, carico: 1, classe: 1 }),
      misura(3, { mansione: 'Carpentiere', attivita: 'Disarmo cassero', durata: 45, schiena: 4, braccia: 1, gambe: 2, carico: 1, classe: 3 }),
    ],
    dvr_anagrafica_cantiere: [{ cantiere_id: CANTIERE, comune: 'Fraconalto', provincia: 'Alessandria', opera: 'Terzo Valico dei Giovi', denominazione: 'Castagnola', impresa: 'CTG', datore_lavoro: 'Ing. Rossi', rspp: '', medico_competente: '', rls: ['Primo RLS'], gruppo_lavoro: ['Davide Bettini'], redatto: 'Davide Bettini', verificato: '', approvato: '' }],
    dvr_ambiti: [{ id: '66666666-6666-4666-8666-000000000001', cantiere_id: CANTIERE, nome: 'Gallerie', tipo: 'galleria_tradizionale', metodo_scavo: 'esplosivo', descrizione: null, ordine: 0 }],
    dvr_mansioni: [
      { id: '44444444-4444-4444-8444-000000000001', cantiere_id: CANTIERE, nome: 'Carpentiere', attivita: 'Armatura e getto', attiva: true, ordine: 0, created_at: ORA, updated_at: ORA },
      { id: '44444444-4444-4444-8444-000000000002', cantiere_id: CANTIERE, nome: 'Minatore', attivita: 'Attività al fronte', attiva: true, ordine: 1, created_at: ORA, updated_at: ORA },
    ],
  }
}

test('DVR Posture: catalogo OWAS e giornate tipo fino al Word', async ({ page }) => {
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
  await page.getByLabel('Rischio del nuovo DVR').selectOption('posture')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Posture incongrue – rev\. 00/ })).toBeVisible()
  expect(tabelle.dvr_documenti?.[0]).toMatchObject({ rischio: 'posture', campagne_ids: [CAMP_OWAS] })

  await page.getByLabel('Data di emissione').fill('2026-07-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  // Catalogo: tre attività dalle misure OWAS
  const catalogo = page.locator('section', { hasText: 'CATALOGO DELLE ATTIVITÀ' })
  await catalogo.getByRole('button', { name: 'Importa dalle misure OWAS (3)' }).click()
  const disarmo = catalogo.getByRole('group', { name: 'Attività Disarmo cassero' })
  await expect(disarmo).toContainText('classe 2')
  await catalogo.getByRole('button', { name: 'Salva catalogo' }).click()
  await expect(page.getByText('Catalogo salvato')).toBeVisible()

  // Carpentiere: righe dalle misure + pause → 240 min classe 3 su 480: rischio medio
  const carp = page.getByRole('group', { name: 'Carpentiere' })
  await carp.getByRole('button', { name: 'Importa dalle misure OWAS (3)' }).click()
  await carp.getByRole('button', { name: '+ Pause' }).click()
  await expect(carp).toContainText('480 / 480 min')
  await expect(carp).toContainText('Indice 209,4 · rischio medio')
  await carp.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Carpentiere')).toBeVisible()

  // Minatore: giornata con operazioni ordinarie ripartite sulle quattro classi
  const min = page.getByRole('group', { name: 'Minatore' })
  await min.getByRole('button', { name: '+ Giornata tipo' }).click()
  const r0 = min.locator('tbody tr').nth(0)
  await r0.getByPlaceholder('Fase').fill('Scavo')
  await r0.getByPlaceholder('Attività').fill('Assistenza allo scavo')
  await r0.getByLabel('Minuti').fill('300')
  await min.getByRole('button', { name: '+ Operazioni ordinarie' }).click()
  await min.locator('tbody tr').nth(1).getByLabel('Minuti').fill('180')
  await expect(min).toContainText('Indice 156,3 · rischio lieve')
  await min.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Minatore')).toBeVisible()

  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-posture.png`, fullPage: true })
  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo).toContainText('209,4')
  await expect(riepilogo).toContainText('Medio')
  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_Posture_CTG_2026_Castagnola_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('TAV 1: CARPENTIERE')
  expect(testo).toContain('RISCHIO MEDIO')
  expect(testo).toContain('Disarmo cassero')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.0-9]+\}/)
  expect(xml).not.toMatch(/[⁣⁤]/)
  expect(errori).toEqual([])
})
