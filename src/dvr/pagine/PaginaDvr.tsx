/**
 * DVR del cantiere: anagrafica, ambiti, mansioni, DPI, macchine, tarature e documenti.
 * L'anagrafica si compila la prima volta e resta modificabile; le modifiche alle mansioni
 * chiedono conferma e finiscono nello storico (servono per le revisioni).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useCantiere } from '../../hooks/useCantiere'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/toast/toastApi'
import * as api from '../api'
import { ETICHETTE_AMBITO, TIPI_AMBITO, type AnagraficaDvr, type MansioneDvr, type TipoAmbito } from '../comune/tipi'
import { BETA_PREDEFINITO, controllaDpi, type DpiUdito, type TipoDpiUdito } from '../rumore/dpi'
import { AreaTesto, Bottone, Campo, Sezione } from '../ui/Kit'
import { esegui } from '../ui/esegui'
import { numeroDa, stili } from '../ui/stili'

const vuota = (cantiereId: string): AnagraficaDvr => ({
  cantiere_id: cantiereId,
  comune: '',
  provincia: '',
  opera: '',
  denominazione: '',
  impresa: '',
  datore_lavoro: '',
  rspp: '',
  medico_competente: '',
  rls: [],
  gruppo_lavoro: [],
  redatto: '',
  verificato: '',
  approvato: '',
})


// ---------------------------------------------------------------- anagrafica

function SezioneAnagrafica({ cantiereId, nomeCantiere, committente }: { cantiereId: string; nomeCantiere: string; committente: string | null }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['dvr', 'anagrafica', cantiereId], queryFn: () => api.leggiAnagrafica(cantiereId) })
  const [a, setA] = useState<AnagraficaDvr | null>(null)

  useEffect(() => {
    if (q.isSuccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setA(q.data ?? { ...vuota(cantiereId), denominazione: nomeCantiere, impresa: committente ?? '' })
    }
  }, [q.isSuccess, q.data, cantiereId, nomeCantiere, committente])

  if (!a) return <Sezione titolo="Anagrafica DVR">Caricamento…</Sezione>
  const set = (k: keyof AnagraficaDvr) => (v: string) => setA({ ...a, [k]: v })
  const lista = (k: 'rls' | 'gruppo_lavoro') => (v: string) => setA({ ...a, [k]: v.split('\n') })

  return (
    <Sezione
      titolo="Anagrafica DVR"
      azioni={
        <Bottone
          tipo="primario"
          onClick={() =>
            void esegui(async () => {
              await api.salvaAnagrafica({
                ...a,
                rls: a.rls.map((x) => x.trim()).filter(Boolean),
                gruppo_lavoro: a.gruppo_lavoro.map((x) => x.trim()).filter(Boolean),
              })
              await qc.invalidateQueries({ queryKey: ['dvr', 'anagrafica', cantiereId] })
            }, 'Anagrafica salvata')
          }
        >
          Salva anagrafica
        </Bottone>
      }
    >
      {!q.data && <p style={stili.attenzione}>Prima volta per questo cantiere: compila l’anagrafica, servirà a tutti i DVR.</p>}
      <div style={stili.griglia}>
        <Campo etichetta="Comune" valore={a.comune} onChange={set('comune')} />
        <Campo etichetta="Provincia" valore={a.provincia} onChange={set('provincia')} />
        <Campo etichetta="Opera / tratta / lotto" valore={a.opera} onChange={set('opera')} />
        <Campo etichetta="Denominazione cantiere (es. TBM1)" valore={a.denominazione} onChange={set('denominazione')} />
        <Campo etichetta="Impresa / consorzio" valore={a.impresa} onChange={set('impresa')} />
        <Campo etichetta="Datore di lavoro" valore={a.datore_lavoro} onChange={set('datore_lavoro')} />
        <Campo etichetta="RSPP" valore={a.rspp} onChange={set('rspp')} />
        <Campo etichetta="Medico competente" valore={a.medico_competente} onChange={set('medico_competente')} />
        <Campo etichetta="Redatto" valore={a.redatto} onChange={set('redatto')} />
        <Campo etichetta="Verificato" valore={a.verificato} onChange={set('verificato')} />
        <Campo etichetta="Approvato" valore={a.approvato} onChange={set('approvato')} />
      </div>
      <div style={{ ...stili.griglia, marginTop: 10 }}>
        <AreaTesto etichetta="RLS (uno per riga)" valore={a.rls.join('\n')} onChange={lista('rls')} righe={3} />
        <AreaTesto etichetta="Gruppo di lavoro (uno per riga)" valore={a.gruppo_lavoro.join('\n')} onChange={lista('gruppo_lavoro')} righe={3} />
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- ambiti

function SezioneAmbiti({ cantiereId }: { cantiereId: string }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['dvr', 'ambiti', cantiereId], queryFn: () => api.leggiAmbiti(cantiereId) })
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoAmbito>('galleria_tbm')
  const aggiorna = () => qc.invalidateQueries({ queryKey: ['dvr', 'ambiti', cantiereId] })

  return (
    <Sezione titolo="Ambiti di lavoro">
      <p style={stili.nota}>L’ambito sceglie testi e metodi del DVR (es. la zonizzazione esiste solo in galleria).</p>
      <table style={stili.tabella}>
        <tbody>
          {(q.data ?? []).map((a) => (
            <tr key={a.id}>
              <td style={stili.td}>{a.nome}</td>
              <td style={stili.td}>{ETICHETTE_AMBITO[a.tipo]}</td>
              <td style={{ ...stili.td, textAlign: 'right' }}>
                <Bottone tipo="pericolo" onClick={() => void esegui(async () => { await api.eliminaAmbito(a.id); await aggiorna() })}>
                  Elimina
                </Bottone>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ ...stili.riga, marginTop: 10, alignItems: 'flex-end' }}>
        <Campo etichetta="Nome ambito" valore={nome} onChange={setNome} segnaposto="es. Galleria TBM1" />
        <label style={stili.campo}>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoAmbito)} style={stili.input}>
            {TIPI_AMBITO.map((t) => (
              <option key={t} value={t}>
                {ETICHETTE_AMBITO[t]}
              </option>
            ))}
          </select>
        </label>
        <Bottone
          disabled={!nome.trim()}
          onClick={() =>
            void esegui(async () => {
              await api.salvaAmbito({ cantiere_id: cantiereId, nome: nome.trim(), tipo, ordine: q.data?.length ?? 0 })
              setNome('')
              await aggiorna()
            })
          }
        >
          Aggiungi ambito
        </Bottone>
      </div>
    </Sezione>
  )
}

// ---------------------------------------------------------------- mansioni

interface ModificaInAttesa {
  azione: api.AzioneMansione
  prima: MansioneDvr | null
  dopo: Partial<MansioneDvr> & { cantiere_id: string; nome: string }
}

function SezioneMansioni({ cantiereId }: { cantiereId: string }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['dvr', 'mansioni', cantiereId], queryFn: () => api.leggiMansioni(cantiereId) })
  const storico = useQuery({ queryKey: ['dvr', 'mansioni-storico', cantiereId], queryFn: () => api.leggiModificheMansioni(cantiereId) })
  const [nuova, setNuova] = useState({ nome: '', attivita: '' })
  const [inModifica, setInModifica] = useState<MansioneDvr | null>(null)
  const [attesa, setAttesa] = useState<ModificaInAttesa | null>(null)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const conferma = async () => {
    if (!attesa) return
    setSalvando(true)
    const ok = await esegui(async () => {
      await api.salvaMansione(attesa.dopo, attesa.prima, attesa.azione, motivo.trim() || null)
      await qc.invalidateQueries({ queryKey: ['dvr', 'mansioni', cantiereId] })
      await qc.invalidateQueries({ queryKey: ['dvr', 'mansioni-storico', cantiereId] })
    }, 'Mansione salvata')
    setSalvando(false)
    if (ok) {
      setAttesa(null)
      setMotivo('')
      setInModifica(null)
      setNuova({ nome: '', attivita: '' })
    }
  }

  const testoAzione: Record<api.AzioneMansione, string> = {
    creata: 'Aggiungere la mansione',
    modificata: 'Modificare la mansione',
    disattivata: 'Disattivare la mansione',
    riattivata: 'Riattivare la mansione',
  }

  return (
    <Sezione titolo="Mansioni e gruppi omogenei">
      <p style={stili.nota}>Ogni modifica chiede conferma e resta nello storico: le mansioni cambiano nel tempo e il DVR va rivisto.</p>
      <table style={stili.tabella}>
        <thead>
          <tr>
            <th style={stili.th}>Mansione</th>
            <th style={stili.th}>Attività principali</th>
            <th style={stili.th} />
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((m) =>
            inModifica?.id === m.id ? (
              <tr key={m.id}>
                <td style={stili.td}>
                  <input style={stili.input} value={inModifica.nome} onChange={(e) => setInModifica({ ...inModifica, nome: e.target.value })} />
                </td>
                <td style={stili.td}>
                  <input style={{ ...stili.input, width: '100%' }} value={inModifica.attivita ?? ''} onChange={(e) => setInModifica({ ...inModifica, attivita: e.target.value })} />
                </td>
                <td style={{ ...stili.td, whiteSpace: 'nowrap' }}>
                  <Bottone tipo="primario" onClick={() => setAttesa({ azione: 'modificata', prima: m, dopo: inModifica })}>
                    Salva
                  </Bottone>{' '}
                  <Bottone onClick={() => setInModifica(null)}>Annulla</Bottone>
                </td>
              </tr>
            ) : (
              <tr key={m.id} style={{ opacity: m.attiva ? 1 : 0.5 }}>
                <td style={stili.td}>{m.nome}</td>
                <td style={{ ...stili.td, color: 'var(--text-secondary)' }}>{m.attivita}</td>
                <td style={{ ...stili.td, whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <Bottone onClick={() => setInModifica(m)}>Modifica</Bottone>{' '}
                  <Bottone
                    tipo={m.attiva ? 'pericolo' : 'secondario'}
                    onClick={() => setAttesa({ azione: m.attiva ? 'disattivata' : 'riattivata', prima: m, dopo: { ...m, attiva: !m.attiva } })}
                  >
                    {m.attiva ? 'Disattiva' : 'Riattiva'}
                  </Bottone>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      <div style={{ ...stili.riga, marginTop: 10, alignItems: 'flex-end' }}>
        <Campo etichetta="Nuova mansione" valore={nuova.nome} onChange={(v) => setNuova({ ...nuova, nome: v })} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <Campo etichetta="Attività principali" valore={nuova.attivita} onChange={(v) => setNuova({ ...nuova, attivita: v })} />
        </div>
        <Bottone
          disabled={!nuova.nome.trim()}
          onClick={() =>
            setAttesa({
              azione: 'creata',
              prima: null,
              dopo: { cantiere_id: cantiereId, nome: nuova.nome.trim(), attivita: nuova.attivita.trim() || null, ordine: q.data?.length ?? 0 },
            })
          }
        >
          Aggiungi mansione
        </Bottone>
      </div>

      {(storico.data ?? []).length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ ...stili.nota, cursor: 'pointer' }}>Storico modifiche ({storico.data!.length})</summary>
          <table style={stili.tabella}>
            <tbody>
              {storico.data!.map((s) => (
                <tr key={s.id}>
                  <td style={stili.td}>{new Date(s.created_at).toLocaleString('it-IT')}</td>
                  <td style={stili.td}>{s.azione}</td>
                  <td style={stili.td}>
                    {s.prima?.nome && s.dopo?.nome && s.prima.nome !== s.dopo.nome ? `${s.prima.nome} → ${s.dopo.nome}` : (s.dopo?.nome ?? s.prima?.nome)}
                  </td>
                  <td style={{ ...stili.td, color: 'var(--text-secondary)' }}>{s.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <ConfirmDialog
        open={attesa !== null}
        title={attesa ? `${testoAzione[attesa.azione]}?` : ''}
        confirmLabel="Conferma"
        loading={salvando}
        variant={attesa?.azione === 'disattivata' ? 'danger' : 'default'}
        onCancel={() => setAttesa(null)}
        onConfirm={() => void conferma()}
        message={
          <div>
            <p style={{ margin: '0 0 8px' }}>
              <b>{attesa?.dopo.nome}</b>
              {attesa?.azione === 'modificata' && attesa.prima?.nome !== attesa.dopo.nome ? ` (prima: ${attesa.prima?.nome})` : ''}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 13 }}>
              Le mansioni sono la base dei DVR: la modifica resta nello storico e va riportata nella prossima revisione.
            </p>
            <textarea
              placeholder="Motivo (facoltativo), es. riorganizzazione squadre"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              style={{ ...stili.input, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        }
      />
    </Sezione>
  )
}

// ---------------------------------------------------------------- DPI udito

const FREQUENZE = [125, 250, 500, 1000, 2000, 4000, 8000]

interface BozzaDpi {
  id?: string
  nome: string
  tipo: TipoDpiUdito
  h: string
  m: string
  l: string
  beta: string
  snr: string
  media: string[]
  deviazione: string[]
}

const bozzaVuota = (): BozzaDpi => ({ nome: '', tipo: 'inserti', h: '', m: '', l: '', beta: '0.5', snr: '', media: FREQUENZE.map(() => ''), deviazione: FREQUENZE.map(() => '') })

function daBozza(b: BozzaDpi): DpiUdito | null {
  const h = numeroDa(b.h)
  const m = numeroDa(b.m)
  const l = numeroDa(b.l)
  const beta = numeroDa(b.beta)
  if (!b.nome.trim() || h === null || m === null || l === null || beta === null) return null
  const ottave = FREQUENZE.map((f, i) => ({ frequenza: f, media: numeroDa(b.media[i]), deviazione: numeroDa(b.deviazione[i]) }))
  const complete = ottave.every((o) => o.media !== null && o.deviazione !== null)
  return {
    nome: b.nome.trim(),
    tipo: b.tipo,
    h,
    m,
    l,
    beta,
    snr: numeroDa(b.snr),
    ottave: complete ? ottave.map((o) => ({ frequenza: o.frequenza, media: o.media!, deviazione: o.deviazione! })) : undefined,
  }
}

function SezioneDpi({ cantiereId }: { cantiereId: string }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['dvr', 'dpi', cantiereId], queryFn: () => api.leggiDpi(cantiereId) })
  const [bozza, setBozza] = useState<BozzaDpi | null>(null)
  const dpi = bozza ? daBozza(bozza) : null
  const avvisi = dpi ? controllaDpi(dpi) : []

  const modifica = (r: api.RigaDpi) =>
    setBozza({
      id: r.id,
      nome: r.nome,
      tipo: r.dati.tipo,
      h: String(r.dati.h),
      m: String(r.dati.m),
      l: String(r.dati.l),
      beta: String(r.dati.beta),
      snr: r.dati.snr != null ? String(r.dati.snr) : '',
      media: FREQUENZE.map((f) => String(r.dati.ottave?.find((o) => o.frequenza === f)?.media ?? '')),
      deviazione: FREQUENZE.map((f) => String(r.dati.ottave?.find((o) => o.frequenza === f)?.deviazione ?? '')),
    })

  return (
    <Sezione titolo="DPI per l’udito" azioni={!bozza && <Bottone onClick={() => setBozza(bozzaVuota())}>Aggiungi DPI</Bottone>}>
      <table style={stili.tabella}>
        <thead>
          <tr>
            {['Nome', 'Tipo', 'H', 'M', 'L', 'β', 'Ottave', ''].map((t) => (
              <th key={t} style={stili.th}>
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((r) => (
            <tr key={r.id}>
              <td style={stili.td}>{r.nome}</td>
              <td style={stili.td}>{r.dati.tipo}</td>
              <td style={stili.td}>{r.dati.h}</td>
              <td style={stili.td}>{r.dati.m}</td>
              <td style={stili.td}>{r.dati.l}</td>
              <td style={stili.td}>{r.dati.beta}</td>
              <td style={stili.td}>{r.dati.ottave?.length ? 'sì' : 'no'}</td>
              <td style={{ ...stili.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <Bottone onClick={() => modifica(r)}>Modifica</Bottone>{' '}
                <Bottone
                  tipo="pericolo"
                  onClick={() => void esegui(async () => { await api.eliminaDpi(r.id); await qc.invalidateQueries({ queryKey: ['dvr', 'dpi', cantiereId] }) })}
                >
                  Elimina
                </Bottone>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {bozza && (
        <div style={{ marginTop: 12 }}>
          <div style={stili.griglia}>
            <Campo etichetta="Nome e modello" valore={bozza.nome} onChange={(v) => setBozza({ ...bozza, nome: v })} />
            <label style={stili.campo}>
              Tipo
              <select
                value={bozza.tipo}
                onChange={(e) => {
                  const tipo = e.target.value as TipoDpiUdito
                  setBozza({ ...bozza, tipo, beta: String(BETA_PREDEFINITO[tipo]) })
                }}
                style={stili.input}
              >
                <option value="inserti">Inserti</option>
                <option value="archetto">Inserti ad archetto</option>
                <option value="cuffie">Cuffie</option>
              </select>
            </label>
            <Campo etichetta="H [dB]" tipo="number" valore={bozza.h} onChange={(v) => setBozza({ ...bozza, h: v })} />
            <Campo etichetta="M [dB]" tipo="number" valore={bozza.m} onChange={(v) => setBozza({ ...bozza, m: v })} />
            <Campo etichetta="L [dB]" tipo="number" valore={bozza.l} onChange={(v) => setBozza({ ...bozza, l: v })} />
            <Campo etichetta="β (UNI 9432)" tipo="number" valore={bozza.beta} onChange={(v) => setBozza({ ...bozza, beta: v })} />
            <Campo etichetta="SNR [dB] (facoltativo)" tipo="number" valore={bozza.snr} onChange={(v) => setBozza({ ...bozza, snr: v })} />
          </div>
          <p style={stili.nota}>Attenuazione per banda d’ottava (facoltativa, dalla scheda del costruttore):</p>
          <table style={stili.tabella}>
            <thead>
              <tr>
                <th style={stili.th}>Hz</th>
                {FREQUENZE.map((f) => (
                  <th key={f} style={stili.th}>
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['media', 'deviazione'] as const).map((k) => (
                <tr key={k}>
                  <td style={stili.td}>{k === 'media' ? 'Media' : 'Dev. std'}</td>
                  {FREQUENZE.map((f, i) => (
                    <td key={f} style={stili.td}>
                      <input
                        inputMode="decimal"
                        style={{ ...stili.input, width: 56 }}
                        value={bozza[k][i]}
                        onChange={(e) => {
                          const arr = [...bozza[k]]
                          arr[i] = e.target.value
                          setBozza({ ...bozza, [k]: arr })
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {avvisi.map((a) => (
            <p key={a} style={stili.attenzione}>
              {a}
            </p>
          ))}
          <div style={{ ...stili.riga, marginTop: 10 }}>
            <Bottone
              tipo="primario"
              disabled={!dpi}
              onClick={() =>
                void esegui(async () => {
                  const { nome, ...dati } = dpi!
                  await api.salvaDpi({ id: bozza.id, cantiere_id: cantiereId, nome, dati })
                  setBozza(null)
                  await qc.invalidateQueries({ queryKey: ['dvr', 'dpi', cantiereId] })
                }, 'DPI salvato')
              }
            >
              Salva DPI
            </Bottone>
            <Bottone onClick={() => setBozza(null)}>Annulla</Bottone>
          </div>
        </div>
      )}
    </Sezione>
  )
}

// ---------------------------------------------------------------- macchine

function SezioneMacchine({ cantiereId }: { cantiereId: string }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['dvr', 'macchine', cantiereId], queryFn: () => api.leggiMacchine(cantiereId) })
  const [m, setM] = useState({ tipologia: '', marca_modello: '', alimentazione: '' })
  const aggiorna = () => qc.invalidateQueries({ queryKey: ['dvr', 'macchine', cantiereId] })

  const importa = () =>
    esegui(async () => {
      const { data, error } = await supabase.from('risorse_cantiere').select('valore').eq('cantiere_id', cantiereId).eq('tipo', 'macchina')
      if (error) throw new Error(error.message)
      const presenti = new Set((q.data ?? []).map((x) => `${x.tipologia} ${x.marca_modello ?? ''}`.trim().toLowerCase()))
      const nuove = (data ?? []).map((r) => r.valore as string).filter((v) => !presenti.has(v.trim().toLowerCase()))
      for (const [i, v] of nuove.entries()) {
        await api.salvaMacchina({ cantiere_id: cantiereId, tipologia: v, ordine: (q.data?.length ?? 0) + i })
      }
      await aggiorna()
      toast.success(nuove.length ? `${nuove.length} macchine importate` : 'Nessuna macchina nuova da importare')
    })

  return (
    <Sezione titolo="Macchine e attrezzature" azioni={<Bottone onClick={() => void importa()}>Importa dalle macchine del cantiere</Bottone>} chiusa>
      <table style={stili.tabella}>
        <thead>
          <tr>
            <th style={stili.th}>Tipologia</th>
            <th style={stili.th}>Marca e modello</th>
            <th style={stili.th}>Trazione / alimentazione</th>
            <th style={stili.th} />
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((x) => (
            <tr key={x.id}>
              <td style={stili.td}>{x.tipologia}</td>
              <td style={stili.td}>{x.marca_modello}</td>
              <td style={stili.td}>{x.alimentazione}</td>
              <td style={{ ...stili.td, textAlign: 'right' }}>
                <Bottone tipo="pericolo" onClick={() => void esegui(async () => { await api.eliminaMacchina(x.id); await aggiorna() })}>
                  Elimina
                </Bottone>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ ...stili.riga, marginTop: 10, alignItems: 'flex-end' }}>
        <Campo etichetta="Tipologia" valore={m.tipologia} onChange={(v) => setM({ ...m, tipologia: v })} />
        <Campo etichetta="Marca e modello" valore={m.marca_modello} onChange={(v) => setM({ ...m, marca_modello: v })} />
        <Campo etichetta="Trazione / alimentazione" valore={m.alimentazione} onChange={(v) => setM({ ...m, alimentazione: v })} />
        <Bottone
          disabled={!m.tipologia.trim()}
          onClick={() =>
            void esegui(async () => {
              await api.salvaMacchina({ cantiere_id: cantiereId, tipologia: m.tipologia.trim(), marca_modello: m.marca_modello || null, alimentazione: m.alimentazione || null, ordine: q.data?.length ?? 0 })
              setM({ tipologia: '', marca_modello: '', alimentazione: '' })
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

// ---------------------------------------------------------------- tarature (comuni a tutti i cantieri)

function SezioneTarature() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['dvr', 'tarature'], queryFn: api.leggiTarature })
  const vuota = { componente: '', costruttore: '', modello: '', matricola: '', data_taratura: '', certificato: '' }
  const [t, setT] = useState(vuota)
  const aggiorna = () => qc.invalidateQueries({ queryKey: ['dvr', 'tarature'] })
  return (
    <Sezione titolo="Tarature della strumentazione (tutti i cantieri)" chiusa>
      <table style={stili.tabella}>
        <thead>
          <tr>
            {['Strumento', 'Costruttore', 'Modello', 'Matricola', 'Data taratura', 'Certificato', ''].map((h) => (
              <th key={h} style={stili.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((x) => (
            <tr key={x.id}>
              <td style={stili.td}>{x.componente}</td>
              <td style={stili.td}>{x.costruttore}</td>
              <td style={stili.td}>{x.modello}</td>
              <td style={stili.td}>{x.matricola}</td>
              <td style={stili.td}>{x.data_taratura ? new Date(x.data_taratura).toLocaleDateString('it-IT') : ''}</td>
              <td style={stili.td}>{x.certificato}</td>
              <td style={{ ...stili.td, textAlign: 'right' }}>
                <Bottone tipo="pericolo" onClick={() => void esegui(async () => { await api.eliminaTaratura(x.id); await aggiorna() })}>
                  Elimina
                </Bottone>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ ...stili.riga, marginTop: 10, alignItems: 'flex-end' }}>
        <Campo etichetta="Strumento" valore={t.componente} onChange={(v) => setT({ ...t, componente: v })} segnaposto="Fonometro" larghezza={130} />
        <Campo etichetta="Costruttore" valore={t.costruttore} onChange={(v) => setT({ ...t, costruttore: v })} larghezza={130} />
        <Campo etichetta="Modello" valore={t.modello} onChange={(v) => setT({ ...t, modello: v })} larghezza={110} />
        <Campo etichetta="Matricola" valore={t.matricola} onChange={(v) => setT({ ...t, matricola: v })} larghezza={100} />
        <Campo etichetta="Data taratura" tipo="date" valore={t.data_taratura} onChange={(v) => setT({ ...t, data_taratura: v })} />
        <Campo etichetta="N° certificato" valore={t.certificato} onChange={(v) => setT({ ...t, certificato: v })} larghezza={130} />
        <Bottone
          disabled={!t.componente.trim()}
          onClick={() =>
            void esegui(async () => {
              await api.salvaTaratura({ ...t, data_taratura: t.data_taratura || null })
              setT(vuota)
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

// ---------------------------------------------------------------- documenti

/** Rischi per cui l'app redige il DVR: titolo e tipi di campagna da cui prendere le misure. */
const RISCHI_DVR: Record<api.DocumentoDvr['rischio'], { titolo: string; campagne: string[] }> = {
  rumore: { titolo: 'DVR Rumore', campagne: ['rumore'] },
  vibrazioni: { titolo: 'DVR Vibrazioni', campagne: ['vibrazioni-wbv', 'vibrazioni-hav', 'vibrazioni_wbv', 'vibrazioni_hav'] },
  posture: { titolo: 'DVR Posture incongrue', campagne: ['posture_owas', 'owas'] },
  mmc: { titolo: 'DVR Movimentazione manuale dei carichi', campagne: ['mmc', 'movimenti_ripetitivi_ocra'] },
  microclima: { titolo: 'DVR Microclima', campagne: ['microclima'] },
  roa: { titolo: 'DVR Radiazioni ottiche artificiali', campagne: ['roa'] },
  chimico: { titolo: 'DVR Agenti chimici (polveri e gas tossici)', campagne: ['polveri', 'gas'] },
  fumi_saldatura: { titolo: 'DVR Fumi di saldatura', campagne: ['polveri', 'gas'] },
  cancerogeno: { titolo: 'DVR Agenti cancerogeni (silice e carbonio elementare)', campagne: ['polveri', 'carbonio_ec'] },
  cem: { titolo: 'DVR Campi elettromagnetici', campagne: ['cem'] },
  amianto: { titolo: 'DVR Amianto', campagne: ['amianto'] },
  ipa: { titolo: 'DVR Idrocarburi policiclici aromatici (IPA)', campagne: ['ipa'] },
  biologico: { titolo: 'DVR Agenti biologici', campagne: ['biologico_sas'] },
  acqua: { titolo: 'Monitoraggio delle acque', campagne: ['monitoraggio_acqua'] },
}

function SezioneDocumenti({ cantiereId }: { cantiereId: string }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['dvr', 'documenti', cantiereId], queryFn: () => api.leggiDocumenti(cantiereId) })
  const [creando, setCreando] = useState(false)

  const [rischioNuovo, setRischioNuovo] = useState<api.DocumentoDvr['rischio']>('rumore')

  const nuovo = async (rischio: api.DocumentoDvr['rischio']) => {
    setCreando(true)
    await esegui(async () => {
      const [ambiti, campagne, mansioni, anagrafica] = await Promise.all([
        api.leggiAmbiti(cantiereId),
        api.leggiCampagne(cantiereId, RISCHI_DVR[rischio].campagne),
        api.leggiMansioni(cantiereId),
        api.leggiAnagrafica(cantiereId),
      ])
      if (!anagrafica) throw new Error('Compila e salva prima l’anagrafica DVR.')
      const doc = await api.salvaDocumento({
        cantiere_id: cantiereId,
        rischio,
        titolo: RISCHI_DVR[rischio].titolo,
        periodo_riferimento: '',
        ambiti_ids: ambiti.map((a) => a.id),
        campagne_ids: campagne.map((c) => c.id),
        revisione: 0,
        contenuti: {},
        parametri: {},
      })
      const attive = mansioni.filter((m) => m.attiva)
      for (const [i, m] of attive.entries()) {
        await api.salvaDocumentoMansione({ documento_id: doc.id, mansione_id: m.id, ordine: i, dati: {} })
      }
      await api.salvaRevisione({
        documento_id: doc.id,
        revisione: 0,
        integrazione: null,
        data: '',
        descrizione: 'Prima emissione',
        redatto: anagrafica.redatto,
        verificato: anagrafica.verificato,
        approvato: anagrafica.approvato,
      })
      await qc.invalidateQueries({ queryKey: ['dvr', 'documenti', cantiereId] })
      navigate(`/cantieri/${cantiereId}/dvr/${doc.id}`)
    })
    setCreando(false)
  }

  return (
    <Sezione
      titolo="Documenti DVR"
      azioni={
        <>
          <select aria-label="Rischio del nuovo DVR" style={stili.input} value={rischioNuovo} onChange={(e) => setRischioNuovo(e.target.value as api.DocumentoDvr['rischio'])}>
            {Object.entries(RISCHI_DVR).map(([k, r]) => (
              <option key={k} value={k}>
                {r.titolo}
              </option>
            ))}
          </select>
          <Bottone tipo="primario" disabled={creando} onClick={() => void nuovo(rischioNuovo)}>
            + Nuovo DVR
          </Bottone>
        </>
      }
    >
      {(q.data ?? []).length === 0 && <p style={stili.nota}>Nessun DVR per questo cantiere.</p>}
      <table style={stili.tabella}>
        <tbody>
          {(q.data ?? []).map((d) => (
            <tr key={d.id}>
              <td style={stili.td}>{d.titolo ?? `DVR ${d.rischio}`}</td>
              <td style={stili.td}>Rev. {String(d.revisione).padStart(2, '0')}</td>
              <td style={stili.td}>{d.periodo_riferimento}</td>
              <td style={stili.td}>{d.stato === 'emesso' ? 'Emesso' : 'Bozza'}</td>
              <td style={{ ...stili.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <Bottone onClick={() => navigate(`/cantieri/${cantiereId}/dvr/${d.id}`)}>Apri</Bottone>{' '}
                {d.stato === 'emesso' && (
                  <Bottone
                    onClick={() =>
                      void esegui(async () => {
                        const nuovo = await api.nuovaRevisione(d)
                        await qc.invalidateQueries({ queryKey: ['dvr', 'documenti', cantiereId] })
                        navigate(`/cantieri/${cantiereId}/dvr/${nuovo.id}`)
                      }, 'Nuova revisione creata')
                    }
                  >
                    Nuova revisione
                  </Bottone>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Sezione>
  )
}

export default function PaginaDvr() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cantiere, loading } = useCantiere(id)
  if (!id) return null
  return (
    <div style={stili.pagina}>
      <div style={stili.barra}>
        <button type="button" style={stili.indietro} onClick={() => navigate(`/cantieri/${id}`)} aria-label="Torna al cantiere">
          ‹
        </button>
        <div>
          <h1 style={stili.titolo}>DVR – {loading ? '…' : cantiere?.nome}</h1>
          <p style={stili.sottotitolo}>Dati comuni a tutti i documenti di valutazione del cantiere</p>
        </div>
      </div>
      {cantiere && <SezioneAnagrafica cantiereId={id} nomeCantiere={cantiere.nome} committente={cantiere.committente} />}
      <SezioneDocumenti cantiereId={id} />
      <SezioneAmbiti cantiereId={id} />
      <SezioneMansioni cantiereId={id} />
      <SezioneDpi cantiereId={id} />
      <SezioneMacchine cantiereId={id} />
      <SezioneTarature />
    </div>
  )
}
