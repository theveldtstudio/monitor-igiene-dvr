/**
 * Redazione del DVR Agenti biologici (Titolo X D.Lgs. 81/08): agenti potenziali con probabilità e danno,
 * mansioni esposte, misure della carica microbica dell'aria (SAS), testi e piano; riepilogo e Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { contenutiBiologico, datiBiologicoDaDatabase, importaMisureSas, TIPI_CAMPAGNA_BIOLOGICO, type ContenutiBiologico } from '../biologico/daDatabase'
import { generaDvrBiologico } from '../biologico/generaDvrBiologico'
import { agentiPredefiniti, MISURE_PREVENTIVE, NORMATIVA, pianoPredefinito, SORVEGLIANZA } from '../biologico/testi'
import { categoriaAria, classeRischio, valutaBiologico, type AgenteBiologico, type ClasseRischio, type Gruppo, type MisuraSas } from '../biologico/valutazione'
import { nuovoId } from '../comune/base'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { pianoDaTesto, pianoInTesto } from '../comune/piano'
import { AreaTesto, Bottone, Campo, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { numeroDa, stili } from '../ui/stili'
import { CicloLavoro, DatiDocumento, Revisioni } from './comuni'

const COLORE: Record<ClasseRischio, string> = { trascurabile: '#067647', basso: '#3b7c0f', medio: '#b54708', alto: '#b42318' }
const griglia = (min: number) => ({ ...stili.griglia, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` })
const righeTesto = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean)
const PROBABILITA = ['1 – improbabile', '2 – poco probabile', '3 – probabile', '4 – molto probabile']

function NumeroCella({ valore, onChange, etichetta }: { valore: number | null | undefined; onChange: (x: number | null) => void; etichetta: string }) {
  return (
    <input
      aria-label={etichetta}
      inputMode="decimal"
      style={{ ...stili.input, width: 80, padding: '4px 6px' }}
      defaultValue={valore == null ? '' : String(valore).replace('.', ',')}
      onChange={(e) => {
        const n = e.target.value.trim() === '' ? null : numeroDa(e.target.value)
        if (e.target.value.trim() === '' || n !== null) onChange(n)
      }}
    />
  )
}

function EditorAgente({ a, ing, cambia, togli }: { a: AgenteBiologico; ing: Ingresso; cambia: (p: Partial<AgenteBiologico>) => void; togli: () => void }) {
  const mansioni = [...ing.documentoMansioni].sort((x, y) => x.ordine - y.ordine)
  const nome = (id: string) => ing.mansioni.find((m) => m.id === id)?.nome ?? '(mansione eliminata)'
  const d = a.danno ?? a.gruppo
  const r = a.probabilita * d
  const classe = classeRischio(r)
  return (
    <div role="group" aria-label={`Agente ${a.nome || 'nuovo'}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
      <div style={griglia(180)}>
        <Campo etichetta="Agente" valore={a.nome} onChange={(v) => cambia({ nome: v })} />
        <label style={stili.campo}>
          Gruppo
          <select style={stili.input} value={a.gruppo} onChange={(e) => cambia({ gruppo: Number(e.target.value) as Gruppo })}>
            {[1, 2, 3, 4].map((g) => (
              <option key={g} value={g}>
                Gruppo {g}
              </option>
            ))}
          </select>
        </label>
        <Campo etichetta="Malattia o effetto" valore={a.malattia} onChange={(v) => cambia({ malattia: v })} />
        <label style={stili.campo}>
          Probabilità P
          <select style={stili.input} value={a.probabilita} onChange={(e) => cambia({ probabilita: Number(e.target.value) })}>
            {PROBABILITA.map((p, i) => (
              <option key={p} value={i + 1}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label style={stili.campo}>
          Danno D
          <select style={stili.input} value={a.danno ?? 'auto'} onChange={(e) => cambia({ danno: e.target.value === 'auto' ? null : Number(e.target.value) })}>
            <option value="auto">dal gruppo ({a.gruppo})</option>
            {[1, 2, 3, 4].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <Campo etichetta="Vaccino" valore={a.vaccino ?? ''} onChange={(v) => cambia({ vaccino: v })} />
      </div>
      <div style={{ ...stili.griglia, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
        <AreaTesto etichetta="Trasmissione" valore={a.trasmissione} onChange={(v) => cambia({ trasmissione: v })} righe={2} />
        <AreaTesto etichetta="Attività e luoghi" valore={a.attivita} onChange={(v) => cambia({ attivita: v })} righe={2} />
      </div>
      {mansioni.length > 0 && (
        <div style={{ ...stili.riga, marginTop: 6 }}>
          <span style={stili.nota}>Mansioni esposte (nessuna = tutte):</span>
          {mansioni.map((dm) => (
            <label key={dm.mansione_id} style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={(a.mansioni ?? []).includes(dm.mansione_id)}
                onChange={() => {
                  const m = a.mansioni ?? []
                  cambia({ mansioni: m.includes(dm.mansione_id) ? m.filter((x) => x !== dm.mansione_id) : [...m, dm.mansione_id] })
                }}
              />{' '}
              {nome(dm.mansione_id)}
            </label>
          ))}
        </div>
      )}
      <div style={{ ...stili.riga, marginTop: 8, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 13, color: COLORE[classe] }}>
          R = {a.probabilita} × {d} = {r} · rischio {classe}
        </b>
        <Bottone tipo="pericolo" onClick={togli}>
          Togli agente
        </Bottone>
      </div>
    </div>
  )
}

function Valutazione({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const [c, setC] = useState<ContenutiBiologico>(() => contenutiBiologico(ing))
  const [modificato, setModificato] = useState(false)
  const t = c.testi ?? {}
  const tipi = ing.ambiti.filter((a) => ing.documento.ambiti_ids.includes(a.id)).map((a) => a.tipo)
  const [testi, setTesti] = useState({
    normativa: (t.normativa ?? []).join('\n'),
    misure: (t.misurePreventive ?? []).join('\n'),
    sorveglianza: (t.sorveglianza ?? []).join('\n'),
    piano: t.piano ? pianoInTesto(t.piano) : '',
  })
  const imposta = (p: Partial<ContenutiBiologico>) => {
    setC((x) => ({ ...x, ...p }))
    setModificato(true)
  }
  const testo = (k: keyof typeof testi) => (v: string) => {
    setTesti((x) => ({ ...x, [k]: v }))
    setModificato(true)
  }
  const importabili = useMemo(() => importaMisureSas(c, ing.misure).misure.length - c.misure.length, [c, ing.misure])
  const cambiaMisura = (id: string, p: Partial<MisuraSas>) => imposta({ misure: c.misure.map((m) => (m.id === id ? { ...m, ...p } : m)) })

  const salva = () =>
    esegui(async () => {
      c.agenti.forEach((a, i) => {
        if (!a.nome.trim()) throw new Error(`Agente ${i + 1}: manca il nome.`)
      })
      const piano = pianoDaTesto(testi.piano)
      const r = (x: string) => {
        const v = righeTesto(x)
        return v.length ? v : undefined
      }
      await api.aggiornaContenuti(ing.documento.id, {
        biologico: { ...c, testi: { ...t, normativa: r(testi.normativa), misurePreventive: r(testi.misure), sorveglianza: r(testi.sorveglianza), piano: piano.length ? piano : undefined } },
      })
      setModificato(false)
      await aggiorna()
    }, 'Dati del DVR biologico salvati')

  const bottoneSalva = (
    <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
      Salva
    </Bottone>
  )

  return (
    <>
      <Sezione
        titolo="Agenti biologici potenziali"
        azioni={
          <>
            <Bottone onClick={() => imposta({ agenti: [...c.agenti, ...agentiPredefiniti(tipi).filter((p) => !c.agenti.some((a) => a.nome === p.nome)).map((p) => ({ ...p, id: nuovoId('ag') }))] })}>
              Carica l’elenco proposto
            </Bottone>
            {bottoneSalva}
          </>
        }
      >
        <p style={stili.nota}>
          Nel cantiere l’esposizione è potenziale (art. 271 c. 4). Per ogni agente: probabilità P da 1 a 4, danno D dal gruppo (modificabile), R = P × D; classi 1–2 trascurabile, 3–4 basso, 6–8 medio, 9–16 alto.
        </p>
        {c.agenti.map((a, k) => (
          <EditorAgente
            key={a.id}
            a={a}
            ing={ing}
            cambia={(p) => imposta({ agenti: c.agenti.map((x, j) => (j === k ? { ...x, ...p } : x)) })}
            togli={() => imposta({ agenti: c.agenti.filter((_, j) => j !== k) })}
          />
        ))}
        <Bottone onClick={() => imposta({ agenti: [...c.agenti, { id: nuovoId('ag'), nome: '', gruppo: 2, malattia: '', trasmissione: '', attivita: '', probabilita: 1 }] })}>+ Agente</Bottone>
      </Sezione>

      <Sezione
        titolo="Carica microbica dell’aria (SAS)"
        azioni={
          <>
            <Bottone disabled={importabili === 0} onClick={() => imposta(importaMisureSas(c, ing.misure))}>
              Importa dalle misure ({importabili})
            </Bottone>
            {bottoneSalva}
          </>
        }
      >
        <p style={stili.nota}>UFC/m³; categorie indicative ECA (1993) per ambienti non industriali: batteri &lt; 50 molto bassa, &lt; 100 bassa, &lt; 500 intermedia, &lt; 2000 alta; muffe &lt; 25, &lt; 100, &lt; 500, &lt; 2000.</p>
        {c.misure.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={stili.tabella}>
              <thead>
                <tr>
                  {['Postazione', 'Fase', 'Batteri 22 °C', 'Batteri 36 °C', 'Muffe e lieviti', 'Categorie', ''].map((h) => (
                    <th key={h} style={stili.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.misure.map((m, k) => (
                  <tr key={m.id}>
                    <td style={stili.td}>
                      <input aria-label={`Postazione SAS ${k + 1}`} style={{ ...stili.input, padding: '4px 6px' }} value={m.postazione} onChange={(e) => cambiaMisura(m.id, { postazione: e.target.value })} />
                    </td>
                    <td style={stili.td}>
                      <input aria-label={`Fase SAS ${k + 1}`} style={{ ...stili.input, padding: '4px 6px' }} value={m.fase ?? ''} onChange={(e) => cambiaMisura(m.id, { fase: e.target.value })} />
                    </td>
                    <td style={stili.td}>
                      <NumeroCella etichetta={`Batteri 22 °C ${k + 1}`} valore={m.conta22} onChange={(x) => cambiaMisura(m.id, { conta22: x })} />
                    </td>
                    <td style={stili.td}>
                      <NumeroCella etichetta={`Batteri 36 °C ${k + 1}`} valore={m.conta36} onChange={(x) => cambiaMisura(m.id, { conta36: x })} />
                    </td>
                    <td style={stili.td}>
                      <NumeroCella etichetta={`Muffe e lieviti ${k + 1}`} valore={m.muffe} onChange={(x) => cambiaMisura(m.id, { muffe: x })} />
                    </td>
                    <td style={{ ...stili.td, fontSize: 12 }}>
                      {[categoriaAria(m.conta22, 'batteri'), categoriaAria(m.conta36, 'batteri'), categoriaAria(m.muffe, 'funghi')].map((x) => x ?? '–').join(' / ')}
                    </td>
                    <td style={stili.td}>
                      <Bottone tipo="pericolo" onClick={() => imposta({ misure: c.misure.filter((x) => x.id !== m.id) })}>
                        ×
                      </Bottone>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 6 }}>
          <Bottone onClick={() => imposta({ misure: [...c.misure, { id: nuovoId('sas'), postazione: '', conta22: null, conta36: null, muffe: null }] })}>+ Misura</Bottone>
        </div>
      </Sezione>

      <Sezione titolo="Testi e piano" azioni={bottoneSalva} chiusa>
        <div style={{ ...stili.griglia, gridTemplateColumns: '1fr' }}>
          <AreaTesto etichetta={`Normativa (una voce per riga; vuoto = elenco predefinito, ${NORMATIVA.length} voci)`} valore={testi.normativa} onChange={testo('normativa')} righe={3} />
          <AreaTesto etichetta={`Misure preventive adottate (una per riga; vuoto = ${MISURE_PREVENTIVE.length} predefinite)`} valore={testi.misure} onChange={testo('misure')} righe={3} />
          <AreaTesto etichetta={`Vaccinazioni e sorveglianza sanitaria (un paragrafo per riga; vuoto = ${SORVEGLIANZA.length} predefiniti)`} valore={testi.sorveglianza} onChange={testo('sorveglianza')} righe={3} />
          <AreaTesto etichetta="Piano di contenimento (una voce per riga, “- ” per il sotto-elenco; vuoto = piano proposto dal calcolo)" valore={testi.piano} onChange={testo('piano')} righe={8} />
          <div>
            <Bottone onClick={() => testo('piano')(pianoInTesto(pianoPredefinito(valutaBiologico(c.agenti, c.misure, []))))}>Carica il piano proposto</Bottone>
          </div>
        </div>
      </Sezione>
    </>
  )
}

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati } = useMemo(() => datiBiologicoDaDatabase(ing), [ing])
  const v = useMemo(() => valutaBiologico(dati.agenti, dati.misure, dati.mansioni), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [!ing.documento.data_emissione && 'data di emissione'].filter(Boolean)
  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrBiologico(ing.documento.cantiere_id, ing.documento.id)
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
      {v.avvisi.map((a, i) => (
        <p key={i} style={a.livello === 'errore' ? stili.avviso : stili.attenzione}>
          {a.messaggio}
        </p>
      ))}
      <p style={stili.nota}>
        {v.agenti.length} agenti · {v.agenti.filter((e) => e.classe === 'medio' || e.classe === 'alto').length} a rischio medio o alto · {v.misure.length} misure SAS
      </p>
      {v.mansioni.length > 0 && (
        <table style={{ ...stili.tabella, marginTop: 8 }}>
          <thead>
            <tr>
              {['Mansione', 'Classe', 'Agenti a rischio medio o alto'].map((h) => (
                <th key={h} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {v.mansioni.map((m) => (
              <tr key={m.mansione.id}>
                <td style={stili.td}>{m.mansione.nome}</td>
                <td style={{ ...stili.td, color: m.classe ? COLORE[m.classe] : undefined, fontWeight: 600 }}>{m.classe ?? '–'}</td>
                <td style={stili.td}>
                  {m.agenti
                    .filter((e) => e.classe === 'medio' || e.classe === 'alto')
                    .map((e) => e.agente.nome)
                    .join(', ') || '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sezione>
  )
}

export default function EditorDvrBiologico() {
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
          <h1 style={stili.titolo}>DVR Agenti biologici {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, Titolo X – allegato XLVI; carica microbica dell’aria (SAS, categorie ECA 1993)</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA_BIOLOGICO} etichettaCampagne="biologico SAS" />
          <Valutazione key={`val-${q.data.documento.updated_at}`} ing={q.data} aggiorna={aggiorna} />
          <CicloLavoro ing={q.data} aggiorna={aggiorna} titolo="Organizzazione delle attività lavorative (capitolo 5.1)" />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
