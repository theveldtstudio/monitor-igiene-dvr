import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraRumoreModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

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

export default function MisuraRumoreModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraRumoreModalProps) {
  const [durata, setDurata] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [macchineIds, setMacchineIds] = useState<string[]>([])
  const [leqDbA, setLeqDbA] = useState('')
  const [leqDbC, setLeqDbC] = useState('')
  const [lpeakDbC, setLpeakDbC] = useState('')
  const [note, setNote] = useState('')

  const [postazioneModalOpen, setPostazioneModalOpen] = useState(false)
  const [faseModalOpen, setFaseModalOpen] = useState(false)
  const [macchineModalOpen, setMacchineModalOpen] = useState(false)

  const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(
    misuraDaModificare?.id ?? null
  )
  const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(
    misuraDaModificare?.numero
  )

  const isModifica = misuraIdCorrente != null

  const { risorse: postazioni } = useRisorseCantiere(cantiereId, 'postazione')
  const { risorse: fasi } = useRisorseCantiere(cantiereId, 'fase')
  const { risorse: macchine } = useRisorseCantiere(cantiereId, 'macchina')

  const createHook = useCreateMisura()
  const updateHook = useUpdateMisura()
  const saving = isModifica ? updateHook.saving : createHook.saving
  const error = isModifica ? updateHook.error : createHook.error
  const resetError = isModifica ? updateHook.resetError : createHook.resetError

  const initialSnapshot = useMemo(() => {
    if (!misuraDaModificare) return null
    const d = misuraDaModificare.dati as Record<string, unknown>
    return {
      durata: (d.durata as string) ?? '',
      postazioneId: (d.postazione_id as string) ?? null,
      faseId: (d.fase_id as string) ?? null,
      macchineIds: (d.macchine_ids as string[]) ?? [],
      leqDbA: numToString(d.leq_dba),
      leqDbC: numToString(d.leq_dbc),
      lpeakDbC: numToString(d.lpeak_dbc),
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (!open) return
    if (initialSnapshot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDurata(initialSnapshot.durata)
      setPostazioneId(initialSnapshot.postazioneId)
      setFaseId(initialSnapshot.faseId)
      setMacchineIds(initialSnapshot.macchineIds)
      setLeqDbA(initialSnapshot.leqDbA)
      setLeqDbC(initialSnapshot.leqDbC)
      setLpeakDbC(initialSnapshot.lpeakDbC)
      setNote(initialSnapshot.note)
    } else {
      setDurata('')
      setPostazioneId(null)
      setFaseId(null)
      setMacchineIds([])
      setLeqDbA('')
      setLeqDbC('')
      setLpeakDbC('')
      setNote('')
    }
    setPostazioneModalOpen(false)
    setFaseModalOpen(false)
    setMacchineModalOpen(false)
  }, [open, initialSnapshot])

  useEffect(() => {
    if (open) resetError()
  }, [open, resetError])

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMisuraIdCorrente(misuraDaModificare?.id ?? null)
      setNumeroMisuraCorrente(misuraDaModificare?.numero)
    } else {
      setMisuraIdCorrente(null)
      setNumeroMisuraCorrente(undefined)
    }
  }, [open, misuraDaModificare?.id, misuraDaModificare?.numero])

  const postazioneNome = useMemo(() => postazioni.find((p) => p.id === postazioneId)?.valore ?? null, [postazioni, postazioneId])
  const faseNome = useMemo(() => fasi.find((f) => f.id === faseId)?.valore ?? null, [fasi, faseId])
  const macchineNomi = useMemo(() => macchine.filter((m) => macchineIds.includes(m.id)).map((m) => m.valore), [macchine, macchineIds])

  const leqDbAParsed = parseNumeroIT(leqDbA)
  const isValid = leqDbAParsed !== null

  const isDirty = isModifica && initialSnapshot
    ? (
        durata !== initialSnapshot.durata ||
        postazioneId !== initialSnapshot.postazioneId ||
        faseId !== initialSnapshot.faseId ||
        JSON.stringify(macchineIds) !== JSON.stringify(initialSnapshot.macchineIds) ||
        leqDbA !== initialSnapshot.leqDbA ||
        leqDbC !== initialSnapshot.leqDbC ||
        lpeakDbC !== initialSnapshot.lpeakDbC ||
        note !== initialSnapshot.note
      )
    : (
        durata !== '' || postazioneId !== null || faseId !== null || macchineIds.length > 0 ||
        leqDbA !== '' || leqDbC !== '' || lpeakDbC !== '' || note !== ''
      )

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (durata.trim()) dati.durata = durata.trim()
    if (postazioneId) {
      dati.postazione_id = postazioneId
      dati.postazione_nome = postazioneNome ?? ''
    }
    if (faseId) {
      dati.fase_id = faseId
      dati.fase_nome = faseNome ?? ''
    }
    if (macchineIds.length > 0) {
      dati.macchine_ids = macchineIds
      dati.macchine_nomi = macchineNomi
    }
    if (leqDbAParsed !== null) dati.leq_dba = leqDbAParsed
    const leqDbCParsed = parseNumeroIT(leqDbC)
    if (leqDbCParsed !== null) dati.leq_dbc = leqDbCParsed
    const lpeakDbCParsed = parseNumeroIT(lpeakDbC)
    if (lpeakDbCParsed !== null) dati.lpeak_dbc = lpeakDbCParsed
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

  const handleSavePostazione = async (id: string | null): Promise<boolean> => { setPostazioneId(id); return true }
  const handleSaveFase = async (id: string | null): Promise<boolean> => { setFaseId(id); return true }
  const handleSaveMacchine = async (ids: string[]): Promise<boolean> => { setMacchineIds(ids); return true }

  return (
    <>
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
          <label htmlFor="ms-durata" style={styles.label}>Durata</label>
          <input id="ms-durata" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 00:30:00" disabled={saving} inputMode="numeric" maxLength={20}
            style={{ ...styles.input, ...(durata ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          <div style={styles.helperText}>Formato hh:mm:ss</div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Postazione</label>
          <button type="button" onClick={() => setPostazioneModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(postazioneNome ? styles.selectorBtnFilled : {}) }}>
            <span style={postazioneNome ? styles.selectorValue : styles.selectorPlaceholder}>{postazioneNome ?? 'Seleziona postazione'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Fase lavorativa</label>
          <button type="button" onClick={() => setFaseModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(faseNome ? styles.selectorBtnFilled : {}) }}>
            <span style={faseNome ? styles.selectorValue : styles.selectorPlaceholder}>{faseNome ?? 'Seleziona fase'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Macchine{macchineIds.length > 0 ? ` (${macchineIds.length})` : ''}</label>
          <button type="button" onClick={() => setMacchineModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(macchineIds.length > 0 ? styles.selectorBtnFilled : {}) }}>
            <span style={macchineIds.length > 0 ? styles.selectorValue : styles.selectorPlaceholder}>
              {macchineIds.length > 0 ? macchineNomi.join(', ') : 'Seleziona macchine'}
            </span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label htmlFor="ms-leq-dba" style={styles.label}>
            Leq dB(A) <span style={styles.required}>*</span>
          </label>
          <input id="ms-leq-dba" type="text" value={leqDbA} onChange={(e) => setLeqDbA(e.target.value)} placeholder="es. 87,4" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(leqDbA ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ms-leq-dbc" style={styles.label}>Leq dB(C)</label>
          <input id="ms-leq-dbc" type="text" value={leqDbC} onChange={(e) => setLeqDbC(e.target.value)} placeholder="es. 92,1" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(leqDbC ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ms-lpeak" style={styles.label}>Lpeak dB(C)</label>
          <input id="ms-lpeak" type="text" value={lpeakDbC} onChange={(e) => setLpeakDbC(e.target.value)} placeholder="es. 132,5" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(lpeakDbC ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="ms-note" style={styles.label}>Note</label>
          <textarea id="ms-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
            style={{ ...styles.textarea, ...(note ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />
        </div>
      </MisuraModalShell>

      <SelezionaRisorseModal
        open={postazioneModalOpen}
        onClose={() => setPostazioneModalOpen(false)}
        onSaveSingola={handleSavePostazione}
        modalita="singola"
        initialSelectedId={postazioneId}
        cantiereId={cantiereId}
        tipo="postazione"
        titolo="Postazione"
        labelSingolare="postazione"
        labelPlurale="postazioni"
        permettiNessuno={true}
        saving={false}
        saveError={null}
      />

      <SelezionaRisorseModal
        open={faseModalOpen}
        onClose={() => setFaseModalOpen(false)}
        onSaveSingola={handleSaveFase}
        modalita="singola"
        initialSelectedId={faseId}
        cantiereId={cantiereId}
        tipo="fase"
        titolo="Fase lavorativa"
        labelSingolare="fase"
        labelPlurale="fasi"
        permettiNessuno={true}
        saving={false}
        saveError={null}
      />

      <SelezionaRisorseModal
        open={macchineModalOpen}
        onClose={() => setMacchineModalOpen(false)}
        onSaveMultipla={handleSaveMacchine}
        modalita="multipla"
        initialSelectedIds={macchineIds}
        cantiereId={cantiereId}
        tipo="macchina"
        titolo="Macchine"
        labelSingolare="macchina"
        labelPlurale="macchine"
        saving={false}
        saveError={null}
      />
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 },
  required: { color: '#A32D2D' },
  input: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 60 },
  inputFilled: { borderColor: 'var(--accent)' },
  inputDisabled: { background: 'var(--bg-toggle)', opacity: 0.7, cursor: 'not-allowed' },
  helperText: { fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 },
  selectorBtn: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxSizing: 'border-box' },
  selectorBtnFilled: { borderColor: 'var(--accent)' },
  selectorValue: { color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 },
  selectorPlaceholder: { color: 'var(--text-tertiary)', flex: 1, marginRight: 8 },
  selectorChevron: { color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 },
}
