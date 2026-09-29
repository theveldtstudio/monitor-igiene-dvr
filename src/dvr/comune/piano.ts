/** Piano di contenimento dei rischi: voci con eventuale sotto-elenco, modificabili come testo. */

export interface VocePiano {
  testo: string
  /** sotto-elenco (es. i sintomi da evidenziare negli incontri formativi) */
  sotto?: string[]
}

/** Piano come testo: una voce per riga, le righe che iniziano con "- " sono il sotto-elenco della voce sopra. */
export function pianoDaTesto(t: string): VocePiano[] {
  const out: VocePiano[] = []
  for (const riga of t.split('\n')) {
    const s = riga.trim()
    if (!s) continue
    if (s.startsWith('- ') && out.length) (out[out.length - 1].sotto ??= []).push(s.slice(2).trim())
    else out.push({ testo: s })
  }
  return out
}
export const pianoInTesto = (p: VocePiano[]) => p.map((v) => [v.testo, ...(v.sotto ?? []).map((x) => `- ${x}`)].join('\n')).join('\n')
