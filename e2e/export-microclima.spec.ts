import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import {
  seedBlocco4x8Campagna,
  cleanup,
  MICROCLIMA_TA,
  MICROCLIMA_WBGT,
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

test.describe('Export Microclima — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'microclima',
      dati: {
        ta: MICROCLIMA_TA,
        tg: 12.2,
        tnw: 13.3,
        ur: 50,
        va: 0.5,
        wbgt: MICROCLIMA_WBGT,
        postazione_nome: 'Postazione Test',
        fase_nome: 'Fase Test',
        ambiente: 'Interno',
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

  test('esporta campagna microclima e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/microclima/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_Microclima_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // E4 = ta misura 1 (blocco 1, dataStartRow 4, idx 0)
    expect(ws.getCell('E4').value).toBe(MICROCLIMA_TA);
    // J4 = wbgt misura 1
    expect(ws.getCell('J4').value).toBe(MICROCLIMA_WBGT);
  });
});
