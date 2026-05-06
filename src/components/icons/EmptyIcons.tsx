interface IconProps {
  size?: number
}

export function IconCantiere({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 22 L24 8 L42 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="10" y="20" width="28" height="22" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="25" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="28" y="25" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="19" y="30" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export function IconTecnico({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="16" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 40 Q10 30 24 30 Q38 30 38 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function IconStrumento({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="28" r="14" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M24 28 L30 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="24" cy="28" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 18 L16 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M35 18 L32 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 28 L13 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M24 14 L24 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function IconCampagna({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="10" width="24" height="30" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19 7 L19 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M29 7 L29 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 18 L36 18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M18 25 L20 27 L24 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 33 L20 35 L24 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 25 L34 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M28 33 L34 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
