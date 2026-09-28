import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import { seedBlocco4x8Campagna, cleanup, type SeedIds } from './helpers/testDb';

const PIN_HASH_1234 =
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

const BIOLOGICO_CONTA_22 = 101.1;
const BIOLOGICO_CONTA_36 = 102.2;

async function bypassPinLock(page: Page) {
  await page.addInitScript(
    ({ hash }) => {
      window.localStorage.setItem('app_pin_hash', hash);
      window.localStorage.setItem('app_locked', '0');
    },
    { hash: PIN_HASH_1234 },
  );
}

test.describe('Export Biologico SAS — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'biologico_sas',
      dati: {
        codice_filtro: 'F001',
        postazione_nome: 'Postazione Test',
        fase_nome: 'Fase Test',
        tempo_prelievo: '10 min',
        volume_aspirato: 100,
        conta_22: BIOLOGICO_CONTA_22,
        conta_36: BIOLOGICO_CONTA_36,
        muffe_lieviti: 50,
      },
    });
  });

  test.afterAll(async () => {
    if (seed) {
      try {
        await cleanup(seed);
      } catch (e) {
        console.warn('[afterAll] cleanup fallito:', e);
      }
    }
  });

  test('esporta campagna biologico SAS e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/biologico-sas/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_Biologico_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // H4 = conta_22 misura 1 (no raw/sotto_soglia → numero diretto)
    expect(ws.getCell('H4').value).toBe(BIOLOGICO_CONTA_22);
    // I4 = conta_36 misura 1
    expect(ws.getCell('I4').value).toBe(BIOLOGICO_CONTA_36);
  });
});
