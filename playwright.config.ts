import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ── Carica .env.test ────────────────────────────────────────────────────────
// dotenv NON è installato: parser manuale key=value (ignora commenti e righe vuote).
// Popola process.env senza sovrascrivere variabili già presenti nell'ambiente.
const __dirname = dirname(fileURLToPath(import.meta.url));
const envTestPath = resolve(__dirname, '.env.test');
if (existsSync(envTestPath)) {
  const raw = readFileSync(envTestPath, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Playwright avvia il dev server puntato al DB di TEST (mai la prod).
  // reuseExistingServer:false → non riusa per sbaglio un dev server già aperto
  // (magari puntato alla prod). Se la 5173 è occupata, chiudere il dev manuale.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      VITE_SUPABASE_URL: process.env.E2E_SUPABASE_URL!,
      VITE_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY!,
      VITE_E2E_AUTH_BYPASS: 'true',
    },
  },
});
