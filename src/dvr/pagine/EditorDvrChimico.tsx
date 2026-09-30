/**
 * Redazione dei DVR Agenti chimici (polveri e gas tossici), Fumi di saldatura e Agenti cancerogeni
 * (silice libera cristallina e carbonio elementare): ambienti di lavoro con le misure, limiti e
 * gravità degli agenti, giornata tipo per mansione, testi e piano; riepilogo con la classificazione
 * del modello Regione Piemonte e le esposizioni, generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { CAMPAGNE_PER_TIPO, TITOLI_TIPO, type AgenteChimico, type TipoDvrChimico } from '../chimico/agenti'
import { contenutiChimico, datiChimicoDaDatabase, eRischioChimico, importaMisure, nuovoId, periodiDaTempi, type ContenutiChimico } from '../chimico/daDatabase'
import { agentiDocumento, CICLO_SALDATURA } from '../chimico/documento'
import { generaDvrChimico } from '../chimico/generaDvrChimico'
import { testiPredefiniti, type TestiChimico } from '../chimico/testi'
import { CLASSI_PIEMONTE, valutaChimico, type AmbienteChimico, type ClassePiemonte, type MisuraAmbiente } from '../chimico/valutazione'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { formattaIt } from '../comune/numeri'
import { pianoDaTesto, pianoInTesto } from '../comune/piano'
import { eGalleria } from '../comune/tipi'
import { AreaTesto, Bottone, Campo, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { numeroDa, stili } from '../ui/stili'
import { CicloLavoro, DatiDocumento, Revisioni } from './comuni'

const ROSSO = '#b42318'
const COLORE_CLASSE: Record<ClassePiemonte, string> = { irrilevante: '#067647', modesto: '#4d7c0f', medio: '#b54708', alto: '#c4320a', 'molto alto': ROSSO }
const griglia = (min: number) => ({ ...stili.griglia, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` })
const righeTesto = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean)
const valore = (x: number | null | undefined, dec = 2) => (x == null || !Number.isFinite(x) ? '–' : formattaIt(x, dec))

/** Casella numerica compatta per le tabelle (il testo resta com'è finché non è un numero valido). */
function NumeroCella({ valore: v, onChange, etichetta }: { valore: number | null | undefined; onChange: (x: number | null) => void; etichetta: string }) {
  const [testo, setTesto] = useState(v == null ? '' : String(v).replace('.', ','))
  const [ultimo, setUltimo] = useState(v)
  if (v !== ultimo) {
    setUltimo(v)
    if (numeroDa(testo) !== (v ?? null)) setTesto(v == null ? '' : String(v).replace('.', ','))
  }
  return (
    <input
      aria-label={etichetta}
      inputMode="decimal"
      style={{ ...stili.input, width: 70, padding: '4px 6px' }}
      value={testo}
      onChange={(e) => {
        setTesto(e.target.value)
        const n = e.target.value.trim() === '' ? null : numeroDa(e.target.value)
        if (e.target.value.trim() === '' || n !== null) onChange(n)
      }}
    />
  )
}

// ---------------------------------------------------------------- ambiente di lavoro

function EditorAmbiente({ a, agenti, cambia, togli }: { a: AmbienteChimico; agenti: AgenteChimico[]; cambia: (p: Partial<AmbienteChimico>) => void; togli: () => void }) {
  const cambiaMisura = (k: number, p: Partial<MisuraAmbiente>) => cambia({ misure: a.misure.map((m, j) => (j === k ? { ...m, ...p } : m)) })
  const nome = `${a.fase} – ${a.postazione}`
  return (
    <div role="group" aria-label={`Ambiente ${nome}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
      <div style={griglia(180)}>
        <Campo etichetta="Fase lavorativa" valore={a.fase} onChange={(v) => cambia({ fase: v })} />
        <Campo etichetta="Postazione" valore={a.postazione} onChange={(v) => cambia({ postazione: v })} />
        <Campo etichetta="Mansioni maggiormente esposte" valore={a.mansioniEsposte ?? ''} onChange={(v) => cambia({ mansioniEsposte: v })} />
        <label style={stili.campo}>
          Fattore durata (modello Piemonte)
          <select style={stili.input} value={a.durata ?? ''} onChange={(e) => cambia({ durata: e.target.value ? Number(e.target.value) : null })}>
            <option value="">dalla matrice dei tempi</option>
            <option value="1">1 – occasionale (≤ 10%)</option>
            <option value="2">2 – frequente (≤ 25%)</option>
            <option value="3">3 – abituale (≤ 50%)</option>
            <option value="4">4 – continua (&gt; 50%)</option>
          </select>
        </label>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={stili.tabella}>
          <thead>
            <tr>
              {['Fronte', 'Avanz. %', 'Tipo', 'Storico', ...agenti.map((g) => `${g.sigla} [${g.unita}]`), ''].map((h, i) => (
                <th key={i} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {a.misure.map((m, k) => (
              <tr key={m.id}>
                <td style={stili.td}>
                  <input aria-label="Fronte" style={{ ...stili.input, width: 90, padding: '4px 6px' }} value={m.fronte ?? ''} onChange={(e) => cambiaMisura(k, { fronte: e.target.value })} />
                </td>
                <td style={stili.td}>
                  <NumeroCella etichetta="Avanzamento" valore={m.avanzamento} onChange={(x) => cambiaMisura(k, { avanzamento: x })} />
                </td>
                <td style={stili.td}>
                  <select aria-label="Tipo di misura" style={{ ...stili.input, padding: '4px 6px' }} value={m.tipo ?? ''} onChange={(e) => cambiaMisura(k, { tipo: e.target.value })}>
                    <option value="">–</option>
                    <option value="A">area</option>
                    <option value="P">personale</option>
                  </select>
                </td>
                <td style={stili.td}>
                  <input type="checkbox" aria-label="Dato di una campagna precedente" checked={!!m.storico} onChange={(e) => cambiaMisura(k, { storico: e.target.checked })} />
                </td>
                {agenti.map((g) => (
                  <td key={g.id} style={stili.td}>
                    <NumeroCella etichetta={g.sigla} valore={m.valori[g.id]} onChange={(x) => cambiaMisura(k, { valori: { ...m.valori, [g.id]: x } })} />
                  </td>
                ))}
                <td style={stili.td}>
                  <Bottone tipo="pericolo" onClick={() => cambia({ misure: a.misure.filter((_, j) => j !== k) })}>
                    ×
                  </Bottone>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ ...stili.riga, marginTop: 8, justifyContent: 'space-between' }}>
        <Bottone onClick={() => cambia({ misure: [...a.misure, { id: nuovoId('mis'), valori: {} }] })}>+ Misura</Bottone>
        <Bottone tipo="pericolo" onClick={togli}>
          Togli ambiente
        </Bottone>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- dati della valutazione

function Valutazione({ ing, tipo, aggiorna }: { ing: Ingresso; tipo: TipoDvrChimico; aggiorna: () => Promise<void> }) {
  const [c, setC] = useState<ContenutiChimico>(() => contenutiChimico(ing))
  const [modificato, setModificato] = useState(false)
  const galleria = ing.ambiti.filter((a) => ing.documento.ambiti_ids.includes(a.id)).some((a) => eGalleria(a.tipo))
  const predefiniti = testiPredefiniti(tipo, galleria)
  const t = c.testi ?? {}
  const agenti = useMemo(() => agentiDocumento(tipo, c.agenti), [tipo, c.agenti])
  const testoIniziale = (k: keyof Omit<TestiChimico, 'piano'>) => (t[k] ?? []).join('\n')
  const [testi, setTesti] = useState({
    dpi: testoIniziale('dpi'),
    misure: testoIniziale('misure'),
    campionamento: testoIniziale('campionamento'),
    strumenti: testoIniziale('strumenti'),
    tempi: testoIniziale('tempi'),
    piano: t.piano ? pianoInTesto(t.piano) : '',
  })
  const imposta = (p: Partial<ContenutiChimico>) => {
    setC((x) => ({ ...x, ...p }))
    setModificato(true)
  }
  const cambiaAgente = (id: string, p: Partial<Pick<AgenteChimico, 'tlv' | 'stel' | 'gravita'>>) => imposta({ agenti: { ...c.agenti, [id]: { ...c.agenti?.[id], ...p } } })
  const importabili = useMemo(() => {
    const dopo = importaMisure(c.ambienti, ing.misure, tipo)
    return dopo.reduce((s, a) => s + a.misure.length, 0) - c.ambienti.reduce((s, a) => s + a.misure.length, 0)
  }, [c.ambienti, ing.misure, tipo])

  const salva = () =>
    esegui(async () => {
      c.ambienti.forEach((a, i) => {
        if (!a.fase.trim()) throw new Error(`Ambiente ${i + 1}: manca la fase lavorativa.`)
      })
      const testiSalvati: TestiChimico = {}
      for (const k of ['dpi', 'misure', 'campionamento', 'strumenti', 'tempi'] as const) {
        const r = righeTesto(testi[k])
        if (r.length) testiSalvati[k] = r
      }
      const piano = pianoDaTesto(testi.piano)
      if (piano.length) testiSalvati.piano = piano
      await api.aggiornaContenuti(ing.documento.id, { chimico: { ...c, testi: testiSalvati } })
      setModificato(false)
      await aggiorna()
    }, 'Dati del DVR salvati')

  const bottoneSalva = (
    <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
      Salva
    </Bottone>
  )
  const testo = (k: keyof typeof testi) => (v: string) => {
    setTesti((x) => ({ ...x, [k]: v }))
    setModificato(true)
  }
  const predefinito = (k: keyof Omit<TestiChimico, 'piano'>) => `vuoto = testo predefinito (“${(predefiniti[k][0] ?? '').slice(0, 60)}…”)`

  return (
    <>
      <Sezione
        titolo="Ambienti di lavoro e misure"
        azioni={
          <>
            <Bottone disabled={importabili === 0} onClick={() => imposta({ ambienti: importaMisure(c.ambienti, ing.misure, tipo) })} title="Misure delle campagne scelte, raggruppate per fase e postazione">
              Importa dalle misure ({importabili})
            </Bottone>
            {bottoneSalva}
          </>
        }
      >
        <p style={stili.nota}>
          La concentrazione dell’ambiente è la media delle misure (anche storiche, segnate con l’asterisco nel documento). Le colonne senza campo nelle misure dell’app (es. metalli, polveri inalabili) si compilano a mano dai rapporti di prova.
        </p>
        {c.ambienti.map((a, k) => (
          <EditorAmbiente
            key={a.id}
            a={a}
            agenti={agenti}
            cambia={(p) => imposta({ ambienti: c.ambienti.map((x, j) => (j === k ? { ...x, ...p } : x)) })}
            togli={() => imposta({ ambienti: c.ambienti.filter((_, j) => j !== k) })}
          />
        ))}
        <Bottone onClick={() => imposta({ ambienti: [...c.ambienti, { id: nuovoId(), fase: '', postazione: '', misure: [{ id: nuovoId('mis'), valori: {} }] }] })}>+ Ambiente</Bottone>
      </Sezione>

      <Sezione titolo="Agenti: valori limite e gravità" azioni={bottoneSalva} chiusa>
        <table style={stili.tabella}>
          <thead>
            <tr>
              {['Agente', 'Unità', 'TLV-TWA / VLEP', 'TLV-STEL', ...(tipo === 'cancerogeno' ? [] : ['Gravità M (1–5)']), 'Fonte'].map((h) => (
                <th key={h} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agenti.map((g) => (
              <tr key={g.id}>
                <td style={stili.td}>{g.nome}</td>
                <td style={stili.td}>{g.unita}</td>
                <td style={stili.td}>{g.minimo != null ? `minimo ${formattaIt(g.minimo, 0)}` : <NumeroCella etichetta={`TLV ${g.sigla}`} valore={g.tlv} onChange={(x) => cambiaAgente(g.id, { tlv: x })} />}</td>
                <td style={stili.td}>{g.minimo != null ? '–' : <NumeroCella etichetta={`STEL ${g.sigla}`} valore={g.stel} onChange={(x) => cambiaAgente(g.id, { stel: x })} />}</td>
                {tipo !== 'cancerogeno' && (
                  <td style={stili.td}>{g.minimo != null ? '–' : <NumeroCella etichetta={`Gravità ${g.sigla}`} valore={g.gravita} onChange={(x) => cambiaAgente(g.id, { gravita: x })} />}</td>
                )}
                <td style={stili.td}>{g.fonte ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {c.agenti && Object.keys(c.agenti).length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Bottone onClick={() => imposta({ agenti: undefined })}>Ripristina i valori predefiniti</Bottone>
          </div>
        )}
      </Sezione>

      <Sezione titolo="Testi e piano" azioni={bottoneSalva} chiusa>
        <div style={{ ...stili.griglia, gridTemplateColumns: '1fr' }}>
          <AreaTesto etichetta={`DPI (un paragrafo per riga; ${predefinito('dpi')})`} valore={testi.dpi} onChange={testo('dpi')} righe={3} />
          <AreaTesto etichetta={`Misure preventive adottate (una per riga; ${predefinito('misure')})`} valore={testi.misure} onChange={testo('misure')} righe={4} />
          <AreaTesto etichetta={`Campionamento (un paragrafo per riga; ${predefinito('campionamento')})`} valore={testi.campionamento} onChange={testo('campionamento')} righe={3} />
          <AreaTesto etichetta={`Strumentazione (una per riga; ${predefinito('strumenti')})`} valore={testi.strumenti} onChange={testo('strumenti')} righe={3} />
          <AreaTesto etichetta={`Elaborazione dei dati e tempi (un paragrafo per riga; ${predefinito('tempi')})`} valore={testi.tempi} onChange={testo('tempi')} righe={3} />
          <AreaTesto etichetta="Piano di contenimento (una voce per riga, “- ” per il sotto-elenco; vuoto = piano predefinito)" valore={testi.piano} onChange={testo('piano')} righe={8} />
          <div>
            <Bottone onClick={() => testo('piano')(pianoInTesto(predefiniti.piano))}>Carica il piano predefinito</Bottone>
          </div>
        </div>
      </Sezione>
    </>
  )
}

// ---------------------------------------------------------------- matrice dei tempi

interface RigaLocale {
  minuti: string
  fase: string
  postazione: string
  ambiente: string
  concentrazioni: Record<string, number | null>
}

function daRiga(r: api.RigaTempi): RigaLocale {
  return { minuti: String(r.minuti), fase: r.fase, postazione: r.postazione ?? '', ambiente: r.valori.ambiente ?? '', concentrazioni: r.valori.concentrazioni ?? {} }
}

function EditorMansione({ ing, dm, tipo, aggiorna }: { ing: Ingresso; dm: api.DocumentoMansione; tipo: TipoDvrChimico; aggiorna: () => Promise<void> }) {
  const mansione = ing.mansioni.find((m) => m.id === dm.mansione_id)
  const c = contenutiChimico(ing)
  const agenti = agentiDocumento(tipo, c.agenti)
  const [righe, setRighe] = useState<RigaLocale[]>(() => ing.tempi.filter((t) => t.mansione_id === dm.mansione_id).sort((a, b) => a.ordine - b.ordine).map(daRiga))
  const [modificata, setModificata] = useState(false)
  const cambia = (i: number, p: Partial<RigaLocale>) => {
    setRighe(righe.map((r, j) => (j === i ? { ...r, ...p } : r)))
    setModificata(true)
  }
  const versoRiga = (r: RigaLocale, i: number): Omit<api.RigaTempi, 'id'> => ({
    documento_id: dm.documento_id,
    mansione_id: dm.mansione_id,
    ordine: i,
    minuti: Number(r.minuti) || 0,
    fase: r.fase.trim(),
    postazione: r.postazione.trim() || null,
    macchine: null,
    origine: r.ambiente ? 'misura' : 'convenzionale',
    misura_id: null,
    valori: r.ambiente ? { ambiente: r.ambiente } : { concentrazioni: r.concentrazioni },
    nota: null,
  })
  const esito = useMemo(() => {
    const periodi = periodiDaTempi(righe.map((r, i) => ({ ...versoRiga(r, i), id: '' })))
    return valutaChimico(agenti, c.ambienti, [{ mansione: { id: dm.mansione_id, nome: mansione?.nome ?? '' }, periodi }], { piemonte: false }).mansioni[0]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [righe, c.ambienti, agenti])
  const totale = righe.reduce((s, r) => s + (Number(r.minuti) || 0), 0)

  const salva = () =>
    esegui(async () => {
      const nuove = righe.map((r, i) => {
        if (!(Number(r.minuti) > 0)) throw new Error(`Riga ${i + 1}: mancano i minuti.`)
        if (!r.fase.trim()) throw new Error(`Riga ${i + 1}: manca la fase.`)
        return versoRiga(r, i)
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
          <span style={{ fontSize: 13, color: totale === 480 ? 'var(--text-secondary)' : ROSSO }}>{totale} / 480 min</span>
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
      {righe.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={stili.tabella}>
            <thead>
              <tr>
                {['Min', 'Fase', 'Postazione', 'Concentrazioni', ...agenti.map((g) => g.sigla), ''].map((h, i) => (
                  <th key={i} style={stili.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {righe.map((r, i) => (
                <tr key={i}>
                  <td style={stili.td}>
                    <input aria-label="Minuti" inputMode="numeric" style={{ ...stili.input, width: 60, padding: '4px 6px' }} value={r.minuti} onChange={(e) => cambia(i, { minuti: e.target.value })} />
                  </td>
                  <td style={stili.td}>
                    <input aria-label="Fase" style={{ ...stili.input, padding: '4px 6px' }} value={r.fase} onChange={(e) => cambia(i, { fase: e.target.value })} />
                  </td>
                  <td style={stili.td}>
                    <input aria-label="Postazione" style={{ ...stili.input, width: 120, padding: '4px 6px' }} value={r.postazione} onChange={(e) => cambia(i, { postazione: e.target.value })} />
                  </td>
                  <td style={stili.td}>
                    <select
                      aria-label="Ambiente"
                      style={{ ...stili.input, padding: '4px 6px', maxWidth: 220 }}
                      value={r.ambiente}
                      onChange={(e) => {
                        const amb = c.ambienti.find((a) => a.id === e.target.value)
                        cambia(i, { ambiente: e.target.value, ...(amb && !r.fase ? { fase: amb.fase, postazione: amb.postazione } : {}) })
                      }}
                    >
                      <option value="">scritte a mano</option>
                      {c.ambienti.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fase} – {a.postazione}
                        </option>
                      ))}
                    </select>
                  </td>
                  {agenti.map((g) => (
                    <td key={g.id} style={stili.td}>
                      {r.ambiente ? (
                        valore(esito?.periodi[i]?.valori[g.id], g.decimali)
                      ) : (
                        <NumeroCella etichetta={`${g.sigla} riga ${i + 1}`} valore={r.concentrazioni[g.id]} onChange={(x) => cambia(i, { concentrazioni: { ...r.concentrazioni, [g.id]: x } })} />
                      )}
                    </td>
                  ))}
                  <td style={stili.td}>
                    <Bottone
                      tipo="pericolo"
                      onClick={() => {
                        setRighe(righe.filter((_, j) => j !== i))
                        setModificata(true)
                      }}
                    >
                      ×
                    </Bottone>
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ ...stili.td, fontWeight: 600 }} colSpan={4}>
                  Esposizione giornaliera (TWA 8 h)
                </td>
                {agenti.map((g) => (
                  <td key={g.id} style={{ ...stili.td, fontWeight: 600, color: esito?.superamenti.includes(g.id) ? ROSSO : undefined }}>
                    {valore(esito?.twa[g.id], g.decimali)}
                  </td>
                ))}
                <td style={stili.td} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div style={{ ...stili.riga, marginTop: 6 }}>
        <Bottone
          onClick={() => {
            setRighe([...righe, { minuti: '', fase: '', postazione: '', ambiente: '', concentrazioni: {} }])
            setModificata(true)
          }}
        >
          + Riga
        </Bottone>
        <Bottone
          onClick={() => {
            setRighe([...righe, { minuti: '15', fase: 'Pausa fisiologica', postazione: '', ambiente: '', concentrazioni: {} }])
            setModificata(true)
          }}
        >
          + Pausa 15 min
        </Bottone>
      </div>
    </div>
  )
}

function MatriceTempi({ ing, tipo, aggiorna }: { ing: Ingresso; tipo: TipoDvrChimico; aggiorna: () => Promise<void> }) {
  const incluse = new Set(ing.documentoMansioni.map((d) => d.mansione_id))
  const aggiungibili = ing.mansioni.filter((m) => m.attiva && !incluse.has(m.id))
  const [daAggiungere, setDaAggiungere] = useState('')
  return (
    <Sezione titolo="Matrice dei tempi (giornata tipo di 480 minuti)">
      <p style={stili.nota}>
        Ogni riga usa le concentrazioni di un ambiente di lavoro (media delle misure) oppure valori scritti a mano (pause, dati di altre campagne). L’esposizione è la media ponderata sulle 8 ore (UNI EN 689); per l’O₂ si riporta il valore minimo.
      </p>
      {contenutiChimico(ing).ambienti.length === 0 && <p style={stili.attenzione}>Nessun ambiente di lavoro: importa le misure o aggiungi gli ambienti e salva.</p>}
      {[...ing.documentoMansioni]
        .sort((a, b) => a.ordine - b.ordine)
        .map((dm) => (
          <EditorMansione key={`${dm.mansione_id}-${ing.documento.updated_at}`} ing={ing} dm={dm} tipo={tipo} aggiorna={aggiorna} />
        ))}
      <div style={{ ...stili.riga, marginTop: 8 }}>
        <select aria-label="Mansione da aggiungere" style={stili.input} value={daAggiungere} onChange={(e) => setDaAggiungere(e.target.value)}>
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

// ---------------------------------------------------------------- riepilogo

function Riepilogo({ ing, tipo }: { ing: Ingresso; tipo: TipoDvrChimico }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati } = useMemo(() => datiChimicoDaDatabase(ing, tipo), [ing, tipo])
  const agenti = useMemo(() => agentiDocumento(tipo, dati.agenti), [tipo, dati.agenti])
  const nomi = new Map(dati.mansioni.map((m) => [m.id, m.nome]))
  const v = useMemo(
    () =>
      valutaChimico(
        agenti,
        dati.ambienti,
        dati.tempi.filter((t) => t.periodi.length).map((t) => ({ mansione: { id: t.mansioneId, nome: nomi.get(t.mansioneId) ?? '' }, periodi: t.periodi })),
        { piemonte: tipo !== 'cancerogeno' },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agenti, dati],
  )
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [!ing.documento.data_emissione && 'data di emissione', dati.ambienti.length === 0 && 'ambienti di lavoro', v.mansioni.length === 0 && 'matrice dei tempi'].filter(Boolean)
  const conSuperamenti = v.mansioni.filter((m) => m.superamenti.length)

  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrChimico(ing.documento.cantiere_id, ing.documento.id, tipo)
      saveBlob(r.blob, r.nomeFile)
    }, 'DVR generato')
    setGenerando(false)
  }

  return (
    <Sezione
      titolo="Riepilogo e controlli"
      azioni={
        <Bottone tipo="primario" disabled={generando} onClick={() => (errori.length ? setConferma(true) : void genera())}>
          {generando ? 'Generazione…' : 'Genera DVR Word'}
        </Bottone>
      }
    >
      <ConfirmDialog
        open={conferma}
        title="Generare comunque?"
        message={`Ci sono ${errori.length} errori (in rosso): il documento li riporterà così come sono.`}
        confirmLabel="Genera bozza"
        onCancel={() => setConferma(false)}
        onConfirm={() => void genera()}
      />
      {mancanti.length > 0 && <p style={stili.attenzione}>Mancano: {mancanti.join(', ')}.</p>}
      {v.avvisi.slice(0, 12).map((a, i) => (
        <p key={i} style={a.livello === 'errore' ? stili.avviso : stili.attenzione}>
          {a.messaggio}
        </p>
      ))}
      {v.avvisi.length > 12 && <p style={stili.nota}>… altri {v.avvisi.length - 12} avvisi.</p>}
      <p style={stili.nota}>
        {dati.ambienti.length} ambienti · {v.mansioni.length} mansioni con giornata tipo
        {v.mansioni.length ? ` · ${conSuperamenti.length ? `${conSuperamenti.length} con esposizioni oltre il limite` : 'esposizioni entro i limiti'}` : ''}
      </p>
      {tipo !== 'cancerogeno' && v.ambienti.some((e) => e.indici.length) && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...stili.tabella, marginTop: 8 }}>
            <thead>
              <tr>
                <th style={stili.th}>Ambiente (modello Regione Piemonte)</th>
                {agenti
                  .filter((g) => g.gravita)
                  .map((g) => (
                    <th key={g.id} style={stili.th}>
                      {g.sigla}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {v.ambienti.map((e) => (
                <tr key={e.ambiente.id}>
                  <td style={stili.td}>
                    {e.ambiente.fase} – {e.ambiente.postazione}
                  </td>
                  {agenti
                    .filter((g) => g.gravita)
                    .map((g) => {
                      const x = e.indici.find((i) => i.agente.id === g.id)
                      return (
                        <td key={g.id} style={{ ...stili.td, color: x ? COLORE_CLASSE[x.classe] : undefined, fontWeight: x && x.classe !== 'irrilevante' ? 600 : undefined }} title={x ? `E ${x.e} · D ${x.d} · M ${x.m}` : ''}>
                          {x ? `${x.ir} ${x.classe}` : '–'}
                        </td>
                      )
                    })}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={stili.nota}>{CLASSI_PIEMONTE.map((k) => `${k.da}–${k.a} ${k.classe}`).join(' · ')}</p>
        </div>
      )}
      {conSuperamenti.length > 0 && (
        <table style={{ ...stili.tabella, marginTop: 8 }}>
          <thead>
            <tr>
              <th style={stili.th}>Mansione oltre il limite</th>
              <th style={stili.th}>Agenti</th>
            </tr>
          </thead>
          <tbody>
            {conSuperamenti.map((m) => (
              <tr key={m.mansione.id}>
                <td style={stili.td}>{m.mansione.nome}</td>
                <td style={{ ...stili.td, color: ROSSO }}>
                  {m.superamenti
                    .map((id) => {
                      const g = agenti.find((x) => x.id === id)!
                      return `${g.sigla} ${valore(m.twa[id], g.decimali)} ${g.unita}`
                    })
                    .join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sezione>
  )
}

const NORME: Record<TipoDvrChimico, string> = {
  chimico: 'D.Lgs. 81/08, Titolo IX Capo I – UNI EN 689, modello Regione Piemonte',
  fumi_saldatura: 'D.Lgs. 81/08, Titolo IX Capo I – UNI EN ISO 10882, UNI EN 689, modello Regione Piemonte',
  cancerogeno: 'D.Lgs. 81/08, Titolo IX Capo II – allegato XLIII, UNI EN 689',
}

export default function EditorDvrChimico() {
  const { id, docId } = useParams<{ id: string; docId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const chiave = ['dvr', 'ingresso', docId]
  const q = useQuery({ queryKey: chiave, queryFn: () => caricaIngresso(id!, docId!), enabled: Boolean(id && docId) })
  const aggiorna = async () => {
    await qc.invalidateQueries({ queryKey: chiave })
  }
  const rischio = q.data?.documento.rischio
  const tipo: TipoDvrChimico = rischio && eRischioChimico(rischio) ? rischio : 'chimico'
  return (
    <div style={stili.pagina}>
      <div style={stili.barra}>
        <button type="button" style={stili.indietro} onClick={() => navigate(`/cantieri/${id}/dvr`)} aria-label="Torna al DVR del cantiere">
          ‹
        </button>
        <div>
          <h1 style={stili.titolo}>
            {TITOLI_TIPO[tipo]} {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}
          </h1>
          <p style={stili.sottotitolo}>{NORME[tipo]}</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} tipo={tipo} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={CAMPAGNE_PER_TIPO[tipo]} etichettaCampagne={tipo === 'cancerogeno' ? 'polveri e carbonio elementare' : 'polveri e gas'} conTarature={false} />
          <Valutazione key={`val-${q.data.documento.updated_at}`} ing={q.data} tipo={tipo} aggiorna={aggiorna} />
          <MatriceTempi ing={q.data} tipo={tipo} aggiorna={aggiorna} />
          <CicloLavoro ing={q.data} aggiorna={aggiorna} titolo={tipo === 'fumi_saldatura' ? 'Aspetti organizzativi e cicli lavorativi' : 'Ciclo di lavoro'} predefinito={tipo === 'fumi_saldatura' ? CICLO_SALDATURA : undefined} />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}

