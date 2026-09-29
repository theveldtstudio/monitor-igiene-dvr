/**
 * Redazione del DVR Posture incongrue (metodo OWAS): catalogo delle attività con le posture,
 * giornate tipo per mansione, testi, revisioni e generazione del Word.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { BracciaCode, CaricoCode, GambeCode, SchienaCode } from '../../data/owasLookup'
import { humanizeError } from '../../lib/humanizeError'
import { saveBlob } from '../../lib/saveBlob'
import * as api from '../api'
import { caricaIngresso, type Ingresso } from '../comune/ingresso'
import { eGalleria } from '../comune/tipi'
import {
  classeOwas,
  DESCRIZIONI_OWAS,
  FASCE_POSTURE,
  valutaMansionePosture,
  type ClasseOwas,
  type CodiceOwas,
  type FasciaPosture,
} from '../posture/calcolo'
import {
  catalogoDaMisure,
  datiPostureDaDatabase,
  GIORNATA_PREDEFINITA,
  GIORNATA_RILIEVI,
  giornateDaTempi,
  misureOwas,
  TIPI_CAMPAGNA_POSTURE,
  type MisuraOwas,
} from '../posture/daDatabase'
import { generaDvrPosture } from '../posture/generaDvrPosture'
import { valutaDvrPosture, type AttivitaCatalogo } from '../posture/valutazione'
import { CICLO_PREDEFINITO } from '../rumore/testiPredefiniti'
import { AreaTesto, Bottone, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { stili } from '../ui/stili'
import { DatiDocumento, Revisioni } from './comuni'

const COLORE_FASCIA: Record<FasciaPosture, string> = { 0: 'var(--text-tertiary)', 1: '#067647', 2: '#b54708', 3: '#b42318' }
const COLORE_CLASSE: Record<ClasseOwas, string> = { 1: '#067647', 2: '#a16207', 3: '#b54708', 4: '#b42318' }
const indice = (x: number) => x.toFixed(1).replace('.', ',')

// ---------------------------------------------------------------- catalogo delle attività

function SceltaCodice<T extends number>({ valore, opzioni, onChange, etichetta }: { valore: T; opzioni: Record<number, string>; onChange: (v: T) => void; etichetta: string }) {
  return (
    <select aria-label={etichetta} title={opzioni[valore]} style={{ ...stili.input, width: 58 }} value={valore} onChange={(e) => onChange(Number(e.target.value) as T)}>
      {Object.entries(opzioni).map(([k, v]) => (
        <option key={k} value={k}>
          {k} – {v}
        </option>
      ))}
    </select>
  )
}

function Catalogo({ ing, misure, aggiorna }: { ing: Ingresso; misure: MisuraOwas[]; aggiorna: () => Promise<void> }) {
  const [voci, setVoci] = useState<AttivitaCatalogo[]>(ing.documento.contenuti.catalogoPosture ?? [])
  const [modificato, setModificato] = useState(false)
  const imposta = (v: AttivitaCatalogo[]) => {
    setVoci(v)
    setModificato(true)
  }
  const cambia = (i: number, patch: Partial<AttivitaCatalogo>) => imposta(voci.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const cambiaPostura = (i: number, k: number, patch: Partial<CodiceOwas>) =>
    cambia(i, { posture: voci[i].posture.map((p, j) => (j === k ? { ...p, ...patch } : p)) })
  const ultimoGruppo = voci[voci.length - 1]?.gruppo ?? ''

  const importa = () => {
    const presenti = new Set(voci.map((v) => v.attivita.trim().toLowerCase()))
    const nuove = catalogoDaMisure(misure).filter((a) => !presenti.has(a.attivita.trim().toLowerCase()))
    if (!nuove.length) return
    imposta([...voci, ...nuove])
  }

  const salva = () =>
    esegui(async () => {
      voci.forEach((v, i) => {
        if (!v.attivita.trim()) throw new Error(`Attività ${i + 1}: manca il nome.`)
      })
      await api.aggiornaContenuti(ing.documento.id, { catalogoPosture: voci })
      setModificato(false)
      await aggiorna()
    }, 'Catalogo salvato')

  return (
    <Sezione
      titolo="Catalogo delle attività e posture OWAS (capitoli 5 e 6)"
      chiusa={voci.length > 0}
      azioni={
        <Bottone tipo="primario" disabled={!modificato} onClick={() => void salva()}>
          Salva catalogo
        </Bottone>
      }
    >
      <p style={stili.nota}>
        Ogni attività che può comportare posture incongrue, raggruppata per tabella (es. “Consolidamento del fronte”). Per ogni postura osservata indica i codici OWAS: la classe si calcola dalla tabella standard.
      </p>
      {voci.map((v, i) => (
        <div key={i} role="group" aria-label={`Attività ${v.attivita || i + 1}`} style={{ ...stili.sezione, background: 'var(--bg-app)', marginBottom: 8 }}>
          <div style={{ ...stili.griglia, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            <label style={stili.campo}>
              Tabella / gruppo
              <input style={stili.input} value={v.gruppo} onChange={(e) => cambia(i, { gruppo: e.target.value })} />
            </label>
            <label style={stili.campo}>
              Fase lavorativa
              <input style={stili.input} value={v.fase} onChange={(e) => cambia(i, { fase: e.target.value })} />
            </label>
            <label style={stili.campo}>
              Attività
              <input style={stili.input} value={v.attivita} onChange={(e) => cambia(i, { attivita: e.target.value })} />
            </label>
            <label style={stili.campo}>
              Mansioni coinvolte
              <input style={stili.input} value={v.mansioni} onChange={(e) => cambia(i, { mansioni: e.target.value })} />
            </label>
            <label style={stili.campo}>
              Rischio ergonomico
              <input style={stili.input} value={v.rischio ?? ''} placeholder="Posture incongrue" onChange={(e) => cambia(i, { rischio: e.target.value })} />
            </label>
          </div>
          <label style={{ ...stili.campo, marginTop: 8 }}>
            Descrizione sintetica della postura
            <textarea style={{ ...stili.input, minHeight: 44 }} value={v.descrizione} onChange={(e) => cambia(i, { descrizione: e.target.value })} />
          </label>
          <div style={{ marginTop: 8 }}>
            {v.posture.map((p, k) => {
              const c = classeOwas(p)
              return (
                <div key={k} style={{ ...stili.riga, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 64 }}>Postura {k + 1}</span>
                  <SceltaCodice<SchienaCode> etichetta="Schiena" valore={p.schiena} opzioni={DESCRIZIONI_OWAS.schiena} onChange={(x) => cambiaPostura(i, k, { schiena: x })} />
                  <SceltaCodice<BracciaCode> etichetta="Braccia" valore={p.braccia} opzioni={DESCRIZIONI_OWAS.braccia} onChange={(x) => cambiaPostura(i, k, { braccia: x })} />
                  <SceltaCodice<GambeCode> etichetta="Gambe" valore={p.gambe} opzioni={DESCRIZIONI_OWAS.gambe} onChange={(x) => cambiaPostura(i, k, { gambe: x })} />
                  <SceltaCodice<CaricoCode> etichetta="Carico" valore={p.carico} opzioni={DESCRIZIONI_OWAS.carico} onChange={(x) => cambiaPostura(i, k, { carico: x })} />
                  <b style={{ color: COLORE_CLASSE[c], fontSize: 13 }}>classe {c}</b>
                  <Bottone tipo="pericolo" onClick={() => cambia(i, { posture: v.posture.filter((_, j) => j !== k) })}>
                    ✕
                  </Bottone>
                </div>
              )
            })}
          </div>
          <div style={{ ...stili.riga, marginTop: 6 }}>
            <Bottone onClick={() => cambia(i, { posture: [...v.posture, { schiena: 1, braccia: 1, gambe: 2, carico: 1 }] })}>+ Postura</Bottone>
            <Bottone tipo="pericolo" onClick={() => imposta(voci.filter((_, j) => j !== i))}>
              Togli attività
            </Bottone>
          </div>
        </div>
      ))}
      <div style={stili.riga}>
        <Bottone onClick={() => imposta([...voci, { gruppo: ultimoGruppo, fase: '', attivita: '', descrizione: '', mansioni: '', posture: [{ schiena: 1, braccia: 1, gambe: 2, carico: 1 }] }])}>
          + Attività
        </Bottone>
        <Bottone disabled={misure.length === 0} onClick={importa} title="Aggiunge le attività delle misure OWAS delle campagne scelte">
          Importa dalle misure OWAS ({misure.length})
        </Bottone>
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- giornate tipo per mansione

interface RigaLocale {
  giornata: string
  fase: string
  attivita: string
  minuti: string
  /** '0' = ripartita sulle quattro classi */
  classe: '0' | '1' | '2' | '3' | '4'
  origine: api.RigaTempi['origine']
  misuraId: string | null
}

const daRiga = (r: api.RigaTempi): RigaLocale => ({
  giornata: r.valori.giornata ?? GIORNATA_PREDEFINITA,
  fase: r.fase,
  attivita: r.valori.attivita ?? '',
  minuti: String(r.minuti),
  classe: String(r.valori.classe ?? 1) as RigaLocale['classe'],
  origine: r.origine,
  misuraId: r.misura_id,
})

const versoRiga = (r: RigaLocale, dm: api.DocumentoMansione, ordine: number): Omit<api.RigaTempi, 'id'> => ({
  documento_id: dm.documento_id,
  mansione_id: dm.mansione_id,
  ordine,
  minuti: Number(r.minuti) || 0,
  fase: r.fase.trim(),
  postazione: null,
  macchine: null,
  origine: r.origine,
  misura_id: r.misuraId,
  valori: { giornata: r.giornata.trim() || GIORNATA_PREDEFINITA, attivita: r.attivita.trim(), classe: Number(r.classe) as 0 | 1 | 2 | 3 | 4 },
  nota: null,
})

const nuovaRiga = (giornata: string, p: Partial<RigaLocale> = {}): RigaLocale => ({
  giornata,
  fase: '',
  attivita: '',
  minuti: '',
  classe: '1',
  origine: 'convenzionale',
  misuraId: null,
  ...p,
})

function EditorMansionePosture({
  ing,
  dm,
  catalogo,
  misure,
  aggiorna,
}: {
  ing: Ingresso
  dm: api.DocumentoMansione
  catalogo: AttivitaCatalogo[]
  misure: MisuraOwas[]
  aggiorna: () => Promise<void>
}) {
  const mansione = ing.mansioni.find((m) => m.id === dm.mansione_id)
  const [righe, setRighe] = useState<RigaLocale[]>(ing.tempi.filter((t) => t.mansione_id === dm.mansione_id).sort((a, b) => a.ordine - b.ordine).map(daRiga))
  const [modificata, setModificata] = useState(false)
  const [copiaDa, setCopiaDa] = useState('')
  const imposta = (r: RigaLocale[]) => {
    setRighe(r)
    setModificata(true)
  }
  const cambia = (i: number, patch: Partial<RigaLocale>) => imposta(righe.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const giornate = [...new Set(righe.map((r) => r.giornata))]
  const perMisura = useMemo(() => new Map(misure.map((m) => [m.misuraId, m])), [misure])
  const esito = valutaMansionePosture(giornateDaTempi(righe.map((r, k) => ({ ...versoRiga(r, dm, k), id: String(k) })), perMisura).giornate)
  const esitoGiornata = (g: string) => esito.giornate.find((x) => x.titolo === (g.trim() || GIORNATA_PREDEFINITA))

  /** scegliendo un'attività del catalogo si propone la classe più alta delle sue posture */
  const scegliAttivita = (i: number, testo: string) => {
    const a = catalogo.find((x) => x.attivita.trim().toLowerCase() === testo.trim().toLowerCase())
    if (!a) return cambia(i, { attivita: testo })
    const classe = a.posture.length ? String(Math.max(...a.posture.map(classeOwas))) : righe[i].classe
    cambia(i, { attivita: a.attivita, fase: righe[i].fase || a.fase, classe: classe as RigaLocale['classe'] })
  }

  const importaMisure = () => {
    const nome = (mansione?.nome ?? '').trim().toLowerCase()
    const gia = new Set(righe.map((r) => r.misuraId).filter(Boolean))
    const nuove = misure
      .filter((m) => m.mansione.trim().toLowerCase() === nome && m.minuti && !gia.has(m.misuraId))
      .map((m) => nuovaRiga(GIORNATA_RILIEVI, { fase: m.attivita, attivita: m.note || m.attivita, minuti: String(m.minuti), classe: String(m.classe) as RigaLocale['classe'], origine: 'misura', misuraId: m.misuraId }))
    if (nuove.length) imposta([...righe, ...nuove])
  }

  const copia = () => {
    const da = ing.tempi.filter((t) => t.mansione_id === copiaDa).sort((a, b) => a.ordine - b.ordine).map(daRiga)
    imposta([...righe, ...da])
    setCopiaDa('')
  }

  const salva = () =>
    esegui(async () => {
      const nuove = righe.map((r, i) => {
        if (!(Number(r.minuti) > 0)) throw new Error(`Riga ${i + 1}: mancano i minuti.`)
        if (!r.fase.trim()) throw new Error(`Riga ${i + 1}: manca la fase lavorativa.`)
        return versoRiga(r, dm, i)
      })
      const salvate = await api.sostituisciTempi(dm.documento_id, dm.mansione_id, nuove)
      setRighe(salvate.map(daRiga))
      setModificata(false)
      await aggiorna()
    }, `Salvata: ${mansione?.nome ?? ''}`)

  const altre = ing.documentoMansioni.filter((x) => x.mansione_id !== dm.mansione_id && ing.tempi.some((t) => t.mansione_id === x.mansione_id))
  const nomeMisure = (mansione?.nome ?? '').trim().toLowerCase()
  const importate = new Set(righe.map((r) => r.misuraId).filter(Boolean))
  const misureMansione = misure.filter((m) => m.mansione.trim().toLowerCase() === nomeMisure && m.minuti && !importate.has(m.misuraId)).length

  return (
    <div role="group" aria-label={mansione?.nome ?? 'mansione'} style={{ ...stili.sezione, background: 'var(--bg-app)' }}>
      <div style={{ ...stili.riga, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 14 }}>{mansione?.nome ?? '(mansione eliminata)'}</b>
        <div style={stili.riga}>
          {esito.peggiore && (
            <b style={{ color: COLORE_FASCIA[esito.fascia], fontSize: 13 }}>
              Indice {indice(esito.peggiore.indice)} · rischio {FASCE_POSTURE[esito.fascia].tipo.toLowerCase()}
            </b>
          )}
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
      <datalist id={`attivita-${dm.mansione_id}`}>
        {catalogo.map((a, k) => (
          <option key={k} value={a.attivita} />
        ))}
      </datalist>
      {giornate.map((g) => {
        const e = esitoGiornata(g)
        const indici = righe.map((r, i) => ({ r, i })).filter((x) => x.r.giornata === g)
        return (
          <div key={g} style={{ marginTop: 10 }}>
            <div style={{ ...stili.riga, justifyContent: 'space-between', fontSize: 13 }}>
              <input
                aria-label="Nome della giornata"
                style={{ ...stili.input, fontWeight: 600, width: 260 }}
                value={g}
                onChange={(ev) => imposta(righe.map((r) => (r.giornata === g ? { ...r, giornata: ev.target.value } : r)))}
              />
              {e && (
                <span>
                  <span style={{ color: e.minutiTotali === 480 ? 'var(--text-secondary)' : '#b42318' }}>{Math.round(e.minutiTotali * 100) / 100} / 480 min</span>{' '}
                  · classi 1–4: {e.frequenze.map((f) => `${indice(f)}%`).join(' · ')} · <b style={{ color: COLORE_FASCIA[e.fascia] }}>indice {indice(e.indice)}</b>
                </span>
              )}
            </div>
            <table style={{ ...stili.tabella, marginTop: 4 }}>
              <thead>
                <tr>
                  {['Fase lavorativa', 'Attività', 'Min', 'Classe', ''].map((h, k) => (
                    <th key={k} style={stili.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indici.map(({ r, i }) => (
                  <tr key={i}>
                    <td style={stili.td}>
                      <input style={{ ...stili.input, width: '100%' }} value={r.fase} placeholder="Fase" onChange={(ev) => cambia(i, { fase: ev.target.value })} />
                    </td>
                    <td style={stili.td}>
                      <input
                        list={`attivita-${dm.mansione_id}`}
                        style={{ ...stili.input, width: '100%' }}
                        value={r.attivita}
                        placeholder="Attività"
                        onChange={(ev) => scegliAttivita(i, ev.target.value)}
                      />
                    </td>
                    <td style={stili.td}>
                      <input inputMode="numeric" aria-label="Minuti" style={{ ...stili.input, width: 60 }} value={r.minuti} onChange={(ev) => cambia(i, { minuti: ev.target.value })} />
                    </td>
                    <td style={stili.td}>
                      {r.origine === 'misura' && r.misuraId && perMisura.has(r.misuraId) ? (
                        <span title="Classe calcolata dalla misura OWAS">{perMisura.get(r.misuraId)!.classe} (misura)</span>
                      ) : (
                        <select aria-label="Classe" style={stili.input} value={r.classe} onChange={(ev) => cambia(i, { classe: ev.target.value as RigaLocale['classe'] })}>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="0">ripartita 1–4</option>
                        </select>
                      )}
                    </td>
                    <td style={stili.td}>
                      <Bottone tipo="pericolo" onClick={() => imposta(righe.filter((_, j) => j !== i))}>
                        ✕
                      </Bottone>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ ...stili.riga, marginTop: 6 }}>
              <Bottone onClick={() => imposta([...righe, nuovaRiga(g)])}>+ Riga</Bottone>
              <Bottone
                onClick={() =>
                  imposta([
                    ...righe,
                    nuovaRiga(g, {
                      fase: 'Operazioni ordinarie',
                      attivita: 'Attività di vario genere difficilmente descrivibili e classificabili, ripartite in parti uguali nelle quattro classi di rischio',
                      classe: '0',
                    }),
                  ])
                }
              >
                + Operazioni ordinarie
              </Bottone>
              <Bottone onClick={() => imposta([...righe, nuovaRiga(g, { fase: 'Pause tecniche', attivita: 'Tempi di attesa', minuti: '30' }), nuovaRiga(g, { fase: 'Pausa fisiologica', attivita: '/', minuti: '15' })])}>
                + Pause
              </Bottone>
            </div>
          </div>
        )
      })}
      <div style={{ ...stili.riga, marginTop: 10 }}>
        <Bottone onClick={() => imposta([...righe, nuovaRiga(giornate.length ? `Giornata ${giornate.length + 1}` : GIORNATA_PREDEFINITA)])}>+ Giornata tipo</Bottone>
        <Bottone disabled={misureMansione === 0} onClick={importaMisure} title="Le misure OWAS con questa mansione e una durata">
          Importa dalle misure OWAS ({misureMansione})
        </Bottone>
        {altre.length > 0 && (
          <>
            <select aria-label="Copia le giornate da" style={stili.input} value={copiaDa} onChange={(e) => setCopiaDa(e.target.value)}>
              <option value="">— copia le giornate da —</option>
              {altre.map((x) => (
                <option key={x.mansione_id} value={x.mansione_id}>
                  {ing.mansioni.find((m) => m.id === x.mansione_id)?.nome}
                </option>
              ))}
            </select>
            <Bottone disabled={!copiaDa} onClick={copia}>
              Copia
            </Bottone>
          </>
        )}
      </div>
    </div>
  )
}

function Giornate({ ing, misure, aggiorna }: { ing: Ingresso; misure: MisuraOwas[]; aggiorna: () => Promise<void> }) {
  const incluse = new Set(ing.documentoMansioni.map((d) => d.mansione_id))
  const aggiungibili = ing.mansioni.filter((m) => m.attiva && !incluse.has(m.id))
  const [daAggiungere, setDaAggiungere] = useState('')
  const catalogo = ing.documento.contenuti.catalogoPosture ?? []
  return (
    <Sezione titolo="Giornate tipo per mansione (Allegato 1)">
      <p style={stili.nota}>
        Per ogni mansione una o più giornate tipo (di norma 480 minuti) con la durata e la classe OWAS di ogni attività. Alla mansione si assegna la giornata più gravosa. Scegliendo un’attività del catalogo si propone la classe più alta delle sue posture.
      </p>
      {[...ing.documentoMansioni]
        .sort((a, b) => a.ordine - b.ordine)
        .map((dm) => (
          <EditorMansionePosture key={dm.mansione_id} ing={ing} dm={dm} catalogo={catalogo} misure={misure} aggiorna={aggiorna} />
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
        {aggiungibili.length > 1 && (
          <Bottone
            onClick={() =>
              void esegui(async () => {
                let ordine = ing.documentoMansioni.length
                for (const m of aggiungibili) {
                  await api.salvaDocumentoMansione({ documento_id: ing.documento.id, mansione_id: m.id, ordine: ordine++, dati: {} })
                }
                await aggiorna()
              })
            }
          >
            Aggiungi tutte ({aggiungibili.length})
          </Bottone>
        )}
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- testi

function Testi({ ing, aggiorna }: { ing: Ingresso; aggiorna: () => Promise<void> }) {
  const doc = ing.documento
  const tipoPrincipale = ing.ambiti.filter((a) => doc.ambiti_ids.includes(a.id)).map((a) => a.tipo).find(eGalleria)
  const [c, setC] = useState<api.ContenutiRumore>(doc.contenuti ?? {})
  const ciclo = c.ciclo ?? (tipoPrincipale ? CICLO_PREDEFINITO[tipoPrincipale] : undefined) ?? [{ testo: '', punti: [] }]
  const salva = () =>
    esegui(async () => {
      await api.aggiornaContenuti(doc.id, { ciclo: c.ciclo ?? null })
      await aggiorna()
    }, 'Salvato')
  return (
    <Sezione titolo="Organizzazione del cantiere e ciclo di lavoro (capitolo 4.1)" chiusa azioni={<Bottone tipo="primario" onClick={() => void salva()}>Salva</Bottone>}>
      {ciclo.map((b, i) => (
        <div key={i} style={{ ...stili.griglia, gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
          <AreaTesto etichetta={`Paragrafo ${i + 1}`} valore={b.testo} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, testo: v } : x)) })} righe={5} />
          <AreaTesto etichetta="Elenco puntato (una voce per riga)" valore={b.punti.join('\n')} onChange={(v) => setC({ ...c, ciclo: ciclo.map((x, j) => (j === i ? { ...x, punti: v.split('\n').filter((y) => y.trim()) } : x)) })} righe={5} />
        </div>
      ))}
      <div style={stili.riga}>
        <Bottone onClick={() => setC({ ...c, ciclo: [...ciclo, { testo: '', punti: [] }] })}>+ Paragrafo</Bottone>
        {c.ciclo && <Bottone onClick={() => setC({ ...c, ciclo: undefined })}>Ripristina testo predefinito</Bottone>}
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- riepilogo

function Riepilogo({ ing }: { ing: Ingresso }) {
  const [generando, setGenerando] = useState(false)
  const [conferma, setConferma] = useState(false)
  const { dati, righeScartate } = useMemo(() => datiPostureDaDatabase(ing), [ing])
  const v = useMemo(() => valutaDvrPosture(dati.mansioni, dati.catalogo), [dati])
  const errori = v.avvisi.filter((a) => a.livello === 'errore')
  const mancanti = [
    !ing.documento.data_emissione && 'data di emissione',
    dati.catalogo.length === 0 && 'catalogo delle attività (capitoli 5 e 6)',
  ].filter(Boolean)

  const genera = async () => {
    setConferma(false)
    setGenerando(true)
    await esegui(async () => {
      const r = await generaDvrPosture(ing.documento.cantiere_id, ing.documento.id)
      saveBlob(r.blob, r.nomeFile)
    }, 'DVR generato')
    setGenerando(false)
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
            {['Mansione', 'Giornata più gravosa', 'Classi 1 · 2 · 3 · 4 (%)', 'Indice OWAS', 'Rischio'].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.esiti.map((e) => {
            const g = e.esito.peggiore
            return (
              <tr key={e.mansione.id}>
                <td style={stili.td}>{e.mansione.nome}</td>
                <td style={stili.td}>{g?.titolo ?? '—'}</td>
                <td style={stili.td}>{g ? g.frequenze.map(indice).join(' · ') : '—'}</td>
                <td style={stili.td}>{g ? indice(g.indice) : '—'}</td>
                <td style={{ ...stili.td, color: COLORE_FASCIA[e.esito.fascia], fontWeight: e.esito.fascia >= 2 ? 600 : 400 }}>
                  {g ? FASCE_POSTURE[e.esito.fascia].tipo : 'non valutata'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Sezione>
  )
}

export default function EditorDvrPosture() {
  const { id, docId } = useParams<{ id: string; docId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const chiave = ['dvr', 'ingresso', docId]
  const q = useQuery({ queryKey: chiave, queryFn: () => caricaIngresso(id!, docId!), enabled: Boolean(id && docId) })
  const misure = useMemo(() => (q.data ? misureOwas(q.data.misure) : []), [q.data])
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
          <h1 style={stili.titolo}>DVR Posture incongrue {q.data ? `– rev. ${String(q.data.documento.revisione).padStart(2, '0')}` : ''}</h1>
          <p style={stili.sottotitolo}>D.Lgs. 81/08, art. 28 – metodo OWAS</p>
        </div>
      </div>
      {q.isLoading && <p style={stili.nota}>Caricamento…</p>}
      {q.error && <p style={stili.avviso}>{humanizeError(q.error)}</p>}
      {q.data && (
        <div>
          <Riepilogo ing={q.data} />
          <DatiDocumento ing={q.data} aggiorna={aggiorna} tipiCampagna={TIPI_CAMPAGNA_POSTURE} etichettaCampagne="posture OWAS" conTarature={false} />
          <Catalogo key={`cat-${q.data.documento.updated_at}`} ing={q.data} misure={misure} aggiorna={aggiorna} />
          <Giornate ing={q.data} misure={misure} aggiorna={aggiorna} />
          <Testi ing={q.data} aggiorna={aggiorna} />
          <Revisioni ing={q.data} aggiorna={aggiorna} />
        </div>
      )}
    </div>
  )
}
