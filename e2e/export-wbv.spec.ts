import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import {
  seedWbvCampagna,
  cleanup,
  WBV_AW_X,
  WBV_AW_Y,
  WBV_AW_Z,
  type SeedIds,
} from './helpers/testDb';

const PIN_HASH_1234 =
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

async function bypassPinLock(page: Page) {
  await page.addInitScript(
    ({ hash }) => {
      window.localStorage.setItem('app_pin_hash', hash);
      window.localStorage.setItem('app_locked', '0');
    },
    { hash: PIN_HASH_1234 },
  );
}

test.describe('Export WBV — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedWbvCampagna();
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

  test('esporta campagna WBV e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/vibrazioni-wbv/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_WBV_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('CI');
    expect(ws, "worksheet 'CI' presente").toBeTruthy();
    if (!ws) return;

    expect(ws.getCell('B1').value).toBe('Committente Test');
    expect(ws.getCell('K5').value).toBe(WBV_AW_X);
    expect(ws.getCell('L5').value).toBe(WBV_AW_Y);
    expect(ws.getCell('M5').value).toBe(WBV_AW_Z);
  });
});
