import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import { seedBlocco4x8Campagna, cleanup, type SeedIds } from './helpers/testDb';

const PIN_HASH_1234 =
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

const IPA_CODICE_CAMPIONE = 'VAL_IPA_1';
const IPA_VOLUME_CAMPIONATO = 113.3;

async function bypassPinLock(page: Page) {
  await page.addInitScript(
    ({ hash }) => {
      window.localStorage.setItem('app_pin_hash', hash);
      window.localStorage.setItem('app_locked', '0');
    },
    { hash: PIN_HASH_1234 },
  );
}

test.describe('Export IPA — seed via service-key, verifica contenuto Excel', () => {
  let seed: SeedIds;

  test.beforeAll(async () => {
    seed = await seedBlocco4x8Campagna({
      tipoCampionamento: 'ipa',
      dati: {
        fase_nome: 'Fase Test',
        postazione_nome: 'Postazione Test',
        tipo_misura: 'personale',
        codice_campione: IPA_CODICE_CAMPIONE,
        numero_fiala: 'F-001',
        pompa: 'Pompa Test',
        portata_q: 2.0,
        durata_prelievo: 120,
        volume_campionato: IPA_VOLUME_CAMPIONATO,
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

  test('esporta campagna IPA e verifica contenuto Excel', async ({ page }) => {
    await bypassPinLock(page);

    await page.goto(
      `/cantieri/${seed.cantiereId}/moduli/ipa/campagne/${seed.campagnaId}`,
    );
    await page.waitForLoadState('networkidle');

    const bottoneEsporta = page.getByRole('button', { name: 'Esporta in Excel' });
    await expect(bottoneEsporta).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bottoneEsporta.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^TEST_E2E_\d+_IPA_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );

    const filePath = await download.path();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const ws = workbook.getWorksheet('Foglio1');
    expect(ws, "worksheet 'Foglio1' presente").toBeTruthy();
    if (!ws) return;

    // B1 = committente (header blocco 1)
    expect(ws.getCell('B1').value).toBe('Committente Test');
    // F4 = codice_campione misura 1 (campo testo)
    expect(ws.getCell('F4').value).toBe(IPA_CODICE_CAMPIONE);
    // K4 = volume_campionato misura 1
    expect(ws.getCell('K4').value).toBe(IPA_VOLUME_CAMPIONATO);
  });
});
