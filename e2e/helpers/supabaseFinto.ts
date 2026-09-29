/**
 * Supabase finto per gli E2E del modulo DVR: intercetta le chiamate REST (PostgREST) e le serve
 * da tabelle in memoria. Copre solo quello che usa l'app: filtri eq/in, order, limit, upsert,
 * insert, update, delete, single/maybeSingle. Nessun dato reale viene toccato.
 */
import type { Page, Route } from '@playwright/test'
import { randomUUID } from 'node:crypto'

export type Riga = Record<string, unknown>
export type Tabelle = Record<string, Riga[]>

const CHIAVI: Record<string, string[]> = {
  dvr_anagrafica_cantiere: ['cantiere_id'],
  dvr_documento_mansioni: ['documento_id', 'mansione_id'],
}
const chiave = (tabella: string) => CHIAVI[tabella] ?? ['id']

/** Valori predefiniti delle colonne, come nella migrazione (il finto non ha un database vero). */
const PREDEFINITI: Record<string, Riga> = {
  dvr_anagrafica_cantiere: { rls: [], gruppo_lavoro: [] },
  dvr_ambiti: { ordine: 0, metodo_scavo: null, descrizione: null },
  dvr_mansioni: { attiva: true, ordine: 0, attivita: null },
  dvr_macchine: { ordine: 0 },
  dvr_dpi: { attivo: true, ordine: 0, dati: {} },
  dvr_documenti: { ambiti_ids: [], campagne_ids: [], revisione: 0, integrazione: null, stato: 'bozza', data_emissione: null, parametri: {}, contenuti: {}, documento_precedente_id: null },
  dvr_documento_mansioni: { ordine: 0, dati: {} },
  dvr_tempi: { ordine: 0, origine: 'misura', misura_id: null, valori: {}, nota: null },
}

function filtra(righe: Riga[], params: URLSearchParams): Riga[] {
  let out = righe
  for (const [k, v] of params.entries()) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue
    const [op, ...resto] = v.split('.')
    const val = resto.join('.')
    if (op === 'eq') out = out.filter((r) => String(r[k]) === val)
    else if (op === 'in') {
      const lista = val.replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, ''))
      out = out.filter((r) => lista.includes(String(r[k])))
    } else if (op === 'is') out = out.filter((r) => (val === 'null' ? r[k] == null : String(r[k]) === val))
  }
  return out
}

function ordina(righe: Riga[], order: string | null): Riga[] {
  if (!order) return righe
  const criteri = order.split(',').map((c) => {
    const [col, dir] = c.split('.')
    return { col, desc: dir === 'desc' }
  })
  return [...righe].sort((a, b) => {
    for (const { col, desc } of criteri) {
      const x = a[col] as string | number
      const y = b[col] as string | number
      if (x === y) continue
      const cmp = x == null ? -1 : y == null ? 1 : x < y ? -1 : 1
      return desc ? -cmp : cmp
    }
    return 0
  })
}

export async function installaSupabaseFinto(page: Page, tabelle: Tabelle) {
  const rispondi = (route: Route, stato: number, corpo: unknown) =>
    route.fulfill({ status: stato, contentType: 'application/json', body: JSON.stringify(corpo) })

  await page.route('**/auth/v1/**', (route) => rispondi(route, 200, {}))
  await page.route('**/storage/v1/**', (route) => rispondi(route, 200, []))
  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const tabella = url.pathname.split('/rest/v1/')[1]
    tabelle[tabella] ??= []
    const righe = tabelle[tabella]
    const params = url.searchParams
    const oggetto = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    const metodo = req.method()
    const adesso = new Date().toISOString()

    const esito = (lista: Riga[]) => {
      if (!oggetto) return rispondi(route, metodo === 'POST' ? 201 : 200, lista)
      if (lista.length !== 1) return rispondi(route, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${lista.length} rows`, hint: null })
      return rispondi(route, 200, lista[0])
    }

    if (metodo === 'GET' || metodo === 'HEAD') {
      let lista = ordina(filtra(righe, params), params.get('order'))
      const limit = params.get('limit')
      if (limit) lista = lista.slice(0, Number(limit))
      return esito(lista)
    }
    if (metodo === 'POST') {
      const corpo = req.postDataJSON() as Riga | Riga[]
      const nuove = Array.isArray(corpo) ? corpo : [corpo]
      const upsert = (req.headers()['prefer'] ?? '').includes('merge-duplicates')
      const k = chiave(tabella)
      const salvate: Riga[] = []
      for (const n of nuove) {
        const esistente = upsert ? righe.find((r) => k.every((c) => n[c] !== undefined && r[c] === n[c])) : undefined
        if (esistente) {
          Object.assign(esistente, n, { updated_at: adesso })
          salvate.push(esistente)
        } else {
          const riga: Riga = { ...(PREDEFINITI[tabella] ?? {}), created_at: adesso, updated_at: adesso, ...n }
          if (k[0] === 'id' && !riga.id) riga.id = randomUUID()
          righe.push(riga)
          salvate.push(riga)
        }
      }
      return esito(ordina(salvate, params.get('order')))
    }
    if (metodo === 'PATCH') {
      const corpo = req.postDataJSON() as Riga
      const lista = filtra(righe, params)
      lista.forEach((r) => Object.assign(r, corpo, { updated_at: adesso }))
      return esito(lista)
    }
    if (metodo === 'DELETE') {
      const via = new Set(filtra(righe, params))
      tabelle[tabella] = righe.filter((r) => !via.has(r))
      return esito([...via])
    }
    return rispondi(route, 405, {})
  })
}
