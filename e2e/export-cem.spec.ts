import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import {
  seedBlocco4x8Campagna,
  cleanup,
  CEM_CAMPO_E,
  CEM_INDICE_ESPOSIZIONE,
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

test.describe('Export CEM — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'cem',
      dati: {
        campo_e: CEM_CAMPO_E,
        campo_h: 0.5,
        induzione_b: 0.8,
        frequenza: 50,
        unita_frequenza: 'Hz',
        distanza: 1.0,
        limite_riferimento: 'ICNIRP',
        indice_esposizione: CEM_INDICE_ESPOSIZIONE,
        postazione_nome: 'Postazione Test',
        fase_nome: 'Fase Test',
        sorgente: 'Sorgente Test',
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

  test('esporta campagna CEM e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/cem/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_CEM_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // G4 = campo_e misura 1 (blocco 1, dataStartRow 4, idx 0)
    expect(ws.getCell('G4').value).toBe(CEM_CAMPO_E);
    // K4 = indice_esposizione misura 1
    expect(ws.getCell('K4').value).toBe(CEM_INDICE_ESPOSIZIONE);
  });
});
