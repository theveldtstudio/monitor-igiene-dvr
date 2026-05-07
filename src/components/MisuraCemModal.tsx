import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraCemModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type UnitaFrequenza = '' | 'Hz' | 'kHz' | 'MHz' | 'GHz'

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

export default function MisuraCemModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraCemModalProps) {
  const [durata, setDurata] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [sorgente, setSorgente] = useState('')
  const [frequenza, setFrequenza] = useState('')
  const [unitaFrequenza, setUnitaFrequenza] = useState<UnitaFrequenza>('')
  const [distanza, setDistanza] = useState('')
  const [campoE, setCampoE] = useState('')
  const [campoH, setCampoH] = useState('')
  const [induzioneB, setInduzioneB] = useState('')
  const [limite, setLimite] = useState('')
  const [indice, setIndice] = useState('')
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
      sorgente: (d.sorgente as string) ?? '',
      frequenza: numToString(d.frequenza),
      unitaFrequenza: (d.unita_frequenza as UnitaFrequenza) ?? '',
      distanza: numToString(d.distanza),
      campoE: numToString(d.campo_e),
      campoH: numToString(d.campo_h),
      induzioneB: numToString(d.induzione_b),
      limite: (d.limite_riferimento as string) ?? '',
      indice: numToString(d.indice_esposizione),
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setDurata(initialSnapshot.durata)
        setPostazioneId(initialSnapshot.postazioneId)
        setFaseId(initialSnapshot.faseId)
        setSorgente(initialSnapshot.sorgente)
        setFrequenza(initialSnapshot.frequenza)
        setUnitaFrequenza(initialSnapshot.unitaFrequenza)
        setDistanza(initialSnapshot.distanza)
        setCampoE(initialSnapshot.campoE)
        setCampoH(initialSnapshot.campoH)
        setInduzioneB(initialSnapshot.induzioneB)
        setLimite(initialSnapshot.limite)
        setIndice(initialSnapshot.indice)
        setNote(initialSnapshot.note)
      } else {
        setDurata(''); setPostazioneId(null); setFaseId(null); setSorgente('')
        setFrequenza(''); setUnitaFrequenza(''); setDistanza('')
        setCampoE(''); setCampoH(''); setInduzioneB('')
        setLimite(''); setIndice(''); setNote('')
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

  const frequenzaParsed = parseNumeroIT(frequenza)
  const distanzaParsed = parseNumeroIT(distanza)
  const campoEParsed = parseNumeroIT(campoE)
  const campoHParsed = parseNumeroIT(campoH)
  const induzioneBParsed = parseNumeroIT(induzioneB)
  const indiceParsed = parseNumeroIT(indice)

  const isAlmenoUnCampoCompilato = (
    durata !== '' || postazioneId !== null || faseId !== null || sorgente !== '' ||
    frequenza !== '' || unitaFrequenza !== '' || distanza !== '' ||
    campoE !== '' || campoH !== '' || induzioneB !== '' ||
    limite !== '' || indice !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      durata !== initialSnapshot.durata || postazioneId !== initialSnapshot.postazioneId ||
      faseId !== initialSnapshot.faseId || sorgente !== initialSnapshot.sorgente ||
      frequenza !== initialSnapshot.frequenza || unitaFrequenza !== initialSnapshot.unitaFrequenza ||
      distanza !== initialSnapshot.distanza ||
      campoE !== initialSnapshot.campoE || campoH !== initialSnapshot.campoH || induzioneB !== initialSnapshot.induzioneB ||
      limite !== initialSnapshot.limite || indice !== initialSnapshot.indice ||
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
    if (sorgente.trim()) dati.sorgente = sorgente.trim()
    if (frequenzaParsed !== null) dati.frequenza = frequenzaParsed
    if (unitaFrequenza !== '') dati.unita_frequenza = unitaFrequenza
    if (distanzaParsed !== null) dati.distanza = distanzaParsed
    if (campoEParsed !== null) dati.campo_e = campoEParsed
    if (campoHParsed !== null) dati.campo_h = campoHParsed
    if (induzioneBParsed !== null) dati.induzione_b = induzioneBParsed
    if (limite.trim()) dati.limite_riferimento = limite.trim()
    if (indiceParsed !== null) dati.indice_esposizione = indiceParsed
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
          <label htmlFor="cem-durata" style={styles.label}>Durata</label>
          <input id="cem-durata" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 30'" disabled={saving} maxLength={20}
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
          <label htmlFor="cem-sorg" style={styles.label}>Sorgente CEM</label>
          <input id="cem-sorg" type="text" value={sorgente} onChange={(e) => setSorgente(e.target.value)} placeholder="es. linea elettrica MT 20kV" disabled={saving} maxLength={120}
            style={{ ...styles.input, ...(sorgente ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Frequenza</label>
          <div style={styles.freqRow}>
            <input type="text" value={frequenza} onChange={(e) => setFrequenza(e.target.value)} placeholder="es. 50" disabled={saving} inputMode="decimal"
              style={{ ...styles.inputFreq, ...(frequenza ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
            <select value={unitaFrequenza} onChange={(e) => setUnitaFrequenza(e.target.value as UnitaFrequenza)} disabled={saving}
              style={{ ...styles.unitSelect, ...(unitaFrequenza ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
              <option value="">unità</option>
              <option value="Hz">Hz</option>
              <option value="kHz">kHz</option>
              <option value="MHz">MHz</option>
              <option value="GHz">GHz</option>
            </select>
          </div>
        </div>

        <div style={styles.field}>
          <label htmlFor="cem-dist" style={styles.label}>Distanza dalla sorgente (m)</label>
          <input id="cem-dist" type="text" value={distanza} onChange={(e) => setDistanza(e.target.value)} placeholder="es. 1,5" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(distanza ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="cem-e" style={styles.label}>Campo elettrico E (V/m)</label>
          <input id="cem-e" type="text" value={campoE} onChange={(e) => setCampoE(e.target.value)} placeholder="es. 25,3" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(campoE ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="cem-h" style={styles.label}>Campo magnetico H (A/m)</label>
          <input id="cem-h" type="text" value={campoH} onChange={(e) => setCampoH(e.target.value)} placeholder="es. 0,8" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(campoH ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="cem-b" style={styles.label}>Induzione magnetica B (μT)</label>
          <input id="cem-b" type="text" value={induzioneB} onChange={(e) => setInduzioneB(e.target.value)} placeholder="es. 12,5" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(induzioneB ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="cem-lim" style={styles.label}>Limite di riferimento</label>
          <input id="cem-lim" type="text" value={limite} onChange={(e) => setLimite(e.target.value)} placeholder='es. "100 μT" o "20 V/m"' disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(limite ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="cem-ind" style={styles.label}>Indice di esposizione (%)</label>
          <input id="cem-ind" type="text" value={indice} onChange={(e) => setIndice(e.target.value)} placeholder="es. 35" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(indice ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="cem-note" style={styles.label}>Note</label>
          <textarea id="cem-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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
  selectorBtn: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxSizing: 'border-box' },
  selectorBtnFilled: { borderColor: 'var(--accent)' },
  selectorValue: { color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 },
  selectorPlaceholder: { color: 'var(--text-tertiary)', flex: 1, marginRight: 8 },
  selectorChevron: { color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 },
  freqRow: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 },
  inputFreq: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  unitSelect: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
}
