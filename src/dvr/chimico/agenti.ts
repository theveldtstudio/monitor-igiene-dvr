/**
 * Agenti chimici valutati nei tre DVR di questa famiglia (come i DVR modello Castagnola):
 * - chimico: polveri respirabili e gas tossici in galleria e sul piazzale;
 * - fumi_saldatura: polveri, metalli e gas dei fumi di saldatura in officina;
 * - cancerogeno: silice libera cristallina e carbonio elementare (gas di scarico dei motori diesel);
 * - amianto: fibre aerodisperse totali (MOCF) e fibre di amianto (SEM), senza DVR modello;
 * - ipa: idrocarburi policiclici aromatici (somma, benzo[a]pirene e BaP equivalente) dai rapporti di
 *   prova del laboratorio, senza DVR modello.
 * L'insieme degli agenti è fisso per tipo di documento (le colonne delle tabelle del Word);
 * limiti e fattore di gravità si possono modificare nel documento.
 */

export type TipoDvrChimico = 'chimico' | 'fumi_saldatura' | 'cancerogeno' | 'amianto' | 'ipa'

export type UnitaAgente = 'mg/m³' | 'ppm' | '%' | 'ff/L' | 'ng/m³'

export interface AgenteChimico {
  id: string
  nome: string
  /** nome breve per le intestazioni delle tabelle */
  sigla: string
  unita: UnitaAgente
  /** TLV-TWA o VLEP; null se non c'è un limite (es. O₂, valutato come minimo) */
  tlv: number | null
  stel?: number | null
  /** O₂: il valore è un minimo (18 %) e non entra nel modello Piemonte */
  minimo?: number | null
  /** fattore di gravità M del modello Regione Piemonte (1–5) */
  gravita?: number | null
  /** riferimento del limite (es. "ACGIH 2019", "All. XXXVIII D.Lgs. 81/08") */
  fonte?: string
  /** campo della misura dell'app da cui importare la concentrazione */
  campo?: string
  /** cifre decimali con cui si scrive la concentrazione */
  decimali: number
  cancerogeno?: boolean
}

const A = (x: AgenteChimico) => x

export const AGENTI_PREDEFINITI: Record<TipoDvrChimico, AgenteChimico[]> = {
  chimico: [
    A({ id: 'polveri_resp', nome: 'Polveri in frazione respirabile', sigla: 'Polveri resp.', unita: 'mg/m³', tlv: 3, gravita: 1, fonte: 'ACGIH', campo: 'conc_polveri', decimali: 2 }),
    A({ id: 'no', nome: 'Monossido di azoto (NO)', sigla: 'NO', unita: 'ppm', tlv: 2, gravita: 5, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'no', decimali: 1 }),
    A({ id: 'co', nome: 'Monossido di carbonio (CO)', sigla: 'CO', unita: 'ppm', tlv: 20, stel: 100, gravita: 3, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'co', decimali: 1 }),
    A({ id: 'co2', nome: 'Anidride carbonica (CO₂)', sigla: 'CO₂', unita: '%', tlv: 0.5, gravita: 1, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'co2', decimali: 1 }),
    A({ id: 'h2s', nome: 'Acido solfidrico (H₂S)', sigla: 'H₂S', unita: 'ppm', tlv: 5, stel: 10, gravita: 4, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'h2s', decimali: 1 }),
    A({ id: 'no2', nome: 'Biossido di azoto (NO₂)', sigla: 'NO₂', unita: 'ppm', tlv: 0.5, stel: 1, gravita: 4, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'no2', decimali: 2 }),
    A({ id: 'o2', nome: 'Ossigeno (O₂)', sigla: 'O₂', unita: '%', tlv: null, minimo: 18, campo: 'o2', decimali: 1 }),
  ],
  fumi_saldatura: [
    A({ id: 'polveri_resp', nome: 'Polveri in frazione respirabile', sigla: 'Polveri resp.', unita: 'mg/m³', tlv: 3, gravita: 1, fonte: 'ACGIH 2019', campo: 'conc_polveri', decimali: 2 }),
    A({ id: 'polveri_inal', nome: 'Polveri in frazione inalabile', sigla: 'Polveri inal.', unita: 'mg/m³', tlv: 10, gravita: 1, fonte: 'ACGIH 2019', decimali: 2 }),
    A({ id: 'ferro', nome: 'Ossidi di ferro (Fe₂O₃), frazione respirabile', sigla: 'Ferro', unita: 'mg/m³', tlv: 5, gravita: 2, fonte: 'ACGIH 2019', decimali: 3 }),
    A({ id: 'rame_resp', nome: 'Rame, fumi', sigla: 'Rame resp.', unita: 'mg/m³', tlv: 0.2, gravita: 3, fonte: 'ACGIH 2019', decimali: 3 }),
    A({ id: 'rame_inal', nome: 'Rame, polveri', sigla: 'Rame inal.', unita: 'mg/m³', tlv: 1, gravita: 3, fonte: 'ACGIH 2019', decimali: 3 }),
    A({ id: 'silice', nome: 'Silice libera cristallina (quarzo), frazione respirabile', sigla: 'Silice', unita: 'mg/m³', tlv: 0.1, gravita: 5, fonte: 'All. XLIII D.Lgs. 81/08', campo: 'conc_silice', decimali: 3, cancerogeno: true }),
    A({ id: 'mn_resp', nome: 'Manganese, frazione respirabile', sigla: 'Mn resp.', unita: 'mg/m³', tlv: 0.05, gravita: 4, fonte: 'All. XXXVIII D.Lgs. 81/08', decimali: 3 }),
    A({ id: 'mn_inal', nome: 'Manganese, frazione inalabile', sigla: 'Mn inal.', unita: 'mg/m³', tlv: 0.2, gravita: 4, fonte: 'All. XXXVIII D.Lgs. 81/08', decimali: 3 }),
    A({ id: 'no2', nome: 'Biossido di azoto (NO₂)', sigla: 'NO₂', unita: 'ppm', tlv: 0.5, stel: 1, gravita: 4, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'no2', decimali: 2 }),
    A({ id: 'co', nome: 'Monossido di carbonio (CO)', sigla: 'CO', unita: 'ppm', tlv: 20, stel: 100, gravita: 3, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'co', decimali: 1 }),
    A({ id: 'no', nome: 'Monossido di azoto (NO)', sigla: 'NO', unita: 'ppm', tlv: 2, gravita: 5, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'no', decimali: 1 }),
    A({ id: 'co2', nome: 'Anidride carbonica (CO₂)', sigla: 'CO₂', unita: '%', tlv: 0.5, gravita: 1, fonte: 'All. XXXVIII D.Lgs. 81/08', campo: 'co2', decimali: 1 }),
  ],
  cancerogeno: [
    A({ id: 'polveri_resp', nome: 'Polveri in frazione respirabile', sigla: 'Polveri resp.', unita: 'mg/m³', tlv: 3, fonte: 'ACGIH', campo: 'conc_polveri', decimali: 2 }),
    A({ id: 'silice', nome: 'Silice libera cristallina, frazione respirabile', sigla: 'Silice', unita: 'mg/m³', tlv: 0.1, fonte: 'All. XLIII D.Lgs. 81/08', campo: 'conc_silice', decimali: 3, cancerogeno: true }),
    A({ id: 'ec', nome: 'Carbonio elementare (emissioni dei motori diesel)', sigla: 'Carbonio elementare', unita: 'mg/m³', tlv: 0.05, fonte: 'All. XLIII D.Lgs. 81/08', campo: 'conc_ec', decimali: 3, cancerogeno: true }),
  ],
  amianto: [
    A({ id: 'amianto', nome: 'Fibre di amianto (SEM)', sigla: 'Amianto', unita: 'ff/L', tlv: 100, fonte: 'art. 254 D.Lgs. 81/08 (0,1 ff/cm³)', campo: 'conc_amianto', decimali: 1, cancerogeno: true }),
    A({ id: 'fibre', nome: 'Fibre aerodisperse totali (MOCF)', sigla: 'Fibre totali', unita: 'ff/L', tlv: null, fonte: 'indicatore (nessun limite)', campo: 'conc_fibre_totali', decimali: 1 }),
  ],
  ipa: [
    A({ id: 'ipa_tot', nome: 'IPA totali (somma degli IPA determinati)', sigla: 'IPA totali', unita: 'ng/m³', tlv: null, fonte: 'indicatore (nessun limite)', decimali: 1 }),
    A({ id: 'bap', nome: 'Benzo[a]pirene', sigla: 'BaP', unita: 'ng/m³', tlv: 70, fonte: 'TRGS 910 – concentrazione di accettazione (nessun VLEP nel D.Lgs. 81/08)', decimali: 2, cancerogeno: true }),
    A({ id: 'bapeq', nome: 'Benzo[a]pirene equivalente (fattori TEF)', sigla: 'BaP eq.', unita: 'ng/m³', tlv: 70, fonte: 'come il benzo[a]pirene', decimali: 2, cancerogeno: true }),
  ],
}

/** DVR classificati con il modello Regione Piemonte (gli altri: confronto delle esposizioni con i limiti). */
export const conPiemonte = (t: TipoDvrChimico) => t === 'chimico' || t === 'fumi_saldatura'

/** Tipi di campagna dell'app da cui si importano le misure. */
export const CAMPAGNE_PER_TIPO: Record<TipoDvrChimico, string[]> = {
  chimico: ['polveri', 'gas'],
  fumi_saldatura: ['polveri', 'gas'],
  cancerogeno: ['polveri', 'carbonio_ec'],
  amianto: ['amianto'],
  ipa: ['ipa'],
}

export const TITOLI_TIPO: Record<TipoDvrChimico, string> = {
  chimico: 'DVR Agenti chimici (polveri e gas tossici)',
  fumi_saldatura: 'DVR Fumi di saldatura',
  cancerogeno: 'DVR Agenti cancerogeni (silice e carbonio elementare)',
  amianto: 'DVR Amianto',
  ipa: 'DVR Idrocarburi policiclici aromatici (IPA)',
}
