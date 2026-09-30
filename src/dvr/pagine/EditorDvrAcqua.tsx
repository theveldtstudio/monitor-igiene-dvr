/**
 * Redazione della relazione di monitoraggio delle acque: punti con destinazione e limiti, misure di
 * campo (pH, conducibilità, temperatura, ossigeno), confronto con i limiti, testi e piano; Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { contenutiAcqua, datiAcquaDaDatabase, importaMisureAcqua, TIPI_CAMPAGNA_ACQUA, type ContenutiAcqua } from '../acqua/daDatabase'
import { generaDvrAcqua } from '../acqua/generaDvrAcqua'
import { NORMATIVA, pianoPredefinito } from '../acqua/testi'
import { DESTINAZIONI, limitiPunto, PARAMETRI, testoLimite, valutaAcqua, type Destinazione, type Esito, type LimitiAcqua, type MisuraAcqua, type PuntoAcqua } from '../acqua/valutazione'
import { nuovoId } from '../comune/base'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { pianoDaTesto, pianoInTesto } from '../comune/piano'
import { AreaTesto, Bottone, Campo, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { numeroDa, stili } from '../ui/stili'
import { CicloLavoro, DatiDocumento, Revisioni } from './comuni'

const COLORE: Record<Esito, string> = { conforme: '#067647', 'non conforme': '#b42318', 'senza limite': '#475467' }
const griglia = (min: number) => ({ ...stili.griglia, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` })
const righeTesto = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean)
const CAMPI_LIMITE: { k: keyof LimitiAcqua; nome: string }[] = [
  { k: 'phMin', nome: 'pH minimo' },
  { k: 'phMax', nome: 'pH massimo' },
  { k: 'conducibilitaMax', nome: 'Conducibilità max [µS/cm]' },
  { k: 'tMax', nome: 'T acqua max [°C]' },
  { k: 'o2Min', nome: 'O₂ min [mg/L]' },
]
const COLONNE: { k: keyof MisuraAcqua; nome: string }[] = [
  { k: 'ph', nome: 'pH' },
  { k: 'conducibilita', nome: 'Cond. [µS/cm]' },
  { k: 'tAcqua', nome: 'T acqua [°C]' },
  { k: 'tAmbiente', nome: 'T aria [°C]' },
  { k: 'o2Perc', nome: 'O₂ [%]' },
  { k: 'o2MgL', nome: 'O₂ [mg/L]' },
]

function NumeroCella({ valore, onChange, etichetta, largo = 80 }: { valore: number | null | undefined; onChange: (x: number | null) => void; etichetta: string; largo?: number }) {
  return (
    <input
      aria-label={etichetta}
      inputMode="decimal"
      style={{ ...stili.input, width: largo, padding: '4px 6px' }}
      defaultValue={valore == null ? '' : String(valore).replace('.', ',')}
      onChange={(e) => {
        const n = e.target.value.trim() === '' ? null : numeroDa(e.target.value)
        if (e.target.value.trim() === '' || n !== null) onChange(n)
      }}
    />
  )
}

function EditorPunto({ p, misure, cambia, togli, cambiaMisure }: { p: PuntoAcqua; misure: MisuraAcqua[]; cambia: (x: Partial<PuntoAcqua>) => void; togli: () => void; cambiaMisure: (m: MisuraAcqua[]) => void }) {
  const l = limitiPunto(p)
  const v = valutaAcqua([p], misure)
  const cambiaMisura = (id: string, x: Partial<MisuraAcqua>) => cambiaMisure(misure.map((m) => (m.id === id ? { ...m, ...x } : m)))
  return (
    <div role="group" aria-label={`Punto ${p.nome || 'nuovo'}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
      <div style={griglia(200)}>
        <Campo etichetta="Punto di monitoraggio" valore={p.nome} onChange={(x) => cambia({ nome: x })} />
        <label style={stili.campo}>
          Destinazione
          <select style={stili.input} value={p.destinazione} onChange={(e) => cambia({ destinazione: e.target.value as Destinazione, limiti: undefined })}>
            {(Object.keys(DESTINAZIONI) as Destinazione[]).map((k) => (
              <option key={k} value={k}>
                {DESTINAZIONI[k].nome}
              </option>
            ))}
          </select>
        </label>
        <Campo etichetta="Descrizione" valore={p.descrizione ?? ''} onChange={(x) => cambia({ descrizione: x })} />
      </div>
      <div style={{ ...griglia(150), marginTop: 6 }}>
        {CAMPI_LIMITE.map(({ k, nome }) => (
          <label key={`${k}-${p.destinazione}`} style={stili.campo}>
            {nome}
            <NumeroCella etichetta={`${nome} – ${p.nome}`} valore={l[k]} largo={120} onChange={(x) => cambia({ limiti: { ...p.limiti, [k]: x } })} />
          </label>
        ))}
      </div>
      <p style={{ ...stili.nota, marginTop: 4 }}>Limiti da {DESTINAZIONI[p.destinazione].fonte}; si possono modificare (es. prescrizioni dell’autorizzazione allo scarico). Campo vuoto = nessun limite.</p>
      <div style={{ overflowX: 'auto', marginTop: 6 }}>
        <table style={stili.tabella}>
          <thead>
            <tr>
              {['Data', ...COLONNE.map((c) => c.nome), 'Esito', ''].map((h) => (
                <th key={h} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {misure.map((m, k) => {
              const e = v.misure[k]
              return (
                <tr key={m.id}>
                  <td style={stili.td}>
                    <input aria-label={`Data misura ${k + 1}`} style={{ ...stili.input, width: 100, padding: '4px 6px' }} value={m.data ?? ''} onChange={(ev) => cambiaMisura(m.id, { data: ev.target.value })} />
                  </td>
                  {COLONNE.map((c) => (
                    <td key={c.k} style={stili.td}>
                      <NumeroCella etichetta={`${c.nome} misura ${k + 1}`} valore={m[c.k] as number | null} largo={70} onChange={(x) => cambiaMisura(m.id, { [c.k]: x })} />
                    </td>
                  ))}
                  <td style={{ ...stili.td, color: e.esito ? COLORE[e.esito] : undefined, fontWeight: 600 }}>{e.esito ?? '–'}</td>
                  <td style={stili.td}>
                    <Bottone tipo="pericolo" onClick={() => cambiaMisure(misure.filter((x) => x.id !== m.id))}>
                      ×
                    </Bottone>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ ...stili.riga, marginTop: 8, justifyContent: 'space-between' }}>
        <Bottone onClick={() => cambiaMisure([...misure, { id: nuovoId('acq'), puntoId: p.id, ph: null, conducibilita: null, tAcqua: null, tAmbiente: null, o2Perc: null, o2MgL: null }])}>+ Misura</Bottone>
        <b style={{ fontSize: 13, color: v.punti[0].esito ? COLORE[v.punti[0].esito] : undefined }}>
          {v.punti[0].esito ?? 'nessuna misura'}
          {v.punti[0].nonConformi.length ? ` (${v.punti[0].nonConformi.map((id) => PARAMETRI.find((x) => x.id === id)!.nome).join(', ')})` : ''}
        </b>
        <Bottone tipo="pericolo" onClick={togli}>
          Togli punto
        </Bottone>
      </div>
    </div>
  )
}

function Valutazione({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const [c, setC] = useState<ContenutiAcqua>(() => contenutiAcqua(ing))
  const [modificato, setModificato] = useState(false)
  const t = c.testi ?? {}
  const [testi, setTesti] = useState({
    normativa: (t.normativa ?? []).join('\n'),
    misure: (t.misurePreventive ?? []).join('\n'),
    strumenti: (t.strumenti ?? []).join('\n'),
    piano: t.piano ? pianoInTesto(t.piano) : '',
  })
  const imposta = (p: Partial<ContenutiAcqua>) => {
    setC((x) => ({ ...x, ...p }))
    setModificato(true)
  }
  const testo = (k: keyof typeof testi) => (v: string) => {
    setTesti((x) => ({ ...x, [k]: v }))
    setModificato(true)
  }
  const importabili = useMemo(() => importaMisureAcqua(c, ing.misure).misure.length - c.misure.length, [c, ing.misure])

  const salva = () =>
    esegui(async () => {
      c.punti.forEach((p, i) => {
        if (!p.nome.trim()) throw new Error(`Punto ${i + 1}: manca il nome.`)
      })
      const piano = pianoDaTesto(testi.piano)
      const r = (x: string) => {
        const v = righeTesto(x)
        return v.length ? v : undefined
      }
      await api.aggiornaContenuti(ing.documento.id, {
        acqua: { ...c, testi: { ...t, normativa: r(testi.normativa), misurePreventive: r(testi.misure), strumenti: r(testi.strumenti), piano: piano.length ? piano : undefined } },
      })
      setModificato(false)
      await aggiorna()
    }, 'Dati del monitoraggio salvati')

  const bottoneSalva = (
    <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
      Salva
    </Bottone>
  )

  return (
    <>
      <Sezione
        titolo="Punti di monitoraggio e misure"
        azioni={
          <>
            <Bottone disabled={importabili === 0} onClick={() => imposta(importaMisureAcqua(c, ing.misure))} title="Misure delle campagne scelte, raggruppate per punto di monitoraggio">
              Importa dalle misure ({importabili})
            </Bottone>
            {bottoneSalva}
          </>
        }
      >
        <p style={stili.nota}>La destinazione del punto decide i limiti: consumo umano (D.Lgs. 18/2023: pH 6,5–9,5, conducibilità ≤ 2500 µS/cm), scarico in acque superficiali o in fognatura (D.Lgs. 152/2006 tab. 3: pH 5,5–9,5), solo monitoraggio (nessun limite).</p>
        {c.punti.map((p, k) => (
          <EditorPunto
            key={p.id}
            p={p}
            misure={c.misure.filter((m) => m.puntoId === p.id)}
            cambia={(x) => imposta({ punti: c.punti.map((y, j) => (j === k ? { ...y, ...x } : y)) })}
            togli={() => imposta({ punti: c.punti.filter((_, j) => j !== k), misure: c.misure.filter((m) => m.puntoId !== p.id) })}
            cambiaMisure={(ms) => imposta({ misure: [...c.misure.filter((m) => m.puntoId !== p.id), ...ms] })}
          />
        ))}
        <Bottone onClick={() => imposta({ punti: [...c.punti, { id: nuovoId('pt'), nome: '', destinazione: 'scarico_superficiale' }] })}>+ Punto</Bottone>
      </Sezione>

      <Sezione titolo="Testi e piano" azioni={bottoneSalva} chiusa>
        <div style={{ ...stili.griglia, gridTemplateColumns: '1fr' }}>
          <AreaTesto etichetta={`Normativa (una voce per riga; vuoto = elenco predefinito, ${NORMATIVA.length} voci)`} valore={testi.normativa} onChange={testo('normativa')} righe={3} />
          <AreaTesto etichetta="Gestione delle acque di cantiere (una misura per riga; vuoto = predefinite)" valore={testi.misure} onChange={testo('misure')} righe={3} />
          <AreaTesto etichetta="Strumentazione (una voce per riga; vuoto = predefinita)" valore={testi.strumenti} onChange={testo('strumenti')} righe={3} />
          <AreaTesto etichetta="Piano (una voce per riga, “- ” per il sotto-elenco; vuoto = piano proposto dal calcolo)" valore={testi.piano} onChange={testo('piano')} righe={8} />
          <div>
            <Bottone onClick={() => testo('piano')(pianoInTesto(pianoPredefinito(valutaAcqua(c.punti, c.misure))))}>Carica il piano proposto</Bottone>
          </div>
        </div>
      </Sezione>
    </>
  )
}

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati } = useMemo(() => datiAcquaDaDatabase(ing), [ing])
  const v = useMemo(() => valutaAcqua(dati.punti, dati.misure), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [!ing.documento.data_emissione && 'data di emissione', dati.punti.length === 0 && 'punti di monitoraggio'].filter(Boolean)
  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrAcqua(ing.documento.cantiere_id, ing.documento.id)
      saveBlob(r.blob, r.nomeFile)
    }, 'Documento generato')
    setGenerando(false)
  }
  return (
    <Sezione
      titolo="Riepilogo e controlli"
      azioni={
        <Bottone tipo="primario" disabled={generando} onClick={() => (errori.length ? setConferma(true) : void genera())}>
          {generando ? 'Generazione…' : 'Genera Word'}
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
      {v.avvisi.map((a, i) => (
        <p key={i} style={a.livello === 'errore' ? stili.avviso : stili.attenzione}>
          {a.messaggio}
        </p>
      ))}
      <p style={stili.nota}>
        {v.punti.length} punti · {v.misure.length} misure · {v.punti.filter((p) => p.esito === 'non conforme').length} punti non conformi
      </p>
      {v.punti.length > 0 && (
        <table style={{ ...stili.tabella, marginTop: 8 }}>
          <thead>
            <tr>
              {['Punto', 'Destinazione', 'pH (limite)', 'Esito'].map((h) => (
                <th key={h} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {v.punti.map((p) => (
              <tr key={p.punto.id}>
                <td style={stili.td}>{p.punto.nome}</td>
                <td style={stili.td}>{DESTINAZIONI[p.punto.destinazione].nome}</td>
                <td style={stili.td}>
                  {p.intervalli.ph ? `${String(p.intervalli.ph.min).replace('.', ',')}–${String(p.intervalli.ph.max).replace('.', ',')}` : '–'} ({testoLimite('ph', p.limiti)})
                </td>
                <td style={{ ...stili.td, color: p.esito ? COLORE[p.esito] : undefined, fontWeight: 600 }}>{p.esito ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sezione>
  )
}

export default function EditorDvrAcqua() {
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
          <h1 style={stili.titolo}>Monitoraggio delle acque {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 152/2006 (scarichi, tab. 3) – D.Lgs. 18/2023 (acque destinate al consumo umano)</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA_ACQUA} etichettaCampagne="monitoraggio acqua" />
          <Valutazione key={`val-${q.data.documento.updated_at}`} ing={q.data} aggiorna={aggiorna} />
          <CicloLavoro ing={q.data} aggiorna={aggiorna} titolo="Organizzazione delle attività lavorative (capitolo 5.1)" />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
