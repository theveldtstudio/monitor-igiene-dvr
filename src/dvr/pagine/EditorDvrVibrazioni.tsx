/**
 * Redazione del DVR Vibrazioni: dati del documento, matrice dei tempi per mansione
 * (corpo intero e mano-braccio), testi, revisioni e generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { cicloPredefinito } from '../rumore/testiPredefiniti'
import { SOGLIE_VIBRAZIONI, valutaVibrazioni, type FasciaVibrazioni, type TipoVibrazione, type ValorePerCalcolo } from '../vibrazioni/calcolo'
import { datiVibrazioniDaDatabase, mappaValori, periodoVibDaRiga, rilieviVibrazioni } from '../vibrazioni/daDatabase'
import { generaDvrVibrazioni } from '../vibrazioni/generaDvrVibrazioni'
import { valutaDvrVibrazioni } from '../vibrazioni/valutazione'
import { AreaTesto, Bottone, Campo, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { numeroDa, stili } from '../ui/stili'
import { DatiDocumento, Revisioni } from './comuni'

const TIPI_CAMPAGNA = ['vibrazioni-wbv', 'vibrazioni-hav', 'vibrazioni_wbv', 'vibrazioni_hav']
const COLORE: Record<FasciaVibrazioni, string> = { 0: 'var(--text-tertiary)', 1: '#067647', 2: '#b54708', 3: '#b42318' }
const ETICHETTA_FASCIA: Record<FasciaVibrazioni, string> = { 0: 'trascurabile', 1: 'sotto azione', 2: 'oltre azione', 3: 'oltre limite' }
const due = (x: number) => x.toFixed(2).replace('.', ',')

// ---------------------------------------------------------------- matrice dei tempi

interface RigaLocale {
  tipo: TipoVibrazione
  minuti: string
  origine: api.RigaTempi['origine']
  gruppo: string
  fase: string
  macchina: string
  dettaglio: string
  a: string
}

const daRiga = (r: api.RigaTempi): RigaLocale => ({
  tipo: r.valori.tipo ?? 'wbv',
  minuti: String(r.minuti),
  origine: r.origine,
  gruppo: r.valori.gruppo ?? '',
  fase: r.fase,
  macchina: r.macchine ?? '',
  dettaglio: r.valori.dettaglio ?? '',
  a: r.valori.a != null ? String(r.valori.a) : '',
})

function versoRiga(r: RigaLocale, dm: api.DocumentoMansione, ordine: number, valori: Map<string, ValorePerCalcolo>): Omit<api.RigaTempi, 'id'> {
  const v = r.origine === 'misura' ? valori.get(r.gruppo) : undefined
  return {
    documento_id: dm.documento_id,
    mansione_id: dm.mansione_id,
    ordine,
    minuti: Number(r.minuti) || 0,
    origine: r.origine,
    misura_id: null,
    fase: v?.fase ?? r.fase,
    postazione: null,
    macchine: v?.macchina ?? (r.macchina || null),
    valori:
      r.origine === 'misura'
        ? { tipo: r.tipo, gruppo: r.gruppo || null }
        : { tipo: r.tipo, a: numeroDa(r.a) ?? undefined, dettaglio: r.dettaglio || null },
    nota: null,
  }
}

const vuota = (tipo: TipoVibrazione): RigaLocale => ({ tipo, minuti: '', origine: 'misura', gruppo: '', fase: '', macchina: '', dettaglio: '', a: '' })
const pausa = (tipo: TipoVibrazione): RigaLocale => ({ tipo, minuti: '15', origine: 'convenzionale', gruppo: '', fase: 'Pausa fisiologica', macchina: '', dettaglio: '', a: '0.01' })

function TabellaTipo({
  tipo,
  righe,
  valori,
  cambia,
  togli,
}: {
  tipo: TipoVibrazione
  righe: { r: RigaLocale; i: number }[]
  valori: ValorePerCalcolo[]
  cambia: (i: number, patch: Partial<RigaLocale>) => void
  togli: (i: number) => void
}) {
  const disponibili = valori.filter((v) => v.tipo === tipo)
  return (
    <table style={{ ...stili.tabella, marginTop: 4 }}>
      <thead>
        <tr>
          {['Min', 'Origine', tipo === 'wbv' ? 'Macchina / fase / regime' : 'Utensile / fase / impugnatura', '', tipo === 'wbv' ? 'A(w)max' : 'A(w)sum', ''].map((h, k) => (
            <th key={k} style={stili.th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {righe.map(({ r, i }) => (
          <tr key={i}>
            <td style={stili.td}>
              <input inputMode="numeric" style={{ ...stili.input, width: 56 }} value={r.minuti} onChange={(e) => cambia(i, { minuti: e.target.value })} />
            </td>
            <td style={stili.td}>
              <select style={stili.input} value={r.origine} onChange={(e) => cambia(i, { origine: e.target.value as RigaLocale['origine'] })}>
                <option value="misura">Misure</option>
                <option value="storico">Dato storico</option>
                <option value="convenzionale">Convenzionale</option>
              </select>
            </td>
            {r.origine === 'misura' ? (
              <>
                <td style={stili.td} colSpan={2}>
                  <select style={{ ...stili.input, width: '100%' }} value={r.gruppo} onChange={(e) => cambia(i, { gruppo: e.target.value })}>
                    <option value="">— scegli —</option>
                    {disponibili.map((v) => (
                      <option key={v.chiave} value={v.chiave}>
                        {v.macchina} – {v.fase}
                        {v.dettaglio ? ` – ${v.dettaglio}` : ''} ({due(v.valore)} m/s², {v.n} {v.n === 1 ? 'misura' : 'misure'})
                      </option>
                    ))}
                  </select>
                </td>
                <td style={stili.td}>{r.gruppo ? due(disponibili.find((v) => v.chiave === r.gruppo)?.valore ?? 0) : ''}</td>
              </>
            ) : (
              <>
                <td style={stili.td}>
                  <input style={{ ...stili.input, width: '100%' }} placeholder="Fase" value={r.fase} onChange={(e) => cambia(i, { fase: e.target.value })} />
                </td>
                <td style={stili.td}>
                  <div style={stili.riga}>
                    <input style={{ ...stili.input, width: 140 }} placeholder={tipo === 'wbv' ? 'Macchina' : 'Utensile'} value={r.macchina} onChange={(e) => cambia(i, { macchina: e.target.value })} />
                    <input style={{ ...stili.input, width: 90 }} placeholder={tipo === 'wbv' ? 'Regime' : 'Impugnatura'} value={r.dettaglio} onChange={(e) => cambia(i, { dettaglio: e.target.value })} />
                  </div>
                </td>
                <td style={stili.td}>
                  <input inputMode="decimal" style={{ ...stili.input, width: 64 }} value={r.a} onChange={(e) => cambia(i, { a: e.target.value })} />
                </td>
              </>
            )}
            <td style={stili.td}>
              <Bottone tipo="pericolo" onClick={() => togli(i)}>
                ✕
              </Bottone>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EditorMansioneVib({ ing, dm, valori, aggiorna }: { ing: Ingresso; dm: api.DocumentoMansione; valori: Map<string, ValorePerCalcolo>; aggiorna: () => Promise<void> }) {
  const mansione = ing.mansioni.find((m) => m.id === dm.mansione_id)
  const [righe, setRighe] = useState<RigaLocale[]>(
    ing.tempi.filter((t) => t.mansione_id === dm.mansione_id).sort((a, b) => a.ordine - b.ordine).map(daRiga),
  )
  const [modificata, setModificata] = useState(false)
  const elencoValori = useMemo(() => [...valori.values()], [valori])

  const cambia = (i: number, patch: Partial<RigaLocale>) => {
    setRighe(righe.map((r, j) => (j === i ? { ...r, ...patch } : r)))
    setModificata(true)
  }
  const togli = (i: number) => {
    setRighe(righe.filter((_, j) => j !== i))
    setModificata(true)
  }
  const aggiungi = (r: RigaLocale) => {
    setRighe([...righe, r])
    setModificata(true)
  }

  const esito = (tipo: TipoVibrazione) => {
    const periodi = righe
      .filter((r) => r.tipo === tipo)
      .map((r, k) => periodoVibDaRiga({ ...versoRiga(r, dm, k, valori), id: '' }, valori))
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => p.periodo)
    const totale = righe.filter((r) => r.tipo === tipo).reduce((s, r) => s + (Number(r.minuti) || 0), 0)
    return { r: valutaVibrazioni(tipo, periodi), totale, vuoto: !righe.some((r) => r.tipo === tipo) }
  }

  const salva = () =>
    esegui(async () => {
      const nuove = righe.map((r, i) => {
        const riga = versoRiga(r, dm, i, valori)
        if (!(riga.minuti > 0)) throw new Error(`Riga ${i + 1}: mancano i minuti.`)
        if (r.origine === 'misura' && !r.gruppo) throw new Error(`Riga ${i + 1}: scegli le misure.`)
        if (r.origine !== 'misura' && (!r.fase || numeroDa(r.a) === null)) throw new Error(`Riga ${i + 1}: servono fase e accelerazione.`)
        return riga
      })
      const salvate = await api.sostituisciTempi(dm.documento_id, dm.mansione_id, nuove)
      setRighe(salvate.map(daRiga))
      setModificata(false)
      await aggiorna()
    }, `Salvata: ${mansione?.nome ?? ''}`)

  return (
    <div role="group" aria-label={mansione?.nome ?? 'mansione'} style={{ ...stili.sezione, background: 'var(--bg-app)' }}>
      <div style={{ ...stili.riga, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 14 }}>{mansione?.nome ?? '(mansione eliminata)'}</b>
        <div style={stili.riga}>
          <Bottone
            tipo="pericolo"
            onClick={() =>
              void esegui(async () => {
                await api.togliDocumentoMansione(dm.documento_id, dm.mansione_id)
                await aggiorna()
              })
            }
          >
            Togli dal DVR
          </Bottone>
          <Bottone tipo="primario" disabled={!modificata} onClick={() => void salva()}>
            Salva mansione
          </Bottone>
        </div>
      </div>
      {(['wbv', 'hav'] as const).map((tipo) => {
        const e = esito(tipo)
        const s = SOGLIE_VIBRAZIONI[tipo]
        return (
          <div key={tipo} style={{ marginTop: 10 }}>
            <div style={{ ...stili.riga, justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{tipo === 'wbv' ? 'Corpo intero (WBV)' : 'Mano-braccio (HAV)'}</span>
              {e.vuoto ? (
                <span style={{ color: 'var(--text-tertiary)' }}>nessun periodo: esposizione trascurabile</span>
              ) : (
                <span>
                  <span style={{ color: e.totale === 480 ? 'var(--text-secondary)' : '#b42318' }}>{e.totale} / 480 min</span>{' '}
                  <b style={{ color: COLORE[e.r.fascia] }}>
                    A(8) {due(e.r.a8Arrotondato)} · con +20% {due(e.r.esposizione)} m/s² · {ETICHETTA_FASCIA[e.r.fascia]} (azione {due(s.azione)}, limite {due(s.limite)})
                  </b>
                </span>
              )}
            </div>
            {!e.vuoto && (
              <TabellaTipo tipo={tipo} righe={righe.map((r, i) => ({ r, i })).filter((x) => x.r.tipo === tipo)} valori={elencoValori} cambia={cambia} togli={togli} />
            )}
            <div style={{ ...stili.riga, marginTop: 6 }}>
              <Bottone onClick={() => aggiungi(vuota(tipo))}>+ Riga {tipo.toUpperCase()}</Bottone>
              <Bottone onClick={() => aggiungi(pausa(tipo))}>+ Pausa 15 min</Bottone>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MatriceTempi({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const valori = useMemo(() => mappaValori(rilieviVibrazioni(ing.misure)), [ing.misure])
  const incluse = new Set(ing.documentoMansioni.map((d) => d.mansione_id))
  const aggiungibili = ing.mansioni.filter((m) => m.attiva && !incluse.has(m.id))
  const [daAggiungere, setDaAggiungere] = useState('')
  return (
    <Sezione titolo="Matrice dei tempi (giornata tipo di 480 minuti, separata per corpo intero e mano-braccio)">
      <p style={stili.nota}>
        Le misure ripetute sulla stessa macchina, fase e regime valgono media + deviazione standard; per gli utensili con doppia impugnatura si usa quella con la vibrazione più alta. Senza periodi l’esposizione di quel tipo è trascurabile.
      </p>
      {valori.size === 0 && <p style={stili.attenzione}>Nessuna misura di vibrazioni nelle campagne scelte: seleziona le campagne nei dati del documento.</p>}
      {[...ing.documentoMansioni]
        .sort((a, b) => a.ordine - b.ordine)
        .map((dm) => (
          <EditorMansioneVib key={dm.mansione_id} ing={ing} dm={dm} valori={valori} aggiorna={aggiorna} />
        ))}
      <div style={{ ...stili.riga, marginTop: 8 }}>
        <select style={stili.input} value={daAggiungere} onChange={(e) => setDaAggiungere(e.target.value)}>
          <option value="">— aggiungi una mansione al DVR —</option>
          {aggiungibili.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
        <Bottone
          disabled={!daAggiungere}
          onClick={() =>
            void esegui(async () => {
              await api.salvaDocumentoMansione({ documento_id: ing.documento.id, mansione_id: daAggiungere, ordine: ing.documentoMansioni.length, dati: {} })
              setDaAggiungere('')
              await aggiorna()
            })
          }
        >
          Aggiungi
        </Bottone>
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- testi e rapporti

function Contenuti({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const doc = ing.documento
  const tipi = ing.ambiti.filter((a) => doc.ambiti_ids.includes(a.id)).map((a) => a.tipo)
  const [c, setC] = useState<api.ContenutiRumore>(doc.contenuti ?? {})
  const ciclo = c.ciclo ?? (cicloPredefinito(tipi).length ? cicloPredefinito(tipi) : [{ testo: '', punti: [] }])
  const salva = () =>
    esegui(async () => {
      await api.aggiornaContenuti(doc.id, { ciclo: c.ciclo ?? null, rapportoWbv: c.rapportoWbv ?? null, rapportoHav: c.rapportoHav ?? null })
      await aggiorna()
    }, 'Salvato')
  return (
    <Sezione titolo="Rapporti di prova e testi" chiusa azioni={<Bottone tipo="primario" onClick={() => void salva()}>Salva</Bottone>}>
      <div style={stili.griglia}>
        <Campo etichetta="N° rapporto di prova corpo intero" valore={c.rapportoWbv} onChange={(v) => setC({ ...c, rapportoWbv: v })} segnaposto="es. 26_1166" />
        <Campo etichetta="N° rapporto di prova mano-braccio" valore={c.rapportoHav} onChange={(v) => setC({ ...c, rapportoHav: v })} segnaposto="es. 26_1167" />
      </div>
      {ciclo.map((b, i) => (
        <div key={i} style={{ ...stili.griglia, gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
          <AreaTesto etichetta={`Ciclo di lavoro – paragrafo ${i + 1}`} valore={b.testo} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, testo: v } : x)) })} righe={5} />
          <AreaTesto etichetta="Elenco puntato (una voce per riga)" valore={b.punti.join('\n')} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, punti: v.split('\n').filter((y) => y.trim()) } : x)) })} righe={5} />
        </div>
      ))}
      <div style={stili.riga}>
        <Bottone onClick={() => setC({ ...c, ciclo: [...ciclo, { testo: '', punti: [] }] })}>+ Paragrafo</Bottone>
        {c.ciclo && <Bottone onClick={() => setC({ ...c, ciclo: undefined })}>Ripristina ciclo predefinito</Bottone>}
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- riepilogo

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati, righeScartate } = useMemo(() => datiVibrazioniDaDatabase(ing), [ing])
  const v = useMemo(() => valutaDvrVibrazioni(dati.mansioni, dati.opzioni), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [
    !ing.documento.periodo_riferimento && 'periodo di riferimento',
    !ing.documento.data_emissione && 'data di emissione',
    dati.tarature.length === 0 && 'strumenti (tarature)',
  ].filter(Boolean)

  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrVibrazioni(ing.documento.cantiere_id, ing.documento.id)
      saveBlob(r.blob, r.nomeFile)
    }, 'DVR generato')
    setGenerando(false)
  }

  const cella = (e: (typeof v.esiti)[number], tipo: TipoVibrazione) => {
    const r = e[tipo]
    if (e.mansione[tipo].length === 0) return <span style={{ color: 'var(--text-tertiary)' }}>trascurabile</span>
    return (
      <span style={{ color: COLORE[r.fascia], fontWeight: r.fascia >= 2 ? 600 : 400 }}>
        {due(r.esposizione)} m/s² · {ETICHETTA_FASCIA[r.fascia]}
      </span>
    )
  }

  return (
    <Sezione
      titolo="Riepilogo e controlli"
      azioni={
        <Bottone tipo="primario" disabled={generando || v.esiti.length === 0} onClick={() => (errori.length || righeScartate.length ? setConferma(true) : void genera())}>
          {generando ? 'Generazione…' : 'Genera DVR Word'}
        </Bottone>
      }
    >
      <ConfirmDialog
        open={conferma}
        title="Generare comunque?"
        message={`Ci sono ${errori.length + righeScartate.length} errori (in rosso): il documento andrà usato solo come bozza finché non li correggi.`}
        confirmLabel="Genera bozza"
        onCancel={() => setConferma(false)}
        onConfirm={() => void genera()}
      />
      {mancanti.length > 0 && <p style={stili.attenzione}>Mancano: {mancanti.join(', ')}.</p>}
      {errori.map((a, i) => (
        <p key={`e${i}`} style={stili.avviso}>
          {a.mansione ? <b>{a.mansione}: </b> : null}
          {a.messaggio}
        </p>
      ))}
      {righeScartate.map((r, i) => (
        <p key={`s${i}`} style={stili.avviso}>
          <b>{r.mansione}</b> – “{r.fase}” esclusa dal calcolo: {r.motivo}.
        </p>
      ))}
      {v.avvisi
        .filter((a) => a.livello === 'attenzione')
        .map((a, i) => (
          <p key={`a${i}`} style={stili.attenzione}>
            {a.mansione ? `${a.mansione}: ` : ''}
            {a.messaggio}
          </p>
        ))}
      <table style={{ ...stili.tabella, marginTop: 8 }}>
        <thead>
          <tr>
            {['Mansione', 'Corpo intero (esposizione +20%)', 'Mano-braccio (esposizione +20%)'].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.esiti.map((e) => (
            <tr key={e.mansione.id}>
              <td style={stili.td}>{e.mansione.nome}</td>
              <td style={stili.td}>{cella(e, 'wbv')}</td>
              <td style={stili.td}>{cella(e, 'hav')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Sezione>
  )
}

export default function EditorDvrVibrazioni() {
  const { id, docId } = useParams<{ id: string; docId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const chiave = ['dvr', 'ingresso', docId]
  const q = useQuery({ queryKey: chiave, queryFn: () => caricaIngresso(id!, docId!), enabled: Boolean(id && docId) })
  const aggiorna = async () => {
    await qc.invalidateQueries({ queryKey: chiave })
  }
  return (
    <div style={stili.pagina}>
      <div style={stili.barra}>
        <button type="button" style={stili.indietro} onClick={() => navigate(`/cantieri/${id}/dvr`)} aria-label="Torna al DVR del cantiere">
          ‹
        </button>
        <div>
          <h1 style={stili.titolo}>DVR Vibrazioni {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, Titolo VIII Capo III – UNI ISO 2631-1, UNI EN ISO 5349</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA} etichettaCampagne="vibrazioni corpo intero e mano-braccio" />
          <MatriceTempi ing={q.data} aggiorna={aggiorna} />
          <Contenuti ing={q.data} aggiorna={aggiorna} />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
