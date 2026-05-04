export type CategoriaModulo = 'fisici' | 'chimici' | 'biologici' | 'ergonomia'

export interface ModuloCampionamento {
  id: string
  nome: string
  riferimentoNormativo: string
  descrizioneBreve?: string
  categoria: CategoriaModulo
  iconPath: string
}

export interface CategoriaInfo {
  id: CategoriaModulo
  label: string
  bgIcona: string
  colorAccento: string
}

export const CATEGORIE: Record<CategoriaModulo, CategoriaInfo> = {
  fisici: { id: 'fisici', label: 'Agenti fisici', bgIcona: '#E6F1FB', colorAccento: '#042C53' },
  chimici: { id: 'chimici', label: 'Agenti chimici', bgIcona: '#FAEEDA', colorAccento: '#854F0B' },
  biologici: { id: 'biologici', label: 'Agenti biologici', bgIcona: '#E1F5EE', colorAccento: '#0F6E56' },
  ergonomia: { id: 'ergonomia', label: 'Ergonomia', bgIcona: '#EEEDFE', colorAccento: '#534AB7' },
}

export const ORDINE_CATEGORIE: CategoriaModulo[] = ['fisici', 'chimici', 'biologici', 'ergonomia']

export const MODULI: ModuloCampionamento[] = [
  { id: 'rumore', nome: 'Rumore', riferimentoNormativo: 'Tit. VIII c.2', descrizioneBreve: 'Leq, picchi, fasce di esposizione', categoria: 'fisici', iconPath: 'M3 9 L5 9 M5 5 L5 13 M7 3 L7 15 M9 6 L9 12 M11 4 L11 14 M13 7 L13 11' },
  { id: 'vibrazioni-wbv', nome: 'Vibrazioni WBV', riferimentoNormativo: 'Tit. VIII c.3', descrizioneBreve: 'Corpo intero — operatori macchine', categoria: 'fisici', iconPath: 'WBV' },
  { id: 'vibrazioni-hav', nome: 'Vibrazioni HAV', riferimentoNormativo: 'Tit. VIII c.3', descrizioneBreve: 'Mano-braccio — utensili portatili', categoria: 'fisici', iconPath: 'HAV' },
  { id: 'microclima', nome: 'Microclima', riferimentoNormativo: 'Tit. VIII c.1', descrizioneBreve: 'Temperatura, umidità, PMV/PPD', categoria: 'fisici', iconPath: 'CLIMA' },
  { id: 'cem', nome: 'CEM', riferimentoNormativo: 'Tit. VIII c.4', descrizioneBreve: 'Campi elettromagnetici', categoria: 'fisici', iconPath: 'CEM' },
  { id: 'roa', nome: 'ROA', riferimentoNormativo: 'Tit. VIII c.5', descrizioneBreve: 'Radiazioni ottiche artificiali', categoria: 'fisici', iconPath: 'ROA' },

  { id: 'gas', nome: 'Gas e vapori', riferimentoNormativo: 'Tit. IX c.1', descrizioneBreve: 'NO2, CO, CO2, H2S, O2', categoria: 'chimici', iconPath: 'GAS' },
  { id: 'polveri', nome: 'Polveri', riferimentoNormativo: 'Tit. IX c.1', descrizioneBreve: 'Emissioni in atmosfera', categoria: 'chimici', iconPath: 'POLV' },
  { id: 'carbonio-elementare', nome: 'Carbonio elementare', riferimentoNormativo: 'Tit. IX c.1', descrizioneBreve: 'EC su filtro', categoria: 'chimici', iconPath: 'EC' },
  { id: 'ipa', nome: 'IPA', riferimentoNormativo: 'Tit. IX c.2', descrizioneBreve: 'Idrocarburi policiclici aromatici', categoria: 'chimici', iconPath: 'IPA' },
  { id: 'amianto', nome: 'Amianto', riferimentoNormativo: 'Tit. IX c.3', descrizioneBreve: 'Fibre aerodisperse', categoria: 'chimici', iconPath: 'AMI' },

  { id: 'biologico-sas', nome: 'Biologico SAS', riferimentoNormativo: 'Tit. X', descrizioneBreve: 'Carica microbica aria', categoria: 'biologici', iconPath: 'BIO' },
  { id: 'acqua', nome: 'Acqua', riferimentoNormativo: 'D.Lgs 152', descrizioneBreve: 'pH, conducibilità, O2', categoria: 'biologici', iconPath: 'ACQUA' },

  { id: 'mmc', nome: 'MMC', riferimentoNormativo: 'Tit. VI', descrizioneBreve: 'Movimentazione manuale carichi', categoria: 'ergonomia', iconPath: 'MMC' },
  { id: 'owas', nome: 'OWAS', riferimentoNormativo: 'Tit. VI', descrizioneBreve: 'Posture incongrue', categoria: 'ergonomia', iconPath: 'OWAS' },
  { id: 'ocra', nome: 'OCRA', riferimentoNormativo: 'Tit. VI', descrizioneBreve: 'Movimenti ripetitivi arti superiori', categoria: 'ergonomia', iconPath: 'OCRA' },
]

export function moduliPerCategoria(categoria: CategoriaModulo): ModuloCampionamento[] {
  return MODULI.filter((m) => m.categoria === categoria)
}
