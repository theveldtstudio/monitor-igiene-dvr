import { test, expect, type Page } from '@playwright/test';

// SHA-256 di "1234" — il PIN che useremo per bypassare l'AppLock
const PIN_HASH_1234 =
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

/**
 * Inietta lo stato di PIN già configurato e sbloccato nel localStorage
 * PRIMA che l'app carichi. Questo evita la schermata di setup PIN.
 */
async function bypassPinLock(page: Page) {
  await page.addInitScript(
    ({ hash }) => {
      window.localStorage.setItem('app_pin_hash', hash);
      window.localStorage.setItem('app_locked', '0');
    },
    { hash: PIN_HASH_1234 },
  );
}

test.describe('Modale Rumore — flusso UI completo (senza salvataggio)', () => {
  let nomeCantiereTest: string;

  test.beforeEach(async ({ page }) => {
    nomeCantiereTest = `TEST_E2E_${Date.now()}`;
    await bypassPinLock(page);
  });

  test('apri modale Rumore, compila Leq dB(A), verifica stato UI', async ({
    page,
  }) => {
    // === FASE 1: Home — crea cantiere ===
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Apri modale "Nuovo cantiere"
    await page.getByRole('button', { name: '+ Nuovo cantiere' }).click();

    // Compila nome cantiere
    const inputNome = page.locator('#cantiere-nome');
    await expect(inputNome).toBeVisible();
    await inputNome.fill(nomeCantiereTest);

    // Salva cantiere
    await page.getByRole('button', { name: 'Crea', exact: true }).click();

    // Attendi che il modale si chiuda e la card del cantiere appaia
    await expect(
      page.getByTestId('cantiere-card').filter({ hasText: nomeCantiereTest }),
    ).toBeVisible({ timeout: 5000 });

    // === FASE 2: clicca card cantiere ===
    await page
      .getByTestId('cantiere-card')
      .filter({ hasText: nomeCantiereTest })
      .click();

    // Attendi navigazione a /cantieri/:id
    await page.waitForURL(/\/cantieri\/[a-f0-9-]+$/);

    // === FASE 3: clicca card modulo Rumore ===
    await page.getByTestId('modulo-card-rumore').click();

    // Attendi navigazione a /cantieri/:id/moduli/rumore
    await page.waitForURL(/\/cantieri\/[a-f0-9-]+\/moduli\/rumore$/);

    // === FASE 4: crea campagna ===
    await page.getByRole('button', { name: '+ Nuova campagna' }).click();

    // Il campo datetime dovrebbe essere già pre-filled, basta cliccare "Crea e apri"
    await page.getByRole('button', { name: 'Crea e apri' }).click();

    // Attendi navigazione a foglio campagna
    await page.waitForURL(
      /\/cantieri\/[a-f0-9-]+\/moduli\/rumore\/campagne\/[a-f0-9-]+$/,
    );

    // === FASE 5: apri modale Nuova misura ===
    await page.getByRole('button', { name: 'Aggiungi misura' }).click();

    // === FASE 6: verifica struttura modale ===
    const modale = page.getByRole('dialog');
    await expect(modale).toBeVisible();

    // Il titolo del modale deve esistere
    await expect(modale).toContainText(/Nuova misura|Rumore/);

    // Tutti i campi attesi devono essere presenti
    await expect(modale.locator('#ms-leq-dba')).toBeVisible();
    await expect(modale.locator('#ms-leq-dbc')).toBeVisible();
    await expect(modale.locator('#ms-lpeak')).toBeVisible();
    await expect(modale.locator('#ms-durata')).toBeVisible();

    // Il bottone Salva esiste
    const bottoneSalva = page.getByRole('button', { name: 'Salva misura' });
    await expect(bottoneSalva).toBeVisible();

    // === FASE 7: compila Leq dB(A) ===
    await modale.locator('#ms-leq-dba').fill('87,4');

    // Verifica che il valore sia stato inserito
    await expect(modale.locator('#ms-leq-dba')).toHaveValue('87,4');

    // === FASE 8: verifica che il bottone Salva sia abilitato ===
    // (non è disabled — segno che la validation client-side accetta il valore)
    await expect(bottoneSalva).toBeEnabled();

    // === NON cliccare salva — il test finisce qui ===
    // Chiudi il modale via tasto Annulla per pulizia visiva
    // Il form è dirty (abbiamo compilato Leq) → MisuraModalShell mostra dialog di conferma
    await page.getByRole('button', { name: 'Annulla' }).click();
    await page.getByRole('button', { name: 'Scarta' }).click();
    await expect(modale).not.toBeVisible({ timeout: 3000 });
  });
});
