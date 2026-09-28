import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import {
  seedBlocco4x8Campagna,
  cleanup,
  POLVERI_CONC_POLVERI,
  POLVERI_CONC_SILICE,
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

test.describe('Export Polveri — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'polveri',
      dati: {
        fase_nome: 'Fase Test',
        postazione_nome: 'Postazione Test',
        tipo_misura: 'personale',
        codice_filtro: 'F001',
        pompa: 'Pompa Test',
        portata_q: 2.0,
        durata_prelievo: 120,
        volume_campionato: 240,
        polveri_filtro: 0.5,
        conc_polveri: POLVERI_CONC_POLVERI,
        silice_filtro_valore: 0.1,
        conc_silice: POLVERI_CONC_SILICE,
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

  test('esporta campagna polveri e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/polveri/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_Polveri_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // L4 = conc_polveri misura 1 (blocco 1, dataStartRow 4, idx 0)
    expect(ws.getCell('L4').value).toBe(POLVERI_CONC_POLVERI);
    // N4 = conc_silice misura 1 (conc_silice_sotto_soglia non impostato → numero diretto)
    expect(ws.getCell('N4').value).toBe(POLVERI_CONC_SILICE);
  });
});
