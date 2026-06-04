export type TipoCampionamento =
  | 'rumore'
  | 'vibrazioni_wbv'
  | 'vibrazioni_hav'
  | 'microclima'
  | 'cem'
  | 'roa'
  | 'gas'
  | 'polveri'
  | 'carbonio_ec'
  | 'ipa'
  | 'amianto'
  | 'biologico_sas'
  | 'monitoraggio_acqua'
  | 'mmc'
  | 'posture_owas'
  | 'movimenti_ripetitivi_ocra';

export interface Cantiere {
  id: string;
  nome: string;
  indirizzo: string;
  committente: string | null;
  stato: 'aperto' | 'chiuso' | 'sospeso';
  created_at: string;
}

export interface Tecnico {
  id: string;
  nome: string;
  cognome: string;
  created_at: string | null;
}

export interface Strumento {
  id: string;
  nome: string;
  modello: string;
  matricola: string;
  created_at: string | null;
}

export interface Campagna {
  id: string;
  cantiere_id: string;
  tipo_campionamento: TipoCampionamento;
  data_ora: string;
  strumento_id: string | null;
  tecnici_ids: string[];
  pin_tecnico: string;
  pin_osservatore: string;
  stato: 'bozza' | 'completa';
  sync_pending: boolean;
  created_at: string | null;
}

export interface Misura {
  id: string;
  campagna_id: string;
  numero: number;
  dati: Record<string, unknown>;
  note: string | null;
  sync_pending: boolean | null;
  created_at: string | null;
}

export interface FotoMisura {
  id: string;
  misura_id: string;
  url_storage: string | null;
  path_locale: string;
  sync_pending: boolean;
  created_at: string | null;
}

export type TipoRisorsa = 'macchina' | 'fase' | 'postazione'

export interface RisorsaCantiere {
  id: string
  cantiere_id: string
  tipo: TipoRisorsa
  valore: string
  created_at: string | null
}
