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

const MMC_CARICO = 15;
const MMC_DISLOCAZIONE_ANGOLARE = 45;

test.describe('Export MMC — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'mmc',
      dati: {
        carico: MMC_CARICO,
        altezza_mani: 80,
        distanza_verticale: 50,
        distanza_peso_corpo: 30,
        dislocazione_angolare: MMC_DISLOCAZIONE_ANGOLARE,
        frequenza_gesti: 10,
        frequenza_unita: 'atti/min',
        giudizio_presa: 'buona',
        n_persone: 1,
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

  test('esporta campagna mmc e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/mmc/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_MMC_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // B5 = carico misura 1 (blocco 1, dataStartRow 5, idx 0)
    expect(ws.getCell('B5').value).toBe(MMC_CARICO);
    // F5 = dislocazione_angolare misura 1
    expect(ws.getCell('F5').value).toBe(MMC_DISLOCAZIONE_ANGOLARE);
  });
});
