/**
 * Accesso ai dati del modulo DVR (tabelle dvr_*). Solo online: il DVR si redige in ufficio,
 * quindi niente coda offline come per le misure di campo.
 */
import { supabase } from '../lib/supabase'
import type { Campagna, Misura } from '../types'
import type { AmbitoDvr, AnagraficaDvr, MacchinaDvr, MansioneDvr, RevisioneDvr, TaraturaDvr } from './comune/tipi'
import type { ContenutiMicroclima } from './microclima/daDatabase'
import type { AttivitaMmc } from './mmc/valutazione'
import type { AttivitaCatalogo } from './posture/valutazione'
import type { DpiUdito } from './rumore/dpi'

function ok<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

// ---------------------------------------------------------------- anagrafica

export async function leggiAnagrafica(cantiereId: string): Promise<AnagraficaDvr | null> {
  return ok(await supabase.from('dvr_anagrafica_cantiere').select('*').eq('cantiere_id', cantiereId).maybeSingle())
}

export async function salvaAnagrafica(a: AnagraficaDvr): Promise<AnagraficaDvr> {
  return ok(await supabase.from('dvr_anagrafica_cantiere').upsert(a).select().single())
}

// ---------------------------------------------------------------- ambiti

export async function leggiAmbiti(cantiereId: string): Promise<AmbitoDvr[]> {
  return ok(await supabase.from('dvr_ambiti').select('*').eq('cantiere_id', cantiereId).order('ordine').order('created_at'))
}

export async function salvaAmbito(a: Partial<AmbitoDvr> & { cantiere_id: string }): Promise<AmbitoDvr> {
  return ok(await supabase.from('dvr_ambiti').upsert(a).select().single())
}

export async function eliminaAmbito(id: string): Promise<void> {
  ok(await supabase.from('dvr_ambiti').delete().eq('id', id))
}

// ---------------------------------------------------------------- mansioni (con storico delle modifiche)

export async function leggiMansioni(cantiereId: string): Promise<MansioneDvr[]> {
  return ok(await supabase.from('dvr_mansioni').select('*').eq('cantiere_id', cantiereId).order('ordine').order('created_at'))
}

export type AzioneMansione = 'creata' | 'modificata' | 'disattivata' | 'riattivata'

export interface ModificaMansione {
  id: string
  cantiere_id: string
  mansione_id: string | null
  azione: AzioneMansione
  prima: Partial<MansioneDvr> | null
  dopo: Partial<MansioneDvr> | null
  motivo: string | null
  created_at: string
}

/** Salva una mansione e registra la modifica confermata dall'utente (serve per le revisioni del DVR). */
export async function salvaMansione(
  m: Partial<MansioneDvr> & { cantiere_id: string; nome: string },
  prima: MansioneDvr | null,
  azione: AzioneMansione,
  motivo: string | null,
): Promise<MansioneDvr> {
  const salvata = ok(await supabase.from('dvr_mansioni').upsert(m).select().single()) as MansioneDvr
  const campi = (x: Partial<MansioneDvr> | null) =>
    x ? { nome: x.nome, attivita: x.attivita, attiva: x.attiva } : null
  ok(
    await supabase.from('dvr_mansioni_modifiche').insert({
      cantiere_id: m.cantiere_id,
      mansione_id: salvata.id,
      azione,
      prima: campi(prima),
      dopo: campi(salvata),
      motivo,
    }),
  )
  return salvata
}

export async function leggiModificheMansioni(cantiereId: string): Promise<ModificaMansione[]> {
  return ok(
    await supabase
      .from('dvr_mansioni_modifiche')
      .select('*')
      .eq('cantiere_id', cantiereId)
      .order('created_at', { ascending: false })
      .limit(50),
  )
}

// ---------------------------------------------------------------- macchine, DPI, tarature

export async function leggiMacchine(cantiereId: string): Promise<MacchinaDvr[]> {
  return ok(await supabase.from('dvr_macchine').select('*').eq('cantiere_id', cantiereId).order('ordine').order('created_at'))
}

export async function salvaMacchina(m: Partial<MacchinaDvr> & { cantiere_id: string; tipologia: string }): Promise<MacchinaDvr> {
  return ok(await supabase.from('dvr_macchine').upsert(m).select().single())
}

export async function eliminaMacchina(id: string): Promise<void> {
  ok(await supabase.from('dvr_macchine').delete().eq('id', id))
}

export interface RigaDpi {
  id: string
  cantiere_id: string
  rischio: string
  nome: string
  dati: Omit<DpiUdito, 'nome'>
  attivo: boolean
  ordine: number
}

export async function leggiDpi(cantiereId: string, rischio = 'rumore'): Promise<RigaDpi[]> {
  return ok(
    await supabase.from('dvr_dpi').select('*').eq('cantiere_id', cantiereId).eq('rischio', rischio).order('ordine').order('created_at'),
  )
}

export async function salvaDpi(d: Partial<RigaDpi> & { cantiere_id: string; nome: string; dati: RigaDpi['dati'] }): Promise<RigaDpi> {
  return ok(await supabase.from('dvr_dpi').upsert({ rischio: 'rumore', ...d }).select().single())
}

export async function eliminaDpi(id: string): Promise<void> {
  ok(await supabase.from('dvr_dpi').delete().eq('id', id))
}

export async function leggiTarature(): Promise<TaraturaDvr[]> {
  return ok(await supabase.from('dvr_tarature').select('*').order('componente').order('data_taratura', { ascending: false }))
}

export async function salvaTaratura(t: Partial<TaraturaDvr> & { componente: string }): Promise<TaraturaDvr> {
  return ok(await supabase.from('dvr_tarature').upsert(t).select().single())
}

export async function eliminaTaratura(id: string): Promise<void> {
  ok(await supabase.from('dvr_tarature').delete().eq('id', id))
}

// ---------------------------------------------------------------- documenti

export interface ContenutiRumore {
  impulsivi?: { zona: string; componente: string; lpeak: number }[]
  segnali?: { fase: string; sorgente: string; ambiente: number; segnale: number }[]
  ciclo?: { testo: string; punti: string[] }[] | null
  zonizzazione?: string | null
  pianoIntro?: string
  pianoPunti?: string[]
  /** Logo del cliente già adattato al riquadro, come data URL PNG. */
  logoCliente?: string | null
  tarature_ids?: string[]
  dpi_ids?: string[]
  /** Numeri dei rapporti di prova (DVR Vibrazioni). */
  rapportoWbv?: string | null
  rapportoHav?: string | null
  /** Catalogo delle attività con le posture OWAS (DVR Posture, capitoli 5 e 6). */
  catalogoPosture?: AttivitaCatalogo[]
  /** Attività valutate nel DVR Movimentazione manuale dei carichi. */
  attivitaMmc?: AttivitaMmc[]
  /** Scenario, lavorazioni, rilievi e testi del DVR Microclima. */
  microclima?: ContenutiMicroclima
}

export interface DocumentoDvr {
  id: string
  cantiere_id: string
  rischio: 'rumore' | 'vibrazioni' | 'posture' | 'mmc' | 'microclima'
  titolo: string | null
  periodo_riferimento: string | null
  ambiti_ids: string[]
  campagne_ids: string[]
  revisione: number
  integrazione: number | null
  stato: 'bozza' | 'emesso'
  data_emissione: string | null
  parametri: Record<string, unknown>
  contenuti: ContenutiRumore
  documento_precedente_id: string | null
  created_at: string
  updated_at: string
}

export async function leggiDocumenti(cantiereId: string): Promise<DocumentoDvr[]> {
  return ok(
    await supabase.from('dvr_documenti').select('*').eq('cantiere_id', cantiereId).order('created_at', { ascending: false }),
  )
}

export async function leggiDocumento(id: string): Promise<DocumentoDvr> {
  return ok(await supabase.from('dvr_documenti').select('*').eq('id', id).single())
}

export async function salvaDocumento(d: Partial<DocumentoDvr> & { cantiere_id: string }): Promise<DocumentoDvr> {
  return ok(await supabase.from('dvr_documenti').upsert({ rischio: 'rumore', ...d }).select().single())
}

/** Aggiorna solo i campi indicati (le sezioni della pagina non si sovrascrivono a vicenda). */
export async function aggiornaDocumento(id: string, patch: Partial<Omit<DocumentoDvr, 'id' | 'contenuti'>>): Promise<void> {
  ok(await supabase.from('dvr_documenti').update(patch).eq('id', id))
}

/** Unisce `patch` ai contenuti attuali letti dal database. */
export async function aggiornaContenuti(id: string, patch: Partial<ContenutiRumore>): Promise<void> {
  const attuale = await leggiDocumento(id)
  ok(await supabase.from('dvr_documenti').update({ contenuti: { ...attuale.contenuti, ...patch } }).eq('id', id))
}

/** Sostituisce tutta la matrice dei tempi di una mansione nel documento. */
export async function sostituisciTempi(
  documentoId: string,
  mansioneId: string,
  righe: Omit<RigaTempi, 'id'>[],
): Promise<RigaTempi[]> {
  ok(await supabase.from('dvr_tempi').delete().eq('documento_id', documentoId).eq('mansione_id', mansioneId))
  if (righe.length === 0) return []
  return ok(await supabase.from('dvr_tempi').insert(righe).select().order('ordine'))
}

export async function leggiRevisioni(documentoId: string): Promise<(RevisioneDvr & { id: string })[]> {
  return ok(await supabase.from('dvr_revisioni').select('*').eq('documento_id', documentoId).order('revisione'))
}

export async function salvaRevisione(r: Partial<RevisioneDvr> & { documento_id: string; id?: string }): Promise<void> {
  ok(await supabase.from('dvr_revisioni').upsert(r))
}

export interface DocumentoMansione {
  documento_id: string
  mansione_id: string
  ordine: number
  dati: { vibrazioni?: boolean; ototossiche?: boolean }
}

export async function leggiDocumentoMansioni(documentoId: string): Promise<DocumentoMansione[]> {
  return ok(await supabase.from('dvr_documento_mansioni').select('*').eq('documento_id', documentoId).order('ordine'))
}

export async function salvaDocumentoMansione(r: DocumentoMansione): Promise<void> {
  ok(await supabase.from('dvr_documento_mansioni').upsert(r))
}

export async function togliDocumentoMansione(documentoId: string, mansioneId: string): Promise<void> {
  ok(await supabase.from('dvr_tempi').delete().eq('documento_id', documentoId).eq('mansione_id', mansioneId))
  ok(await supabase.from('dvr_documento_mansioni').delete().eq('documento_id', documentoId).eq('mansione_id', mansioneId))
}

export interface RigaTempi {
  id: string
  documento_id: string
  mansione_id: string
  ordine: number
  minuti: number
  fase: string
  postazione: string | null
  macchine: string | null
  origine: 'misura' | 'storico' | 'convenzionale'
  misura_id: string | null
  valori: {
    laeq?: number
    lceq?: number | null
    lpeak?: number | null
    /** DVR Vibrazioni: tipo, accelerazione, regime/impugnatura e gruppo di misure collegato. */
    tipo?: 'wbv' | 'hav'
    a?: number
    dettaglio?: string | null
    gruppo?: string | null
    /** DVR Posture: giornata tipo, attività e classe OWAS (0 = ripartita sulle quattro classi). */
    giornata?: string
    attivita?: string
    classe?: 0 | 1 | 2 | 3 | 4
  }
  nota: string | null
}

export async function leggiTempi(documentoId: string): Promise<RigaTempi[]> {
  return ok(await supabase.from('dvr_tempi').select('*').eq('documento_id', documentoId).order('mansione_id').order('ordine'))
}

export async function salvaTempi(r: Partial<RigaTempi> & { documento_id: string; mansione_id: string; minuti: number; fase: string }): Promise<RigaTempi> {
  return ok(await supabase.from('dvr_tempi').upsert(r).select().single())
}

export async function eliminaTempi(id: string): Promise<void> {
  ok(await supabase.from('dvr_tempi').delete().eq('id', id))
}

/** Nuova revisione: copia documento, mansioni incluse e matrice dei tempi. */
export async function nuovaRevisione(doc: DocumentoDvr): Promise<DocumentoDvr> {
  const { id: _id, created_at: _c, updated_at: _u, ...resto } = doc
  void _id
  void _c
  void _u
  const nuovo = await salvaDocumento({
    ...resto,
    revisione: doc.revisione + 1,
    stato: 'bozza',
    data_emissione: null,
    documento_precedente_id: doc.id,
  })
  const [mans, tempi, revs] = await Promise.all([leggiDocumentoMansioni(doc.id), leggiTempi(doc.id), leggiRevisioni(doc.id)])
  if (mans.length) ok(await supabase.from('dvr_documento_mansioni').insert(mans.map((m) => ({ ...m, documento_id: nuovo.id }))))
  if (tempi.length) {
    ok(
      await supabase.from('dvr_tempi').insert(
        tempi.map(({ id: _i, ...t }) => {
          void _i
          return { ...t, documento_id: nuovo.id }
        }),
      ),
    )
  }
  if (revs.length) {
    ok(
      await supabase.from('dvr_revisioni').insert(
        revs.map(({ id: _i, ...r }) => {
          void _i
          return { ...r, documento_id: nuovo.id }
        }),
      ),
    )
  }
  return nuovo
}

// ---------------------------------------------------------------- misure di rumore dell'app

export interface MisuraRumore {
  misura: Misura
  campagna: Campagna
  codice: string
}

/** Misure di rumore delle campagne scelte, numerate in ordine di campagna e di misura (codice rilievo). */
export async function leggiMisure(cantiereId: string, campagneIds: string[]): Promise<MisuraRumore[]> {
  if (campagneIds.length === 0) return []
  const campagne = ok(
    await supabase.from('campagne').select('*').eq('cantiere_id', cantiereId).in('id', campagneIds).order('data_ora'),
  ) as Campagna[]
  const misure = ok(await supabase.from('misure').select('*').in('campagna_id', campagneIds).order('numero')) as Misura[]
  const out: MisuraRumore[] = []
  let n = 0
  for (const c of campagne) {
    for (const m of misure.filter((x) => x.campagna_id === c.id)) {
      out.push({ misura: m, campagna: c, codice: String(++n) })
    }
  }
  return out
}

/** Stesse misure, nome storico usato dal DVR Rumore. */
export const leggiMisureRumore = leggiMisure

export async function leggiCampagne(cantiereId: string, tipi: string[]): Promise<Campagna[]> {
  return ok(
    await supabase
      .from('campagne')
      .select('*')
      .eq('cantiere_id', cantiereId)
      .in('tipo_campionamento', tipi)
      .order('data_ora', { ascending: false }),
  )
}

export async function leggiCampagneRumore(cantiereId: string): Promise<Campagna[]> {
  return ok(
    await supabase
      .from('campagne')
      .select('*')
      .eq('cantiere_id', cantiereId)
      .eq('tipo_campionamento', 'rumore')
      .order('data_ora', { ascending: false }),
  )
}
