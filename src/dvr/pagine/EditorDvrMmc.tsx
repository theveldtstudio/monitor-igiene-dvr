/**
 * Redazione del DVR Movimentazione manuale dei carichi: attività con il metodo di calcolo
 * (NIOSH semplice o composto, Snook e Ciriello, check list OCRA), mansioni coinvolte,
 * riepilogo e generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { attivitaDaMisure, datiMmcDaDatabase, nuovoId, TIPI_CAMPAGNA_MMC } from '../mmc/daDatabase'
import { generaDvrMmc } from '../mmc/generaDvrMmc'
import { ETICHETTE_NIOSH, type CompitoNiosh, type DurataNiosh, type PresaNiosh } from '../mmc/niosh'
import { ETICHETTE_SNOOK, intervalliDisponibili, testoIntervallo, type AzioneSnook } from '../mmc/snook'
import { ETICHETTE_LIVELLO, ETICHETTE_METODO, valutaAttivita, valutaDvrMmc, type AttivitaMmc, type LivelloMmc, type MetodoMmc } from '../mmc/valutazione'
import { AreaTesto, Bottone, CampoNumero, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { stili } from '../ui/stili'
import { CicloLavoro, DatiDocumento, Revisioni } from './comuni'

const COLORE: Record<LivelloMmc, string> = { 0: '#067647', 1: '#b54708', 2: '#b42318', 3: '#7a1a12' }
const due = (x: number) => (Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '∞')

const compitoVuoto = (): CompitoNiosh => ({ peso: 0, persone: 1, altezza: 75, dislocazione: 25, distanza: 25, asimmetria: 0, frequenza: 0.2, durata: 'breve', presa: 'buono' })

function nuovaAttivita(metodo: MetodoMmc): AttivitaMmc {
  const base = { id: nuovoId(), titolo: '', descrizione: '', mansioni: [], metodo }
  if (metodo === 'niosh') return { ...base, compiti: [compitoVuoto()] }
  if (metodo === 'niosh_composto') return { ...base, compiti: [compitoVuoto(), compitoVuoto()] }
  if (metodo === 'snook') return { ...base, snook: { azione: 'trasporto', altezza: 80, distanza: 15, intervallo: 8 * 3600, valore: 0 } }
  return { ...base, ocra: { dx: null, sx: null, minuti: null } }
}

// ---------------------------------------------------------------- editor dei metodi

function EditorCompito({ c, cambia, composto }: { c: CompitoNiosh; cambia: (p: Partial<CompitoNiosh>) => void; composto: boolean }) {
  return (
    <div style={{ ...stili.griglia, gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
      {composto && (
        <label style={{ ...stili.campo, gridColumn: '1 / -1' }}>
          Compito
          <input style={stili.input} value={c.descrizione ?? ''} onChange={(e) => cambia({ descrizione: e.target.value })} />
        </label>
      )}
      <CampoNumero etichetta="Peso complessivo" unita="kg" valore={c.peso} onChange={(v) => cambia({ peso: v ?? 0 })} />
      <CampoNumero etichetta="N° persone" valore={c.persone ?? 1} onChange={(v) => cambia({ persone: Math.max(1, Math.round(v ?? 1)) })} />
      <CampoNumero etichetta="Altezza mani (inizio)" unita="cm" valore={c.altezza} onChange={(v) => cambia({ altezza: v ?? 0 })} />
      <CampoNumero etichetta="Dislocazione verticale" unita="cm" valore={c.dislocazione} onChange={(v) => cambia({ dislocazione: v ?? 0 })} />
      <CampoNumero etichetta="Distanza dal corpo" unita="cm" valore={c.distanza} onChange={(v) => cambia({ distanza: v ?? 0 })} />
      <CampoNumero etichetta="Asimmetria" unita="°" valore={c.asimmetria} onChange={(v) => cambia({ asimmetria: v ?? 0 })} />
      <CampoNumero etichetta="Frequenza" unita="atti/min" valore={c.frequenza} onChange={(v) => cambia({ frequenza: v ?? 0 })} />
      <label style={stili.campo}>
        Durata
        <select style={stili.input} value={c.durata} onChange={(e) => cambia({ durata: e.target.value as DurataNiosh })}>
          <option value="breve">fino a 1 ora</option>
          <option value="media">da 1 a 2 ore</option>
          <option value="lunga">da 2 a 8 ore</option>
        </select>
      </label>
      <label style={stili.campo}>
        Presa
        <select style={stili.input} value={c.presa} onChange={(e) => cambia({ presa: e.target.value as PresaNiosh })}>
          <option value="buono">buona</option>
          <option value="medio">media</option>
          <option value="scarso">scarsa</option>
        </select>
      </label>
      <label style={{ ...stili.campo, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <input type="checkbox" checked={!!c.unaMano} onChange={(e) => cambia({ unaMano: e.target.checked })} /> una mano
      </label>
    </div>
  )
}

function EsitoAttivita({ a }: { a: AttivitaMmc }) {
  const { esito, avvisi } = valutaAttivita(a)
  const errore = avvisi.find((x) => x.livello === 'errore')
  if (!esito) return <p style={stili.attenzione}>{errore?.messaggio ?? 'Dati incompleti.'}</p>
  let testo = ''
  if (esito.niosh) {
    const r = esito.niosh
    testo = `PLR ${r.adulti.plr.toString().replace('.', ',')} / ${r.anziani.plr.toString().replace('.', ',')} kg · IS adulti ${due(r.adulti.is)} (${ETICHETTE_NIOSH[r.adulti.fascia].rischio}) · giovani/anziani ${due(r.anziani.is)} (${ETICHETTE_NIOSH[r.anziani.fascia].rischio})`
  } else if (esito.composto) {
    const r = esito.composto
    testo = `ISC adulti ${due(r.adulti.isc)} (${ETICHETTE_NIOSH[r.adulti.fascia].rischio}) · giovani/anziani ${due(r.anziani.isc)} (${ETICHETTE_NIOSH[r.anziani.fascia].rischio})`
  } else if (esito.snook) {
    const r = esito.snook
    testo = `Limite ${r.limite}${r.limiteMantenimento != null ? ` / ${r.limiteMantenimento}` : ''} kg (tabella: ${r.altezzaTabella} cm, ${r.distanzaTabella} m, ogni ${testoIntervallo(r.intervalloTabella)}) · indice ${due(r.indice)} (${ETICHETTE_SNOOK[r.fascia].rischio})`
  } else if (esito.ocra) {
    const r = esito.ocra
    const it = (x: number) => String(x).replace('.', ',')
    testo = [r.sx && `SX ${it(r.sx.punteggio)} → OCRA ${it(r.sx.indice)} (${r.sx.etichetta.toLowerCase()})`, r.dx && `DX ${it(r.dx.punteggio)} → OCRA ${it(r.dx.indice)} (${r.dx.etichetta.toLowerCase()})`]
      .filter(Boolean)
      .join(' · ')
  }
  const peggiore = Math.max(esito.livello.adulti, esito.livello.anziani) as LivelloMmc
  return (
    <div style={{ marginTop: 6 }}>
      <b style={{ fontSize: 13, color: COLORE[peggiore] }}>{testo}</b>
      {avvisi
        .filter((x) => x.livello === 'attenzione')
        .map((x, i) => (
          <p key={i} style={{ ...stili.attenzione, margin: '4px 0 0' }}>
            {x.messaggio}
          </p>
        ))}
    </div>
  )
}

function EditorAttivita({ a, ing, cambia, togli }: { a: AttivitaMmc; ing: Ingresso; cambia: (p: Partial<AttivitaMmc>) => void; togli: () => void }) {
  const mansioni = [...ing.documentoMansioni].sort((x, y) => x.ordine - y.ordine)
  const nome = (id: string) => ing.mansioni.find((m) => m.id === id)?.nome ?? '(mansione eliminata)'
  const compiti = a.compiti ?? []
  const cambiaCompito = (k: number, p: Partial<CompitoNiosh>) => cambia({ compiti: compiti.map((c, j) => (j === k ? { ...c, ...p } : c)) })
  const cambiaMetodo = (metodo: MetodoMmc) => {
    const n = nuovaAttivita(metodo)
    const nuoviCompiti =
      metodo === 'niosh'
        ? compiti.length
          ? compiti.slice(0, 1)
          : n.compiti
        : metodo === 'niosh_composto'
          ? [...compiti, ...n.compiti!].slice(0, Math.max(2, compiti.length))
          : a.compiti
    cambia({ metodo, compiti: nuoviCompiti, snook: a.snook ?? n.snook, ocra: a.ocra ?? n.ocra })
  }
  const s = a.snook
  return (
    <div role="group" aria-label={`Attività ${a.titolo || 'nuova'}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
      <div style={{ ...stili.griglia, gridTemplateColumns: '2fr 1fr' }}>
        <label style={stili.campo}>
          Attività
          <input style={stili.input} value={a.titolo} onChange={(e) => cambia({ titolo: e.target.value })} />
        </label>
        <label style={stili.campo}>
          Metodo
          <select style={stili.input} value={a.metodo} onChange={(e) => cambiaMetodo(e.target.value as MetodoMmc)}>
            {Object.entries(ETICHETTE_METODO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ ...stili.griglia, gridTemplateColumns: '1fr 2fr', marginTop: 8 }}>
        <AreaTesto etichetta="Descrizione sintetica (elenco del capitolo 4)" valore={a.sintesi ?? ''} onChange={(v) => cambia({ sintesi: v })} righe={3} />
        <AreaTesto etichetta="Descrizione e ipotesi di calcolo (paragrafi separati da una riga vuota)" valore={a.descrizione} onChange={(v) => cambia({ descrizione: v })} righe={3} />
      </div>
      <p style={{ ...stili.nota, marginTop: 8 }}>Mansioni che svolgono l’attività:</p>
      <div style={stili.riga}>
        {mansioni.map((dm) => (
          <label key={dm.mansione_id} style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              checked={a.mansioni.includes(dm.mansione_id)}
              onChange={() => cambia({ mansioni: a.mansioni.includes(dm.mansione_id) ? a.mansioni.filter((x) => x !== dm.mansione_id) : [...a.mansioni, dm.mansione_id] })}
            />{' '}
            {nome(dm.mansione_id)}
          </label>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        {(a.metodo === 'niosh' || a.metodo === 'niosh_composto') &&
          compiti.map((c, k) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <EditorCompito c={c} cambia={(p) => cambiaCompito(k, p)} composto={a.metodo === 'niosh_composto'} />
              {a.metodo === 'niosh_composto' && compiti.length > 2 && (
                <Bottone tipo="pericolo" onClick={() => cambia({ compiti: compiti.filter((_, j) => j !== k) })}>
                  Togli compito
                </Bottone>
              )}
            </div>
          ))}
        {a.metodo === 'niosh_composto' && <Bottone onClick={() => cambia({ compiti: [...compiti, { ...compitoVuoto(), durata: compiti[0]?.durata ?? 'breve' }] })}>+ Compito</Bottone>}

        {a.metodo === 'snook' && s && (
          <div style={{ ...stili.griglia, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            <label style={stili.campo}>
              Azione
              <select style={stili.input} value={s.azione} onChange={(e) => cambia({ snook: { ...s, azione: e.target.value as AzioneSnook } })}>
                <option value="trasporto">trasporto in piano</option>
                <option value="spinta">spinta</option>
                <option value="traino">traino</option>
              </select>
            </label>
            <CampoNumero etichetta="Altezza mani" unita="cm" valore={s.altezza} onChange={(v) => cambia({ snook: { ...s, altezza: v ?? 0 } })} />
            <CampoNumero etichetta="Distanza" unita="m" valore={s.distanza} onChange={(v) => cambia({ snook: { ...s, distanza: v ?? 0 } })} />
            <label style={stili.campo}>
              Frequenza
              <select style={stili.input} value={s.intervallo} onChange={(e) => cambia({ snook: { ...s, intervallo: Number(e.target.value) } })}>
                {[...new Set([...intervalliDisponibili(s.azione, s.distanza), s.intervallo])]
                  .sort((x, y) => x - y)
                  .map((x) => (
                    <option key={x} value={x}>
                      1 azione ogni {testoIntervallo(x)}
                    </option>
                  ))}
              </select>
            </label>
            <CampoNumero etichetta={s.azione === 'trasporto' ? 'Peso trasportato' : 'Forza iniziale'} unita="kg" valore={s.valore} onChange={(v) => cambia({ snook: { ...s, valore: v ?? 0 } })} />
            {s.azione !== 'trasporto' && (
              <CampoNumero etichetta="Forza di mantenimento" unita="kg" valore={s.mantenimento ?? null} onChange={(v) => cambia({ snook: { ...s, mantenimento: v } })} />
            )}
          </div>
        )}

        {a.metodo === 'ocra' && a.ocra && (
          <div style={{ ...stili.griglia, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            <CampoNumero etichetta="Check list – arto destro" valore={a.ocra.dx} onChange={(v) => cambia({ ocra: { ...a.ocra!, dx: v } })} />
            <CampoNumero etichetta="Check list – arto sinistro" valore={a.ocra.sx} onChange={(v) => cambia({ ocra: { ...a.ocra!, sx: v } })} />
            <CampoNumero etichetta="Tempo di lavoro ripetitivo" unita="min" valore={a.ocra.minuti ?? null} onChange={(v) => cambia({ ocra: { ...a.ocra!, minuti: v } })} />
          </div>
        )}
      </div>
      <EsitoAttivita a={a} />
      <div style={{ ...stili.riga, marginTop: 8 }}>
        <Bottone tipo="pericolo" onClick={togli}>
          Togli attività
        </Bottone>
      </div>
    </div>
  )
}

function Attivita({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const [voci, setVoci] = useState<AttivitaMmc[]>(ing.documento.contenuti.attivitaMmc ?? [])
  const [modificato, setModificato] = useState(false)
  const [metodoNuova, setMetodoNuova] = useState<MetodoMmc>('niosh')
  const imposta = (v: AttivitaMmc[]) => {
    setVoci(v)
    setModificato(true)
  }
  const importabili = useMemo(() => {
    const gia = new Set(voci.map((v) => v.misuraId).filter(Boolean))
    return attivitaDaMisure(ing.misure).filter((a) => !gia.has(a.misuraId))
  }, [ing.misure, voci])

  const salva = () =>
    esegui(async () => {
      voci.forEach((v, i) => {
        if (!v.titolo.trim()) throw new Error(`Attività ${i + 1}: manca il nome.`)
      })
      await api.aggiornaContenuti(ing.documento.id, { attivitaMmc: voci })
      setModificato(false)
      await aggiorna()
    }, 'Attività salvate')

  return (
    <Sezione
      titolo="Attività con movimentazione manuale dei carichi (capitoli 4 e 6)"
      azioni={
        <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
          Salva attività
        </Bottone>
      }
    >
      <p style={stili.nota}>
        Per ogni attività scegli il metodo: NIOSH per i sollevamenti (composto se nello stesso turno ci sono sollevamenti diversi), Snook e Ciriello per trasporto, spinta e traino, check list OCRA per i movimenti ripetitivi. Le mansioni senza attività risultano non esposte.
      </p>
      {voci.map((a, i) => (
        <EditorAttivita
          key={a.id}
          a={a}
          ing={ing}
          cambia={(p) => imposta(voci.map((x, j) => (j === i ? { ...x, ...p } : x)))}
          togli={() => imposta(voci.filter((_, j) => j !== i))}
        />
      ))}
      <div style={stili.riga}>
        <select aria-label="Metodo della nuova attività" style={stili.input} value={metodoNuova} onChange={(e) => setMetodoNuova(e.target.value as MetodoMmc)}>
          {Object.entries(ETICHETTE_METODO).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <Bottone onClick={() => imposta([...voci, nuovaAttivita(metodoNuova)])}>+ Attività</Bottone>
        <Bottone disabled={importabili.length === 0} onClick={() => imposta([...voci, ...importabili])} title="Misure MMC e OCRA delle campagne scelte">
          Importa dalle misure ({importabili.length})
        </Bottone>
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- riepilogo

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati } = useMemo(() => datiMmcDaDatabase(ing), [ing])
  const v = useMemo(() => valutaDvrMmc(dati.mansioni, dati.attivita), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [!ing.documento.data_emissione && 'data di emissione', dati.attivita.length === 0 && 'attività valutate'].filter(Boolean)

  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrMmc(ing.documento.cantiere_id, ing.documento.id)
      saveBlob(r.blob, r.nomeFile)
    }, 'DVR generato')
    setGenerando(false)
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
        message={`Ci sono ${errori.length} errori (in rosso): le attività con errori non compaiono nel documento.`}
        confirmLabel="Genera bozza"
        onCancel={() => setConferma(false)}
        onConfirm={() => void genera()}
      />
      {mancanti.length > 0 && <p style={stili.attenzione}>Mancano: {mancanti.join(', ')}.</p>}
      {v.avvisi.map((a, i) => (
        <p key={i} style={a.livello === 'errore' ? stili.avviso : stili.attenzione}>
          {a.attivita ? <b>{a.attivita}: </b> : null}
          {a.messaggio}
        </p>
      ))}
      <table style={{ ...stili.tabella, marginTop: 8 }}>
        <thead>
          <tr>
            {['Mansione', 'Attività', 'Adulti (18–45)', 'Giovani / over 45'].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.perMansione.map((m) => (
            <tr key={m.mansione.id}>
              <td style={stili.td}>{m.mansione.nome}</td>
              <td style={stili.td}>{m.esiti.length ? m.esiti.map((e) => e.attivita.titolo).join(', ') : <span style={{ color: 'var(--text-tertiary)' }}>non esposta</span>}</td>
              {(['adulti', 'anziani'] as const).map((k) => (
                <td key={k} style={{ ...stili.td, color: COLORE[m.livello[k]], fontWeight: m.livello[k] >= 1 ? 600 : 400 }}>
                  {m.esiti.length ? ETICHETTE_LIVELLO[m.livello[k]] : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Sezione>
  )
}

export default function EditorDvrMmc() {
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
          <h1 style={stili.titolo}>DVR Movimentazione manuale dei carichi {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, Titolo VI – UNI ISO 11228-1, -2, -3</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA_MMC} etichettaCampagne="MMC e movimenti ripetitivi (OCRA)" conTarature={false} />
          <Attivita key={`att-${q.data.documento.updated_at}`} ing={q.data} aggiorna={aggiorna} />
          <CicloLavoro ing={q.data} aggiorna={aggiorna} titolo="Ciclo lavorativo (capitolo 4.1)" />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
