import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('si carica senza errori console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Asserzione 1: la pagina ha caricato e c'è almeno un elemento visibile
    await expect(page.locator('body')).toBeVisible();

    // Asserzione 2: nessun errore console critico
    // Filtriamo errori noti non bloccanti (es. favicon, ServiceWorker dev)
    const errorsFiltrati = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ServiceWorker') &&
        !e.includes('Manifest'),
    );
    expect(errorsFiltrati).toEqual([]);
  });
});
