import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraBiologicoModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

interface UfcParsed {
  isSottoSoglia: boolean
  valore: number | null
  raw: string
}

function parseNumeroIT(s: string): number | null {
  const trimmed = s.trim()
  if (trimmed === '') return null
  const normalized = trimmed.replace(',', '.')
  const n = Number(normalized)
  if (!isFinite(n)) return null
  return n
}

function parseUfc(s: string): UfcParsed {
  const trimmed = s.trim()
  if (trimmed === '') return { isSottoSoglia: false, valore: null, raw: '' }
  if (trimmed.startsWith('<')) {
    const numPart = trimmed.slice(1).trim().replace(',', '.')
    const n = Number(numPart)
    return { isSottoSoglia: true, valore: isFinite(n) ? n : null, raw: trimmed }
  }
  const normalized = trimmed.replace(',', '.')
  const n = Number(normalized)
  return { isSottoSoglia: false, valore: isFinite(n) ? n : null, raw: trimmed }
}

function numToString(n: unknown): string {
  if (typeof n !== 'number' || !isFinite(n)) return ''
  return String(n).replace('.', ',')
}

export default function MisuraBiologicoModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraBiologicoModalProps) {
  const [codiceFiltro, setCodiceFiltro] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [macchineIds, setMacchineIds] = useState<string[]>([])
  const [tempoPrelievo, setTempoPrelievo] = useState('')
  const [volumeAspirato, setVolumeAspirato] = useState('')
  const [conta22Raw, setConta22Raw] = useState('')
  const [conta36Raw, setConta36Raw] = useState('')
  const [muffeRaw, setMuffeRaw] = useState('')
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
      codiceFiltro: (d.codice_filtro as string) ?? '',
      postazioneId: (d.postazione_id as string) ?? null,
      faseId: (d.fase_id as string) ?? null,
      macchineIds: (d.macchine_ids as string[]) ?? [],
      tempoPrelievo: (d.tempo_prelievo as string) ?? '',
      volumeAspirato: numToString(d.volume_aspirato),
      conta22Raw: (d.conta_22_raw as string) ?? '',
      conta36Raw: (d.conta_36_raw as string) ?? '',
      muffeRaw: (d.muffe_lieviti_raw as string) ?? '',
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setCodiceFiltro(initialSnapshot.codiceFiltro)
        setPostazioneId(initialSnapshot.postazioneId)
        setFaseId(initialSnapshot.faseId)
        setMacchineIds(initialSnapshot.macchineIds)
        setTempoPrelievo(initialSnapshot.tempoPrelievo)
        setVolumeAspirato(initialSnapshot.volumeAspirato)
        setConta22Raw(initialSnapshot.conta22Raw)
        setConta36Raw(initialSnapshot.conta36Raw)
        setMuffeRaw(initialSnapshot.muffeRaw)
        setNote(initialSnapshot.note)
      } else {
        setCodiceFiltro(''); setPostazioneId(null); setFaseId(null); setMacchineIds([])
        setTempoPrelievo(''); setVolumeAspirato('')
        setConta22Raw(''); setConta36Raw(''); setMuffeRaw(''); setNote('')
      }
      setPostazioneModalOpen(false); setFaseModalOpen(false); setMacchineModalOpen(false)
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
  const macchineNomi = useMemo(() => macchine.filter((m) => macchineIds.includes(m.id)).map((m) => m.valore), [macchine, macchineIds])

  const volumeParsed = parseNumeroIT(volumeAspirato)
  const conta22Parsed = parseUfc(conta22Raw)
  const conta36Parsed = parseUfc(conta36Raw)
  const muffeParsed = parseUfc(muffeRaw)

  const isAlmenoUnCampoCompilato = (
    codiceFiltro !== '' || postazioneId !== null || faseId !== null || macchineIds.length > 0 ||
    tempoPrelievo !== '' || volumeAspirato !== '' ||
    conta22Raw !== '' || conta36Raw !== '' || muffeRaw !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      codiceFiltro !== initialSnapshot.codiceFiltro ||
      postazioneId !== initialSnapshot.postazioneId || faseId !== initialSnapshot.faseId ||
      JSON.stringify(macchineIds) !== JSON.stringify(initialSnapshot.macchineIds) ||
      tempoPrelievo !== initialSnapshot.tempoPrelievo ||
      volumeAspirato !== initialSnapshot.volumeAspirato ||
      conta22Raw !== initialSnapshot.conta22Raw || conta36Raw !== initialSnapshot.conta36Raw ||
      muffeRaw !== initialSnapshot.muffeRaw || note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (codiceFiltro.trim()) dati.codice_filtro = codiceFiltro.trim()
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
    if (tempoPrelievo.trim()) dati.tempo_prelievo = tempoPrelievo.trim()
    if (volumeParsed !== null) dati.volume_aspirato = volumeParsed

    if (conta22Raw.trim()) {
      dati.conta_22_raw = conta22Raw.trim()
      if (conta22Parsed.valore !== null) {
        dati.conta_22 = conta22Parsed.valore
        dati.conta_22_sotto_soglia = conta22Parsed.isSottoSoglia
      }
    }
    if (conta36Raw.trim()) {
      dati.conta_36_raw = conta36Raw.trim()
      if (conta36Parsed.valore !== null) {
        dati.conta_36 = conta36Parsed.valore
        dati.conta_36_sotto_soglia = conta36Parsed.isSottoSoglia
      }
    }
    if (muffeRaw.trim()) {
      dati.muffe_lieviti_raw = muffeRaw.trim()
      if (muffeParsed.valore !== null) {
        dati.muffe_lieviti = muffeParsed.valore
        dati.muffe_lieviti_sotto_soglia = muffeParsed.isSottoSoglia
      }
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
          <label htmlFor="bio-cod" style={styles.label}>Codice filtro</label>
          <input id="bio-cod" type="text" value={codiceFiltro} onChange={(e) => setCodiceFiltro(e.target.value)} placeholder="es. B-01" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(codiceFiltro ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Postazione di misura</label>
          <button type="button" onClick={() => setPostazioneModalOpen(true)} disabled={saving}
            style={{ ...styles.selectorBtn, ...(postazioneNome ? styles.selectorBtnFilled : {}) }}>
            <span style={postazioneNome ? styles.selectorValue : styles.selectorPlaceholder}>{postazioneNome ?? 'Seleziona postazione'}</span>
            <span style={styles.selectorChevron}>›</span>
          </button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Fase lavorativa / Mansione</label>
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
          <label htmlFor="bio-tp" style={styles.label}>Tempo prelievo</label>
          <input id="bio-tp" type="text" value={tempoPrelievo} onChange={(e) => setTempoPrelievo(e.target.value)} placeholder="es. 5' o 10 minuti" disabled={saving} maxLength={30}
            style={{ ...styles.input, ...(tempoPrelievo ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="bio-vol" style={styles.label}>Volume aspirato (l)</label>
          <input id="bio-vol" type="text" value={volumeAspirato} onChange={(e) => setVolumeAspirato(e.target.value)} placeholder="es. 100 o 1000" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(volumeAspirato ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          <div style={styles.helperText}>Volume standard SAS (display dello strumento)</div>
        </div>

        <div style={styles.sectionHeader}>Conte UFC</div>

        <div style={styles.field}>
          <label htmlFor="bio-c22" style={styles.label}>Conta totale 22°C (UFC/m³)</label>
          <input id="bio-c22" type="text" value={conta22Raw} onChange={(e) => setConta22Raw(e.target.value)} placeholder='es. 320 oppure "<10"' disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(conta22Raw ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="bio-c36" style={styles.label}>Conta totale 36°C (UFC/m³)</label>
          <input id="bio-c36" type="text" value={conta36Raw} onChange={(e) => setConta36Raw(e.target.value)} placeholder='es. 180 oppure "<10"' disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(conta36Raw ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="bio-muf" style={styles.label}>Muffe e lieviti (UFC/m³)</label>
          <input id="bio-muf" type="text" value={muffeRaw} onChange={(e) => setMuffeRaw(e.target.value)} placeholder='es. 50 oppure "<10"' disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(muffeRaw ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          <div style={styles.helperText}>Usa "&lt;" per limite di rilevabilità (es. &lt;10)</div>
        </div>

        <div style={styles.field}>
          <label htmlFor="bio-note" style={styles.label}>Note</label>
          <textarea id="bio-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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
  helperText: { fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 },
  selectorBtn: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxSizing: 'border-box' },
  selectorBtnFilled: { borderColor: 'var(--accent)' },
  selectorValue: { color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 },
  selectorPlaceholder: { color: 'var(--text-tertiary)', flex: 1, marginRight: 8 },
  selectorChevron: { color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 },
  sectionHeader: { fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 8, marginBottom: 8, paddingBottom: 4, borderBottomWidth: '0.5px', borderBottomStyle: 'solid', borderBottomColor: 'var(--border)' },
}
