import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import { seedBlocco4x8Campagna, cleanup, type SeedIds } from './helpers/testDb';

const PIN_HASH_1234 =
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

const ROA_IRRADIANZA_E = 71.1;
const ROA_INDICE_ESPOSIZIONE = 72.2;

async function bypassPinLock(page: Page) {
  await page.addInitScript(
    ({ hash }) => {
      window.localStorage.setItem('app_pin_hash', hash);
      window.localStorage.setItem('app_locked', '0');
    },
    { hash: PIN_HASH_1234 },
  );
}

test.describe('Export ROA — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'roa',
      dati: {
        postazione_nome: 'Postazione Test',
        fase_nome: 'Fase Test',
        sorgente: 'Sorgente Test',
        banda: 'UV-A',
        lunghezza_onda: 365,
        distanza: 0.5,
        irradianza_e: ROA_IRRADIANZA_E,
        radianza_l: 10.0,
        tempo_esposizione: 120,
        h_radiant: 5.0,
        limite_riferimento: 'ICNIRP',
        indice_esposizione: ROA_INDICE_ESPOSIZIONE,
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

  test('esporta campagna ROA e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/roa/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_ROA_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // H4 = irradianza_e misura 1 (blocco 1, dataStartRow 4, idx 0)
    expect(ws.getCell('H4').value).toBe(ROA_IRRADIANZA_E);
    // M4 = indice_esposizione misura 1
    expect(ws.getCell('M4').value).toBe(ROA_INDICE_ESPOSIZIONE);
  });
});
