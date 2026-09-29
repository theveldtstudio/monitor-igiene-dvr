/**
 * Redazione del DVR Microclima: scenario (galleria o esterno, estate o inverno), rilievi o dati
 * meteo, lavorazioni con dispendio metabolico e mansioni, vestiario, misure e piano; riepilogo e
 * generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { contenutiMicroclima, daMisureMicroclima, datiMicroclimaDaDatabase, nuovoId, TIPI_CAMPAGNA_MICROCLIMA, type ContenutiMicroclima } from '../microclima/daDatabase'
import { generaDvrMicroclima } from '../microclima/generaDvrMicroclima'
import { CLO_PREDEFINITO, misurePredefinite, pianoDaTesto, pianoInTesto, pianoPredefinito, vestiarioPredefinito } from '../microclima/testi'
import { conRilievi, estivo, ETICHETTE_SCENARIO, valutaMicroclima, type LavorazioneMicroclima, type LivelloMicroclima, type MeseMeteo, type RilievoMicroclima, type ScenarioMicroclima } from '../microclima/valutazione'
import { AreaTesto, Bottone, Campo, CampoNumero, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { stili } from '../ui/stili'
import { CicloLavoro, DatiDocumento, Revisioni } from './comuni'

const COLORE: Record<LivelloMicroclima, string> = { 0: '#067647', 1: '#b54708', 2: '#b42318' }
const ETICHETTA: Record<LivelloMicroclima, string> = { 0: 'accettabile', 1: 'discomfort / da limitare', 2: 'rischio per la salute' }
const uno = (x: number | null | undefined) => (x == null || !Number.isFinite(x) ? '–' : x.toFixed(1).replace('.', ','))
const griglia = (min: number) => ({ ...stili.griglia, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` })

// ---------------------------------------------------------------- dati della valutazione

function Valutazione({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const [c, setC] = useState<ContenutiMicroclima>(() => contenutiMicroclima(ing))
  const [modificato, setModificato] = useState(false)
  const imposta = (p: Partial<ContenutiMicroclima>) => {
    setC((x) => ({ ...x, ...p }))
    setModificato(true)
  }
  const p = c.parametri
  const s = p.scenario
  const parametri = (x: Partial<typeof p>) => imposta({ parametri: { ...p, ...x } })
  const meteo = p.meteo ?? { mesi: [] }
  const cambiaMeteo = (x: Partial<typeof meteo>) => parametri({ meteo: { ...meteo, ...x } })
  const cambiaMese = (k: number, x: Partial<MeseMeteo>) => cambiaMeteo({ mesi: meteo.mesi.map((m, j) => (j === k ? { ...m, ...x } : m)) })
  const cambiaRilievo = (k: number, x: Partial<RilievoMicroclima>) => imposta({ rilievi: c.rilievi.map((r, j) => (j === k ? { ...r, ...x } : r)) })
  const cambiaLav = (k: number, x: Partial<LavorazioneMicroclima>) => imposta({ lavorazioni: c.lavorazioni.map((l, j) => (j === k ? { ...l, ...x } : l)) })
  const mansioni = [...ing.documentoMansioni].sort((a, b) => a.ordine - b.ordine)
  const nome = (id: string) => ing.mansioni.find((m) => m.id === id)?.nome ?? '(mansione eliminata)'
  const vestiario = c.vestiario ?? vestiarioPredefinito(s)
  const [testoPiano, setTestoPiano] = useState(() => pianoInTesto(c.piano ?? pianoPredefinito(s)))
  const [testoMisure, setTestoMisure] = useState(() => (c.misure ?? misurePredefinite(s)).join('\n'))

  const importabili = useMemo(() => {
    const gia = new Set(c.rilievi.map((r) => r.misuraId).filter(Boolean))
    return daMisureMicroclima(
      ing.misure.filter((m) => !gia.has(m.misura.id)),
      c.rilievi.length + 1,
    )
  }, [ing.misure, c.rilievi])

  const cambiaScenario = (nuovo: ScenarioMicroclima) => {
    const stagioneCambiata = estivo(nuovo) !== estivo(s)
    imposta({
      parametri: { ...p, scenario: nuovo, clo: stagioneCambiata ? CLO_PREDEFINITO(nuovo) : p.clo },
      ...(stagioneCambiata ? { vestiario: undefined, misure: undefined, piano: undefined } : {}),
    })
    if (stagioneCambiata || conRilievi(nuovo) !== conRilievi(s)) setTestoPiano(pianoInTesto(pianoPredefinito(nuovo)))
    if (stagioneCambiata) setTestoMisure(misurePredefinite(nuovo).join('\n'))
  }

  const salva = () =>
    esegui(async () => {
      c.lavorazioni.forEach((l, i) => {
        if (!l.fase.trim()) throw new Error(`Lavorazione ${i + 1}: manca la fase.`)
      })
      const piano = pianoDaTesto(testoPiano)
      const misure = testoMisure.split('\n').map((x) => x.trim()).filter(Boolean)
      await api.aggiornaContenuti(ing.documento.id, { microclima: { ...c, piano: piano.length ? piano : undefined, misure: misure.length ? misure : undefined } })
      setModificato(false)
      await aggiorna()
    }, 'Dati del DVR Microclima salvati')

  const bottoneSalva = (
    <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
      Salva
    </Bottone>
  )

  return (
    <>
      <Sezione titolo="Scenario e parametri" azioni={bottoneSalva}>
        <div style={griglia(180)}>
          <label style={{ ...stili.campo, gridColumn: '1 / -1' }}>
            Scenario
            <select style={stili.input} value={s} onChange={(e) => cambiaScenario(e.target.value as ScenarioMicroclima)}>
              {Object.entries(ETICHETTE_SCENARIO).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <CampoNumero etichetta="Isolamento del vestiario" unita="clo" valore={p.clo} onChange={(v) => parametri({ clo: v ?? 0 })} />
          {s === 'galleria_inverno' && (
            <CampoNumero etichetta="Diametro del globo" unita="m" valore={p.diametroGlobo ?? 0.15} onChange={(v) => parametri({ diametroGlobo: v ?? undefined })} />
          )}
          {estivo(s) && (
            <label style={{ ...stili.campo, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={p.acclimatati ?? true} onChange={(e) => parametri({ acclimatati: e.target.checked })} /> lavoratori acclimatati
            </label>
          )}
          <Campo etichetta="Periodo di osservazione (tabella MET)" valore={c.periodoOsservazione ?? ''} segnaposto={ing.documento.periodo_riferimento ?? ''} onChange={(v) => imposta({ periodoOsservazione: v })} />
        </div>
        {s === 'galleria_inverno' && <p style={stili.nota}>Il PMV usa la temperatura media radiante ricavata dal globotermometro: indica il diametro della sonda (0,15 m il globo standard, 0,05 m i globi piccoli).</p>}
      </Sezione>

      {conRilievi(s) ? (
        <Sezione
          titolo="Rilievi microclimatici (capitolo 6)"
          azioni={
            <>
              <Bottone
                disabled={importabili.rilievi.length === 0}
                onClick={() => imposta({ rilievi: [...c.rilievi, ...importabili.rilievi], lavorazioni: [...c.lavorazioni, ...importabili.lavorazioni] })}
                title="Misure delle campagne microclima scelte: un rilievo e una lavorazione per misura"
              >
                Importa dalle misure ({importabili.rilievi.length})
              </Bottone>
              {bottoneSalva}
            </>
          }
        >
          {c.rilievi.map((r, k) => (
            <div key={r.id} role="group" aria-label={`Rilievo ${r.codice}`} style={{ ...griglia(110), marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <Campo etichetta="Sigla" valore={r.codice} onChange={(v) => cambiaRilievo(k, { codice: v })} />
              <Campo etichetta="Data" valore={r.data} onChange={(v) => cambiaRilievo(k, { data: v })} />
              <Campo etichetta="Fase" valore={r.fase} onChange={(v) => cambiaRilievo(k, { fase: v })} />
              <Campo etichetta="Postazione" valore={r.postazione} onChange={(v) => cambiaRilievo(k, { postazione: v })} />
              <CampoNumero etichetta="Ta" unita="°C" valore={r.ta} onChange={(v) => cambiaRilievo(k, { ta: v ?? 0 })} />
              <CampoNumero etichetta="Tg" unita="°C" valore={r.tg} onChange={(v) => cambiaRilievo(k, { tg: v ?? 0 })} />
              <CampoNumero etichetta="Tuvn" unita="°C" valore={r.tnw} onChange={(v) => cambiaRilievo(k, { tnw: v })} />
              <CampoNumero etichetta="UR" unita="%" valore={r.ur} onChange={(v) => cambiaRilievo(k, { ur: v ?? 0 })} />
              <CampoNumero etichetta="Va" unita="m/s" valore={r.va} onChange={(v) => cambiaRilievo(k, { va: v ?? 0 })} />
              <CampoNumero etichetta="T rugiada" unita="°C" valore={r.trugiada ?? null} onChange={(v) => cambiaRilievo(k, { trugiada: v })} />
              <div style={{ alignSelf: 'end' }}>
                <Bottone tipo="pericolo" onClick={() => imposta({ rilievi: c.rilievi.filter((_, j) => j !== k), lavorazioni: c.lavorazioni.map((l) => (l.rilievo === r.id ? { ...l, rilievo: null } : l)) })}>
                  Togli
                </Bottone>
              </div>
            </div>
          ))}
          <Bottone
            onClick={() =>
              imposta({
                rilievi: [...c.rilievi, { id: nuovoId('ril'), codice: `MCR${String(c.rilievi.length + 1).padStart(2, '0')}`, data: '', fase: '', postazione: 'In prossimità della lavorazione', ta: 20, tg: 20, tnw: null, ur: 50, va: 0.1 }],
              })
            }
          >
            + Rilievo
          </Bottone>
        </Sezione>
      ) : (
        <Sezione titolo="Dati meteoclimatici (capitolo 6)" azioni={bottoneSalva}>
          <div style={griglia(180)}>
            <Campo etichetta="Fonte" valore={meteo.fonte ?? ''} segnaposto="www.ilmeteo.it" onChange={(v) => cambiaMeteo({ fonte: v })} />
            <Campo etichetta="Stazione" valore={meteo.stazione ?? ''} segnaposto="Comune (provincia)" onChange={(v) => cambiaMeteo({ stazione: v })} />
            <Campo etichetta="Anni di riferimento" valore={meteo.periodo ?? ''} segnaposto="2023–2025" onChange={(v) => cambiaMeteo({ periodo: v })} />
          </div>
          <p style={stili.nota}>Medie mensili; la temperatura radiante, se vuota, è pari a Ta.{s === 'esterno_inverno' ? ' Per IREQ e WCI indica per ogni mese la giornata peggiore.' : ''}</p>
          {meteo.mesi.map((m, k) => (
            <div key={k} role="group" aria-label={`Mese ${m.mese}`} style={{ ...griglia(100), marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <Campo etichetta="Mese" valore={m.mese} onChange={(v) => cambiaMese(k, { mese: v })} />
              <CampoNumero etichetta="Ta media" unita="°C" valore={m.ta} onChange={(v) => cambiaMese(k, { ta: v ?? 0 })} />
              <CampoNumero etichetta="Ta min medie" unita="°C" valore={m.taMin ?? null} onChange={(v) => cambiaMese(k, { taMin: v })} />
              <CampoNumero etichetta="Ta max medie" unita="°C" valore={m.taMax ?? null} onChange={(v) => cambiaMese(k, { taMax: v })} />
              <CampoNumero etichetta="UR media" unita="%" valore={m.ur} onChange={(v) => cambiaMese(k, { ur: v ?? 0 })} />
              <CampoNumero etichetta="Va media" unita="m/s" valore={m.va} onChange={(v) => cambiaMese(k, { va: v ?? 0 })} />
              <CampoNumero etichetta="T radiante" unita="°C" valore={m.tr ?? null} onChange={(v) => cambiaMese(k, { tr: v })} />
              {s === 'esterno_inverno' && (
                <>
                  <CampoNumero etichetta="Peggiore: Ta" unita="°C" valore={m.peggiore?.ta ?? null} onChange={(v) => cambiaMese(k, { peggiore: v === null ? null : { ur: 70, va: 5, ...m.peggiore, ta: v } })} />
                  <CampoNumero etichetta="Peggiore: UR" unita="%" valore={m.peggiore?.ur ?? null} onChange={(v) => m.peggiore && cambiaMese(k, { peggiore: { ...m.peggiore, ur: v ?? 0 } })} />
                  <CampoNumero etichetta="Peggiore: Va" unita="m/s" valore={m.peggiore?.va ?? null} onChange={(v) => m.peggiore && cambiaMese(k, { peggiore: { ...m.peggiore, va: v ?? 0 } })} />
                </>
              )}
              <div style={{ alignSelf: 'end' }}>
                <Bottone tipo="pericolo" onClick={() => cambiaMeteo({ mesi: meteo.mesi.filter((_, j) => j !== k) })}>
                  Togli
                </Bottone>
              </div>
            </div>
          ))}
          <Bottone onClick={() => cambiaMeteo({ mesi: [...meteo.mesi, { mese: '', ta: estivo(s) ? 25 : 8, ur: 70, va: 1 }] })}>+ Mese</Bottone>
          {s === 'esterno_estate' && (
            <>
              <p style={{ ...stili.nota, marginTop: 12 }}>Giornata più gravosa (WBGTe): lascia vuoto Ta per non calcolarla.</p>
              <div style={griglia(110)}>
                <Campo etichetta="Data" valore={meteo.picco?.data ?? ''} onChange={(v) => meteo.picco && cambiaMeteo({ picco: { ...meteo.picco, data: v } })} />
                <CampoNumero etichetta="Ta max" unita="°C" valore={meteo.picco?.ta ?? null} onChange={(v) => cambiaMeteo({ picco: v === null ? null : { ur: 50, va: 0, tg: v + 2, tnw: v - 10, ...meteo.picco, ta: v } })} />
                {meteo.picco && (
                  <>
                    <CampoNumero etichetta="UR" unita="%" valore={meteo.picco.ur} onChange={(v) => cambiaMeteo({ picco: { ...meteo.picco!, ur: v ?? 0 } })} />
                    <CampoNumero etichetta="Va" unita="m/s" valore={meteo.picco.va} onChange={(v) => cambiaMeteo({ picco: { ...meteo.picco!, va: v ?? 0 } })} />
                    <CampoNumero etichetta="Tg" unita="°C" valore={meteo.picco.tg} onChange={(v) => cambiaMeteo({ picco: { ...meteo.picco!, tg: v ?? 0 } })} />
                    <CampoNumero etichetta="Tuvn" unita="°C" valore={meteo.picco.tnw} onChange={(v) => cambiaMeteo({ picco: { ...meteo.picco!, tnw: v ?? 0 } })} />
                  </>
                )}
              </div>
            </>
          )}
        </Sezione>
      )}

      <Sezione titolo="Lavorazioni, dispendio metabolico e mansioni (capitoli 5.6 e 8)" azioni={bottoneSalva}>
        <p style={stili.nota}>Dispendio metabolico in met (1 met = 58 W/m²): valori tipici 1,4 lavoro leggero, 2,0–2,4 medio, 2,8 pesante.</p>
        {c.lavorazioni.map((l, k) => (
          <div key={l.id} role="group" aria-label={`Lavorazione ${l.fase || k + 1}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
            <div style={{ ...stili.griglia, gridTemplateColumns: conRilievi(s) ? '2fr 1fr 1fr auto' : '2fr 1fr auto' }}>
              <Campo etichetta="Fase lavorativa" valore={l.fase} onChange={(v) => cambiaLav(k, { fase: v })} />
              <CampoNumero etichetta="Dispendio" unita="met" valore={l.met || null} onChange={(v) => cambiaLav(k, { met: v ?? 0 })} />
              {conRilievi(s) && (
                <label style={stili.campo}>
                  Rilievo
                  <select style={stili.input} value={l.rilievo ?? ''} onChange={(e) => cambiaLav(k, { rilievo: e.target.value || null })}>
                    <option value="">—</option>
                    {c.rilievi.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.codice} – {r.fase}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div style={{ alignSelf: 'end' }}>
                <Bottone tipo="pericolo" onClick={() => imposta({ lavorazioni: c.lavorazioni.filter((_, j) => j !== k) })}>
                  Togli
                </Bottone>
              </div>
            </div>
            <div style={{ ...stili.riga, marginTop: 6 }}>
              {mansioni.map((dm) => (
                <label key={dm.mansione_id} style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={l.mansioni.includes(dm.mansione_id)}
                    onChange={() => cambiaLav(k, { mansioni: l.mansioni.includes(dm.mansione_id) ? l.mansioni.filter((x) => x !== dm.mansione_id) : [...l.mansioni, dm.mansione_id] })}
                  />{' '}
                  {nome(dm.mansione_id)}
                </label>
              ))}
            </div>
          </div>
        ))}
        <Bottone onClick={() => imposta({ lavorazioni: [...c.lavorazioni, { id: nuovoId('lav'), fase: '', mansioni: [], met: 2.2, rilievo: null }] })}>+ Lavorazione</Bottone>
      </Sezione>

      <Sezione titolo="Vestiario, misure preventive e piano (capitoli 5.6, 5.7 e 11)" azioni={bottoneSalva} chiusa>
        <p style={stili.nota}>Capi del vestiario (tabella dell’isolamento termico; senza capi il documento riporta solo il valore in clo).</p>
        {vestiario.map((v, k) => (
          <div key={k} style={{ ...stili.griglia, gridTemplateColumns: '2fr 1fr auto', marginBottom: 4 }}>
            <Campo etichetta="Capo" valore={v.capo} onChange={(x) => imposta({ vestiario: vestiario.map((y, j) => (j === k ? { ...y, capo: x } : y)) })} />
            <CampoNumero etichetta="Isolamento" unita="clo" valore={v.clo} onChange={(x) => imposta({ vestiario: vestiario.map((y, j) => (j === k ? { ...y, clo: x ?? 0 } : y)) })} />
            <div style={{ alignSelf: 'end' }}>
              <Bottone tipo="pericolo" onClick={() => imposta({ vestiario: vestiario.filter((_, j) => j !== k) })}>
                Togli
              </Bottone>
            </div>
          </div>
        ))}
        <div style={stili.riga}>
          <Bottone onClick={() => imposta({ vestiario: [...vestiario, { capo: '', clo: 0 }] })}>+ Capo</Bottone>
          {vestiario.length > 0 && (
            <span style={stili.nota}>
              Somma dei capi {uno(vestiario.reduce((t, v) => t + v.clo, 0))} clo · valore usato nei calcoli {uno(p.clo)} clo
            </span>
          )}
        </div>
        <div style={{ ...stili.griglia, gridTemplateColumns: '1fr', marginTop: 12 }}>
          <AreaTesto
            etichetta="Misure preventive adottate (un paragrafo per riga)"
            valore={testoMisure}
            onChange={(v) => {
              setTestoMisure(v)
              setModificato(true)
            }}
            righe={4}
          />
          <AreaTesto
            etichetta="Piano di contenimento (una voce per riga; “- ” all’inizio per il sotto-elenco della voce sopra)"
            valore={testoPiano}
            onChange={(v) => {
              setTestoPiano(v)
              setModificato(true)
            }}
            righe={10}
          />
        </div>
      </Sezione>
    </>
  )
}

// ---------------------------------------------------------------- riepilogo

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati } = useMemo(() => datiMicroclimaDaDatabase(ing), [ing])
  const v = useMemo(() => valutaMicroclima(dati.parametri, dati.lavorazioni, dati.rilievi, dati.mansioni), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [!ing.documento.data_emissione && 'data di emissione', dati.lavorazioni.length === 0 && 'lavorazioni'].filter(Boolean)
  const s = dati.parametri.scenario

  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrMicroclima(ing.documento.cantiere_id, ing.documento.id)
      saveBlob(r.blob, r.nomeFile)
    }, 'DVR generato')
    setGenerando(false)
  }

  const indice = (e: (typeof v.esiti)[number]) => {
    if (e.comfort) return `PMV ${uno(e.comfort.pmv)} · PPD ${uno(e.comfort.ppd)}% (cat. ${e.comfort.categoria})`
    if (e.wbgt) return `WBGTi ${uno(e.wbgt.valore)} °C / limite ${e.wbgt.limite}`
    const mesi = (e.mesi ?? []).map((m) => `${m.mese.slice(0, 3)} ${uno(m.comfort.pmv)}${m.freddo ? ` (IREQ ${m.freddo.classe})` : ''}`).join(' · ')
    return `PMV ${mesi}${e.picco ? ` · WBGTe ${uno(e.picco.valore)} / ${e.picco.limite}` : ''}`
  }

  return (
    <Sezione
      titolo="Riepilogo e controlli"
      azioni={
        <Bottone tipo="primario" disabled={generando || dati.mansioni.length === 0} onClick={() => (errori.length ? setConferma(true) : void genera())}>
          {generando ? 'Generazione…' : 'Genera DVR Word'}
        </Bottone>
      }
    >
      <ConfirmDialog
        open={conferma}
        title="Generare comunque?"
        message={`Ci sono ${errori.length} errori (in rosso): le lavorazioni con errori non compaiono nel documento.`}
        confirmLabel="Genera bozza"
        onCancel={() => setConferma(false)}
        onConfirm={() => void genera()}
      />
      <p style={stili.nota}>{ETICHETTE_SCENARIO[s]}</p>
      {mancanti.length > 0 && <p style={stili.attenzione}>Mancano: {mancanti.join(', ')}.</p>}
      {v.avvisi.map((a, i) => (
        <p key={i} style={a.livello === 'errore' ? stili.avviso : stili.attenzione}>
          {a.messaggio}
        </p>
      ))}
      {v.esiti.length > 0 && (
        <table style={{ ...stili.tabella, marginTop: 8 }}>
          <thead>
            <tr>
              {['Lavorazione', 'met', 'Indici', 'Esito'].map((h) => (
                <th key={h} style={stili.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {v.esiti.map((e) => (
              <tr key={e.lavorazione.id}>
                <td style={stili.td}>{e.lavorazione.fase}</td>
                <td style={stili.td}>{uno(e.lavorazione.met)}</td>
                <td style={stili.td}>{indice(e)}</td>
                <td style={{ ...stili.td, color: COLORE[e.livello], fontWeight: e.livello ? 600 : 400 }}>{ETICHETTA[e.livello]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {v.wci.length > 0 && (
        <p style={{ ...stili.nota, marginTop: 8 }}>
          WCI giornate peggiori: {v.wci.map((w) => `${w.mese} ${w.valore}`).join(' · ')}
        </p>
      )}
    </Sezione>
  )
}

export default function EditorDvrMicroclima() {
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
          <h1 style={stili.titolo}>DVR Microclima {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, Titolo II – UNI EN ISO 7730, 7243, 11079</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA_MICROCLIMA} etichettaCampagne="microclima" conTarature={false} />
          <Valutazione key={`val-${q.data.documento.updated_at}`} ing={q.data} aggiorna={aggiorna} />
          <CicloLavoro ing={q.data} aggiorna={aggiorna} titolo="Aspetti organizzativi e ciclo di lavoro (capitolo 5.1)" />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
