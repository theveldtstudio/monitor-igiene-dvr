import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'
import {
  TUTTE_LE_SEZIONI,
  calcolaMoltiplicatoreDurata,
  calcolaFasciaRischio,
} from '../data/ocraChecklistData'
import type { OcraSection, OcraSubsection } from '../data/ocraChecklistData'

interface MisuraOcraModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type ArtoValutato = '' | 'DX' | 'SX' | 'Entrambi'

type RisposteState = Record<string, string[]>

function parseNumeroIT(s: string): number | null {
  const trimmed = s.trim()
  if (trimmed === '') return null
  const normalized = trimmed.replace(',', '.')
  const n = Number(normalized)
  if (!isFinite(n)) return null
  return n
}

function numToString(n: unknown): string {
  if (typeof n !== 'number' || !isFinite(n)) return ''
  return String(n).replace('.', ',')
}

function calcolaPunteggioSezione(sezione: OcraSection, risposte: RisposteState): number {
  const punteggiSottoblocchi = sezione.sottoblocchi.map((sb) => {
    const idsSelezionati = risposte[sb.id] ?? []
    const opzioniSelezionate = sb.opzioni.filter((o) => idsSelezionati.includes(o.id))
    if (sb.modalita === 'radio') {
      return opzioniSelezionate.length > 0 ? opzioniSelezionate[0].punteggio : 0
    }
    return opzioniSelezionate.reduce((acc, o) => acc + o.punteggio, 0)
  })

  if (sezione.calcolo === 'sum') {
    return punteggiSottoblocchi.reduce((a, b) => a + b, 0)
  }
  if (sezione.calcolo === 'max_sub') {
    return Math.max(0, ...punteggiSottoblocchi)
  }
  if (sezione.calcolo === 'max_distretti_plus_stereotipia') {
    const distretti = punteggiSottoblocchi.slice(0, -1)
    const stereotipia = punteggiSottoblocchi[punteggiSottoblocchi.length - 1] ?? 0
    return Math.max(0, ...distretti) + stereotipia
  }
  return 0
}

export default function MisuraOcraModal({ open, onClose, onSaved, campagnaId, misuraDaModificare }: MisuraOcraModalProps) {
  const [arto, setArto] = useState<ArtoValutato>('')
  const [minutiCompito, setMinutiCompito] = useState('')
  const [denominazione, setDenominazione] = useState('')
  const [risposte, setRisposte] = useState<RisposteState>({})
  const [sezioniAperte, setSezioniAperte] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')

  const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(
    misuraDaModificare?.id ?? null
  )
  const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(
    misuraDaModificare?.numero
  )

  const isModifica = misuraIdCorrente != null

  const createHook = useCreateMisura()
  const updateHook = useUpdateMisura()
  const saving = isModifica ? updateHook.saving : createHook.saving
  const error = isModifica ? updateHook.error : createHook.error
  const resetError = isModifica ? updateHook.resetError : createHook.resetError

  const initialSnapshot = useMemo(() => {
    if (!misuraDaModificare) return null
    const d = misuraDaModificare.dati as Record<string, unknown>
    return {
      arto: (d.arto_valutato as ArtoValutato) ?? '',
      minutiCompito: numToString(d.minuti_compito),
      denominazione: (d.denominazione as string) ?? '',
      risposte: (d.risposte_ocra as RisposteState) ?? {},
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setArto(initialSnapshot.arto)
        setMinutiCompito(initialSnapshot.minutiCompito)
        setDenominazione(initialSnapshot.denominazione)
        setRisposte(initialSnapshot.risposte)
        setNote(initialSnapshot.note)
      } else {
        setArto(''); setMinutiCompito(''); setDenominazione(''); setRisposte({}); setNote('')
      }
      setSezioniAperte({})
    }
  }, [open, initialSnapshot])

  useEffect(() => {
    if (open) resetError()
  }, [open, resetError])

  useEffect(() => {
    if (open) {
      setMisuraIdCorrente(misuraDaModificare?.id ?? null)
      setNumeroMisuraCorrente(misuraDaModificare?.numero)
    } else {
      setMisuraIdCorrente(null)
      setNumeroMisuraCorrente(undefined)
    }
  }, [open, misuraDaModificare?.id, misuraDaModificare?.numero])

  const setRispostaRadio = (sottoblocco: string, opzioneId: string) => {
    setRisposte((prev) => {
      const prevSelected = prev[sottoblocco] ?? []
      if (prevSelected.length === 1 && prevSelected[0] === opzioneId) {
        const next = { ...prev }
        delete next[sottoblocco]
        return next
      }
      return { ...prev, [sottoblocco]: [opzioneId] }
    })
  }

  const toggleRispostaCheckbox = (sottoblocco: string, opzioneId: string) => {
    setRisposte((prev) => {
      const prevSelected = prev[sottoblocco] ?? []
      const has = prevSelected.includes(opzioneId)
      const next = has ? prevSelected.filter((id) => id !== opzioneId) : [...prevSelected, opzioneId]
      const out = { ...prev }
      if (next.length === 0) delete out[sottoblocco]
      else out[sottoblocco] = next
      return out
    })
  }

  const minutiParsed = parseNumeroIT(minutiCompito)
  const punteggiSezioni = useMemo(() => TUTTE_LE_SEZIONI.map((s) => calcolaPunteggioSezione(s, risposte)), [risposte])
  const punteggioIntrinseco = punteggiSezioni.reduce((a, b) => a + b, 0)
  const moltiplicatore = calcolaMoltiplicatoreDurata(minutiParsed)
  const punteggioReale = moltiplicatore !== null ? punteggioIntrinseco * moltiplicatore : null
  const fascia = punteggioReale !== null ? calcolaFasciaRischio(punteggioReale) : null

  const hasAlmenoUnaRisposta = Object.values(risposte).some((arr) => arr.length > 0)
  const isAlmenoUnCampoCompilato = (
    arto !== '' || minutiCompito !== '' || denominazione !== '' || hasAlmenoUnaRisposta || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      arto !== initialSnapshot.arto || minutiCompito !== initialSnapshot.minutiCompito ||
      denominazione !== initialSnapshot.denominazione ||
      JSON.stringify(risposte) !== JSON.stringify(initialSnapshot.risposte) ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (arto !== '') dati.arto_valutato = arto
    if (minutiParsed !== null) dati.minuti_compito = minutiParsed
    if (denominazione.trim()) dati.denominazione = denominazione.trim()
    if (hasAlmenoUnaRisposta) dati.risposte_ocra = risposte
    dati.punteggio_intrinseco = Math.round(punteggioIntrinseco * 100) / 100
    if (moltiplicatore !== null) dati.moltiplicatore_durata = moltiplicatore
    if (punteggioReale !== null) dati.punteggio_reale = Math.round(punteggioReale * 100) / 100
    if (fascia) {
      dati.fascia_rischio = fascia.livello
      dati.fascia_label = fascia.label
    }
    return dati
  }

  const handleSubmit = async () => {
    const dati = buildDati()
    const noteTrim = note.trim()
    let result: Misura | null
    if (misuraIdCorrente) {
      result = await updateHook.updateMisura({ id: misuraIdCorrente, dati, note: noteTrim })
    } else {
      result = await createHook.createMisura({ campagna_id: campagnaId, dati, note: noteTrim || undefined })
    }
    if (result) {
      onSaved(result)

      if (!misuraIdCorrente) {
        setMisuraIdCorrente(result.id)
        setNumeroMisuraCorrente(result.numero)
      } else {
        onClose()
      }
    }
  }

  const toggleSezione = (id: string) => {
    setSezioniAperte((p) => ({ ...p, [id]: !p[id] }))
  }

  return (
    <MisuraModalShell
      open={open}
      onClose={onClose}
      isModifica={isModifica}
      numeroMisura={numeroMisuraCorrente}
      isValid={isValid}
      isDirty={isDirty}
      saving={saving}
      saveError={error}
      onSubmit={handleSubmit}
    >
      <div style={styles.field}>
        <label htmlFor="oc-den" style={styles.label}>Denominazione compito</label>
        <input id="oc-den" type="text" value={denominazione} onChange={(e) => setDenominazione(e.target.value)} placeholder="es. Smontaggio pneumatici" disabled={saving} maxLength={120}
          style={{ ...styles.input, ...(denominazione ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
      </div>

      <div style={styles.field}>
        <label htmlFor="oc-arto" style={styles.label}>Arto valutato</label>
        <select id="oc-arto" value={arto} onChange={(e) => setArto(e.target.value as ArtoValutato)} disabled={saving}
          style={{ ...styles.input, ...(arto ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
          <option value="">— seleziona —</option>
          <option value="DX">Destro</option>
          <option value="SX">Sinistro</option>
          <option value="Entrambi">Entrambi</option>
        </select>
      </div>

      <div style={styles.field}>
        <label htmlFor="oc-min" style={styles.label}>Minuti totali compito ripetitivo</label>
        <input id="oc-min" type="text" value={minutiCompito} onChange={(e) => setMinutiCompito(e.target.value)} placeholder="es. 420" disabled={saving} inputMode="decimal"
          style={{ ...styles.input, ...(minutiCompito ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        <div style={styles.helperText}>Determina il moltiplicatore durata (0,5 a 1,5)</div>
      </div>

      {TUTTE_LE_SEZIONI.map((sezione, idx) => {
        const aperta = sezioniAperte[sezione.id] ?? false
        const punteggio = punteggiSezioni[idx]
        return (
          <div key={sezione.id} style={styles.sezione}>
            <button type="button" onClick={() => toggleSezione(sezione.id)} disabled={saving} style={styles.sezioneHeader}>
              <span style={styles.sezioneTitolo}>{sezione.titolo}</span>
              <span style={styles.sezionePunteggio}>{Math.round(punteggio * 10) / 10}</span>
              <span style={styles.sezioneChevron}>{aperta ? '▾' : '▸'}</span>
            </button>
            {aperta && (
              <div style={styles.sezioneBody}>
                <div style={styles.sezioneDescrizione}>{sezione.descrizione}</div>
                {sezione.sottoblocchi.map((sb: OcraSubsection) => (
                  <div key={sb.id} style={styles.sottoblocco}>
                    <div style={styles.sottobloccoTitolo}>{sb.titolo}</div>
                    {sb.opzioni.map((opt) => {
                      const selected = (risposte[sb.id] ?? []).includes(opt.id)
                      return (
                        <label key={opt.id} style={{ ...styles.opzione, ...(selected ? styles.opzioneSelected : {}) }}>
                          <input
                            type={sb.modalita === 'radio' ? 'radio' : 'checkbox'}
                            name={`ocra-${sb.id}`}
                            checked={selected}
                            onChange={() => sb.modalita === 'radio' ? setRispostaRadio(sb.id, opt.id) : toggleRispostaCheckbox(sb.id, opt.id)}
                            disabled={saving}
                            style={styles.opzioneInput}
                          />
                          <span style={styles.opzioneLabel}>{opt.label}</span>
                          <span style={styles.opzionePunteggio}>{opt.punteggio}</span>
                        </label>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div style={styles.calcBox}>
        <div style={styles.calcLabel}>Punteggio Checklist OCRA</div>
        <div style={styles.calcRow}>
          <span style={styles.calcSub}>Intrinseco</span>
          <span style={styles.calcSubVal}>{(Math.round(punteggioIntrinseco * 100) / 100).toString().replace('.', ',')}</span>
        </div>
        {moltiplicatore !== null && (
          <div style={styles.calcRow}>
            <span style={styles.calcSub}>× Moltiplicatore durata</span>
            <span style={styles.calcSubVal}>{moltiplicatore.toString().replace('.', ',')}</span>
          </div>
        )}
        {punteggioReale !== null && fascia ? (
          <div style={{ ...styles.calcReale, color: fascia.colore }}>
            <strong>= {(Math.round(punteggioReale * 100) / 100).toString().replace('.', ',')}</strong>
            <div style={styles.calcFascia}>{fascia.label}</div>
          </div>
        ) : (
          <div style={styles.calcEmpty}>Inserisci minuti compito per il punteggio reale</div>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="oc-note" style={styles.label}>Note</label>
        <textarea id="oc-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
          style={{ ...styles.textarea, ...(note ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
      </div>

      <div style={styles.field}>
        <FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />
      </div>
    </MisuraModalShell>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 },
  input: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 60 },
  inputFilled: { borderColor: 'var(--accent)' },
  inputDisabled: { background: 'var(--bg-toggle)', opacity: 0.7, cursor: 'not-allowed' },
  helperText: { fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 },
  sezione: { marginBottom: 8, borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, overflow: 'hidden' },
  sezioneHeader: { width: '100%', background: 'var(--bg-toggle)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'left' },
  sezioneTitolo: { flex: 1 },
  sezionePunteggio: { fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginRight: 8, minWidth: 24, textAlign: 'right' },
  sezioneChevron: { fontSize: 12, color: 'var(--text-tertiary)' },
  sezioneBody: { padding: 12, background: 'var(--bg-card)' },
  sezioneDescrizione: { fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 10 },
  sottoblocco: { marginBottom: 12 },
  sottobloccoTitolo: { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 },
  opzione: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 4, borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'transparent' },
  opzioneSelected: { background: 'var(--bg-toggle)', borderColor: 'var(--accent)' },
  opzioneInput: { marginTop: 2, flexShrink: 0 },
  opzioneLabel: { flex: 1, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 },
  opzionePunteggio: { fontSize: 11, color: 'var(--accent)', fontWeight: 600, flexShrink: 0, paddingLeft: 6 },
  calcBox: { background: 'var(--bg-toggle)', borderWidth: '0.5px', borderStyle: 'dashed', borderColor: 'var(--border)', borderRadius: 8, padding: '12px 14px', marginTop: 12, marginBottom: 12 },
  calcLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  calcRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 },
  calcSub: {},
  calcSubVal: { fontWeight: 500, color: 'var(--text-primary)' },
  calcReale: { fontSize: 18, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTopWidth: '0.5px', borderTopStyle: 'solid', borderTopColor: 'var(--border)' },
  calcFascia: { fontSize: 12, fontWeight: 500, marginTop: 4 },
  calcEmpty: { fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 8 },
}
