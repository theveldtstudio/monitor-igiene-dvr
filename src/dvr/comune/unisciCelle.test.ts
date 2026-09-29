import { describe, expect, it } from 'vitest'
import { unibile, unisciCelleMarcate } from './unisciCelle'

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
const tc = (t: string, pr = '') => `<w:tc>${pr ? `<w:tcPr>${pr}</w:tcPr>` : ''}<w:p><w:r><w:t>${t}</w:t></w:r></w:p></w:tc>`
const doc = (righe: string[][]) => `<w:document ${W}><w:body><w:tbl>${righe.map((r) => `<w:tr>${r.join('')}</w:tr>`).join('')}</w:tbl></w:body></w:document>`

function leggi(xml: string) {
  const righe = [...xml.matchAll(/<w:tr>(.*?)<\/w:tr>/g)].map((m) =>
    [...m[1].matchAll(/<w:tc>(.*?)<\/w:tc>/g)].map((c) => {
      const v = /<w:vMerge( w:val="restart")?\/>/.exec(c[1])
      const t = [...c[1].matchAll(/<w:t>(.*?)<\/w:t>|<w:t\/>/g)].map((x) => x[1] ?? '').join('')
      return `${v ? (v[1] ? 'R:' : 'C:') : ''}${t}`
    }),
  )
  return righe
}

describe('unione verticale delle celle marcate', () => {
  it('unisce le celle consecutive con la stessa chiave e toglie i marcatori', () => {
    const xml = doc([
      [tc(unibile('a', 'Posa centina')), tc('Montaggio')],
      [tc(unibile('a', 'Posa centina')), tc('Verifica')],
      [tc(unibile('b', 'Spritz')), tc('Assistenza')],
      [tc(unibile('a', 'Posa centina')), tc('Altro')],
    ])
    expect(leggi(unisciCelleMarcate(xml))).toEqual([
      ['R:Posa centina', 'Montaggio'],
      ['C:', 'Verifica'],
      ['Spritz', 'Assistenza'],
      ['Posa centina', 'Altro'],
    ])
  })

  it('segue le celle già unite nel template (coppie di righe)', () => {
    const xml = doc([
      [tc(unibile('f', 'Scavo'), '<w:vMerge w:val="restart"/>'), tc('dritta')],
      [tc('', '<w:vMerge/>'), tc('1')],
      [tc(unibile('f', 'Scavo'), '<w:vMerge w:val="restart"/>'), tc('curva')],
      [tc('', '<w:vMerge/>'), tc('2')],
    ])
    expect(leggi(unisciCelleMarcate(xml)).map((r) => r[0])).toEqual(['R:Scavo', 'C:', 'C:', 'C:'])
  })

  it('senza marcatori il documento resta identico', () => {
    const xml = doc([[tc('x'), tc('y')]])
    expect(unisciCelleMarcate(xml)).toBe(xml)
  })
})
