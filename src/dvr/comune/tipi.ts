/** Tipi condivisi dal modulo DVR (specchio delle tabelle dvr_*). */

export const TIPI_AMBITO = [
  'galleria_tradizionale',
  'galleria_tbm',
  'viadotto',
  'opere_esterne',
  'piazzale',
  'officina',
  'campo_base',
  'uffici',
] as const
export type TipoAmbito = (typeof TIPI_AMBITO)[number]

export const ETICHETTE_AMBITO: Record<TipoAmbito, string> = {
  galleria_tradizionale: 'Galleria – scavo tradizionale',
  galleria_tbm: 'Galleria – TBM',
  viadotto: 'Viadotto',
  opere_esterne: 'Opere in esterno',
  piazzale: 'Piazzale',
  officina: 'Officina',
  campo_base: 'Campo base',
  uffici: 'Uffici',
}

export const eGalleria = (t: TipoAmbito) => t === 'galleria_tbm' || t === 'galleria_tradizionale'

export interface AnagraficaDvr {
  cantiere_id: string
  comune: string | null
  provincia: string | null
  opera: string | null
  denominazione: string | null
  impresa: string | null
  datore_lavoro: string | null
  rspp: string | null
  medico_competente: string | null
  rls: string[]
  gruppo_lavoro: string[]
  redatto: string | null
  verificato: string | null
  approvato: string | null
}

export interface AmbitoDvr {
  id: string
  cantiere_id: string
  nome: string
  tipo: TipoAmbito
  metodo_scavo: 'esplosivo' | 'martellone' | 'tbm' | null
  descrizione: string | null
  ordine: number
}

export interface MansioneDvr {
  id: string
  cantiere_id: string
  nome: string
  attivita: string | null
  attiva: boolean
  ordine: number
}

export interface MacchinaDvr {
  id: string
  cantiere_id: string
  tipologia: string
  marca_modello: string | null
  alimentazione: string | null
  ordine: number
}

export interface TaraturaDvr {
  id: string
  strumento_id: string | null
  componente: string
  costruttore: string | null
  modello: string | null
  matricola: string | null
  data_taratura: string | null
  certificato: string | null
}

export interface RevisioneDvr {
  revisione: number
  integrazione: number | null
  data: string
  descrizione: string
  redatto: string | null
  verificato: string | null
  approvato: string | null
}
