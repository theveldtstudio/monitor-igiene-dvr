import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraMicroclimaModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type Ambiente = '' | 'indoor' | 'outdoor'
type Attivita = '' | 'riposo seduto' | 'leggera' | 'moderata' | 'pesante' | 'molto pesante'
type Vestiario = '' | 'estivo leggero' | 'lavorativo standard' | 'invernale pesante'

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

function calcolaWbgt(ambiente: Ambiente, ta: number | null, tg: number | null, tnw: number | null): number | null {
  if (ambiente === 'outdoor') {
    if (ta === null || tg === null || tnw === null) return null
    return 0.7 * tnw + 0.2 * tg + 0.1 * ta
  }
  if (ambiente === 'indoor') {
    if (tg === null || tnw === null) return null
    return 0.7 * tnw + 0.3 * tg
  }
  return null
}

const ATTIVITA_OPTIONS: { value: Attivita; label: string }[] = [
  { value: '', label: '— seleziona —' },
  { value: 'riposo seduto', label: 'Riposo seduto (~58 W/m²)' },
  { value: 'leggera', label: 'Leggera (~93 W/m²)' },
  { value: 'moderata', label: 'Moderata (~140 W/m²)' },
  { value: 'pesante', label: 'Pesante (~200 W/m²)' },
  { value: 'molto pesante', label: 'Molto pesante (~260 W/m²)' },
]

const VESTIARIO_OPTIONS: { value: Vestiario; label: string }[] = [
  { value: '', label: '— seleziona —' },
  { value: 'estivo leggero', label: 'Estivo leggero (~0.5 clo)' },
  { value: 'lavorativo standard', label: 'Lavorativo standard (~0.85 clo)' },
  { value: 'invernale pesante', label: 'Invernale pesante (~1.5 clo)' },
]

export default function MisuraMicroclimaModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraMicroclimaModalProps) {
  const [durata, setDurata] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [ambiente, setAmbiente] = useState<Ambiente>('')
  const [ta, setTa] = useState('')
  const [tg, setTg] = useState('')
  const [tnw, setTnw] = useState('')
  const [ur, setUr] = useState('')
  const [va, setVa] = useState('')
  const [attivita, setAttivita] = useState<Attivita>('')
  const [vestiario, setVestiario] = useState<Vestiario>('')
  const [note, setNote] = useState('')

  const [postazioneModalOpen, setPostazioneModalOpen] = useState(false)
  const [faseModalOpen, setFaseModalOpen] = useState(false)

  const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(
    misuraDaModificare?.id ?? null
  )
  const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(
    misuraDaModificare?.numero
  )

  const isModifica = misuraIdCorrente != null

  const { risorse: postazioni } = useRisorseCantiere(cantiereId, 'postazione')
  const { risorse: fasi } = useRisorseCantiere(cantiereId, 'fase')

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
      ambiente: (d.ambiente as Ambiente) ?? '',
      ta: numToString(d.ta),
      tg: numToString(d.tg),
      tnw: numToString(d.tnw),
      ur: numToString(d.ur),
      va: numToString(d.va),
      attivita: (d.attivita_metabolica as Attivita) ?? '',
      vestiario: (d.vestiario as Vestiario) ?? '',
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setDurata(initialSnapshot.durata)
        setPostazioneId(initialSnapshot.postazioneId)
        setFaseId(initialSnapshot.faseId)
        setAmbiente(initialSnapshot.ambiente)
        setTa(initialSnapshot.ta)
        setTg(initialSnapshot.tg)
        setTnw(initialSnapshot.tnw)
        setUr(initialSnapshot.ur)
        setVa(initialSnapshot.va)
        setAttivita(initialSnapshot.attivita)
        setVestiario(initialSnapshot.vestiario)
        setNote(initialSnapshot.note)
      } else {
        setDurata(''); setPostazioneId(null); setFaseId(null); setAmbiente('')
        setTa(''); setTg(''); setTnw(''); setUr(''); setVa('')
        setAttivita(''); setVestiario(''); setNote('')
      }
      setPostazioneModalOpen(false); setFaseModalOpen(false)
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

  const postazioneNome = useMemo(() => postazioni.find((p) => p.id === postazioneId)?.valore ?? null, [postazioni, postazioneId])
  const faseNome = useMemo(() => fasi.find((f) => f.id === faseId)?.valore ?? null, [fasi, faseId])

  const taParsed = parseNumeroIT(ta)
  const tgParsed = parseNumeroIT(tg)
  const tnwParsed = parseNumeroIT(tnw)
  const urParsed = parseNumeroIT(ur)
  const vaParsed = parseNumeroIT(va)
  const wbgt = calcolaWbgt(ambiente, taParsed, tgParsed, tnwParsed)

  const isAlmenoUnCampoCompilato = (
    durata !== '' || postazioneId !== null || faseId !== null || ambiente !== '' ||
    ta !== '' || tg !== '' || tnw !== '' || ur !== '' || va !== '' ||
    attivita !== '' || vestiario !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      durata !== initialSnapshot.durata || postazioneId !== initialSnapshot.postazioneId ||
      faseId !== initialSnapshot.faseId || ambiente !== initialSnapshot.ambiente ||
      ta !== initialSnapshot.ta || tg !== initialSnapshot.tg || tnw !== initialSnapshot.tnw ||
      ur !== initialSnapshot.ur || va !== initialSnapshot.va ||
      attivita !== initialSnapshot.attivita || vestiario !== initialSnapshot.vestiario ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

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
    if (ambiente !== '') dati.ambiente = ambiente
    if (taParsed !== null) dati.ta = taParsed
    if (tgParsed !== null) dati.tg = tgParsed
    if (tnwParsed !== null) dati.tnw = tnwParsed
    if (urParsed !== null) dati.ur = urParsed
    if (vaParsed !== null) dati.va = vaParsed
    if (wbgt !== null) dati.wbgt = Math.round(wbgt * 100) / 100
    if (attivita !== '') dati.attivita_metabolica = attivita
    if (vestiario !== '') dati.vestiario = vestiario
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
          <label htmlFor="mc-durata" style={styles.label}>Durata</label>
          <input id="mc-durata" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 30'" disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(durata ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
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
          <label style={styles.label}>Ambiente</label>
          <div style={styles.radioGroup}>
            {(['indoor', 'outdoor'] as const).map((opt) => (
              <button key={opt} type="button" onClick={() => setAmbiente(ambiente === opt ? '' : opt)} disabled={saving}
                style={{ ...styles.radioBtn, ...(ambiente === opt ? styles.radioBtnActive : {}) }}>
                {opt}
              </button>
            ))}
          </div>
          {ambiente === 'outdoor' && (
            <div style={styles.helperText}>WBGT outdoor = 0.7·Tnw + 0.2·Tg + 0.1·Ta</div>
          )}
          {ambiente === 'indoor' && (
            <div style={styles.helperText}>WBGT indoor = 0.7·Tnw + 0.3·Tg</div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-ta" style={styles.label}>Temperatura aria Ta (°C)</label>
          <input id="mc-ta" type="text" value={ta} onChange={(e) => setTa(e.target.value)} placeholder="es. 28,5" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(ta ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-tg" style={styles.label}>Temperatura globotermometro Tg (°C)</label>
          <input id="mc-tg" type="text" value={tg} onChange={(e) => setTg(e.target.value)} placeholder="es. 32,0" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(tg ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-tnw" style={styles.label}>Temperatura bulbo umido naturale Tnw (°C)</label>
          <input id="mc-tnw" type="text" value={tnw} onChange={(e) => setTnw(e.target.value)} placeholder="es. 24,3" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(tnw ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-ur" style={styles.label}>Umidità relativa UR (%)</label>
          <input id="mc-ur" type="text" value={ur} onChange={(e) => setUr(e.target.value)} placeholder="es. 65" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(ur ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-va" style={styles.label}>Velocità aria Va (m/s)</label>
          <input id="mc-va" type="text" value={va} onChange={(e) => setVa(e.target.value)} placeholder="es. 0,3" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(va ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>WBGT calcolato</div>
          {wbgt !== null ? (
            <div style={styles.calcValue}>
              <strong>{(Math.round(wbgt * 100) / 100).toFixed(2).replace('.', ',')} °C</strong>
              <span style={styles.calcAsse}>{ambiente === 'outdoor' ? 'outdoor' : 'indoor'}</span>
            </div>
          ) : (
            <div style={styles.calcEmpty}>
              {ambiente === '' ? 'Seleziona ambiente per calcolare WBGT' : 'Inserisci le temperature richieste'}
            </div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-att" style={styles.label}>Attività metabolica</label>
          <select id="mc-att" value={attivita} onChange={(e) => setAttivita(e.target.value as Attivita)} disabled={saving}
            style={{ ...styles.input, ...(attivita ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            {ATTIVITA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-ves" style={styles.label}>Vestiario</label>
          <select id="mc-ves" value={vestiario} onChange={(e) => setVestiario(e.target.value as Vestiario)} disabled={saving}
            style={{ ...styles.input, ...(vestiario ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            {VESTIARIO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="mc-note" style={styles.label}>Note</label>
          <textarea id="mc-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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
    </>
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
  selectorBtn: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxSizing: 'border-box' },
  selectorBtnFilled: { borderColor: 'var(--accent)' },
  selectorValue: { color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 },
  selectorPlaceholder: { color: 'var(--text-tertiary)', flex: 1, marginRight: 8 },
  selectorChevron: { color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 },
  radioGroup: { display: 'flex', gap: 6 },
  radioBtn: { flex: 1, background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)', padding: '8px 10px', borderRadius: 18, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textTransform: 'capitalize' },
  radioBtnActive: { background: 'var(--accent)', color: 'var(--text-on-accent)', borderColor: 'var(--accent)' },
  calcBox: { background: 'var(--bg-toggle)', borderWidth: '0.5px', borderStyle: 'dashed', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 },
  calcLabel: { fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  calcValue: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 16, color: 'var(--text-primary)' },
  calcAsse: { fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' },
  calcEmpty: { fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' },
}
