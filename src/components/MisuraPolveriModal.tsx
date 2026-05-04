import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import SelezionaRisorseModal from './SelezionaRisorseModal'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraPolveriModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type TipoMisura = '' | 'personale' | 'ambientale'

interface SiliceParsed {
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

function parseSilice(s: string): SiliceParsed {
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

function formatNum(n: number, decimals = 3): string {
  return (Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals).replace('.', ',')
}

export default function MisuraPolveriModal({ open, onClose, onSaved, cantiereId, campagnaId, misuraDaModificare }: MisuraPolveriModalProps) {
  const [codiceFiltro, setCodiceFiltro] = useState('')
  const [durata, setDurata] = useState('')
  const [postazioneId, setPostazioneId] = useState<string | null>(null)
  const [faseId, setFaseId] = useState<string | null>(null)
  const [macchineIds, setMacchineIds] = useState<string[]>([])
  const [tipoMisura, setTipoMisura] = useState<TipoMisura>('')
  const [temp, setTemp] = useState('')
  const [vAria, setVAria] = useState('')
  const [pompa, setPompa] = useState('')
  const [portataQ, setPortataQ] = useState('')
  const [polveri, setPolveri] = useState('')
  const [siliceRaw, setSiliceRaw] = useState('')
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
      durata: numToString(d.durata_prelievo),
      postazioneId: (d.postazione_id as string) ?? null,
      faseId: (d.fase_id as string) ?? null,
      macchineIds: (d.macchine_ids as string[]) ?? [],
      tipoMisura: (d.tipo_misura as TipoMisura) ?? '',
      temp: numToString(d.temperatura),
      vAria: numToString(d.velocita_aria),
      pompa: (d.pompa as string) ?? '',
      portataQ: numToString(d.portata_q),
      polveri: numToString(d.polveri_filtro),
      siliceRaw: (d.silice_filtro_raw as string) ?? '',
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setCodiceFiltro(initialSnapshot.codiceFiltro)
        setDurata(initialSnapshot.durata)
        setPostazioneId(initialSnapshot.postazioneId)
        setFaseId(initialSnapshot.faseId)
        setMacchineIds(initialSnapshot.macchineIds)
        setTipoMisura(initialSnapshot.tipoMisura)
        setTemp(initialSnapshot.temp)
        setVAria(initialSnapshot.vAria)
        setPompa(initialSnapshot.pompa)
        setPortataQ(initialSnapshot.portataQ)
        setPolveri(initialSnapshot.polveri)
        setSiliceRaw(initialSnapshot.siliceRaw)
        setNote(initialSnapshot.note)
      } else {
        setCodiceFiltro(''); setDurata(''); setPostazioneId(null); setFaseId(null); setMacchineIds([])
        setTipoMisura(''); setTemp(''); setVAria(''); setPompa(''); setPortataQ('')
        setPolveri(''); setSiliceRaw(''); setNote('')
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

  const durataParsed = parseNumeroIT(durata)
  const tempParsed = parseNumeroIT(temp)
  const vAriaParsed = parseNumeroIT(vAria)
  const portataParsed = parseNumeroIT(portataQ)
  const polveriParsed = parseNumeroIT(polveri)
  const siliceParsed = parseSilice(siliceRaw)

  const volume = (portataParsed !== null && durataParsed !== null) ? (portataParsed * durataParsed) / 1000 : null

  const concPolveri = (polveriParsed !== null && volume !== null && volume > 0) ? polveriParsed / volume : null

  let concSiliceLabel: string | null = null
  let concSiliceValore: number | null = null
  if (siliceParsed.valore !== null && volume !== null && volume > 0) {
    const v = siliceParsed.valore / volume
    concSiliceValore = v
    if (siliceParsed.isSottoSoglia) {
      concSiliceLabel = `<${formatNum(v)} mg/m³ (sotto soglia)`
    } else {
      concSiliceLabel = `${formatNum(v)} mg/m³`
    }
  }

  const isAlmenoUnCampoCompilato = (
    codiceFiltro !== '' || durata !== '' || postazioneId !== null || faseId !== null || macchineIds.length > 0 ||
    tipoMisura !== '' || temp !== '' || vAria !== '' || pompa !== '' || portataQ !== '' ||
    polveri !== '' || siliceRaw !== '' || note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      codiceFiltro !== initialSnapshot.codiceFiltro || durata !== initialSnapshot.durata ||
      postazioneId !== initialSnapshot.postazioneId || faseId !== initialSnapshot.faseId ||
      JSON.stringify(macchineIds) !== JSON.stringify(initialSnapshot.macchineIds) ||
      tipoMisura !== initialSnapshot.tipoMisura ||
      temp !== initialSnapshot.temp || vAria !== initialSnapshot.vAria ||
      pompa !== initialSnapshot.pompa || portataQ !== initialSnapshot.portataQ ||
      polveri !== initialSnapshot.polveri || siliceRaw !== initialSnapshot.siliceRaw ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (codiceFiltro.trim()) dati.codice_filtro = codiceFiltro.trim()
    if (durataParsed !== null) dati.durata_prelievo = durataParsed
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
    if (tipoMisura !== '') dati.tipo_misura = tipoMisura
    if (tempParsed !== null) dati.temperatura = tempParsed
    if (vAriaParsed !== null) dati.velocita_aria = vAriaParsed
    if (pompa.trim()) dati.pompa = pompa.trim()
    if (portataParsed !== null) dati.portata_q = portataParsed
    if (polveriParsed !== null) dati.polveri_filtro = polveriParsed
    if (siliceRaw.trim()) {
      dati.silice_filtro_raw = siliceRaw.trim()
      if (siliceParsed.valore !== null) {
        dati.silice_filtro_valore = siliceParsed.valore
        dati.silice_sotto_soglia = siliceParsed.isSottoSoglia
      }
    }
    if (volume !== null) dati.volume_campionato = Math.round(volume * 1000) / 1000
    if (concPolveri !== null) dati.conc_polveri = Math.round(concPolveri * 1000) / 1000
    if (concSiliceValore !== null) {
      dati.conc_silice = Math.round(concSiliceValore * 1000) / 1000
      dati.conc_silice_sotto_soglia = siliceParsed.isSottoSoglia
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
          <label htmlFor="po-cod" style={styles.label}>Codice filtro</label>
          <input id="po-cod" type="text" value={codiceFiltro} onChange={(e) => setCodiceFiltro(e.target.value)} placeholder="es. F-A1-001" disabled={saving} maxLength={50}
            style={{ ...styles.input, ...(codiceFiltro ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="po-dur" style={styles.label}>Durata prelievo (min)</label>
          <input id="po-dur" type="text" value={durata} onChange={(e) => setDurata(e.target.value)} placeholder="es. 480" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(durata ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
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
          <label htmlFor="po-tipo" style={styles.label}>Tipo di misura</label>
          <select id="po-tipo" value={tipoMisura} onChange={(e) => setTipoMisura(e.target.value as TipoMisura)} disabled={saving}
            style={{ ...styles.input, ...(tipoMisura ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            <option value="">— seleziona —</option>
            <option value="personale">Personale</option>
            <option value="ambientale">Ambientale</option>
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="po-temp" style={styles.label}>Temperatura (°C)</label>
          <input id="po-temp" type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="es. 22" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(temp ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="po-va" style={styles.label}>Velocità aria (m/s)</label>
          <input id="po-va" type="text" value={vAria} onChange={(e) => setVAria(e.target.value)} placeholder="es. 0,3" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(vAria ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="po-pompa" style={styles.label}>Pompa utilizzata</label>
          <input id="po-pompa" type="text" value={pompa} onChange={(e) => setPompa(e.target.value)} placeholder="es. Gillian GilAir 5" disabled={saving} maxLength={120}
            style={{ ...styles.input, ...(pompa ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="po-q" style={styles.label}>Portata aspirazione Q (l/min)</label>
          <input id="po-q" type="text" value={portataQ} onChange={(e) => setPortataQ(e.target.value)} placeholder="es. 2,0" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(portataQ ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>Volume campionato</div>
          {volume !== null ? (
            <div style={styles.calcValue}>
              <strong>{formatNum(volume)} m³</strong>
              <span style={styles.calcAsse}>auto: Q × durata / 1000</span>
            </div>
          ) : (
            <div style={styles.calcEmpty}>Compila Q e durata per calcolare il volume</div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="po-pol" style={styles.label}>Polveri su filtro (mg)</label>
          <input id="po-pol" type="text" value={polveri} onChange={(e) => setPolveri(e.target.value)} placeholder="es. 0,3" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(polveri ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>

        <div style={styles.field}>
          <label htmlFor="po-sil" style={styles.label}>Silice su filtro (mg)</label>
          <input id="po-sil" type="text" value={siliceRaw} onChange={(e) => setSiliceRaw(e.target.value)} placeholder='es. 0,008 oppure "<0,005"' disabled={saving} maxLength={20}
            style={{ ...styles.input, ...(siliceRaw ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
          <div style={styles.helperText}>Usa "&lt;" per limite di rilevabilità (es. &lt;0,005)</div>
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>Concentrazione polveri</div>
          {concPolveri !== null ? (
            <div style={styles.calcValue}>
              <strong>{formatNum(concPolveri)} mg/m³</strong>
              <span style={styles.calcAsse}>auto: polveri / volume</span>
            </div>
          ) : (
            <div style={styles.calcEmpty}>Compila polveri e volume per calcolare</div>
          )}
        </div>

        <div style={styles.calcBox}>
          <div style={styles.calcLabel}>Concentrazione silice</div>
          {concSiliceLabel !== null ? (
            <div style={styles.calcValue}>
              <strong>{concSiliceLabel}</strong>
            </div>
          ) : (
            <div style={styles.calcEmpty}>Compila silice e volume per calcolare</div>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="po-note" style={styles.label}>Note</label>
          <textarea id="po-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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
  calcBox: { background: 'var(--bg-toggle)', borderWidth: '0.5px', borderStyle: 'dashed', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 },
  calcLabel: { fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  calcValue: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 16, color: 'var(--text-primary)' },
  calcAsse: { fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' },
  calcEmpty: { fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' },
}
