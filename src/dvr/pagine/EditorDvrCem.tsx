/**
 * Redazione del DVR Campi elettromagnetici: censimento e giustificazione delle sorgenti (CEI EN 50499),
 * misure di E e B per le sorgenti da valutare, confronto con i valori di azione (allegato XXXVI) e con
 * i livelli per la popolazione (1999/519/CE), zone, testi e piano; riepilogo e generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { contenutiCem, datiCemDaDatabase, importaMisure, nuovoId, TIPI_CAMPAGNA_CEM, type ContenutiCem } from '../cem/daDatabase'
import { frequenzaTesto, num } from '../cem/documento'
import { generaDvrCem } from '../cem/generaDvrCem'
import { NORMATIVA, pianoPredefinito, SENSIBILI, STRUMENTAZIONE } from '../cem/testi'
import { CATEGORIE, ESITI, giustificabile, valutaCem, valutaMisura, type CategoriaSorgente, type EsitoMisura, type MisuraCem, type SorgenteCem } from '../cem/valutazione'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { pianoDaTesto, pianoInTesto } from '../comune/piano'
import { AreaTesto, Bottone, Campo, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { numeroDa, stili } from '../ui/stili'
import { CicloLavoro, DatiDocumento, Revisioni } from './comuni'

const COLORE: Record<EsitoMisura, string> = { popolazione: '#067647', lavoratori: '#b54708', vaInferiori: '#c4320a', vaSuperiori: '#b42318' }
const griglia = (min: number) => ({ ...stili.griglia, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` })
const righeTesto = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean)
const UNITA: [string, number][] = [
  ['Hz', 1],
  ['kHz', 1e3],
  ['MHz', 1e6],
  ['GHz', 1e9],
]
const pct = (x: number | null) => (x == null ? '–' : `${Math.round(x * 100)}%`)

/** Frequenza con unità di misura (il valore salvato è in Hz; 0 = campo statico). */
function CampoFrequenza({ valore, onChange, etichetta = 'Frequenza' }: { valore: number | null | undefined; onChange: (hz: number | null) => void; etichetta?: string }) {
  const unitaIniziale = valore ? [...UNITA].reverse().find(([, m]) => valore >= m)?.[1] ?? 1 : 1
  const [unita, setUnita] = useState(unitaIniziale)
  return (
    <label style={stili.campo}>
      {etichetta}
      <span style={{ display: 'flex', gap: 4 }}>
        <input
          aria-label={etichetta}
          inputMode="decimal"
          style={{ ...stili.input, flex: 1, minWidth: 0 }}
          defaultValue={valore == null ? '' : String(valore / unita).replace('.', ',')}
          onChange={(e) => {
            const n = e.target.value.trim() === '' ? null : numeroDa(e.target.value)
            if (e.target.value.trim() === '' || n !== null) onChange(n == null ? null : n * unita)
          }}
        />
        <select
          aria-label={`${etichetta} – unità`}
          style={{ ...stili.input, width: 70 }}
          value={unita}
          onChange={(e) => {
            const nuova = Number(e.target.value)
            if (valore != null) onChange((valore / unita) * nuova)
            setUnita(nuova)
          }}
        >
          {UNITA.map(([u, m]) => (
            <option key={u} value={m}>
              {u}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}

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

// ---------------------------------------------------------------- sorgente

function EditorSorgente({
  s,
  misure,
  ing,
  cambia,
  togli,
  cambiaMisure,
}: {
  s: SorgenteCem
  misure: MisuraCem[]
  ing: Ingresso
  cambia: (p: Partial<SorgenteCem>) => void
  togli: () => void
  cambiaMisure: (m: MisuraCem[]) => void
}) {
  const g = giustificabile(s)
  const mansioni = [...ing.documentoMansioni].sort((a, b) => a.ordine - b.ordine)
  const nome = (id: string) => ing.mansioni.find((m) => m.id === id)?.nome ?? '(mansione eliminata)'
  const cambiaMisura = (id: string, p: Partial<MisuraCem>) => cambiaMisure(misure.map((m) => (m.id === id ? { ...m, ...p } : m)))
  return (
    <div role="group" aria-label={`Sorgente ${s.descrizione || 'nuova'}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
      <div style={griglia(180)}>
        <label style={stili.campo}>
          Categoria
          <select
            style={stili.input}
            value={s.categoria}
            onChange={(e) => {
              const c = e.target.value as CategoriaSorgente
              cambia({ categoria: c, frequenza: s.frequenza ?? CATEGORIE[c].frequenza ?? null })
            }}
          >
            {(Object.keys(CATEGORIE) as CategoriaSorgente[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORIE[k].giustificabile ? '✓ ' : ''}
                {CATEGORIE[k].nome}
              </option>
            ))}
          </select>
        </label>
        <Campo etichetta="Descrizione" valore={s.descrizione} onChange={(v) => cambia({ descrizione: v })} />
        <CampoFrequenza key={`f-${s.id}`} valore={s.frequenza} onChange={(v) => cambia({ frequenza: v })} />
        <Campo etichetta="Attività lavorativa" valore={s.attivita} onChange={(v) => cambia({ attivita: v })} />
        <Campo etichetta="Postazione" valore={s.postazione ?? ''} onChange={(v) => cambia({ postazione: v })} />
        <label style={stili.campo}>
          Giustificabile (CEI EN 50499)
          <select
            style={stili.input}
            value={s.giustificabile == null ? 'auto' : s.giustificabile ? 'si' : 'no'}
            onChange={(e) => cambia({ giustificabile: e.target.value === 'auto' ? null : e.target.value === 'si' })}
          >
            <option value="auto">dalla categoria ({CATEGORIE[s.categoria].giustificabile ? 'SI' : 'NO'})</option>
            <option value="si">SI</option>
            <option value="no">NO</option>
          </select>
        </label>
      </div>
      <div style={{ ...stili.griglia, gridTemplateColumns: '1fr', marginTop: 8 }}>
        <AreaTesto etichetta={g ? 'Giustificazione (facoltativa)' : 'Note sulla valutazione (es. dati del fabbricante)'} valore={s.motivazione ?? ''} onChange={(v) => cambia({ motivazione: v })} righe={2} />
      </div>
      {mansioni.length > 0 && (
        <div style={{ ...stili.riga, marginTop: 6 }}>
          <span style={stili.nota}>Mansioni che lavorano vicino alla sorgente:</span>
          {mansioni.map((dm) => (
            <label key={dm.mansione_id} style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={(s.mansioni ?? []).includes(dm.mansione_id)}
                onChange={() => {
                  const m = s.mansioni ?? []
                  cambia({ mansioni: m.includes(dm.mansione_id) ? m.filter((x) => x !== dm.mansione_id) : [...m, dm.mansione_id] })
                }}
              />{' '}
              {nome(dm.mansione_id)}
            </label>
          ))}
        </div>
      )}
      {!g && (
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={stili.tabella}>
            <thead>
              <tr>
                {['Postazione', 'Distanza [m]', 'E [V/m]', 'B [µT]', 'Arti', 'Popolazione', 'VA inf.', 'VA sup.', 'Esito', ''].map((h) => (
                  <th key={h} style={stili.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {misure.map((m, k) => {
                const v = valutaMisura(m, s)
                return (
                  <tr key={m.id}>
                    <td style={stili.td}>
                      <input aria-label={`Postazione misura ${k + 1}`} style={{ ...stili.input, padding: '4px 6px' }} value={m.postazione} onChange={(e) => cambiaMisura(m.id, { postazione: e.target.value })} />
                    </td>
                    <td style={stili.td}>
                      <NumeroCella etichetta={`Distanza misura ${k + 1}`} valore={m.distanza} onChange={(x) => cambiaMisura(m.id, { distanza: x })} />
                    </td>
                    <td style={stili.td}>
                      <NumeroCella etichetta={`E misura ${k + 1}`} valore={m.e} onChange={(x) => cambiaMisura(m.id, { e: x })} />
                    </td>
                    <td style={stili.td}>
                      <NumeroCella etichetta={`B misura ${k + 1}`} valore={m.b ?? (m.h != null ? Math.round(m.h * 1.2566 * 100) / 100 : null)} onChange={(x) => cambiaMisura(m.id, { b: x, h: null })} />
                    </td>
                    <td style={stili.td}>
                      <input type="checkbox" aria-label={`Esposizione degli arti, misura ${k + 1}`} checked={!!m.arti} onChange={(e) => cambiaMisura(m.id, { arti: e.target.checked })} />
                    </td>
                    <td style={stili.td}>{pct(v.indicePopolazione)}</td>
                    <td style={stili.td}>{pct(v.indiceInf)}</td>
                    <td style={stili.td}>{pct(v.indiceSup)}</td>
                    <td style={{ ...stili.td, color: v.esito ? COLORE[v.esito] : undefined, fontWeight: 600 }}>{v.esito ? `Zona ${ESITI[v.esito].zona}` : '–'}</td>
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
          <div style={{ marginTop: 6 }}>
            <Bottone onClick={() => cambiaMisure([...misure, { id: nuovoId('mis'), sorgenteId: s.id, postazione: s.postazione ?? '', distanza: null, e: null, b: null }])}>+ Misura</Bottone>
          </div>
        </div>
      )}
      <div style={{ ...stili.riga, marginTop: 8, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 13, color: g ? '#067647' : '#b54708' }}>
          {g ? 'Giustificabile' : 'Valutazione specifica'} · {frequenzaTesto(s.frequenza)} · {CATEGORIE[s.categoria].riferimento}
        </b>
        <Bottone tipo="pericolo" onClick={togli}>
          Togli sorgente
        </Bottone>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- dati della valutazione

function Valutazione({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const [c, setC] = useState<ContenutiCem>(() => contenutiCem(ing))
  const [modificato, setModificato] = useState(false)
  const [categoriaNuova, setCategoriaNuova] = useState<CategoriaSorgente>('saldatura')
  const t = c.testi ?? {}
  const tipi = ing.ambiti.filter((a) => ing.documento.ambiti_ids.includes(a.id)).map((a) => a.tipo)
  const [testi, setTesti] = useState({
    normativa: (t.normativa ?? []).join('\n'),
    misure: (t.misurePreventive ?? []).join('\n'),
    organizzazione: (t.organizzazione ?? []).join('\n'),
    piano: t.piano ? pianoInTesto(t.piano) : '',
  })
  const imposta = (p: Partial<ContenutiCem>) => {
    setC((x) => ({ ...x, ...p }))
    setModificato(true)
  }
  const testiCem = (p: Partial<NonNullable<ContenutiCem['testi']>>) => imposta({ testi: { ...t, ...p } })
  const testo = (k: keyof typeof testi) => (v: string) => {
    setTesti((x) => ({ ...x, [k]: v }))
    setModificato(true)
  }
  const importabili = useMemo(() => importaMisure(c, ing.misure).misure.length - c.misure.length, [c, ing.misure])

  const salva = () =>
    esegui(async () => {
      c.sorgenti.forEach((s, i) => {
        if (!s.descrizione.trim()) throw new Error(`Sorgente ${i + 1}: manca la descrizione.`)
      })
      const piano = pianoDaTesto(testi.piano)
      const r = (x: string) => {
        const v = righeTesto(x)
        return v.length ? v : undefined
      }
      await api.aggiornaContenuti(ing.documento.id, {
        cem: { ...c, testi: { ...t, normativa: r(testi.normativa), misurePreventive: r(testi.misure), organizzazione: r(testi.organizzazione), piano: piano.length ? piano : undefined } },
      })
      setModificato(false)
      await aggiorna()
    }, 'Dati del DVR CEM salvati')

  const bottoneSalva = (
    <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
      Salva
    </Bottone>
  )

  return (
    <>
      <Sezione
        titolo="Sorgenti di campi elettromagnetici e misure"
        azioni={
          <>
            <Bottone disabled={importabili === 0} onClick={() => imposta(importaMisure(c, ing.misure))} title="Misure CEM delle campagne scelte, collegate alla sorgente con lo stesso nome">
              Importa dalle misure ({importabili})
            </Bottone>
            {bottoneSalva}
          </>
        }
      >
        <p style={stili.nota}>
          Le categorie con ✓ sono giustificabili secondo la norma CEI EN 50499 (conformi a priori se usate secondo le istruzioni del fabbricante). Per le altre servono misure o dati del fabbricante: E e B efficaci alla frequenza della sorgente, confrontati con i valori di azione e con i livelli per la popolazione.
        </p>
        {c.sorgenti.map((s, k) => (
          <EditorSorgente
            key={s.id}
            s={s}
            misure={c.misure.filter((m) => m.sorgenteId === s.id)}
            ing={ing}
            cambia={(p) => imposta({ sorgenti: c.sorgenti.map((x, j) => (j === k ? { ...x, ...p } : x)) })}
            togli={() => imposta({ sorgenti: c.sorgenti.filter((_, j) => j !== k), misure: c.misure.filter((m) => m.sorgenteId !== s.id) })}
            cambiaMisure={(ms) => imposta({ misure: [...c.misure.filter((m) => m.sorgenteId !== s.id), ...ms] })}
          />
        ))}
        <div style={stili.riga}>
          <select aria-label="Categoria della nuova sorgente" style={stili.input} value={categoriaNuova} onChange={(e) => setCategoriaNuova(e.target.value as CategoriaSorgente)}>
            {(Object.keys(CATEGORIE) as CategoriaSorgente[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORIE[k].nome}
              </option>
            ))}
          </select>
          <Bottone
            onClick={() =>
              imposta({ sorgenti: [...c.sorgenti, { id: nuovoId(), categoria: categoriaNuova, descrizione: '', frequenza: CATEGORIE[categoriaNuova].frequenza ?? null, attivita: '' }] })
            }
          >
            + Sorgente
          </Bottone>
        </div>
      </Sezione>

      <Sezione titolo="Testi e piano" azioni={bottoneSalva} chiusa>
        <div style={{ ...stili.griglia, gridTemplateColumns: '1fr' }}>
          <AreaTesto etichetta={`Normativa (una voce per riga; vuoto = elenco predefinito, ${NORMATIVA.length} voci)`} valore={testi.normativa} onChange={testo('normativa')} righe={3} />
          <AreaTesto etichetta="Misure tecniche e organizzative adottate (una per riga; vuoto = predefinite)" valore={testi.misure} onChange={testo('misure')} righe={3} />
          <AreaTesto etichetta="Organizzazione dei luoghi di lavoro (un paragrafo per riga; vuoto = predefinito)" valore={testi.organizzazione} onChange={testo('organizzazione')} righe={2} />
          <AreaTesto etichetta="Strumentazione e modalità delle misure" valore={t.strumentazione ?? STRUMENTAZIONE} onChange={(x) => testiCem({ strumentazione: x })} righe={3} />
          <AreaTesto etichetta="Lavoratori particolarmente sensibili" valore={t.sensibili ?? SENSIBILI} onChange={(x) => testiCem({ sensibili: x })} righe={3} />
          <AreaTesto etichetta="Piano di contenimento (una voce per riga, “- ” per il sotto-elenco; vuoto = piano proposto dal calcolo)" valore={testi.piano} onChange={testo('piano')} righe={8} />
          <div>
            <Bottone onClick={() => testo('piano')(pianoInTesto(pianoPredefinito(valutaCem(c.sorgenti, c.misure), tipi)))}>Carica il piano proposto</Bottone>
          </div>
        </div>
      </Sezione>
    </>
  )
}

// ---------------------------------------------------------------- riepilogo

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati } = useMemo(() => datiCemDaDatabase(ing), [ing])
  const v = useMemo(() => valutaCem(dati.sorgenti, dati.misure, dati.mansioni), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [!ing.documento.data_emissione && 'data di emissione', dati.sorgenti.length === 0 && 'sorgenti'].filter(Boolean)

  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrCem(ing.documento.cantiere_id, ing.documento.id)
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
        {dati.sorgenti.length} sorgenti: {v.sorgenti.filter((s) => s.giustificabile).length} giustificabili, {v.sorgenti.filter((s) => !s.giustificabile).length} da valutare · {v.misure.length} misure
      </p>
      {v.sorgenti.length > 0 && (
        <table style={{ ...stili.tabella, marginTop: 8 }}>
          <thead>
            <tr>
              {['Sorgente', 'Zona', 'Esito', 'Distanza di rispetto'].map((h) => (
                <th key={h} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {v.sorgenti.map((s) => (
              <tr key={s.sorgente.id}>
                <td style={stili.td}>{s.sorgente.descrizione}</td>
                <td style={{ ...stili.td, color: s.esito ? COLORE[s.esito] : undefined, fontWeight: 600 }}>{s.esito ? `Zona ${ESITI[s.esito].zona}` : '–'}</td>
                <td style={stili.td}>{s.esito ? ESITI[s.esito].breve : 'da valutare'}</td>
                <td style={stili.td}>{s.distanzaRispetto != null ? `${num(s.distanzaRispetto)} m` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sezione>
  )
}

export default function EditorDvrCem() {
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
          <h1 style={stili.titolo}>DVR Campi elettromagnetici {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, Titolo VIII Capo IV – allegato XXXVI (D.Lgs. 159/2016), CEI EN 50499, raccomandazione 1999/519/CE</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA_CEM} etichettaCampagne="CEM" />
          <Valutazione key={`val-${q.data.documento.updated_at}`} ing={q.data} aggiorna={aggiorna} />
          <CicloLavoro ing={q.data} aggiorna={aggiorna} titolo="Organizzazione delle attività lavorative (capitolo 6.1)" />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
