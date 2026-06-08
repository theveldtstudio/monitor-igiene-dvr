import { cleanupByPrefix } from './helpers/testDb';

// Sweep finale: rimuove ogni cantiere TEST_E2E_% (e figli) creato dai test,
// inclusi quelli generati via UI (es. rumore-modal.spec.ts) che non fanno
// cleanup proprio. Garantisce un progetto Supabase di test pulito.
export default async function globalTeardown() {
  try {
    await cleanupByPrefix();
  } catch (e) {
    console.warn('[globalTeardown] cleanupByPrefix fallito:', e);
  }
}
