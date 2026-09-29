/**
 * Redazione del DVR Radiazioni ottiche artificiali: censimento e giustificazione delle sorgenti,
 * analisi delle non giustificabili, misure di illuminamento (luminanza), DPI per saldatura
 * (UNI EN 169), testi e piano; riepilogo e generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { pianoDaTesto, pianoInTesto } from '../comune/piano'
import { contenutiRoa, datiRoaDaDatabase, nuovoId, sorgentiDaMisure, TIPI_CAMPAGNA_ROA, type ContenutiRoa } from '../roa/daDatabase'
import { organizzazionePredefinita, pianoPredefinito, STRUMENTO_MISURE, TESTI_FOTOSENSIBILIZZANTI, TESTI_SENSIBILI } from '../roa/documento'
import { PROCESSI_EN169, type ProcessoEn169 } from '../roa/en169'
import { generaDvrRoa } from '../roa/generaDvrRoa'
import { giustificabile, giustificabileDaClasse, LIMITE_LUMINANZA, luminanza, TIPI_SORGENTE, valutaRoa, type DpiSaldatura, type SorgenteRoa, type TipoSorgente } from '../roa/valutazione'
import { AreaTesto, Bottone, Campo, CampoNumero, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { stili } from '../ui/stili'
import { CicloLavoro, DatiDocumento, Revisioni } from './comuni'

const VERDE = '#067647'
const ROSSO = '#b42318'
const griglia = (min: number) => ({ ...stili.griglia, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` })
const righe = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean)
const intero = (x: number) => (Number.isFinite(x) ? Math.round(x).toLocaleString('it-IT') : '–')

function nuovaSorgente(tipo: TipoSorgente): SorgenteRoa {
  return { id: nuovoId(), tipo, descrizione: '', attivita: '', funzionamento: '/', utilizzo: '/', classe: '', saldatura: false }
}

// ---------------------------------------------------------------- sorgente

function EditorSorgente({ s, ing, cambia, togli }: { s: SorgenteRoa; ing: Ingresso; cambia: (p: Partial<SorgenteRoa>) => void; togli: () => void }) {
  const t = TIPI_SORGENTE[s.tipo]
  const auto = giustificabileDaClasse(s)
  const g = giustificabile(s)
  const mansioni = [...ing.documentoMansioni].sort((a, b) => a.ordine - b.ordine)
  const nome = (id: string) => ing.mansioni.find((m) => m.id === id)?.nome ?? '(mansione eliminata)'
  return (
    <div role="group" aria-label={`Sorgente ${s.descrizione || 'nuova'}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
      <div style={griglia(170)}>
        <label style={stili.campo}>
          Tipo
          <select style={stili.input} value={s.tipo} onChange={(e) => cambia({ tipo: e.target.value as TipoSorgente, classe: '' })}>
            {(Object.keys(TIPI_SORGENTE) as TipoSorgente[]).map((k) => (
              <option key={k} value={k}>
                {TIPI_SORGENTE[k].nome}
              </option>
            ))}
          </select>
        </label>
        <Campo etichetta="Descrizione" valore={s.descrizione} onChange={(v) => cambia({ descrizione: v })} />
        {s.tipo === 'laser' && <Campo etichetta="Componente" valore={s.componente ?? ''} onChange={(v) => cambia({ componente: v })} />}
        <Campo etichetta="Attività lavorativa" valore={s.attivita} onChange={(v) => cambia({ attivita: v })} />
        <Campo etichetta="Condizioni di funzionamento" valore={s.funzionamento ?? ''} onChange={(v) => cambia({ funzionamento: v })} />
        <Campo etichetta="Condizioni di utilizzo" valore={s.utilizzo ?? ''} onChange={(v) => cambia({ utilizzo: v })} />
        <label style={stili.campo}>
          {t.etichettaClasse} ({t.norma})
          <select style={stili.input} value={s.classe ?? ''} onChange={(e) => cambia({ classe: e.target.value })}>
            <option value="">non reperita</option>
            {t.classi.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {s.tipo === 'macchina' && (
          <label style={{ ...stili.campo, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={!!s.saldatura} onChange={(e) => cambia({ saldatura: e.target.checked })} /> saldatura o taglio termico
          </label>
        )}
        <label style={stili.campo}>
          Giustificabile
          <select
            style={stili.input}
            value={s.giustificabile == null ? 'auto' : s.giustificabile ? 'si' : 'no'}
            onChange={(e) => cambia({ giustificabile: e.target.value === 'auto' ? null : e.target.value === 'si' })}
          >
            <option value="auto">dalla classificazione ({auto ? 'SI' : 'NO'})</option>
            <option value="si">SI</option>
            <option value="no">NO</option>
          </select>
        </label>
      </div>
      <div style={{ ...stili.griglia, gridTemplateColumns: '1fr', marginTop: 8 }}>
        <AreaTesto etichetta="Motivazione della giustificazione (facoltativa)" valore={s.motivazione ?? ''} onChange={(v) => cambia({ motivazione: v })} righe={2} />
      </div>
      {!g && (
        <>
          <p style={{ ...stili.nota, marginTop: 8 }}>Sorgente non giustificabile: analisi della situazione lavorativa (capitolo 7.2).</p>
          <div style={griglia(170)}>
            <Campo etichetta="Descrizione nell’analisi" valore={s.descrizioneAnalisi ?? ''} segnaposto={[s.descrizione, s.componente].filter(Boolean).join(' – ')} onChange={(v) => cambia({ descrizioneAnalisi: v })} />
            <Campo etichetta="Dati spettrali" valore={s.spettro ?? ''} segnaposto="ultravioletti, luce visibile…" onChange={(v) => cambia({ spettro: v })} />
            <Campo etichetta="Distanza operatore – sorgente" valore={s.distanza ?? ''} onChange={(v) => cambia({ distanza: v })} />
            <Campo etichetta="Tempo massimo di permanenza (min)" valore={s.tempo ?? ''} onChange={(v) => cambia({ tempo: v })} />
            <Campo etichetta="Mansioni esposte direttamente" valore={s.espostiDiretti ?? ''} onChange={(v) => cambia({ espostiDiretti: v })} />
            <Campo etichetta="Mansioni esposte indebitamente" valore={s.espostiIndebiti ?? ''} onChange={(v) => cambia({ espostiIndebiti: v })} />
            <label style={{ ...stili.campo, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={!!s.misure} onChange={(e) => cambia({ misure: e.target.checked })} /> servono misure
            </label>
          </div>
          <div style={{ ...stili.griglia, gridTemplateColumns: '1fr', marginTop: 8 }}>
            <AreaTesto etichetta="Motivazione (necessità o meno di misure)" valore={s.motivazioneMisure ?? ''} onChange={(v) => cambia({ motivazioneMisure: v })} righe={2} />
          </div>
          {mansioni.length > 0 && (
            <div style={{ ...stili.riga, marginTop: 6 }}>
              <span style={stili.nota}>Mansioni esposte (riepilogo):</span>
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
        </>
      )}
      <div style={{ ...stili.riga, marginTop: 8, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 13, color: g ? VERDE : ROSSO }}>{g ? 'Giustificabile' : 'Non giustificabile'}</b>
        <Bottone tipo="pericolo" onClick={togli}>
          Togli sorgente
        </Bottone>
      </div>
    </div>
  )
}

function EsitoDpi({ d }: { d: DpiSaldatura }) {
  const v = valutaRoa([], [], [d]).dpi[0]
  const p = PROCESSI_EN169[d.processo]
  const richieste = v.richieste.map((r) => `${r.n} (${r.da}–${r.a} ${p.unita})`).join(', ')
  return (
    <p style={{ fontSize: 13, margin: '6px 0 0', color: v.adeguato ? VERDE : ROSSO, fontWeight: 600 }}>
      Richiesti: {richieste || '—'}
      {v.fuoriTabella ? ' · parte del campo fuori prospetto' : ''} · in dotazione {v.disponibili.join(', ') || '—'} → {v.adeguato ? 'adeguati' : `non adeguati${v.mancanti.length ? ` (manca ${v.mancanti.join(', ')})` : ''}`}
    </p>
  )
}

// ---------------------------------------------------------------- dati della valutazione

function Valutazione({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const [c, setC] = useState<ContenutiRoa>(() => contenutiRoa(ing))
  const [modificato, setModificato] = useState(false)
  const [tipoNuova, setTipoNuova] = useState<TipoSorgente>('macchina')
  const t = c.testi ?? {}
  const v = useMemo(() => valutaRoa(c.sorgenti, c.rilievi, c.dpi), [c])
  const [testoPiano, setTestoPiano] = useState(() => (t.piano ? pianoInTesto(t.piano) : ''))
  const [testoDpi, setTestoDpi] = useState(() => (t.dpi ?? []).join('\n'))
  const [testoOrg, setTestoOrg] = useState(() => (t.organizzazione ?? []).join('\n'))
  const imposta = (p: Partial<ContenutiRoa>) => {
    setC((x) => ({ ...x, ...p }))
    setModificato(true)
  }
  const testi = (p: Partial<NonNullable<ContenutiRoa['testi']>>) => imposta({ testi: { ...t, ...p } })
  const cambiaSorgente = (k: number, p: Partial<SorgenteRoa>) => imposta({ sorgenti: c.sorgenti.map((s, j) => (j === k ? { ...s, ...p } : s)) })
  const cambiaDpi = (k: number, p: Partial<DpiSaldatura>) => imposta({ dpi: c.dpi.map((d, j) => (j === k ? { ...d, ...p } : d)) })
  const importabili = useMemo(() => {
    const gia = new Set(c.sorgenti.map((s) => s.misuraId).filter(Boolean))
    return sorgentiDaMisure(ing.misure).filter((s) => !gia.has(s.misuraId))
  }, [ing.misure, c.sorgenti])

  const salva = () =>
    esegui(async () => {
      c.sorgenti.forEach((s, i) => {
        if (!s.descrizione.trim()) throw new Error(`Sorgente ${i + 1}: manca la descrizione.`)
      })
      const piano = pianoDaTesto(testoPiano)
      const dpi = righe(testoDpi)
      const organizzazione = righe(testoOrg)
      await api.aggiornaContenuti(ing.documento.id, {
        roa: { ...c, testi: { ...t, piano: piano.length ? piano : undefined, dpi: dpi.length ? dpi : undefined, organizzazione: organizzazione.length ? organizzazione : undefined } },
      })
      setModificato(false)
      await aggiorna()
    }, 'Dati del DVR ROA salvati')

  const bottoneSalva = (
    <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
      Salva
    </Bottone>
  )
  const segna = <T,>(set: (x: T) => void) => (x: T) => {
    set(x)
    setModificato(true)
  }

  return (
    <>
      <Sezione
        titolo="Sorgenti di ROA (capitoli 6.7 e 7)"
        azioni={
          <>
            <Bottone disabled={importabili.length === 0} onClick={() => imposta({ sorgenti: [...c.sorgenti, ...importabili] })} title="Misure ROA delle campagne scelte: una sorgente per misura">
              Importa dalle misure ({importabili.length})
            </Bottone>
            {bottoneSalva}
          </>
        }
      >
        <p style={stili.nota}>
          Giustificabili dalla classificazione: macchine di categoria 0 (UNI EN 12198), lampade del gruppo esente (CEI EN 62471), laser di classe 1 e 2 (CEI EN 60825-1). Saldature e tagli termici non sono mai giustificabili.
        </p>
        {c.sorgenti.map((s, k) => (
          <EditorSorgente key={s.id} s={s} ing={ing} cambia={(p) => cambiaSorgente(k, p)} togli={() => imposta({ sorgenti: c.sorgenti.filter((_, j) => j !== k) })} />
        ))}
        <div style={stili.riga}>
          <select aria-label="Tipo della nuova sorgente" style={stili.input} value={tipoNuova} onChange={(e) => setTipoNuova(e.target.value as TipoSorgente)}>
            {(Object.keys(TIPI_SORGENTE) as TipoSorgente[]).map((k) => (
              <option key={k} value={k}>
                {TIPI_SORGENTE[k].nome}
              </option>
            ))}
          </select>
          <Bottone onClick={() => imposta({ sorgenti: [...c.sorgenti, nuovaSorgente(tipoNuova)] })}>+ Sorgente</Bottone>
        </div>
      </Sezione>

      <Sezione titolo="Misure di illuminamento (capitoli 8 e 9)" azioni={bottoneSalva}>
        <p style={stili.nota}>Luminanza Lv = Ev / ω, confrontata con {LIMITE_LUMINANZA.toLocaleString('it-IT')} cd/m² (solo sorgenti senza UV).</p>
        {c.rilievi.map((r, k) => {
          const lv = luminanza(r)
          return (
            <div key={r.id} role="group" aria-label={`Rilievo ${r.sorgente || k + 1}`} style={{ ...griglia(140), marginBottom: 8 }}>
              <Campo etichetta="Sorgente" valore={r.sorgente} onChange={(x) => imposta({ rilievi: c.rilievi.map((y, j) => (j === k ? { ...y, sorgente: x } : y)) })} />
              <CampoNumero etichetta="Illuminamento Ev" unita="lux" valore={r.ev} onChange={(x) => imposta({ rilievi: c.rilievi.map((y, j) => (j === k ? { ...y, ev: x ?? 0 } : y)) })} />
              <CampoNumero etichetta="Distanza" unita="cm" valore={r.distanza ?? null} onChange={(x) => imposta({ rilievi: c.rilievi.map((y, j) => (j === k ? { ...y, distanza: x } : y)) })} />
              <CampoNumero etichetta="Angolo solido ω" unita="sr" valore={r.omega} onChange={(x) => imposta({ rilievi: c.rilievi.map((y, j) => (j === k ? { ...y, omega: x ?? 0 } : y)) })} />
              <div style={{ alignSelf: 'end', fontSize: 13, fontWeight: 600, color: lv <= LIMITE_LUMINANZA ? VERDE : ROSSO }}>Lv {intero(lv)} cd/m²</div>
              <div style={{ alignSelf: 'end' }}>
                <Bottone tipo="pericolo" onClick={() => imposta({ rilievi: c.rilievi.filter((_, j) => j !== k) })}>
                  Togli
                </Bottone>
              </div>
            </div>
          )
        })}
        <Bottone onClick={() => imposta({ rilievi: [...c.rilievi, { id: nuovoId('ril'), sorgente: '', ev: 0, distanza: null, omega: 0 }] })}>+ Misura</Bottone>
      </Sezione>

      <Sezione titolo="DPI per saldatura e taglio (capitolo 10, UNI EN 169)" azioni={bottoneSalva}>
        {c.dpi.map((d, k) => {
          const p = PROCESSI_EN169[d.processo]
          return (
            <div key={d.id} role="group" aria-label={`DPI ${d.etichetta || p.nome}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
              <div style={griglia(160)}>
                <label style={stili.campo}>
                  Procedimento
                  <select style={stili.input} value={d.processo} onChange={(e) => cambiaDpi(k, { processo: e.target.value as ProcessoEn169 })}>
                    {(Object.keys(PROCESSI_EN169) as ProcessoEn169[]).map((x) => (
                      <option key={x} value={x}>
                        {PROCESSI_EN169[x].nome}
                      </option>
                    ))}
                  </select>
                </label>
                <Campo etichetta="Nome nel documento" valore={d.etichetta ?? ''} segnaposto={p.nome} onChange={(x) => cambiaDpi(k, { etichetta: x })} />
                <CampoNumero etichetta={`${p.grandezza} min`} unita={p.unita} valore={d.min} onChange={(x) => cambiaDpi(k, { min: x ?? 0 })} />
                <CampoNumero etichetta={`${p.grandezza} max`} unita={p.unita} valore={d.max} onChange={(x) => cambiaDpi(k, { max: x ?? 0 })} />
                <Campo etichetta="Filtri in dotazione (n°)" valore={d.dotazione} segnaposto="10-11; 9-13" onChange={(x) => cambiaDpi(k, { dotazione: x })} />
                <Campo etichetta="DPI" valore={d.descrizione ?? ''} segnaposto="maschera DIN 9-13" onChange={(x) => cambiaDpi(k, { descrizione: x })} />
                <Campo etichetta="Condizioni al contorno" valore={d.condizioni ?? ''} onChange={(x) => cambiaDpi(k, { condizioni: x })} />
                <div style={{ alignSelf: 'end' }}>
                  <Bottone tipo="pericolo" onClick={() => imposta({ dpi: c.dpi.filter((_, j) => j !== k) })}>
                    Togli
                  </Bottone>
                </div>
              </div>
              <EsitoDpi d={d} />
            </div>
          )
        })}
        <Bottone onClick={() => imposta({ dpi: [...c.dpi, { id: nuovoId('dpi'), processo: 'elettrodi', min: 40, max: 100, dotazione: '', condizioni: 'Distanza operatore-sorgente: ~50 cm; illuminamento medio: 100 lux' }] })}>
          + DPI
        </Bottone>
      </Sezione>

      <Sezione titolo="Testi e piano (capitoli 6.6, 8, 11–14)" azioni={bottoneSalva} chiusa>
        <div style={{ ...stili.griglia, gridTemplateColumns: '1fr' }}>
          <AreaTesto etichetta="DPI utilizzati (uno per riga; vuoto = quelli dei DPI per saldatura)" valore={testoDpi} onChange={segna(setTestoDpi)} righe={3} />
          <AreaTesto etichetta={`Organizzazione dei luoghi di lavoro (un paragrafo per riga; vuoto = “${organizzazionePredefinita(c.sorgenti)[0]}”)`} valore={testoOrg} onChange={segna(setTestoOrg)} righe={3} />
          <AreaTesto etichetta="Strumento e modalità delle misure di illuminamento" valore={t.strumentoMisure ?? STRUMENTO_MISURE} onChange={(x) => testi({ strumentoMisure: x })} righe={2} />
          <AreaTesto etichetta="Soggetti particolarmente sensibili" valore={t.sensibili ?? TESTI_SENSIBILI} onChange={(x) => testi({ sensibili: x })} righe={2} />
          <AreaTesto etichetta="Sostanze fotosensibilizzanti" valore={t.fotosensibilizzanti ?? TESTI_FOTOSENSIBILIZZANTI} onChange={(x) => testi({ fotosensibilizzanti: x })} righe={3} />
          <AreaTesto
            etichetta="Piano di contenimento (una voce per riga, “- ” per il sotto-elenco; vuoto = piano proposto dal calcolo)"
            valore={testoPiano}
            onChange={segna(setTestoPiano)}
            righe={8}
          />
          <div>
            <Bottone onClick={() => segna(setTestoPiano)(pianoInTesto(pianoPredefinito(v)))}>Carica il piano proposto</Bottone>
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
  const { dati } = useMemo(() => datiRoaDaDatabase(ing), [ing])
  const v = useMemo(() => valutaRoa(dati.sorgenti, dati.rilievi, dati.dpi, dati.mansioni), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [!ing.documento.data_emissione && 'data di emissione', dati.sorgenti.length === 0 && 'sorgenti'].filter(Boolean)

  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrRoa(ing.documento.cantiere_id, ing.documento.id)
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
        {dati.sorgenti.length} sorgenti: {v.giustificabili.length} giustificabili, {v.nonGiustificabili.length} non giustificabili
        {v.rilievi.length ? ` · luminanza massima ${intero(Math.max(...v.rilievi.map((r) => r.lv)))} cd/m²` : ''}
        {v.dpi.length ? ` · DPI adeguati ${v.dpi.filter((d) => d.adeguato).length}/${v.dpi.length}` : ''}
      </p>
      {v.nonGiustificabili.length > 0 && (
        <table style={{ ...stili.tabella, marginTop: 8 }}>
          <thead>
            <tr>
              {['Sorgente non giustificabile', 'Tipo', 'Misure'].map((h) => (
                <th key={h} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {v.nonGiustificabili.map((s) => (
              <tr key={s.id}>
                <td style={stili.td}>{[s.descrizione, s.componente].filter(Boolean).join(' – ')}</td>
                <td style={stili.td}>{TIPI_SORGENTE[s.tipo].nome}</td>
                <td style={stili.td}>{s.misure ? 'SI' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sezione>
  )
}

export default function EditorDvrRoa() {
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
          <h1 style={stili.titolo}>DVR Radiazioni ottiche artificiali {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, Titolo VIII Capo V – UNI EN 12198, CEI EN 62471, CEI EN 60825-1, UNI EN 169</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA_ROA} etichettaCampagne="ROA" conTarature={false} />
          <Valutazione key={`val-${q.data.documento.updated_at}`} ing={q.data} aggiorna={aggiorna} />
          <CicloLavoro ing={q.data} aggiorna={aggiorna} titolo="Organizzazione delle attività lavorative (capitolo 6.1)" />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
