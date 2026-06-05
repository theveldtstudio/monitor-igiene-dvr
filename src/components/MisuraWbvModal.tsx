import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraWbvModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type PosizioneOperatore = '' | 'seduto' | 'in piedi' | 'sdraiato' | 'altro'
type Regime = '' | 'basso' | 'medio' | 'alto'

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

interface AwMaxResult {
  awMax: number | null
  asse: 'X' | 'Y' | 'Z' | null
}

function calcolaAwMax(awX: number | null, awY: number | null, awZ: number | null, posizione: PosizioneOperatore): AwMaxResult {
  const pesoSeduto = posizione === 'seduto'
  const wx = pesoSeduto ? 1.4 : 1.0
  const wy = pesoSeduto ? 1.4 : 1.0
  const wz = 1.0
  const candidates: { val: number; asse: 'X' | 'Y' | 'Z' }[] = []
  if (awX !== null) candidates.push({ val: Math.abs(awX) * wx, asse: 'X' })
  if (awY !== null) candidates.push({ val: Math.abs(awY) * wy, asse: 'Y' })
  if (awZ !== null) candidates.push({ val: Math.abs(awZ) * wz, asse: 'Z' })
  if (candidates.length === 0) return { awMax: null, asse: null }
  const winner = candidates.reduce((a, b) => (b.val > a.val ? b : a))
  return { awMax: winner.val, asse: winner.asse }
}

export default function MisuraWbvModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraWbvModalProps) {
  const [durata, setDurata] = useState('')
  const [macchinaId, setMacchinaId] = useState<string | null>(null)
  const [targa, setTarga] = useState('')
  const [posizione, setPosizione] = useState<PosizioneOperatore>('')
  const [regime, setRegime] = useState<Regime>('')
  const [trazione, setTrazione] = useState('')
  const [utensile, setUtensile] = useState('')
  const [faseId, setFaseId] = useState<string | null>(null)
  const [awX, setAwX] = useState('')
  const [awY, setAwY] = useState('')
  const [awZ, setAwZ] = useState('')
  const [temp, setTemp] = useState('')
  const [note, setNote] = useState('')

  const [macchinaModalOpen, setMacchinaModalOpen] = useState(false)
  const [faseModalOpen, setFaseModalOpen] = useState(false)

  const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(
    misuraDaModificare?.id ?? null
  )
  const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(
    misuraDaModificare?.numero
  )

  const isModifica = misuraIdCorrente != null

  const { risorse: macchine } = useRisorseCantiere(cantiereId, 'macchina')
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
      macchinaId: (d.macchina_id as string) ?? null,
      targa: (d.targa as string) ?? '',
      posizione: (d.posizione_operatore as PosizioneOperatore) ?? '',
      regime: (d.regime as Regime) ?? '',
      trazione: (d.trazione as string) ?? '',
      utensile: (d.utensile as string) ?? '',
      faseId: (d.fase_id as string) ?? null,
      awX: numToString(d.aw_x),
      awY: numToString(d.aw_y),
      awZ: numToString(d.aw_z),
      temp: (d.temperatura as string) ?? '',
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDurata(initialSnapshot.durata)
        setMacchinaId(initialSnapshot.macchinaId)
        setTarga(initialSnapshot.targa)
        setPosizione(initialSnapshot.posizione)
        setRegime(initialSnapshot.regime)
        setTrazione(initialSnapshot.trazione)
        setUtensile(initialSnapshot.utensile)
        setFaseId(initialSnapshot.faseId)
        setAwX(initialSnapshot.awX)
        setAwY(initialSnapshot.awY)
        setAwZ(initialSnapshot.awZ)
        setTemp(initialSnapshot.temp)
        setNote(initialSnapshot.note)
      } else {
        setDurata(''); setMacchinaId(null); setTarga(''); setPosizione(''); setRegime('')
        setTrazione(''); setUtensile(''); setFaseId(null)
        setAwX(''); setAwY(''); setAwZ(''); setTemp(''); setNote('')
      }
      setMacchinaModalOpen(false); setFaseModalOpen(false)
    }
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

  const macchinaNome = useMemo(() => macchine.find((m) => m.id === macchinaId)?.valore ?? null, [macchine, macchinaId])
  const faseNome = useMemo(() => fasi.find((f) => f.id === faseId)?.valore ?? null, [fasi, faseId])

  const awXParsed = parseNumeroIT(awX)
  const awYParsed = parseNumeroIT(awY)
  const awZParsed = parseNumeroIT(awZ)
  const awCalc = calcolaAwMax(awXParsed, awYParsed, awZParsed, posizione)

  const isAlmenoUnCampoCompilato = (
    durata !== '' || macchinaId !== null || targa !== '' || posizione !== '' || regime !== ''
    || trazione !== '' || utensile !== '' || faseId !== null
    || awX !== '' || awY !== '' || awZ !== '' || temp !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      durata !== initialSnapshot.durata || macchinaId !== initialSnapshot.macchinaId ||
      targa !== initialSnapshot.targa || posizione !== initialSnapshot.posizione ||
      regime !== initialSnapshot.regime || trazione !== initialSnapshot.trazione ||
      utensile !== initialSnapshot.utensile || faseId !== initialSnapshot.faseId ||
      awX !== initialSnapshot.awX || awY !== initialSnapshot.awY || awZ !== initialSnapshot.awZ ||
      temp !== initialSnapshot.temp || note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (durata.trim()) dati.durata = durata.trim()
    if (macchinaId) {
      dati.macchina_id = macchinaId
      dati.macchina_nome = macchinaNome ?? ''
    }
    if (targa.trim()) dati.targa = targa.trim()
    if (posizione !== '') dati.posizione_operatore = posizione
    if (regime !== '') dati.regime = regime
    if (trazione.trim()) dati.trazione = trazione.trim()
    if (utensile.trim()) dati.utensile = utensile.trim()
    if (faseId) {
      dati.fase_id = faseId
      dati.fase_nome = faseNome ?? ''
    }
    if (awXParsed !== null) dati.aw_x = awXParsed
    if (awYParsed !== null) dati.aw_y = awYParsed
    if (awZParsed !== null) dati.aw_z = awZParsed
    if (awCalc.awMax !== null) {
      dati.aw_max = Math.round(awCalc.awMax * 100) / 100
      dati.aw_max_asse = awCalc.asse
    }
    if (temp.trim()) dati.temperatura = temp.trim()
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

  const handleSaveMacchina = async (id: string | null): Promise<boolean> => { setMacchinaId(id); return true }
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
          <label htmlFor="wbv-durata" style={styles.label}>Durata</label>
          <input id="wbv-durata" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 2' oppure 00:30:00" disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(durata ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Macchina</label>
          <button type="button" onClick={() => setMacchinaModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(macchinaNome ? styles.selectorBtnFilled : {}) }}>
            <span style={macchinaNome ? styles.selectorValue : styles.selectorPlaceholder}>{macchinaNome ?? 'Seleziona macchina'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label htmlFor="wbv-targa" style={styles.label}>Targa o matricola</label>
          <input id="wbv-targa" type="text" value={targa} onChange={(e) => setTarga(e.target.value)} placeholder="es. M53" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(targa ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="wbv-pos" style={styles.label}>Posizione operatore</label>
          <select id="wbv-pos" value={posizione} onChange={(e) => setPosizione(e.target.value as PosizioneOperatore)} disabled={saving}
            style={{ ...styles.input, ...(posizione ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            <option value="">— seleziona —</option>
            <option value="seduto">Seduto</option>
            <option value="in piedi">In piedi</option>
            <option value="sdraiato">Sdraiato</option>
            <option value="altro">Altro</option>
          </select>
          {posizione === 'seduto' && (
            <div style={styles.helperText}>Pesi norma ISO 2631-1: X·1.4, Y·1.4, Z·1.0</div>
          )}
          {posizione !== '' && posizione !== 'seduto' && (
            <div style={styles.helperText}>Pesi: X·1.0, Y·1.0, Z·1.0</div>
          )}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Regime</label>
          <div style={styles.radioGroup}>
            {(['basso', 'medio', 'alto'] as const).map((opt) => (
              <button key={opt} type="button" onClick={() => setRegime(regime === opt ? '' : opt)} disabled={saving}
                style={{ ...styles.radioBtn, ...(regime === opt ? styles.radioBtnActive : {}) }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <label htmlFor="wbv-tra" style={styles.label}>Trazione</label>
          <input id="wbv-tra" type="text" value={trazione} onChange={(e) => setTrazione(e.target.value)} placeholder="opzionale" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(trazione ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="wbv-ute" style={styles.label}>Utensile eventuale</label>
          <input id="wbv-ute" type="text" value={utensile} onChange={(e) => setUtensile(e.target.value)} placeholder="opzionale" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(utensile ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
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
          <label style={styles.label}>Valori a<sub>w</sub> ponderati (m/s²)</label>
          <div style={styles.tripletta}>
            <div style={styles.triplettaCell}>
              <div style={styles.triplettaAsse}>X</div>
              <input type="text" value={awX} onChange={(e) => setAwX(e.target.value)} placeholder="0,00" disabled={saving} inputMode="decimal"
                style={{ ...styles.inputCell, ...(awX ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
            </div>
            <div style={styles.triplettaCell}>
              <div style={styles.triplettaAsse}>Y</div>
              <input type="text" value={awY} onChange={(e) => setAwY(e.target.value)} placeholder="0,00" disabled={saving} inputMode="decimal"
                style={{ ...styles.inputCell, ...(awY ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
            </div>
            <div style={styles.triplettaCell}>
              <div style={styles.triplettaAsse}>Z</div>
              <input type="text" value={awZ} onChange={(e) => setAwZ(e.target.value)} placeholder="0,00" disabled={saving} inputMode="decimal"
                style={{ ...styles.inputCell, ...(awZ ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
            </div>
          </div>
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>A(w)max calcolato</div>
          {awCalc.awMax !== null ? (
            <div style={styles.calcValue}>
              <strong>{(Math.round(awCalc.awMax * 100) / 100).toFixed(2).replace('.', ',')} m/s²</strong>
              <span style={styles.calcAsse}>asse {awCalc.asse}</span>
            </div>
          ) : (
            <div style={styles.calcEmpty}>Inserisci almeno un valore X, Y o Z</div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="wbv-temp" style={styles.label}>Temperatura</label>
          <input id="wbv-temp" type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="es. 22°C" disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(temp ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="wbv-note" style={styles.label}>Note</label>
          <textarea id="wbv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
            style={{ ...styles.textarea, ...(note ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />
        </div>
      </MisuraModalShell>

      <SelezionaRisorseModal
        open={macchinaModalOpen}
        onClose={() => setMacchinaModalOpen(false)}
        onSaveSingola={handleSaveMacchina}
        modalita="singola"
        initialSelectedId={macchinaId}
        cantiereId={cantiereId}
        tipo="macchina"
        titolo="Macchina"
        labelSingolare="macchina"
        labelPlurale="macchine"
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
  tripletta: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  triplettaCell: { display: 'flex', flexDirection: 'column', gap: 4 },
  triplettaAsse: { fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, paddingLeft: 4 },
  inputCell: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', textAlign: 'center' },
  calcBox: { background: 'var(--bg-toggle)', borderWidth: '0.5px', borderStyle: 'dashed', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 },
  calcLabel: { fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  calcValue: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 16, color: 'var(--text-primary)' },
  calcAsse: { fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' },
  calcEmpty: { fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' },
}
