import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraHavModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type Impugnatura = '' | 'dx' | 'sx' | 'anteriore' | 'posteriore' | 'altro'

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

function calcolaAwSum(awX: number | null, awY: number | null, awZ: number | null): number | null {
  if (awX === null && awY === null && awZ === null) return null
  const x = awX ?? 0
  const y = awY ?? 0
  const z = awZ ?? 0
  return Math.sqrt(x * x + y * y + z * z)
}

export default function MisuraHavModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraHavModalProps) {
  const [durata, setDurata] = useState('')
  const [utensile, setUtensile] = useState('')
  const [matricola, setMatricola] = useState('')
  const [impugnatura, setImpugnatura] = useState<Impugnatura>('')
  const [impugnaturaAltro, setImpugnaturaAltro] = useState('')
  const [alimentazione, setAlimentazione] = useState('')
  const [accessorio, setAccessorio] = useState('')
  const [faseId, setFaseId] = useState<string | null>(null)
  const [awX, setAwX] = useState('')
  const [awY, setAwY] = useState('')
  const [awZ, setAwZ] = useState('')
  const [temp, setTemp] = useState('')
  const [note, setNote] = useState('')

  const [faseModalOpen, setFaseModalOpen] = useState(false)

  const [misuraIdCorrente, setMisuraIdCorrente] = useState<string | null>(
    misuraDaModificare?.id ?? null
  )
  const [numeroMisuraCorrente, setNumeroMisuraCorrente] = useState<number | undefined>(
    misuraDaModificare?.numero
  )

  const isModifica = misuraIdCorrente != null

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
      utensile: (d.utensile as string) ?? '',
      matricola: (d.matricola as string) ?? '',
      impugnatura: (d.impugnatura as Impugnatura) ?? '',
      impugnaturaAltro: (d.impugnatura_altro as string) ?? '',
      alimentazione: (d.alimentazione as string) ?? '',
      accessorio: (d.accessorio as string) ?? '',
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
        setDurata(initialSnapshot.durata)
        setUtensile(initialSnapshot.utensile)
        setMatricola(initialSnapshot.matricola)
        setImpugnatura(initialSnapshot.impugnatura)
        setImpugnaturaAltro(initialSnapshot.impugnaturaAltro)
        setAlimentazione(initialSnapshot.alimentazione)
        setAccessorio(initialSnapshot.accessorio)
        setFaseId(initialSnapshot.faseId)
        setAwX(initialSnapshot.awX)
        setAwY(initialSnapshot.awY)
        setAwZ(initialSnapshot.awZ)
        setTemp(initialSnapshot.temp)
        setNote(initialSnapshot.note)
      } else {
        setDurata(''); setUtensile(''); setMatricola(''); setImpugnatura(''); setImpugnaturaAltro('')
        setAlimentazione(''); setAccessorio(''); setFaseId(null)
        setAwX(''); setAwY(''); setAwZ(''); setTemp(''); setNote('')
      }
      setFaseModalOpen(false)
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

  const faseNome = useMemo(() => fasi.find((f) => f.id === faseId)?.valore ?? null, [fasi, faseId])

  const awXParsed = parseNumeroIT(awX)
  const awYParsed = parseNumeroIT(awY)
  const awZParsed = parseNumeroIT(awZ)
  const awSum = calcolaAwSum(awXParsed, awYParsed, awZParsed)

  const isValid = (awXParsed !== null) || (awYParsed !== null) || (awZParsed !== null)

  const isDirty = isModifica && initialSnapshot
    ? (
      durata !== initialSnapshot.durata || utensile !== initialSnapshot.utensile ||
      matricola !== initialSnapshot.matricola || impugnatura !== initialSnapshot.impugnatura ||
      impugnaturaAltro !== initialSnapshot.impugnaturaAltro ||
      alimentazione !== initialSnapshot.alimentazione || accessorio !== initialSnapshot.accessorio ||
      faseId !== initialSnapshot.faseId ||
      awX !== initialSnapshot.awX || awY !== initialSnapshot.awY || awZ !== initialSnapshot.awZ ||
      temp !== initialSnapshot.temp || note !== initialSnapshot.note
    )
    : (
      durata !== '' || utensile !== '' || matricola !== '' || impugnatura !== '' ||
      impugnaturaAltro !== '' || alimentazione !== '' || accessorio !== '' || faseId !== null ||
      awX !== '' || awY !== '' || awZ !== '' || temp !== '' || note !== ''
    )

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (durata.trim()) dati.durata = durata.trim()
    if (utensile.trim()) dati.utensile = utensile.trim()
    if (matricola.trim()) dati.matricola = matricola.trim()
    if (impugnatura !== '') {
      dati.impugnatura = impugnatura
      if (impugnatura === 'altro' && impugnaturaAltro.trim()) {
        dati.impugnatura_altro = impugnaturaAltro.trim()
      }
    }
    if (alimentazione.trim()) dati.alimentazione = alimentazione.trim()
    if (accessorio.trim()) dati.accessorio = accessorio.trim()
    if (faseId) {
      dati.fase_id = faseId
      dati.fase_nome = faseNome ?? ''
    }
    if (awXParsed !== null) dati.aw_x = awXParsed
    if (awYParsed !== null) dati.aw_y = awYParsed
    if (awZParsed !== null) dati.aw_z = awZParsed
    if (awSum !== null) dati.aw_sum = Math.round(awSum * 100) / 100
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
          <label htmlFor="hav-durata" style={styles.label}>Durata</label>
          <input id="hav-durata" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 2' oppure 00:30:00" disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(durata ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="hav-ute" style={styles.label}>Utensile</label>
          <input id="hav-ute" type="text" value={utensile} onChange={(e) => setUtensile(e.target.value)} placeholder="es. Smerigliatrice" disabled={saving} maxLength={80}
            style={{ ...styles.input, ...(utensile ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="hav-mat" style={styles.label}>Matricola</label>
          <input id="hav-mat" type="text" value={matricola} onChange={(e) => setMatricola(e.target.value)} placeholder="opzionale" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(matricola ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="hav-imp" style={styles.label}>Impugnatura</label>
          <select id="hav-imp" value={impugnatura} onChange={(e) => setImpugnatura(e.target.value as Impugnatura)} disabled={saving}
            style={{ ...styles.input, ...(impugnatura ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            <option value="">— seleziona —</option>
            <option value="dx">DX</option>
            <option value="sx">SX</option>
            <option value="anteriore">Anteriore</option>
            <option value="posteriore">Posteriore</option>
            <option value="altro">Altro</option>
          </select>
          {impugnatura === 'altro' && (
            <input
              type="text"
              value={impugnaturaAltro}
              onChange={(e) => setImpugnaturaAltro(e.target.value)}
              placeholder="Specifica impugnatura"
              disabled={saving}
              maxLength={50}
              style={{ ...styles.input, ...(impugnaturaAltro ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}), marginTop: 8 }}
            />
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="hav-ali" style={styles.label}>Alimentazione</label>
          <input id="hav-ali" type="text" value={alimentazione} onChange={(e) => setAlimentazione(e.target.value)} placeholder="es. elettrica" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(alimentazione ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="hav-acc" style={styles.label}>Accessorio eventuale</label>
          <input id="hav-acc" type="text" value={accessorio} onChange={(e) => setAccessorio(e.target.value)} placeholder="opzionale" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(accessorio ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
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
          <label style={styles.label}>Valori a<sub>w</sub> (m/s²) <span style={styles.required}>*</span></label>
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
          <div style={styles.helperText}>Almeno un valore richiesto per il calcolo A(w)sum</div>
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>A(w)sum calcolato</div>
          {awSum !== null ? (
            <div style={styles.calcValue}>
              <strong>{(Math.round(awSum * 100) / 100).toFixed(2).replace('.', ',')} m/s²</strong>
              <span style={styles.calcAsse}>√(X² + Y² + Z²)</span>
            </div>
          ) : (
            <div style={styles.calcEmpty}>Inserisci almeno un valore X, Y o Z</div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="hav-temp" style={styles.label}>Temperatura</label>
          <input id="hav-temp" type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="es. 22°C" disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(temp ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="hav-note" style={styles.label}>Note</label>
          <textarea id="hav-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
            style={{ ...styles.textarea, ...(note ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />
        </div>
      </MisuraModalShell>

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
