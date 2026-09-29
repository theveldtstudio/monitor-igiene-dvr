/**
 * Dal database al DVR MMC: attività e metodi dai contenuti del documento; le misure MMC e OCRA
 * delle campagne scelte si possono importare come attività da completare.
 */
import type { MisuraRumore as MisuraCampagna } from '../api'
import type { Ingresso } from '../comune/ingresso'
import { meseAnno } from '../rumore/daDatabase'
import type { DatiDvrMmc } from './documento'
import type { CompitoNiosh, PresaNiosh } from './niosh'
import type { CompitoSnook } from './snook'
import type { AttivitaMmc } from './valutazione'

export const TIPI_CAMPAGNA_MMC = ['mmc', 'movimenti_ripetitivi_ocra']

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const PRESE: Record<string, PresaNiosh> = { Buona: 'buono', Discreta: 'medio', Scarsa: 'scarso' }

/** Frequenza in atti al minuto dalla frequenza e dall'unità della misura. */
export function frequenzaAlMinuto(f: number | null, unita: unknown): number | null {
  if (f === null) return null
  if (unita === 'atti/ora') return f / 60
  if (unita === 'atti/turno') return f / 480
  return f
}

let contatore = 0
export const nuovoId = () => `att-${Date.now().toString(36)}-${(++contatore).toString(36)}`

/** Una attività per misura MMC (NIOSH se c'è un sollevamento, Snook se spinta/traino/trasporto). */
export function attivitaDaMisuraMmc(m: MisuraCampagna): AttivitaMmc | null {
  const d = m.misura.dati
  const peso = num(d.carico)
  const spinta = num(d.spinta)
  const traino = num(d.traino)
  const distanzaTrasporto = num(d.distanza_trasporto)
  const f = frequenzaAlMinuto(num(d.frequenza_gesti), d.frequenza_unita)
  const titolo = (m.misura.note ?? '').split('\n')[0].trim() || `Movimentazione rilevata n° ${m.misura.numero}`
  const base = { id: nuovoId(), titolo, descrizione: m.misura.note ?? '', mansioni: [] as string[] }
  const intervallo = f && f > 0 ? Math.round(60 / f) : 8 * 3600
  if (spinta !== null || traino !== null) {
    const snook: CompitoSnook = {
      azione: spinta !== null ? 'spinta' : 'traino',
      altezza: num(d.altezza_mani) ?? 95,
      distanza: distanzaTrasporto ?? 2,
      intervallo,
      valore: (spinta ?? traino)!,
      mantenimento: num(d.forza_mantenimento),
    }
    return { ...base, metodo: 'snook', snook }
  }
  if (peso !== null && distanzaTrasporto !== null && num(d.distanza_verticale) === null) {
    return { ...base, metodo: 'snook', snook: { azione: 'trasporto', altezza: num(d.altezza_mani) ?? 80, distanza: distanzaTrasporto, intervallo, valore: peso } }
  }
  if (peso === null) return null
  const compito: CompitoNiosh = {
    peso,
    persone: Math.max(1, num(d.n_persone) ?? 1),
    altezza: num(d.altezza_mani) ?? 75,
    dislocazione: num(d.distanza_verticale) ?? 25,
    distanza: num(d.distanza_peso_corpo) ?? 25,
    asimmetria: num(d.dislocazione_angolare) ?? 0,
    frequenza: f ?? 0.2,
    // durata da confermare: la misura non la registra; si parte dal caso più cautelativo
    durata: 'lunga',
    presa: PRESE[String(d.giudizio_presa)] ?? 'buono',
  }
  return { ...base, metodo: 'niosh', compiti: [compito] }
}

/** Una attività OCRA per misura (punteggio reale già corretto per la durata). */
export function attivitaDaMisuraOcra(m: MisuraCampagna): AttivitaMmc | null {
  const d = m.misura.dati
  const p = num(d.punteggio_reale)
  if (p === null) return null
  const arto = String(d.arto_valutato ?? '')
  const titolo = (typeof d.denominazione === 'string' && d.denominazione.trim()) || `Movimenti ripetitivi n° ${m.misura.numero}`
  return {
    id: nuovoId(),
    titolo,
    descrizione: m.misura.note ?? '',
    mansioni: [],
    metodo: 'ocra',
    ocra: { dx: arto === 'SX' ? null : p, sx: arto === 'DX' ? null : arto === 'SX' || arto === 'Entrambi' ? p : null, minuti: num(d.minuti_compito) },
  }
}

export function attivitaDaMisure(misure: MisuraCampagna[]): AttivitaMmc[] {
  const out: AttivitaMmc[] = []
  for (const m of misure) {
    const tipo = m.campagna.tipo_campionamento
    const a = tipo === 'mmc' ? attivitaDaMisuraMmc(m) : tipo === 'movimenti_ripetitivi_ocra' ? attivitaDaMisuraOcra(m) : null
    if (a) out.push({ ...a, misuraId: m.misura.id })
  }
  return out
}

export function datiMmcDaDatabase(x: Ingresso): { dati: DatiDvrMmc } {
  const c = x.documento.contenuti ?? {}
  const mansioni = [...x.documentoMansioni]
    .sort((a, b) => a.ordine - b.ordine)
    .map((dm) => {
      const m = x.mansioni.find((y) => y.id === dm.mansione_id)
      return { id: dm.mansione_id, nome: m?.nome ?? '(mansione eliminata)', attivita: m?.attivita ?? undefined }
    })
  const ambitiDoc = x.ambiti.filter((a) => x.documento.ambiti_ids.includes(a.id))
  const { cantiere_id: _c, ...anagrafica } = x.anagrafica
  void _c
  return {
    dati: {
      anagrafica,
      documento: {
        periodoRiferimento: x.documento.periodo_riferimento ?? '',
        revisione: x.documento.revisione,
        integrazione: x.documento.integrazione,
        dataEmissioneTesto: meseAnno(x.documento.data_emissione),
        anno: (x.documento.data_emissione ? new Date(x.documento.data_emissione) : new Date()).getFullYear(),
        primaValutazione: x.documento.revisione === 0 && !x.documento.documento_precedente_id,
        revisioni: x.revisioni,
      },
      ambiti: (ambitiDoc.length ? ambitiDoc : x.ambiti).map((a) => ({ nome: a.nome, tipo: a.tipo })),
      mansioni,
      attivita: c.attivitaMmc ?? [],
      testi: { ciclo: c.ciclo ?? undefined },
    },
  }
}
