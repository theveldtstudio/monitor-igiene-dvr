import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const baseProps = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 40 60',
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

// ═══════════════════════════════════════════════════════
// SCHIENA — 4 posture (vista laterale)
// ═══════════════════════════════════════════════════════

export const SchienaIcon1 = ({ size = 36, ...rest }: IconProps) => (
  // 1 - Schiena dritta: omino di profilo, schiena perfettamente verticale
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="38" />
    <line x1="20" y1="18" x2="14" y2="28" />
    <line x1="14" y1="28" x2="14" y2="38" />
    <line x1="20" y1="38" x2="14" y2="55" />
    <line x1="20" y1="38" x2="26" y2="55" />
  </svg>
);

export const SchienaIcon2 = ({ size = 36, ...rest }: IconProps) => (
  // 2 - Schiena curva: omino di profilo, busto piegato in avanti
  <svg {...baseProps(size)} {...rest}>
    <circle cx="14" cy="10" r="4" fill="currentColor" stroke="none" />
    <path d="M 16 14 Q 18 22 20 30 L 20 38" />
    <line x1="18" y1="22" x2="12" y2="30" />
    <line x1="12" y1="30" x2="12" y2="38" />
    <line x1="20" y1="38" x2="16" y2="55" />
    <line x1="20" y1="38" x2="26" y2="55" />
  </svg>
);

export const SchienaIcon3 = ({ size = 36, ...rest }: IconProps) => (
  // 3 - Schiena in torsione: vista dall'alto, indicato con una freccia di rotazione
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="38" />
    <line x1="20" y1="22" x2="10" y2="20" />
    <line x1="20" y1="22" x2="30" y2="26" />
    <line x1="20" y1="38" x2="14" y2="55" />
    <line x1="20" y1="38" x2="26" y2="55" />
    {/* Indicatore rotazione */}
    <path d="M 28 14 Q 32 18 28 22" />
    <polyline points="26,20 28,22 30,20" />
  </svg>
);

export const SchienaIcon4 = ({ size = 36, ...rest }: IconProps) => (
  // 4 - Schiena curva + torsione: piegata in avanti con freccia rotazione
  <svg {...baseProps(size)} {...rest}>
    <circle cx="14" cy="10" r="4" fill="currentColor" stroke="none" />
    <path d="M 16 14 Q 18 22 20 30 L 20 38" />
    <line x1="18" y1="22" x2="10" y2="20" />
    <line x1="18" y1="22" x2="28" y2="28" />
    <line x1="20" y1="38" x2="16" y2="55" />
    <line x1="20" y1="38" x2="26" y2="55" />
    {/* Freccia rotazione */}
    <path d="M 28 14 Q 32 18 28 22" />
    <polyline points="26,20 28,22 30,20" />
  </svg>
);

// ═══════════════════════════════════════════════════════
// BRACCIA — 3 posture (vista frontale)
// ═══════════════════════════════════════════════════════

export const BracciaIcon1 = ({ size = 36, ...rest }: IconProps) => (
  // 1 - Entrambe sotto le spalle: braccia lungo i fianchi
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="38" />
    {/* Spalle */}
    <line x1="14" y1="18" x2="26" y2="18" />
    {/* Braccia entrambe in basso */}
    <line x1="14" y1="18" x2="12" y2="32" />
    <line x1="26" y1="18" x2="28" y2="32" />
    {/* Gambe */}
    <line x1="20" y1="38" x2="14" y2="55" />
    <line x1="20" y1="38" x2="26" y2="55" />
  </svg>
);

export const BracciaIcon2 = ({ size = 36, ...rest }: IconProps) => (
  // 2 - Una sopra le spalle: braccio destro alzato
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="38" />
    <line x1="14" y1="18" x2="26" y2="18" />
    {/* Sinistro in basso */}
    <line x1="14" y1="18" x2="12" y2="32" />
    {/* Destro sollevato sopra la testa */}
    <line x1="26" y1="18" x2="32" y2="6" />
    <line x1="20" y1="38" x2="14" y2="55" />
    <line x1="20" y1="38" x2="26" y2="55" />
  </svg>
);

export const BracciaIcon3 = ({ size = 36, ...rest }: IconProps) => (
  // 3 - Entrambe sopra: braccia alzate in cima
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="38" />
    <line x1="14" y1="18" x2="26" y2="18" />
    {/* Entrambe sopra la testa */}
    <line x1="14" y1="18" x2="8" y2="6" />
    <line x1="26" y1="18" x2="32" y2="6" />
    <line x1="20" y1="38" x2="14" y2="55" />
    <line x1="20" y1="38" x2="26" y2="55" />
  </svg>
);

// ═══════════════════════════════════════════════════════
// GAMBE — 7 posture
// ═══════════════════════════════════════════════════════

export const GambeIcon1 = ({ size = 36, ...rest }: IconProps) => (
  // 1 - Seduto: gambe a 90°
  <svg {...baseProps(size)} {...rest}>
    <circle cx="14" cy="10" r="4" fill="currentColor" stroke="none" />
    <line x1="14" y1="14" x2="14" y2="36" />
    <line x1="9" y1="20" x2="14" y2="22" />
    <line x1="14" y1="22" x2="19" y2="20" />
    {/* Gambe orizzontali (seduto) */}
    <line x1="14" y1="36" x2="32" y2="36" />
    {/* Gambe verticali (giù dalla seduta) */}
    <line x1="32" y1="36" x2="32" y2="55" />
    <line x1="28" y1="36" x2="28" y2="55" />
    {/* Linea sedile */}
    <line x1="14" y1="38" x2="34" y2="38" strokeDasharray="2,2" />
  </svg>
);

export const GambeIcon2 = ({ size = 36, ...rest }: IconProps) => (
  // 2 - In piedi, gambe distese (entrambe dritte)
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="38" />
    <line x1="14" y1="18" x2="26" y2="18" />
    <line x1="14" y1="18" x2="12" y2="32" />
    <line x1="26" y1="18" x2="28" y2="32" />
    {/* Entrambe le gambe diritte */}
    <line x1="20" y1="38" x2="16" y2="55" />
    <line x1="20" y1="38" x2="24" y2="55" />
  </svg>
);

export const GambeIcon3 = ({ size = 36, ...rest }: IconProps) => (
  // 3 - In piedi, peso su una sola gamba (l'altra appena sollevata)
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="38" />
    <line x1="14" y1="18" x2="26" y2="18" />
    <line x1="14" y1="18" x2="12" y2="32" />
    <line x1="26" y1="18" x2="28" y2="32" />
    {/* Gamba destra dritta a terra */}
    <line x1="20" y1="38" x2="22" y2="55" />
    {/* Gamba sinistra sollevata/piegata */}
    <line x1="20" y1="38" x2="14" y2="48" />
    <line x1="14" y1="48" x2="18" y2="52" />
  </svg>
);

export const GambeIcon4 = ({ size = 36, ...rest }: IconProps) => (
  // 4 - In piedi, entrambe le gambe piegate (accosciato)
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="34" />
    <line x1="14" y1="18" x2="26" y2="18" />
    <line x1="14" y1="18" x2="12" y2="30" />
    <line x1="26" y1="18" x2="28" y2="30" />
    {/* Gambe entrambe piegate (forma a Z) */}
    <line x1="20" y1="34" x2="14" y2="42" />
    <line x1="14" y1="42" x2="18" y2="55" />
    <line x1="20" y1="34" x2="26" y2="42" />
    <line x1="26" y1="42" x2="22" y2="55" />
  </svg>
);

export const GambeIcon5 = ({ size = 36, ...rest }: IconProps) => (
  // 5 - In piedi, peso su una sola gamba piegata
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="36" />
    <line x1="14" y1="18" x2="26" y2="18" />
    <line x1="14" y1="18" x2="12" y2="32" />
    <line x1="26" y1="18" x2="28" y2="32" />
    {/* Gamba destra a terra piegata */}
    <line x1="20" y1="36" x2="14" y2="44" />
    <line x1="14" y1="44" x2="20" y2="55" />
    {/* Gamba sinistra sollevata */}
    <line x1="20" y1="36" x2="28" y2="42" />
  </svg>
);

export const GambeIcon6 = ({ size = 36, ...rest }: IconProps) => (
  // 6 - In ginocchio (su una o entrambe le ginocchia)
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="10" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="14" x2="20" y2="36" />
    <line x1="14" y1="20" x2="26" y2="20" />
    <line x1="14" y1="20" x2="10" y2="32" />
    <line x1="26" y1="20" x2="30" y2="32" />
    {/* In ginocchio: gambe piegate sotto, ginocchia a terra */}
    <line x1="20" y1="36" x2="14" y2="46" />
    <line x1="14" y1="46" x2="22" y2="50" />
    <line x1="20" y1="36" x2="26" y2="46" />
    <line x1="26" y1="46" x2="20" y2="50" />
    {/* Linea pavimento */}
    <line x1="8" y1="55" x2="32" y2="55" strokeDasharray="1,1" />
  </svg>
);

export const GambeIcon7 = ({ size = 36, ...rest }: IconProps) => (
  // 7 - In piedi, in movimento (camminando, una gamba avanti)
  <svg {...baseProps(size)} {...rest}>
    <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
    <line x1="20" y1="12" x2="20" y2="36" />
    <line x1="14" y1="18" x2="26" y2="18" />
    <line x1="14" y1="18" x2="10" y2="30" />
    <line x1="26" y1="18" x2="30" y2="30" />
    {/* Una gamba avanti, una indietro (in movimento) */}
    <line x1="20" y1="36" x2="12" y2="55" />
    <line x1="20" y1="36" x2="28" y2="55" />
    {/* Indicatore movimento */}
    <line x1="6" y1="50" x2="3" y2="50" />
    <line x1="6" y1="46" x2="3" y2="46" />
  </svg>
);

// ═══════════════════════════════════════════════════════
// CARICO — 3 livelli (cassetta + indicatore peso)
// ═══════════════════════════════════════════════════════

export const CaricoIcon1 = ({ size = 36, ...rest }: IconProps) => (
  // 1 - Inferiore a 10 kg: cassetta piccola
  <svg {...baseProps(size)} {...rest}>
    <rect x="14" y="22" width="12" height="10" />
    <text x="20" y="44" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="600">{'<10'}</text>
  </svg>
);

export const CaricoIcon2 = ({ size = 36, ...rest }: IconProps) => (
  // 2 - Tra 10 e 20 kg: cassetta media
  <svg {...baseProps(size)} {...rest}>
    <rect x="11" y="18" width="18" height="14" />
    <text x="20" y="44" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="600">10-20</text>
  </svg>
);

export const CaricoIcon3 = ({ size = 36, ...rest }: IconProps) => (
  // 3 - Superiore a 20 kg: cassetta grande
  <svg {...baseProps(size)} {...rest}>
    <rect x="8" y="14" width="24" height="18" />
    <text x="20" y="44" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="600">{'>20'}</text>
  </svg>
);
