import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraAcquaModalProps {
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

export default function MisuraAcquaModal({ open, onClose, onSaved, campagnaId, misuraDaModificare }: MisuraAcquaModalProps) {
  const [puntoMonitoraggio, setPuntoMonitoraggio] = useState('')
  const [ph, setPh] = useState('')
  const [conducibilita, setConducibilita] = useState('')
  const [tAcqua, setTAcqua] = useState('')
  const [tAmbiente, setTAmbiente] = useState('')
  const [o2Perc, setO2Perc] = useState('')
  const [o2MgL, setO2MgL] = useState('')
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
      puntoMonitoraggio: (d.punto_monitoraggio as string) ?? '',
      ph: numToString(d.ph),
      conducibilita: numToString(d.conducibilita),
      tAcqua: numToString(d.t_acqua),
      tAmbiente: numToString(d.t_ambiente),
      o2Perc: numToString(d.o2_perc),
      o2MgL: numToString(d.o2_mg_l),
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setPuntoMonitoraggio(initialSnapshot.puntoMonitoraggio)
        setPh(initialSnapshot.ph)
        setConducibilita(initialSnapshot.conducibilita)
        setTAcqua(initialSnapshot.tAcqua)
        setTAmbiente(initialSnapshot.tAmbiente)
        setO2Perc(initialSnapshot.o2Perc)
        setO2MgL(initialSnapshot.o2MgL)
        setNote(initialSnapshot.note)
      } else {
        setPuntoMonitoraggio('')
        setPh(''); setConducibilita(''); setTAcqua(''); setTAmbiente('')
        setO2Perc(''); setO2MgL(''); setNote('')
      }
      resetError()
    }
  }, [open, initialSnapshot, resetError])

  useEffect(() => {
    if (open) {
      setMisuraIdCorrente(misuraDaModificare?.id ?? null)
      setNumeroMisuraCorrente(misuraDaModificare?.numero)
    } else {
      setMisuraIdCorrente(null)
      setNumeroMisuraCorrente(undefined)
    }
  }, [open, misuraDaModificare?.id, misuraDaModificare?.numero])

  const phParsed = parseNumeroIT(ph)
  const conducibilitaParsed = parseNumeroIT(conducibilita)
  const tAcquaParsed = parseNumeroIT(tAcqua)
  const tAmbienteParsed = parseNumeroIT(tAmbiente)
  const o2PercParsed = parseNumeroIT(o2Perc)
  const o2MgLParsed = parseNumeroIT(o2MgL)

  const isAlmenoUnCampoCompilato = (
    puntoMonitoraggio !== '' || ph !== '' || conducibilita !== '' ||
    tAcqua !== '' || tAmbiente !== '' || o2Perc !== '' || o2MgL !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      puntoMonitoraggio !== initialSnapshot.puntoMonitoraggio ||
      ph !== initialSnapshot.ph || conducibilita !== initialSnapshot.conducibilita ||
      tAcqua !== initialSnapshot.tAcqua || tAmbiente !== initialSnapshot.tAmbiente ||
      o2Perc !== initialSnapshot.o2Perc || o2MgL !== initialSnapshot.o2MgL ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (puntoMonitoraggio.trim()) dati.punto_monitoraggio = puntoMonitoraggio.trim()
    if (phParsed !== null) dati.ph = phParsed
    if (conducibilitaParsed !== null) dati.conducibilita = conducibilitaParsed
    if (tAcquaParsed !== null) dati.t_acqua = tAcquaParsed
    if (tAmbienteParsed !== null) dati.t_ambiente = tAmbienteParsed
    if (o2PercParsed !== null) dati.o2_perc = o2PercParsed
    if (o2MgLParsed !== null) dati.o2_mg_l = o2MgLParsed
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
        <label htmlFor="aq-pm" style={styles.label}>Punto monitoraggio</label>
        <input id="aq-pm" type="text" value={puntoMonitoraggio} onChange={(e) => setPuntoMonitoraggio(e.target.value)} placeholder='es. "Pozzo 1" o "Scarico vasca"' disabled={saving} maxLength={120}
          style={{ ...styles.input, ...(puntoMonitoraggio ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
      </div>

      <div style={styles.sectionHeader}>Parametri</div>

      <div style={styles.grid}>
        <div style={styles.cell}>
          <label htmlFor="aq-ph" style={styles.label}>pH</label>
          <input id="aq-ph" type="text" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="es. 7,2" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(ph ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="aq-cond" style={styles.label}>Conducibilità</label>
          <input id="aq-cond" type="text" value={conducibilita} onChange={(e) => setConducibilita(e.target.value)} placeholder="μS/cm" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(conducibilita ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="aq-ta" style={styles.label}>T acqua</label>
          <input id="aq-ta" type="text" value={tAcqua} onChange={(e) => setTAcqua(e.target.value)} placeholder="°C" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(tAcqua ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="aq-tamb" style={styles.label}>T ambiente</label>
          <input id="aq-tamb" type="text" value={tAmbiente} onChange={(e) => setTAmbiente(e.target.value)} placeholder="°C" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(tAmbiente ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="aq-o2p" style={styles.label}>O₂ %</label>
          <input id="aq-o2p" type="text" value={o2Perc} onChange={(e) => setO2Perc(e.target.value)} placeholder="% saturazione" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(o2Perc ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="aq-o2m" style={styles.label}>O₂ mg/l</label>
          <input id="aq-o2m" type="text" value={o2MgL} onChange={(e) => setO2MgL(e.target.value)} placeholder="mg/l" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(o2MgL ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
      </div>

      <div style={styles.field}>
        <label htmlFor="aq-note" style={styles.label}>Note</label>
        <textarea id="aq-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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
  sectionHeader: { fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 8, marginBottom: 8, paddingBottom: 4, borderBottomWidth: '0.5px', borderBottomStyle: 'solid', borderBottomColor: 'var(--border)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  cell: { display: 'flex', flexDirection: 'column', gap: 0 },
}
