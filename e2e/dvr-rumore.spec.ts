/**
 * Percorso completo del DVR Rumore con un Supabase finto in memoria (nessun database reale):
 * anagrafica → ambito → mansioni con conferma → DPI → taratura → nuovo DVR → matrice tempi → Word.
 */
import { expect, test, type Page } from '@playwright/test'
import PizZip from 'pizzip'
import { readFileSync } from 'node:fs'
import { RILIEVI_XENIA } from '../src/dvr/rumore/__fixtures__/xenia2026Extra'
import { installaSupabaseFinto, type Tabelle } from './helpers/supabaseFinto'

const PIN_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
const CANTIERE = '11111111-1111-4111-8111-111111111111'
const CAMPAGNA = '22222222-2222-4222-8222-222222222222'

function datiIniziali(): Tabelle {
  return {
    cantieri: [{ id: CANTIERE, nome: 'Xenia TBM1', indirizzo: 'Battipaglia', committente: 'Consorzio Xenia', stato: 'aperto', created_at: '2026-05-01T08:00:00Z', updated_at: '2026-05-01T08:00:00Z' }],
    campagne: [{ id: CAMPAGNA, cantiere_id: CANTIERE, tipo_campionamento: 'rumore', data_ora: '2026-05-20T08:00:00Z', strumento_id: null, tecnici_ids: [], pin_tecnico: '', pin_osservatore: '', stato: 'completa', sync_pending: false, created_at: '2026-05-20T08:00:00Z', updated_at: '2026-05-20T08:00:00Z' }],
    misure: RILIEVI_XENIA.map((r, i) => ({
      id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
      campagna_id: CAMPAGNA,
      numero: i + 1,
      dati: { fase_nome: r.fase, postazione_nome: r.postazione, macchine_nomi: [r.macchine], leq_dba: r.laeq, leq_dbc: r.lceq, lpeak_dbc: r.lpeak },
      note: '',
      sync_pending: false,
      created_at: '2026-05-20T08:00:00Z',
      updated_at: '2026-05-20T08:00:00Z',
    })),
  }
}

async function preparaPagina(page: Page, tabelle: Tabelle) {
  await page.addInitScript(({ hash }) => {
    window.localStorage.setItem('app_pin_hash', hash)
    window.localStorage.setItem('app_locked', '0')
  }, { hash: PIN_HASH_1234 })
  await installaSupabaseFinto(page, tabelle)
}

test('DVR Rumore: dall’anagrafica al documento Word', async ({ page }) => {
  test.setTimeout(120_000)
  const tabelle = datiIniziali()
  await preparaPagina(page, tabelle)
  const errori: string[] = []
  page.on('pageerror', (e) => errori.push(e.message))

  await page.goto(`/cantieri/${CANTIERE}`)
  await page.getByTestId('link-dvr').click()
  await expect(page.getByText('Prima volta per questo cantiere')).toBeVisible()

  // Anagrafica
  await page.getByLabel('Comune').fill('Battipaglia')
  await page.getByLabel('Provincia').fill('Salerno')
  await page.getByLabel('Opera / tratta / lotto').fill('Linea AV Salerno-Reggio Calabria, Lotto 1A')
  await page.getByLabel('Datore di lavoro').fill('Ing. Mario Rossi')
  await page.getByLabel('RLS (uno per riga)').fill('Primo RLS\nSecondo RLS')
  await page.getByRole('button', { name: 'Salva anagrafica' }).click()
  await expect(page.getByText('Anagrafica salvata')).toBeVisible()
  expect(tabelle.dvr_anagrafica_cantiere?.[0]).toMatchObject({ comune: 'Battipaglia', rls: ['Primo RLS', 'Secondo RLS'], denominazione: 'Xenia TBM1' })

  // Ambito
  await page.getByLabel('Nome ambito').fill('Galleria TBM1')
  await page.getByRole('button', { name: 'Aggiungi ambito' }).click()
  await expect(page.getByRole('cell', { name: 'Galleria – TBM' })).toBeVisible()

  // Mansioni: ogni modifica chiede conferma e finisce nello storico
  for (const nome of ['Operatore MSV', 'Gruista']) {
    await page.getByLabel('Nuova mansione').fill(nome)
    await page.getByRole('button', { name: 'Aggiungi mansione' }).click()
    await expect(page.getByRole('alertdialog')).toContainText('Aggiungere la mansione')
    await page.getByRole('button', { name: 'Conferma' }).click()
    await expect(page.getByRole('cell', { name: nome, exact: true })).toBeVisible()
  }
  expect(tabelle.dvr_mansioni_modifiche).toHaveLength(2)

  // DPI
  await page.getByRole('button', { name: 'Aggiungi DPI' }).click()
  await page.getByLabel('Nome e modello').fill('Coverguard 30215')
  await page.getByLabel('H [dB]').fill('38')
  await page.getByLabel('M [dB]').fill('37')
  await page.getByLabel('L [dB]').fill('35')
  await page.getByRole('button', { name: 'Salva DPI' }).click()
  await expect(page.getByRole('cell', { name: 'Coverguard 30215' })).toBeVisible()

  // Taratura (sezione chiusa di default)
  await page.getByRole('button', { name: /TARATURE DELLA STRUMENTAZIONE/ }).click()
  await page.getByLabel('Strumento', { exact: true }).fill('Fonometro')
  await page.getByLabel('Matricola').fill('2743')
  await page.getByLabel('Data taratura').fill('2025-03-14')
  const sezTarature = page.locator('section', { hasText: 'TARATURE DELLA STRUMENTAZIONE' })
  await sezTarature.getByRole('button', { name: 'Aggiungi' }).click()
  await expect(page.getByRole('cell', { name: '2743' })).toBeVisible()

  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/pagina-dvr.png`, fullPage: true })

  // Nuovo DVR
  await page.getByLabel('Rischio del nuovo DVR').selectOption('rumore')
  await page.getByRole('button', { name: '+ Nuovo DVR' }).click()
  await expect(page.getByRole('heading', { name: /DVR Rumore – rev\. 00/ })).toBeVisible()
  await page.getByLabel('Periodo di riferimento').fill('Maggio – Giugno 2026')
  await page.getByLabel('Data di emissione').fill('2026-07-15')
  await page.locator('section', { hasText: 'DATI DEL DOCUMENTO' }).getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('Documento salvato')).toBeVisible()

  // Matrice tempi dell'Operatore MSV: trasporto conci 400 min + piazzale 65 + pausa 15 (come TAV.3 Xenia)
  const card = page.getByRole('group', { name: 'Operatore MSV' })
  await card.getByRole('button', { name: '+ Riga' }).click()
  await card.getByRole('button', { name: '+ Riga' }).click()
  const righe = card.locator('tbody tr')
  await righe.nth(0).locator('input').first().fill('400')
  await righe.nth(0).locator('select').nth(1).selectOption({ label: '12. Trasporto conci – Interno cabina MSV (83,0 dB(A))' })
  await righe.nth(1).locator('input').first().fill('65')
  await righe.nth(1).locator('select').nth(1).selectOption({ label: '15. Attività ordinaria sul piazzale – A terra (78,2 dB(A))' })
  await card.getByRole('button', { name: '+ Pausa 15 min (65 dB)' }).click()
  await expect(card).toContainText('480 / 480 min')
  await expect(card).toContainText('LEX 82,4 ± 1,3 dB(A)')
  await expect(card).toContainText('2ª fascia')
  await card.getByRole('button', { name: 'Salva mansione' }).click()
  await expect(page.getByText('Salvata: Operatore MSV')).toBeVisible()
  expect(tabelle.dvr_tempi).toHaveLength(3)

  if (process.env.DVR_SCREEN_DIR) await page.screenshot({ path: `${process.env.DVR_SCREEN_DIR}/editor-dvr.png`, fullPage: true })

  // Il Gruista non ha tempi: lo tolgo da questo DVR
  const cardGruista = page.getByRole('group', { name: 'Gruista' })
  await cardGruista.getByRole('button', { name: 'Togli dal DVR' }).click()
  await expect(page.getByRole('group', { name: 'Gruista' })).toHaveCount(0)

  // Riepilogo e generazione
  const riepilogo = page.locator('section', { hasText: 'RIEPILOGO E CONTROLLI' })
  await expect(riepilogo.getByRole('cell', { name: '82,4 ± 1,3' })).toBeVisible()
  const download = page.waitForEvent('download')
  await riepilogo.getByRole('button', { name: 'Genera DVR Word' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DVR_Rumore_Consorzio_Xenia_2026_Xenia_TBM1_rev00.docx')
  const xml = new PizZip(readFileSync(await file.path())).file('word/document.xml')!.asText()
  const testo = xml.replace(/<[^>]+>/g, ' ')
  expect(testo).toContain('COMUNE DI BATTIPAGLIA')
  expect(testo).toContain('TAV. 1 – OPERATORE MSV')
  expect(testo).toContain('82,4 ± 1,3')
  expect(testo).toContain('Fonometro')
  expect(testo).not.toMatch(/\{[#/^]?[A-Za-z.]+\}/)
  expect(errori).toEqual([])
})
