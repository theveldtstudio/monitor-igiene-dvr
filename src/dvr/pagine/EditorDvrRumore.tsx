/**
 * Redazione del DVR Rumore: dati del documento, matrice dei tempi per mansione,
 * dati accessori (impulsività, segnali di avvertimento), testi e generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { formattaIt } from '../comune/numeri'
import { valutaMansione, type Fascia } from '../rumore/calcolo'
import { controllaDpi } from '../rumore/dpi'
import { datiDaDatabase, periodoDaRiga, rilievoDaMisura } from '../rumore/daDatabase'
import type { RilievoRumore } from '../rumore/documento'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { generaDvrRumore } from '../rumore/generaDvrRumore'
import { DatiDocumento, Revisioni } from './comuni'
import { esegui } from '../ui/esegui'
import { cicloPredefinito, PIANO_INTRO, PIANO_PUNTI, zonizzazionePredefinita } from '../rumore/testiPredefiniti'
import { valutaDvrRumore } from '../rumore/valutazione'
import { AreaTesto, Bottone, Sezione } from '../ui/Kit'
import { numeroDa, stili } from '../ui/stili'


const COLORE_FASCIA: Record<Fascia, string> = { 1: '#067647', 2: '#b54708', 3: '#b42318' }


// ---------------------------------------------------------------- matrice dei tempi

interface RigaLocale {
  id?: string
  minuti: string
  origine: api.RigaTempi['origine']
  misura_id: string | null
  fase: string
  postazione: string
  macchine: string
  laeq: string
  lceq: string
  lpeak: string
}

const daRiga = (r: api.RigaTempi): RigaLocale => ({
  id: r.id,
  minuti: String(r.minuti),
  origine: r.origine,
  misura_id: r.misura_id,
  fase: r.fase,
  postazione: r.postazione ?? '',
  macchine: r.macchine ?? '',
  laeq: r.valori.laeq != null ? String(r.valori.laeq) : '',
  lceq: r.valori.lceq != null ? String(r.valori.lceq) : '',
  lpeak: r.valori.lpeak != null ? String(r.valori.lpeak) : '',
})

function versoRiga(r: RigaLocale, documentoId: string, mansioneId: string, ordine: number, rilievi: Map<string, RilievoRumore & { misuraId: string }>): api.RigaTempi {
  const ril = r.misura_id ? rilievi.get(r.misura_id) : undefined
  return {
    id: r.id ?? '',
    documento_id: documentoId,
    mansione_id: mansioneId,
    ordine,
    minuti: Number(r.minuti) || 0,
    origine: r.origine,
    misura_id: r.origine === 'misura' ? r.misura_id : null,
    fase: r.origine === 'misura' ? (ril?.fase ?? r.fase) : r.fase,
    postazione: r.origine === 'misura' ? (ril?.postazione ?? r.postazione) : r.postazione,
    macchine: r.origine === 'misura' ? (ril?.macchine ?? r.macchine) : r.macchine || null,
    valori: r.origine === 'misura' ? {} : { laeq: numeroDa(r.laeq) ?? undefined, lceq: numeroDa(r.lceq), lpeak: numeroDa(r.lpeak) },
    nota: null,
  }
}

const PAUSA: RigaLocale = { minuti: '15', origine: 'convenzionale', misura_id: null, fase: 'Pausa fisiologica', postazione: '', macchine: '', laeq: '65', lceq: '', lpeak: '' }

function EditorMansione({
  ing,
  dm,
  rilievi,
  aggiorna,
}: {
  ing: Ingresso
  dm: api.DocumentoMansione
  rilievi: Map<string, RilievoRumore & { misuraId: string }>
  aggiorna: () => Promise<void>
}) {
  const mansione = ing.mansioni.find((m) => m.id === dm.mansione_id)
  const salvate = ing.tempi.filter((t) => t.mansione_id === dm.mansione_id).sort((a, b) => a.ordine - b.ordine)
  const [righe, setRighe] = useState<RigaLocale[]>(salvate.map(daRiga))
  const [flag, setFlag] = useState(dm.dati ?? {})
  const [modificata, setModificata] = useState(false)

  const periodi = righe
    .map((r, i) => periodoDaRiga(versoRiga(r, dm.documento_id, dm.mansione_id, i, rilievi), rilievi))
    .filter((p): p is NonNullable<typeof p> => p !== null)
  const esito = periodi.length ? valutaMansione(periodi) : null

  const cambia = (i: number, patch: Partial<RigaLocale>) => {
    setRighe(righe.map((r, j) => (j === i ? { ...r, ...patch } : r)))
    setModificata(true)
  }

  const salva = () =>
    esegui(async () => {
      const nuove = righe.map((r, i) => {
        const { id: _id, ...resto } = versoRiga(r, dm.documento_id, dm.mansione_id, i, rilievi)
        void _id
        if (!(resto.minuti > 0)) throw new Error(`Riga ${i + 1}: mancano i minuti.`)
        if (resto.origine === 'misura' && !resto.misura_id) throw new Error(`Riga ${i + 1}: scegli la misura.`)
        if (resto.origine !== 'misura' && (!resto.fase || resto.valori.laeq === undefined)) throw new Error(`Riga ${i + 1}: servono fase e LAeq.`)
        return resto
      })
      const salvateOra = await api.sostituisciTempi(dm.documento_id, dm.mansione_id, nuove)
      setRighe(salvateOra.map(daRiga))
      await api.salvaDocumentoMansione({ ...dm, dati: flag })
      setModificata(false)
      await aggiorna()
    }, `Salvata: ${mansione?.nome ?? ''}`)

  const totale = righe.reduce((s, r) => s + (Number(r.minuti) || 0), 0)

  return (
    <div role="group" aria-label={mansione?.nome ?? 'mansione'} style={{ ...stili.sezione, background: 'var(--bg-app)' }}>
      <div style={{ ...stili.riga, justifyContent: 'space-between' }}>
        <div>
          <b style={{ fontSize: 14 }}>{mansione?.nome ?? '(mansione eliminata)'}</b>
          {mansione && !mansione.attiva && <span style={{ ...stili.nota, marginLeft: 8 }}>(disattivata)</span>}
        </div>
        <div style={{ ...stili.riga, fontSize: 13 }}>
          <span style={{ color: totale === 480 ? 'var(--text-secondary)' : '#b42318' }}>{totale} / 480 min</span>
          {esito && (
            <span style={{ fontWeight: 600, color: COLORE_FASCIA[esito.fascia] }}>
              LEX {formattaIt(esito.lexArrotondato)} ± {formattaIt(esito.incertezza)} dB(A) · picco {formattaIt(esito.piccoMax)} dB(C) · {esito.fascia}ª fascia
            </span>
          )}
        </div>
      </div>
      <table style={{ ...stili.tabella, marginTop: 6 }}>
        <thead>
          <tr>
            {['Min', 'Origine', 'Misura / fase', 'Postazione', 'LAeq', 'LCeq', 'Lpeak', ''].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => {
            const ril = r.misura_id ? rilievi.get(r.misura_id) : undefined
            return (
              <tr key={i}>
                <td style={stili.td}>
                  <input inputMode="numeric" style={{ ...stili.input, width: 56 }} value={r.minuti} onChange={(e) => cambia(i, { minuti: e.target.value })} />
                </td>
                <td style={stili.td}>
                  <select style={stili.input} value={r.origine} onChange={(e) => cambia(i, { origine: e.target.value as RigaLocale['origine'] })}>
                    <option value="misura">Misura</option>
                    <option value="storico">Dato storico</option>
                    <option value="convenzionale">Convenzionale</option>
                  </select>
                </td>
                {r.origine === 'misura' ? (
                  <>
                    <td style={stili.td} colSpan={2}>
                      <select style={{ ...stili.input, width: '100%' }} value={r.misura_id ?? ''} onChange={(e) => cambia(i, { misura_id: e.target.value || null })}>
                        <option value="">— scegli la misura —</option>
                        {[...rilievi.values()].map((x) => (
                          <option key={x.misuraId} value={x.misuraId}>
                            {x.codice}. {x.fase} – {x.postazione} ({formattaIt(x.laeq)} dB(A))
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={stili.td}>{formattaIt(ril?.laeq)}</td>
                    <td style={stili.td}>{formattaIt(ril?.lceq)}</td>
                    <td style={stili.td}>{formattaIt(ril?.lpeak)}</td>
                  </>
                ) : (
                  <>
                    <td style={stili.td}>
                      <input style={{ ...stili.input, width: '100%' }} value={r.fase} placeholder="Fase" onChange={(e) => cambia(i, { fase: e.target.value })} />
                    </td>
                    <td style={stili.td}>
                      <input style={{ ...stili.input, width: '100%' }} value={r.postazione} placeholder="Postazione" onChange={(e) => cambia(i, { postazione: e.target.value })} />
                    </td>
                    {(['laeq', 'lceq', 'lpeak'] as const).map((k) => (
                      <td key={k} style={stili.td}>
                        <input inputMode="decimal" style={{ ...stili.input, width: 64 }} value={r[k]} onChange={(e) => cambia(i, { [k]: e.target.value })} />
                      </td>
                    ))}
                  </>
                )}
                <td style={stili.td}>
                  <Bottone tipo="pericolo" onClick={() => { setRighe(righe.filter((_, j) => j !== i)); setModificata(true) }}>
                    ✕
                  </Bottone>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{ ...stili.riga, marginTop: 8, justifyContent: 'space-between' }}>
        <div style={stili.riga}>
          <Bottone onClick={() => { setRighe([...righe, { ...PAUSA, minuti: '', fase: '', laeq: '', origine: 'misura' }]); setModificata(true) }}>+ Riga</Bottone>
          <Bottone onClick={() => { setRighe([...righe, PAUSA]); setModificata(true) }}>+ Pausa 15 min (65 dB)</Bottone>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" checked={Boolean(flag.vibrazioni)} onChange={(e) => { setFlag({ ...flag, vibrazioni: e.target.checked }); setModificata(true) }} /> Esposto a vibrazioni
          </label>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" checked={Boolean(flag.ototossiche)} onChange={(e) => { setFlag({ ...flag, ototossiche: e.target.checked }); setModificata(true) }} /> Sostanze ototossiche
          </label>
        </div>
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
    </div>
  )
}

function MatriceTempi({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const rilievi = useMemo(() => {
    const m = new Map<string, RilievoRumore & { misuraId: string }>()
    ing.misure.forEach((x) => {
      const r = rilievoDaMisura(x)
      if (r) m.set(x.misura.id, { ...r, misuraId: x.misura.id })
    })
    return m
  }, [ing.misure])
  const incluse = new Set(ing.documentoMansioni.map((d) => d.mansione_id))
  const aggiungibili = ing.mansioni.filter((m) => m.attiva && !incluse.has(m.id))
  const [daAggiungere, setDaAggiungere] = useState('')

  return (
    <Sezione titolo="Matrice dei tempi (una giornata tipo di 480 minuti per mansione)">
      {rilievi.size === 0 && <p style={stili.attenzione}>Nessuna misura di rumore nelle campagne scelte: seleziona le campagne nei dati del documento.</p>}
      {[...ing.documentoMansioni]
        .sort((a, b) => a.ordine - b.ordine)
        .map((dm) => (
          <EditorMansione key={dm.mansione_id} ing={ing} dm={dm} rilievi={rilievi} aggiorna={aggiorna} />
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

// ---------------------------------------------------------------- contenuti accessori e testi

function Contenuti({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const doc = ing.documento
  const tipi = ing.ambiti.filter((a) => doc.ambiti_ids.includes(a.id)).map((a) => a.tipo)
  const [c, setC] = useState<api.ContenutiRumore>(doc.contenuti ?? {})
  const ciclo = c.ciclo ?? (cicloPredefinito(tipi).length ? cicloPredefinito(tipi) : [{ testo: '', punti: [] }])
  const salva = () =>
    esegui(async () => {
      const { logoCliente: _l, ...resto } = c
      void _l
      await api.aggiornaContenuti(doc.id, { ...resto, ciclo: c.ciclo ?? null })
      await aggiorna()
    }, 'Salvato')

  const impulsivi = c.impulsivi ?? []
  const segnali = c.segnali ?? []

  return (
    <>
      <Sezione titolo="Eventi impulsivi e segnali di avvertimento" chiusa azioni={<Bottone tipo="primario" onClick={() => void salva()}>Salva</Bottone>}>
        <p style={stili.nota}>Eventi impulsivi rilevati (zona, sorgente, Lpeak in dB(C)):</p>
        {impulsivi.map((x, i) => (
          <div key={i} style={{ ...stili.riga, marginBottom: 6 }}>
            <input style={stili.input} value={x.zona} placeholder="Zona" onChange={(e) => setC({ ...c, impulsivi: impulsivi.map((y, j) => (j === i ? { ...y, zona: e.target.value } : y)) })} />
            <input style={stili.input} value={x.componente} placeholder="Sorgente" onChange={(e) => setC({ ...c, impulsivi: impulsivi.map((y, j) => (j === i ? { ...y, componente: e.target.value } : y)) })} />
            <input inputMode="decimal" style={{ ...stili.input, width: 80 }} value={x.lpeak || ''} placeholder="Lpeak" onChange={(e) => setC({ ...c, impulsivi: impulsivi.map((y, j) => (j === i ? { ...y, lpeak: numeroDa(e.target.value) ?? 0 } : y)) })} />
            <Bottone tipo="pericolo" onClick={() => setC({ ...c, impulsivi: impulsivi.filter((_, j) => j !== i) })}>✕</Bottone>
          </div>
        ))}
        <Bottone onClick={() => setC({ ...c, impulsivi: [...impulsivi, { zona: '', componente: '', lpeak: 0 }] })}>+ Evento impulsivo</Bottone>

        <p style={{ ...stili.nota, marginTop: 14 }}>Misure sui segnali di avvertimento (fase, sorgente, rumore ambiente e segnale in dB(A)):</p>
        {segnali.map((x, i) => (
          <div key={i} style={{ ...stili.riga, marginBottom: 6 }}>
            <input style={stili.input} value={x.fase} placeholder="Fase" onChange={(e) => setC({ ...c, segnali: segnali.map((y, j) => (j === i ? { ...y, fase: e.target.value } : y)) })} />
            <input style={{ ...stili.input, minWidth: 260 }} value={x.sorgente} placeholder="es. del cicalino di retromarcia della mini-pala" onChange={(e) => setC({ ...c, segnali: segnali.map((y, j) => (j === i ? { ...y, sorgente: e.target.value } : y)) })} />
            <input inputMode="decimal" style={{ ...stili.input, width: 80 }} value={x.ambiente || ''} placeholder="Ambiente" onChange={(e) => setC({ ...c, segnali: segnali.map((y, j) => (j === i ? { ...y, ambiente: numeroDa(e.target.value) ?? 0 } : y)) })} />
            <input inputMode="decimal" style={{ ...stili.input, width: 80 }} value={x.segnale || ''} placeholder="Segnale" onChange={(e) => setC({ ...c, segnali: segnali.map((y, j) => (j === i ? { ...y, segnale: numeroDa(e.target.value) ?? 0 } : y)) })} />
            <Bottone tipo="pericolo" onClick={() => setC({ ...c, segnali: segnali.filter((_, j) => j !== i) })}>✕</Bottone>
          </div>
        ))}
        <Bottone onClick={() => setC({ ...c, segnali: [...segnali, { fase: '', sorgente: '', ambiente: 0, segnale: 0 }] })}>+ Segnale</Bottone>
      </Sezione>

      <Sezione titolo="Testi del documento" chiusa azioni={<Bottone tipo="primario" onClick={() => void salva()}>Salva testi</Bottone>}>
        <p style={stili.nota}>Partono dai testi predefiniti per il tipo di ambito; qui li adatti al cantiere.</p>
        {ciclo.map((b, i) => (
          <div key={i} style={{ ...stili.griglia, gridTemplateColumns: '1fr 1fr', marginBottom: 10 }}>
            <AreaTesto etichetta={`Ciclo di lavoro – paragrafo ${i + 1}`} valore={b.testo} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, testo: v } : x)) })} righe={5} />
            <AreaTesto etichetta="Elenco puntato (una voce per riga)" valore={b.punti.join('\n')} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, punti: v.split('\n').filter((y) => y.trim()) } : x)) })} righe={5} />
          </div>
        ))}
        <div style={stili.riga}>
          <Bottone onClick={() => setC({ ...c, ciclo: [...ciclo, { testo: '', punti: [] }] })}>+ Paragrafo</Bottone>
          {c.ciclo && <Bottone onClick={() => setC({ ...c, ciclo: undefined })}>Ripristina ciclo predefinito</Bottone>}
        </div>
        <div style={{ marginTop: 10 }}>
          <AreaTesto
            etichetta="Zonizzazione del rumore (vuota = capitolo omesso)"
            valore={c.zonizzazione ?? zonizzazionePredefinita(tipi) ?? ''}
            onChange={(v) => setC({ ...c, zonizzazione: v })}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <AreaTesto etichetta="Piano di contenimento – introduzione" valore={c.pianoIntro ?? PIANO_INTRO} onChange={(v) => setC({ ...c, pianoIntro: v })} righe={3} />
        </div>
        <div style={{ marginTop: 10 }}>
          <AreaTesto
            etichetta="Piano di contenimento – misure (una per riga; con mansioni in 3ª fascia si aggiunge la segnalazione delle aree)"
            valore={(c.pianoPunti ?? PIANO_PUNTI).join('\n')}
            onChange={(v) => setC({ ...c, pianoPunti: v.split('\n').filter((y) => y.trim()) })}
            righe={10}
          />
        </div>
      </Sezione>
    </>
  )
}

// ---------------------------------------------------------------- riepilogo e generazione

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const { dati, righeScartate } = useMemo(() => datiDaDatabase(ing), [ing])
  const v = useMemo(() => valutaDvrRumore({ mansioni: dati.mansioni, dpi: dati.dpi, opzioni: dati.opzioni }), [dati])
  const avvisiDpi = dati.dpi.flatMap(controllaDpi)
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [
    !ing.documento.periodo_riferimento && 'periodo di riferimento',
    !ing.documento.data_emissione && 'data di emissione',
    dati.dpi.length === 0 && 'DPI per l’udito',
    dati.tarature.length === 0 && 'tarature degli strumenti',
  ].filter(Boolean)

  const [confermaBozza, setConfermaBozza] = useState(false)
  const genera = async () => {
    setConfermaBozza(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrRumore(ing.documento.cantiere_id, ing.documento.id)
      saveBlob(r.blob, r.nomeFile)
    }, 'DVR generato')
    setGenerando(false)
  }

  return (
    <Sezione
      titolo="Riepilogo e controlli"
      azioni={
        <Bottone
          tipo="primario"
          disabled={generando || v.esiti.length === 0}
          onClick={() => (errori.length || righeScartate.length ? setConfermaBozza(true) : void genera())}
        >
          {generando ? 'Generazione…' : 'Genera DVR Word'}
        </Bottone>
      }
    >
      <ConfirmDialog
        open={confermaBozza}
        title="Generare comunque?"
        message={`Ci sono ${errori.length + righeScartate.length} errori (in rosso): il documento andrà usato solo come bozza finché non li correggi.`}
        confirmLabel="Genera bozza"
        onCancel={() => setConfermaBozza(false)}
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
      {[...v.avvisi.filter((a) => a.livello === 'attenzione').map((a) => (a.mansione ? `${a.mansione}: ${a.messaggio}` : a.messaggio)), ...avvisiDpi].map((m, i) => (
        <p key={`a${i}`} style={stili.attenzione}>
          {m}
        </p>
      ))}
      <table style={{ ...stili.tabella, marginTop: 8 }}>
        <thead>
          <tr>
            {['Mansione', 'LEX,8h dB(A)', 'Picco dB(C)', 'Fascia', 'Con DPI dB(A)'].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.esiti.map((e) =>
            e.mansione.periodi.length === 0 ? (
              <tr key={e.mansione.id}>
                <td style={stili.td}>{e.mansione.nome}</td>
                <td style={{ ...stili.td, color: 'var(--text-tertiary)' }} colSpan={4}>
                  nessun tempo inserito
                </td>
              </tr>
            ) : (
            <tr key={e.mansione.id}>
              <td style={stili.td}>{e.mansione.nome}</td>
              <td style={stili.td}>
                {formattaIt(e.lexArrotondato)} ± {formattaIt(e.incertezza)}
              </td>
              <td style={stili.td}>{formattaIt(e.piccoMax)}</td>
              <td style={{ ...stili.td, fontWeight: 600, color: COLORE_FASCIA[e.fascia] }}>{e.fascia}ª</td>
              <td style={stili.td}>{e.lexConDpi.map((x) => formattaIt(x)).join(' / ')}</td>
            </tr>
            ),
          )}
        </tbody>
      </table>
    </Sezione>
  )
}

export default function EditorDvrRumore() {
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
          <h1 style={stili.titolo}>DVR Rumore {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, Titolo VIII Capo II – UNI EN ISO 9612</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={['rumore']} etichettaCampagne="rumore" />
          <MatriceTempi ing={q.data} aggiorna={aggiorna} />
          <Contenuti ing={q.data} aggiorna={aggiorna} />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
