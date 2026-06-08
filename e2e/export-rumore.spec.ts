import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import {
  seedRumoreCampagna,
  cleanup,
  RUMORE_LEQ_DBA,
  type SeedIds,
} from './helpers/testDb';

// SHA-256 di "1234" — PIN per bypassare l'AppLock (replica da rumore-modal.spec.ts).
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

test.describe('Export Rumore — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedRumoreCampagna();
  });

  test.afterAll(async () => {
    // Il teardown non deve fallire la suite se il delete va in errore.
    if (seed) {
      try {
        await cleanup(seed);
      } catch (e) {
        console.warn('[afterAll] cleanup fallito:', e);
      }
    }
  });

  test('esporta campagna rumore e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    // Route reale (App.tsx): /cantieri/:id/moduli/:moduloId/campagne/:campagnaId
    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/rumore/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    // === Trigger download ===
    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    // Nome file: {cantiereSafe}_Rumore_{YYYY-MM-DD}.xlsx
    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_Rumore_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    // === Parse con ExcelJS e verifica contenuto ===
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');

    // F4 = Leq dB(A) della misura 1 (blocco 1, dataStartRow 4, idx 0)
    expect(ws.getCell('F4').value).toBe(RUMORE_LEQ_DBA);
  });
});
