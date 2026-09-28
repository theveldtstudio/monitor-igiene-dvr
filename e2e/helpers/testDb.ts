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

export const WBV_AW_X = 1.11;
export const WBV_AW_Y = 2.22;
export const WBV_AW_Z = 3.33;

const datiWbv = {
  aw_x: WBV_AW_X,
  aw_y: WBV_AW_Y,
  aw_z: WBV_AW_Z,
  durata: 30,
  macchina_nome: 'Macchina Test',
  fase_nome: 'Fase Test',
};

export async function seedWbvCampagna(): Promise<SeedIds> {
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
      tipo_campionamento: 'vibrazioni_wbv',
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
      dati: datiWbv,
      note: '',
    })
    .select('id')
    .single();
  if (e3) throw new Error(`seed misura: ${e3.message}`);
  const misuraId = misura.id as string;

  return { cantiereId, campagnaId, misuraId, cantiereNome };
}

export const HAV_AW_X = 4.44;
export const HAV_AW_Y = 5.55;
export const HAV_AW_Z = 6.66;

const datiHav = {
  aw_x: HAV_AW_X,
  aw_y: HAV_AW_Y,
  aw_z: HAV_AW_Z,
  durata: 30,
  utensile: 'Utensile Test',
  fase_nome: 'Fase Test',
  impugnatura: 'destra',
};

export async function seedHavCampagna(): Promise<SeedIds> {
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
      tipo_campionamento: 'vibrazioni_hav',
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
      dati: datiHav,
      note: '',
    })
    .select('id')
    .single();
  if (e3) throw new Error(`seed misura: ${e3.message}`);
  const misuraId = misura.id as string;

  return { cantiereId, campagnaId, misuraId, cantiereNome };
}

// ─── Helper parametrico blocchi 4×8 ──────────────────────────────────────────

export interface SeedBlocco4x8Opts {
  tipoCampionamento: string;
  dati: Record<string, unknown>;
  committente?: string;
}

/**
 * Seed generico per i 13 moduli "4 blocchi × 8 misure" (layout Foglio1, dataStart r4).
 * Crea cantiere + campagna (tipo_campionamento = opts.tipoCampionamento) + 1 misura con
 * dati = opts.dati. Non crea risorse_cantiere: questi moduli usano stringhe denormalizzate
 * nei dati (postazione_nome, fase_nome) senza FK su risorse_cantiere.
 */
export async function seedBlocco4x8Campagna(opts: SeedBlocco4x8Opts): Promise<SeedIds> {
  const cantiereNome = `TEST_E2E_${Date.now()}`;
  const committente = opts.committente ?? 'Committente Test';

  const { data: cantiere, error: e1 } = await admin
    .from('cantieri')
    .insert({
      nome: cantiereNome,
      indirizzo: 'Via Test 1',
      committente,
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
      tipo_campionamento: opts.tipoCampionamento,
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
      dati: opts.dati,
      note: '',
    })
    .select('id')
    .single();
  if (e3) throw new Error(`seed misura: ${e3.message}`);
  const misuraId = misura.id as string;

  return { cantiereId, campagnaId, misuraId, cantiereNome };
}

// ─── Costanti moduli campione ─────────────────────────────────────────────────

export const MICROCLIMA_TA = 11.1;
export const MICROCLIMA_WBGT = 22.2;

export const CEM_CAMPO_E = 33.3;
export const CEM_INDICE_ESPOSIZIONE = 44.4;

export const POLVERI_CONC_POLVERI = 55.5;
export const POLVERI_CONC_SILICE = 66.6;

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
