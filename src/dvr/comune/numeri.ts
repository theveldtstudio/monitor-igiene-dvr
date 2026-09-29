/**
 * Utilità numeriche condivise dai motori di calcolo DVR.
 */

/** Arrotonda a `decimali` cifre con metà verso l'alto, come ARROTONDA di Excel. */
export function arrotonda(valore: number, decimali = 1): number {
  const f = 10 ** decimali
  return Math.sign(valore) * Math.round(Math.abs(valore) * f + 1e-9) / f
}

/** Formato italiano con virgola decimale: 84.3 -> "84,3". */
export function formattaIt(valore: number | null | undefined, decimali = 1): string {
  if (valore === null || valore === undefined || !Number.isFinite(valore)) return '/'
  return arrotonda(valore, decimali).toFixed(decimali).replace('.', ',')
}

/** Somma energetica di livelli in dB pesata sulle durate, normalizzata su `riferimento`. */
export function mediaEnergetica(periodi: { durata: number; livello: number }[], riferimento: number): number {
  const energia = periodi.reduce((s, p) => s + p.durata * 10 ** (p.livello / 10), 0)
  return 10 * Math.log10(energia / riferimento)
}
