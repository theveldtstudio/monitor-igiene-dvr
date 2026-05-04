import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraGasModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type TipoPrelievo = '' | 'personale' | 'ambientale' | 'puntuale'

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

export default function MisuraGasModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraGasModalProps) {
  const [tempoPrelievo, setTempoPrelievo] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [macchineIds, setMacchineIds] = useState<string[]>([])
  const [tipoPrelievo, setTipoPrelievo] = useState<TipoPrelievo>('')
  const [no2, setNo2] = useState('')
  const [no, setNo] = useState('')
  const [co, setCo] = useState('')
  const [co2, setCo2] = useState('')
  const [h2s, setH2s] = useState('')
  const [o2, setO2] = useState('')
  const [altroGasNome, setAltroGasNome] = useState('')
  const [altroGasValore, setAltroGasValore] = useState('')
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
      tempoPrelievo: (d.tempo_prelievo as string) ?? '',
      postazioneId: (d.postazione_id as string) ?? null,
      faseId: (d.fase_id as string) ?? null,
      macchineIds: (d.macchine_ids as string[]) ?? [],
      tipoPrelievo: (d.tipo_prelievo as TipoPrelievo) ?? '',
      no2: numToString(d.no2),
      no: numToString(d.no),
      co: numToString(d.co),
      co2: numToString(d.co2),
      h2s: numToString(d.h2s),
      o2: numToString(d.o2),
      altroGasNome: (d.altro_gas_nome as string) ?? '',
      altroGasValore: numToString(d.altro_gas_valore),
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setTempoPrelievo(initialSnapshot.tempoPrelievo)
        setPostazioneId(initialSnapshot.postazioneId)
        setFaseId(initialSnapshot.faseId)
        setMacchineIds(initialSnapshot.macchineIds)
        setTipoPrelievo(initialSnapshot.tipoPrelievo)
        setNo2(initialSnapshot.no2); setNo(initialSnapshot.no); setCo(initialSnapshot.co)
        setCo2(initialSnapshot.co2); setH2s(initialSnapshot.h2s); setO2(initialSnapshot.o2)
        setAltroGasNome(initialSnapshot.altroGasNome)
        setAltroGasValore(initialSnapshot.altroGasValore)
        setNote(initialSnapshot.note)
      } else {
        setTempoPrelievo(''); setPostazioneId(null); setFaseId(null); setMacchineIds([])
        setTipoPrelievo('')
        setNo2(''); setNo(''); setCo(''); setCo2(''); setH2s(''); setO2('')
        setAltroGasNome(''); setAltroGasValore(''); setNote('')
      }
      setPostazioneModalOpen(false); setFaseModalOpen(false); setMacchineModalOpen(false)
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

  const postazioneNome = useMemo(() => postazioni.find((p) => p.id === postazioneId)?.valore ?? null, [postazioni, postazioneId])
  const faseNome = useMemo(() => fasi.find((f) => f.id === faseId)?.valore ?? null, [fasi, faseId])
  const macchineNomi = useMemo(() => macchine.filter((m) => macchineIds.includes(m.id)).map((m) => m.valore), [macchine, macchineIds])

  const no2Parsed = parseNumeroIT(no2)
  const noParsed = parseNumeroIT(no)
  const coParsed = parseNumeroIT(co)
  const co2Parsed = parseNumeroIT(co2)
  const h2sParsed = parseNumeroIT(h2s)
  const o2Parsed = parseNumeroIT(o2)
  const altroValoreParsed = parseNumeroIT(altroGasValore)

  const isAlmenoUnCampoCompilato = (
    tempoPrelievo !== '' || postazioneId !== null || faseId !== null || macchineIds.length > 0 ||
    tipoPrelievo !== '' ||
    no2 !== '' || no !== '' || co !== '' || co2 !== '' || h2s !== '' || o2 !== '' ||
    altroGasNome !== '' || altroGasValore !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      tempoPrelievo !== initialSnapshot.tempoPrelievo ||
      postazioneId !== initialSnapshot.postazioneId || faseId !== initialSnapshot.faseId ||
      JSON.stringify(macchineIds) !== JSON.stringify(initialSnapshot.macchineIds) ||
      tipoPrelievo !== initialSnapshot.tipoPrelievo ||
      no2 !== initialSnapshot.no2 || no !== initialSnapshot.no || co !== initialSnapshot.co ||
      co2 !== initialSnapshot.co2 || h2s !== initialSnapshot.h2s || o2 !== initialSnapshot.o2 ||
      altroGasNome !== initialSnapshot.altroGasNome || altroGasValore !== initialSnapshot.altroGasValore ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (tempoPrelievo.trim()) dati.tempo_prelievo = tempoPrelievo.trim()
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
    if (tipoPrelievo !== '') dati.tipo_prelievo = tipoPrelievo
    if (no2Parsed !== null) dati.no2 = no2Parsed
    if (noParsed !== null) dati.no = noParsed
    if (coParsed !== null) dati.co = coParsed
    if (co2Parsed !== null) dati.co2 = co2Parsed
    if (h2sParsed !== null) dati.h2s = h2sParsed
    if (o2Parsed !== null) dati.o2 = o2Parsed
    if (altroGasNome.trim()) dati.altro_gas_nome = altroGasNome.trim()
    if (altroValoreParsed !== null) dati.altro_gas_valore = altroValoreParsed
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
          <label htmlFor="g-tp" style={styles.label}>Tempo prelievo</label>
          <input id="g-tp" type="text" value={tempoPrelievo} onChange={(e) => setTempoPrelievo(e.target.value)} placeholder="es. 15' o puntuale" disabled={saving} maxLength={30}
            style={{ ...styles.input, ...(tempoPrelievo ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
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
          <label style={styles.label}>Macchine/impianti{macchineIds.length > 0 ? ` (${macchineIds.length})` : ''}</label>
          <button type="button" onClick={() => setMacchineModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(macchineIds.length > 0 ? styles.selectorBtnFilled : {}) }}>
            <span style={macchineIds.length > 0 ? styles.selectorValue : styles.selectorPlaceholder}>
              {macchineIds.length > 0 ? macchineNomi.join(', ') : 'Seleziona macchine'}
            </span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label htmlFor="g-tipo" style={styles.label}>Tipo prelievo</label>
          <select id="g-tipo" value={tipoPrelievo} onChange={(e) => setTipoPrelievo(e.target.value as TipoPrelievo)} disabled={saving}
            style={{ ...styles.input, ...(tipoPrelievo ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            <option value="">— seleziona —</option>
            <option value="personale">Personale</option>
            <option value="ambientale">Ambientale</option>
            <option value="puntuale">Puntuale</option>
          </select>
        </div>

        <div style={styles.sectionHeader}>Concentrazioni gas</div>

        <div style={styles.gasGrid}>
          <div style={styles.gasCell}>
            <label htmlFor="g-no2" style={styles.gasLabel}>NO₂</label>
            <input id="g-no2" type="text" value={no2} onChange={(e) => setNo2(e.target.value)} placeholder="ppm" disabled={saving} inputMode="decimal"
              style={{ ...styles.gasInput, ...(no2 ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          </div>
          <div style={styles.gasCell}>
            <label htmlFor="g-no" style={styles.gasLabel}>NO</label>
            <input id="g-no" type="text" value={no} onChange={(e) => setNo(e.target.value)} placeholder="ppm" disabled={saving} inputMode="decimal"
              style={{ ...styles.gasInput, ...(no ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          </div>
          <div style={styles.gasCell}>
            <label htmlFor="g-co" style={styles.gasLabel}>CO</label>
            <input id="g-co" type="text" value={co} onChange={(e) => setCo(e.target.value)} placeholder="ppm" disabled={saving} inputMode="decimal"
              style={{ ...styles.gasInput, ...(co ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          </div>
          <div style={styles.gasCell}>
            <label htmlFor="g-co2" style={styles.gasLabel}>CO₂</label>
            <input id="g-co2" type="text" value={co2} onChange={(e) => setCo2(e.target.value)} placeholder="% vol o ppm" disabled={saving} inputMode="decimal"
              style={{ ...styles.gasInput, ...(co2 ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          </div>
          <div style={styles.gasCell}>
            <label htmlFor="g-h2s" style={styles.gasLabel}>H₂S</label>
            <input id="g-h2s" type="text" value={h2s} onChange={(e) => setH2s(e.target.value)} placeholder="ppm" disabled={saving} inputMode="decimal"
              style={{ ...styles.gasInput, ...(h2s ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          </div>
          <div style={styles.gasCell}>
            <label htmlFor="g-o2" style={styles.gasLabel}>O₂</label>
            <input id="g-o2" type="text" value={o2} onChange={(e) => setO2(e.target.value)} placeholder="% vol" disabled={saving} inputMode="decimal"
              style={{ ...styles.gasInput, ...(o2 ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Altro gas</label>
          <div style={styles.altroGrid}>
            <input type="text" value={altroGasNome} onChange={(e) => setAltroGasNome(e.target.value)} placeholder="nome (es. SO₂)" disabled={saving} maxLength={30}
              style={{ ...styles.input, ...(altroGasNome ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
            <input type="text" value={altroGasValore} onChange={(e) => setAltroGasValore(e.target.value)} placeholder="valore" disabled={saving} inputMode="decimal"
              style={{ ...styles.input, ...(altroGasValore ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          </div>
        </div>

        <div style={styles.field}>
          <label htmlFor="g-note" style={styles.label}>Note</label>
          <textarea id="g-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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
  input: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 60 },
  inputFilled: { borderColor: 'var(--accent)' },
  inputDisabled: { background: 'var(--bg-toggle)', opacity: 0.7, cursor: 'not-allowed' },
  selectorBtn: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxSizing: 'border-box' },
  selectorBtnFilled: { borderColor: 'var(--accent)' },
  selectorValue: { color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 },
  selectorPlaceholder: { color: 'var(--text-tertiary)', flex: 1, marginRight: 8 },
  selectorChevron: { color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 },
  sectionHeader: { fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 8, marginBottom: 8, paddingBottom: 4, borderBottomWidth: '0.5px', borderBottomStyle: 'solid', borderBottomColor: 'var(--border)' },
  gasGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  gasCell: { display: 'flex', flexDirection: 'column', gap: 4 },
  gasLabel: { fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' },
  gasInput: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  altroGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 },
}
