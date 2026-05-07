export const tipoLabel = (v: unknown): string => {
  if (v === 'personale') return 'P'
  if (v === 'ambientale') return 'A'
  if (v === 'puntuale') return 'Punt.'
  return ''
}

export const fmtNum = (decimals: number) => (v: unknown): string => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return ''
  return v.toFixed(decimals)
}

export const fmtSottoSoglia = (
  valore: unknown,
  raw: unknown,
  sottoSoglia: unknown,
  decimals: number = 2
): string => {
  if (sottoSoglia === true) {
    if (typeof raw === 'string' && raw.length > 0) return raw
    if (typeof valore === 'number') return `<${valore.toFixed(decimals)}`
    return ''
  }
  if (typeof valore === 'number' && Number.isFinite(valore)) {
    return valore.toFixed(decimals)
  }
  return ''
}
