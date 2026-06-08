import { createClient } from '@supabase/supabase-js';

// Client admin (service-key) verso il progetto Supabase di TEST.
// Gira in Node (fuori dal browser): scrive/pulisce i dati di seed.
// Le env arrivano da .env.test, caricato in playwright.config.ts.
const url = process.env.E2E_SUPABASE_URL;
const serviceKey = process.env.E2E_SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'E2E_SUPABASE_URL / E2E_SUPABASE_SERVICE_KEY mancanti: .env.test non caricato?',
  );
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface SeedIds {
  cantiereId: string;
  campagnaId: string;
  misuraId: string;
  cantiereNome: string;
}

/**
 * `dati` rumore minimo ma valido per l'export: Leq dB(A) seedato a 87.4.
 * Le chiavi rispecchiano quelle lette da exportSchemas.ts (fillRumoreSheet).
 */
export const RUMORE_LEQ_DBA = 87.4;

const datiRumore = {
  leq_dba: RUMORE_LEQ_DBA,
  leq_dbc: 90.1,
  lpeak_dbc: 110.5,
  durata_minuti: 30,
  postazione_nome: 'Postazione Test',
  fase_nome: 'Fase Test',
  macchine_nomi: [] as string[],
};

/**
 * Seed di 1 cantiere + 1 campagna rumore (bozza) + 1 misura (numero 1).
 * Ritorna gli id creati per navigazione e cleanup.
 */
export async function seedRumoreCampagna(): Promise<SeedIds> {
  const cantiereNome = `TEST_E2E_${Date.now()}`;

  const { data: cantiere, error: e1 } = await admin
    .from('cantieri')
    .insert({
      nome: cantiereNome,
      indirizzo: 'Via Test 1',
      committente: 'Committente Test',
      stato: 'aperto',
    })
    .select('id')
    .single();
  if (e1) throw new Error(`seed cantiere: ${e1.message}`);
  const cantiereId = cantiere.id as string;

  const { data: campagna, error: e2 } = await admin
    .from('campagne')
    .insert({
      cantiere_id: cantiereId,
      tipo_campionamento: 'rumore',
      data_ora: new Date().toISOString(),
      tecnici_ids: [],
      pin_tecnico: '',
      pin_osservatore: '',
      stato: 'bozza',
      sync_pending: false,
    })
    .select('id')
    .single();
  if (e2) throw new Error(`seed campagna: ${e2.message}`);
  const campagnaId = campagna.id as string;

  const { data: misura, error: e3 } = await admin
    .from('misure')
    .insert({
      campagna_id: campagnaId,
      numero: 1,
      dati: datiRumore,
      note: '',
    })
    .select('id')
    .single();
  if (e3) throw new Error(`seed misura: ${e3.message}`);
  const misuraId = misura.id as string;

  return { cantiereId, campagnaId, misuraId, cantiereNome };
}

/**
 * Cleanup FK-safe degli id passati:
 * foto_misura → misure → campagne → risorse_cantiere → cantieri.
 * Non solleva: il teardown non deve fallire per errori di delete.
 */
export async function cleanup(ids: SeedIds): Promise<void> {
  await admin.from('foto_misura').delete().eq('misura_id', ids.misuraId);
  await admin.from('misure').delete().eq('id', ids.misuraId);
  await admin.from('campagne').delete().eq('id', ids.campagnaId);
  await admin.from('risorse_cantiere').delete().eq('cantiere_id', ids.cantiereId);
  await admin.from('cantieri').delete().eq('id', ids.cantiereId);
}

/**
 * Sweep di sicurezza: elimina tutti i cantieri TEST_E2E_% e i relativi figli.
 * FK-safe. Usato per ripulire residui da run precedenti interrotti.
 */
export async function cleanupByPrefix(): Promise<void> {
  const { data: cantieri } = await admin
    .from('cantieri')
    .select('id')
    .like('nome', 'TEST_E2E_%');
  const cantiereIds = (cantieri ?? []).map((c) => c.id as string);
  if (cantiereIds.length === 0) return;

  const { data: campagne } = await admin
    .from('campagne')
    .select('id')
    .in('cantiere_id', cantiereIds);
  const campagnaIds = (campagne ?? []).map((c) => c.id as string);

  let misuraIds: string[] = [];
  if (campagnaIds.length > 0) {
    const { data: misure } = await admin
      .from('misure')
      .select('id')
      .in('campagna_id', campagnaIds);
    misuraIds = (misure ?? []).map((m) => m.id as string);
  }

  if (misuraIds.length > 0) {
    await admin.from('foto_misura').delete().in('misura_id', misuraIds);
    await admin.from('misure').delete().in('id', misuraIds);
  }
  if (campagnaIds.length > 0) {
    await admin.from('campagne').delete().in('id', campagnaIds);
  }
  await admin.from('risorse_cantiere').delete().in('cantiere_id', cantiereIds);
  await admin.from('cantieri').delete().in('id', cantiereIds);
}

/**
 * Conteggio cantieri TEST_E2E_ residui (verifica post-cleanup).
 */
export async function countResidui(): Promise<number> {
  const { count } = await admin
    .from('cantieri')
    .select('id', { count: 'exact', head: true })
    .like('nome', 'TEST_E2E_%');
  return count ?? 0;
}
