import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import { seedBlocco4x8Campagna, cleanup, type SeedIds } from './helpers/testDb';

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

// camelCase: debt noto del modulo owas, non normalizzare
const OWAS_SCHIENA = 2;
const OWAS_CLASSE = 3;

test.describe('Export OWAS — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'posture_owas',
      dati: {
        mansione: 'VAL_OWAS_1',
        attivita: 'VAL_OWAS_2',
        durata: 30,
        schiena: OWAS_SCHIENA,
        braccia: 1,
        gambe: 3,
        carico: 1,
        classe: OWAS_CLASSE,
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

  test('esporta campagna owas e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/owas/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_OWAS_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // E1 = cantiere nome (owas usa E1, non F1)
    expect(ws.getCell('E1').value).toBe(seed.cantiereNome);
    // E5 = schiena misura 1 (dataStartRow 5, idx 0) — numFmt 0 → number
    expect(ws.getCell('E5').value).toBe(OWAS_SCHIENA);
    // I5 = classe misura 1 — numFmt 0 → number
    expect(ws.getCell('I5').value).toBe(OWAS_CLASSE);
  });
});
