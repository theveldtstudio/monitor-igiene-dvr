// Lookup table OWAS standard (Karhu et al. 1977, rielaborazione Lundquist & Gustavvson 1987)
// 4 schiene × 3 braccia × 7 gambe × 3 carichi = 252 combinazioni
// Output: classe di rischio 1-4
//   1 = postura normale (verde)
//   2 = da correggere nel prossimo futuro (giallo)
//   3 = da correggere appena possibile (arancione)
//   4 = da correggere immediatamente (rosso)

export type SchienaCode = 1 | 2 | 3 | 4;
export type BracciaCode = 1 | 2 | 3;
export type GambeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type CaricoCode = 1 | 2 | 3;
export type ClasseRischio = 1 | 2 | 3 | 4;

const OWAS_TABLE: Record<string, ClasseRischio> = {
  // Schiena 1 (dritta), Braccia 1 (sotto spalle)
  '1_1_1_1': 1, '1_1_1_2': 1, '1_1_1_3': 1,
  '1_1_2_1': 1, '1_1_2_2': 1, '1_1_2_3': 1,
  '1_1_3_1': 1, '1_1_3_2': 1, '1_1_3_3': 1,
  '1_1_4_1': 2, '1_1_4_2': 2, '1_1_4_3': 2,
  '1_1_5_1': 2, '1_1_5_2': 2, '1_1_5_3': 2,
  '1_1_6_1': 1, '1_1_6_2': 1, '1_1_6_3': 1,
  '1_1_7_1': 1, '1_1_7_2': 1, '1_1_7_3': 1,
  // Schiena 1 (dritta), Braccia 2 (uno sopra)
  '1_2_1_1': 1, '1_2_1_2': 1, '1_2_1_3': 1,
  '1_2_2_1': 1, '1_2_2_2': 1, '1_2_2_3': 1,
  '1_2_3_1': 1, '1_2_3_2': 1, '1_2_3_3': 1,
  '1_2_4_1': 2, '1_2_4_2': 2, '1_2_4_3': 3,
  '1_2_5_1': 2, '1_2_5_2': 2, '1_2_5_3': 3,
  '1_2_6_1': 1, '1_2_6_2': 1, '1_2_6_3': 1,
  '1_2_7_1': 1, '1_2_7_2': 1, '1_2_7_3': 1,
  // Schiena 1 (dritta), Braccia 3 (entrambe sopra)
  '1_3_1_1': 1, '1_3_1_2': 1, '1_3_1_3': 1,
  '1_3_2_1': 1, '1_3_2_2': 1, '1_3_2_3': 1,
  '1_3_3_1': 1, '1_3_3_2': 1, '1_3_3_3': 1,
  '1_3_4_1': 2, '1_3_4_2': 3, '1_3_4_3': 3,
  '1_3_5_1': 2, '1_3_5_2': 3, '1_3_5_3': 3,
  '1_3_6_1': 1, '1_3_6_2': 1, '1_3_6_3': 1,
  '1_3_7_1': 1, '1_3_7_2': 1, '1_3_7_3': 1,

  // Schiena 2 (curva), Braccia 1
  '2_1_1_1': 2, '2_1_1_2': 2, '2_1_1_3': 3,
  '2_1_2_1': 2, '2_1_2_2': 2, '2_1_2_3': 3,
  '2_1_3_1': 2, '2_1_3_2': 2, '2_1_3_3': 3,
  '2_1_4_1': 3, '2_1_4_2': 3, '2_1_4_3': 3,
  '2_1_5_1': 3, '2_1_5_2': 3, '2_1_5_3': 3,
  '2_1_6_1': 2, '2_1_6_2': 2, '2_1_6_3': 3,
  '2_1_7_1': 2, '2_1_7_2': 3, '2_1_7_3': 3,
  // Schiena 2 (curva), Braccia 2
  '2_2_1_1': 2, '2_2_1_2': 2, '2_2_1_3': 3,
  '2_2_2_1': 2, '2_2_2_2': 2, '2_2_2_3': 3,
  '2_2_3_1': 2, '2_2_3_2': 3, '2_2_3_3': 3,
  '2_2_4_1': 3, '2_2_4_2': 3, '2_2_4_3': 4,
  '2_2_5_1': 3, '2_2_5_2': 3, '2_2_5_3': 4,
  '2_2_6_1': 2, '2_2_6_2': 3, '2_2_6_3': 3,
  '2_2_7_1': 2, '2_2_7_2': 3, '2_2_7_3': 3,
  // Schiena 2 (curva), Braccia 3
  '2_3_1_1': 3, '2_3_1_2': 3, '2_3_1_3': 4,
  '2_3_2_1': 2, '2_3_2_2': 3, '2_3_2_3': 4,
  '2_3_3_1': 3, '2_3_3_2': 3, '2_3_3_3': 4,
  '2_3_4_1': 3, '2_3_4_2': 4, '2_3_4_3': 4,
  '2_3_5_1': 4, '2_3_5_2': 4, '2_3_5_3': 4,
  '2_3_6_1': 3, '2_3_6_2': 3, '2_3_6_3': 3,
  '2_3_7_1': 3, '2_3_7_2': 4, '2_3_7_3': 4,

  // Schiena 3 (torsione), Braccia 1
  '3_1_1_1': 1, '3_1_1_2': 1, '3_1_1_3': 1,
  '3_1_2_1': 1, '3_1_2_2': 1, '3_1_2_3': 2,
  '3_1_3_1': 1, '3_1_3_2': 1, '3_1_3_3': 2,
  '3_1_4_1': 2, '3_1_4_2': 3, '3_1_4_3': 3,
  '3_1_5_1': 2, '3_1_5_2': 3, '3_1_5_3': 3,
  '3_1_6_1': 1, '3_1_6_2': 1, '3_1_6_3': 1,
  '3_1_7_1': 1, '3_1_7_2': 1, '3_1_7_3': 1,
  // Schiena 3 (torsione), Braccia 2
  '3_2_1_1': 1, '3_2_1_2': 1, '3_2_1_3': 1,
  '3_2_2_1': 1, '3_2_2_2': 1, '3_2_2_3': 2,
  '3_2_3_1': 1, '3_2_3_2': 1, '3_2_3_3': 2,
  '3_2_4_1': 3, '3_2_4_2': 3, '3_2_4_3': 4,
  '3_2_5_1': 3, '3_2_5_2': 3, '3_2_5_3': 4,
  '3_2_6_1': 1, '3_2_6_2': 2, '3_2_6_3': 3,
  '3_2_7_1': 1, '3_2_7_2': 1, '3_2_7_3': 2,
  // Schiena 3 (torsione), Braccia 3
  '3_3_1_1': 2, '3_3_1_2': 2, '3_3_1_3': 3,
  '3_3_2_1': 2, '3_3_2_2': 3, '3_3_2_3': 3,
  '3_3_3_1': 3, '3_3_3_2': 3, '3_3_3_3': 4,
  '3_3_4_1': 4, '3_3_4_2': 4, '3_3_4_3': 4,
  '3_3_5_1': 4, '3_3_5_2': 4, '3_3_5_3': 4,
  '3_3_6_1': 3, '3_3_6_2': 3, '3_3_6_3': 4,
  '3_3_7_1': 2, '3_3_7_2': 3, '3_3_7_3': 4,

  // Schiena 4 (curva+torsione), Braccia 1
  '4_1_1_1': 2, '4_1_1_2': 3, '4_1_1_3': 3,
  '4_1_2_1': 3, '4_1_2_2': 3, '4_1_2_3': 4,
  '4_1_3_1': 3, '4_1_3_2': 3, '4_1_3_3': 4,
  '4_1_4_1': 4, '4_1_4_2': 4, '4_1_4_3': 4,
  '4_1_5_1': 4, '4_1_5_2': 4, '4_1_5_3': 4,
  '4_1_6_1': 3, '4_1_6_2': 3, '4_1_6_3': 4,
  '4_1_7_1': 3, '4_1_7_2': 4, '4_1_7_3': 4,
  // Schiena 4 (curva+torsione), Braccia 2
  '4_2_1_1': 3, '4_2_1_2': 3, '4_2_1_3': 4,
  '4_2_2_1': 3, '4_2_2_2': 4, '4_2_2_3': 4,
  '4_2_3_1': 3, '4_2_3_2': 4, '4_2_3_3': 4,
  '4_2_4_1': 4, '4_2_4_2': 4, '4_2_4_3': 4,
  '4_2_5_1': 4, '4_2_5_2': 4, '4_2_5_3': 4,
  '4_2_6_1': 4, '4_2_6_2': 4, '4_2_6_3': 4,
  '4_2_7_1': 3, '4_2_7_2': 4, '4_2_7_3': 4,
  // Schiena 4 (curva+torsione), Braccia 3
  '4_3_1_1': 4, '4_3_1_2': 4, '4_3_1_3': 4,
  '4_3_2_1': 4, '4_3_2_2': 4, '4_3_2_3': 4,
  '4_3_3_1': 4, '4_3_3_2': 4, '4_3_3_3': 4,
  '4_3_4_1': 4, '4_3_4_2': 4, '4_3_4_3': 4,
  '4_3_5_1': 4, '4_3_5_2': 4, '4_3_5_3': 4,
  '4_3_6_1': 4, '4_3_6_2': 4, '4_3_6_3': 4,
  '4_3_7_1': 4, '4_3_7_2': 4, '4_3_7_3': 4,
};

export function calcolaClasseOwas(
  schiena: SchienaCode,
  braccia: BracciaCode,
  gambe: GambeCode,
  carico: CaricoCode
): ClasseRischio {
  const key = `${schiena}_${braccia}_${gambe}_${carico}`;
  return OWAS_TABLE[key] ?? 4;
}

export function descrizioneClasseOwas(classe: ClasseRischio): string {
  switch (classe) {
    case 1: return 'Normale';
    case 2: return 'Da correggere a breve';
    case 3: return 'Da correggere prima possibile';
    case 4: return 'Da correggere immediatamente';
  }
}

// Colori semantici per riquadro classe
export function coloriClasseOwas(classe: ClasseRischio): { bg: string; border: string; text: string } {
  switch (classe) {
    case 1: return { bg: '#dcfce7', border: '#22c55e', text: '#15803d' }; // verde
    case 2: return { bg: '#fef9c3', border: '#eab308', text: '#a16207' }; // giallo
    case 3: return { bg: '#ffedd5', border: '#f97316', text: '#c2410c' }; // arancione
    case 4: return { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' }; // rosso
  }
}

// Etichette OWAS per dropdown / labels
export const SCHIENA_LABELS: Record<SchienaCode, string> = {
  1: 'Diritta',
  2: 'Curva',
  3: 'Torsione',
  4: 'Curva + torsione',
};

export const BRACCIA_LABELS: Record<BracciaCode, string> = {
  1: 'Entrambe sotto le spalle',
  2: 'Una sopra le spalle',
  3: 'Entrambe sopra le spalle',
};

export const GAMBE_LABELS: Record<GambeCode, string> = {
  1: 'Seduto',
  2: 'In piedi, gambe distese',
  3: 'In piedi, peso su una gamba',
  4: 'In piedi, gambe piegate',
  5: 'Peso su una gamba piegata',
  6: 'In ginocchio',
  7: 'In piedi, in movimento',
};

export const CARICO_LABELS: Record<CaricoCode, string> = {
  1: '< 10 kg',
  2: '10-20 kg',
  3: '> 20 kg',
};
