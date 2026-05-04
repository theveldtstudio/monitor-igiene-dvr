import type { TipoCampionamento } from '../types';

export const CAMPIONAMENTI: {
  tipo: TipoCampionamento;
  label: string;
  riferimento: string;
  categoria: string;
}[] = [
  { tipo: 'rumore', label: 'Rumore', riferimento: 'Tit. VIII c.2', categoria: 'Agenti fisici' },
  { tipo: 'vibrazioni_wbv', label: 'Vibrazioni WBV', riferimento: 'Tit. VIII c.3', categoria: 'Agenti fisici' },
  { tipo: 'vibrazioni_hav', label: 'Vibrazioni HAV', riferimento: 'Tit. VIII c.3', categoria: 'Agenti fisici' },
  { tipo: 'microclima', label: 'Microclima', riferimento: 'Tit. VIII c.1', categoria: 'Agenti fisici' },
  { tipo: 'cem', label: 'CEM', riferimento: 'Tit. VIII c.4', categoria: 'Agenti fisici' },
  { tipo: 'roa', label: 'ROA', riferimento: 'Tit. VIII c.5', categoria: 'Agenti fisici' },
  { tipo: 'gas', label: 'Gas', riferimento: 'Tit. IX c.1', categoria: 'Agenti chimici' },
  { tipo: 'polveri', label: 'Polveri / Emissioni', riferimento: 'Tit. IX c.1', categoria: 'Agenti chimici' },
  { tipo: 'carbonio_ec', label: 'Carbonio EC', riferimento: 'Tit. IX c.1', categoria: 'Agenti chimici' },
  { tipo: 'ipa', label: 'IPA', riferimento: 'Tit. IX c.2', categoria: 'Agenti chimici' },
  { tipo: 'amianto', label: 'Amianto', riferimento: 'Tit. IX c.3', categoria: 'Agenti chimici' },
  { tipo: 'biologico_sas', label: 'Biologico SAS', riferimento: 'Tit. X', categoria: 'Agenti biologici' },
  { tipo: 'monitoraggio_acqua', label: 'Monitoraggio Acqua', riferimento: 'D.Lgs 152', categoria: 'Agenti biologici' },
  { tipo: 'mmc', label: 'MMC', riferimento: 'Tit. VI', categoria: 'Ergonomia' },
  { tipo: 'posture_owas', label: 'Posture (OWAS)', riferimento: 'Tit. VI', categoria: 'Ergonomia' },
  { tipo: 'movimenti_ripetitivi_ocra', label: 'Mov. Ripetitivi (OCRA)', riferimento: 'Tit. VI', categoria: 'Ergonomia' },
];
