import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import MisuraModalShell from './MisuraModalShell'
import FotoUploader from './FotoUploader'

interface MisuraMmcModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

type GiudizioPresa = '' | 'Buona' | 'Discreta' | 'Scarsa'
type FrequenzaUnita = 'atti/min' | 'atti/ora' | 'atti/turno'

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

export default function MisuraMmcModal({ open, onClose, onSaved, campagnaId, misuraDaModificare }: MisuraMmcModalProps) {
  const [carico, setCarico] = useState('')
  const [altezzaMani, setAltezzaMani] = useState('')
  const [distanzaVerticale, setDistanzaVerticale] = useState('')
  const [distanzaPesoCorpo, setDistanzaPesoCorpo] = useState('')
  const [dislocazioneAngolare, setDislocazioneAngolare] = useState('')
  const [frequenzaGesti, setFrequenzaGesti] = useState('')
  const [frequenzaUnita, setFrequenzaUnita] = useState<FrequenzaUnita>('atti/min')
  const [giudizioPresa, setGiudizioPresa] = useState<GiudizioPresa>('')
  const [nPersone, setNPersone] = useState('')

  const [forzaMantenimento, setForzaMantenimento] = useState('')
  const [spinta, setSpinta] = useState('')
  const [traino, setTraino] = useState('')

  const [distanzaTrasporto, setDistanzaTrasporto] = useState('')

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
      carico: numToString(d.carico),
      altezzaMani: numToString(d.altezza_mani),
      distanzaVerticale: numToString(d.distanza_verticale),
      distanzaPesoCorpo: numToString(d.distanza_peso_corpo),
      dislocazioneAngolare: numToString(d.dislocazione_angolare),
      frequenzaGesti: numToString(d.frequenza_gesti),
      frequenzaUnita: (d.frequenza_unita as FrequenzaUnita) ?? 'atti/min',
      giudizioPresa: (d.giudizio_presa as GiudizioPresa) ?? '',
      nPersone: numToString(d.n_persone),
      forzaMantenimento: numToString(d.forza_mantenimento),
      spinta: numToString(d.spinta),
      traino: numToString(d.traino),
      distanzaTrasporto: numToString(d.distanza_trasporto),
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setCarico(initialSnapshot.carico)
        setAltezzaMani(initialSnapshot.altezzaMani)
        setDistanzaVerticale(initialSnapshot.distanzaVerticale)
        setDistanzaPesoCorpo(initialSnapshot.distanzaPesoCorpo)
        setDislocazioneAngolare(initialSnapshot.dislocazioneAngolare)
        setFrequenzaGesti(initialSnapshot.frequenzaGesti)
        setFrequenzaUnita(initialSnapshot.frequenzaUnita)
        setGiudizioPresa(initialSnapshot.giudizioPresa)
        setNPersone(initialSnapshot.nPersone)
        setForzaMantenimento(initialSnapshot.forzaMantenimento)
        setSpinta(initialSnapshot.spinta)
        setTraino(initialSnapshot.traino)
        setDistanzaTrasporto(initialSnapshot.distanzaTrasporto)
        setNote(initialSnapshot.note)
      } else {
        setCarico(''); setAltezzaMani(''); setDistanzaVerticale(''); setDistanzaPesoCorpo('')
        setDislocazioneAngolare(''); setFrequenzaGesti(''); setFrequenzaUnita('atti/min'); setGiudizioPresa(''); setNPersone('')
        setForzaMantenimento(''); setSpinta(''); setTraino(''); setDistanzaTrasporto('')
        setNote('')
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

  const caricoParsed = parseNumeroIT(carico)
  const altezzaParsed = parseNumeroIT(altezzaMani)
  const distVerticParsed = parseNumeroIT(distanzaVerticale)
  const distPesoCorpoParsed = parseNumeroIT(distanzaPesoCorpo)
  const dislocParsed = parseNumeroIT(dislocazioneAngolare)
  const frequenzaParsed = parseNumeroIT(frequenzaGesti)
  const nPersoneParsed = parseNumeroIT(nPersone)
  const forzaParsed = parseNumeroIT(forzaMantenimento)
  const spintaParsed = parseNumeroIT(spinta)
  const trainoParsed = parseNumeroIT(traino)
  const distTrasParsed = parseNumeroIT(distanzaTrasporto)

  const isAlmenoUnCampoCompilato = (
    carico !== '' || altezzaMani !== '' || distanzaVerticale !== '' || distanzaPesoCorpo !== '' ||
    dislocazioneAngolare !== '' || frequenzaGesti !== '' || giudizioPresa !== '' || nPersone !== '' ||
    forzaMantenimento !== '' || spinta !== '' || traino !== '' || distanzaTrasporto !== '' ||
    note !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      carico !== initialSnapshot.carico || altezzaMani !== initialSnapshot.altezzaMani ||
      distanzaVerticale !== initialSnapshot.distanzaVerticale ||
      distanzaPesoCorpo !== initialSnapshot.distanzaPesoCorpo ||
      dislocazioneAngolare !== initialSnapshot.dislocazioneAngolare ||
      frequenzaGesti !== initialSnapshot.frequenzaGesti || frequenzaUnita !== initialSnapshot.frequenzaUnita ||
      giudizioPresa !== initialSnapshot.giudizioPresa || nPersone !== initialSnapshot.nPersone ||
      forzaMantenimento !== initialSnapshot.forzaMantenimento ||
      spinta !== initialSnapshot.spinta || traino !== initialSnapshot.traino ||
      distanzaTrasporto !== initialSnapshot.distanzaTrasporto ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    if (caricoParsed !== null) dati.carico = caricoParsed
    if (altezzaParsed !== null) dati.altezza_mani = altezzaParsed
    if (distVerticParsed !== null) dati.distanza_verticale = distVerticParsed
    if (distPesoCorpoParsed !== null) dati.distanza_peso_corpo = distPesoCorpoParsed
    if (dislocParsed !== null) dati.dislocazione_angolare = dislocParsed
    if (frequenzaParsed !== null) dati.frequenza_gesti = frequenzaParsed
    dati.frequenza_unita = frequenzaUnita
    if (giudizioPresa !== '') dati.giudizio_presa = giudizioPresa
    if (nPersoneParsed !== null) dati.n_persone = nPersoneParsed
    if (forzaParsed !== null) dati.forza_mantenimento = forzaParsed
    if (spintaParsed !== null) dati.spinta = spintaParsed
    if (trainoParsed !== null) dati.traino = trainoParsed
    if (distTrasParsed !== null) dati.distanza_trasporto = distTrasParsed
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
      <div style={styles.sectionHeader}>Sollevamento</div>

      <div style={styles.grid2col}>
        <div style={styles.cell}>
          <label htmlFor="mmc-car" style={styles.label}>Carico movimentato (kg)</label>
          <input id="mmc-car" type="text" value={carico} onChange={(e) => setCarico(e.target.value)} placeholder="kg" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(carico ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="mmc-am" style={styles.label}>Altezza mani (cm)</label>
          <input id="mmc-am" type="text" value={altezzaMani} onChange={(e) => setAltezzaMani(e.target.value)} placeholder="cm" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(altezzaMani ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="mmc-dv" style={styles.label}>Dist. verticale spost. (cm)</label>
          <input id="mmc-dv" type="text" value={distanzaVerticale} onChange={(e) => setDistanzaVerticale(e.target.value)} placeholder="cm" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(distanzaVerticale ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="mmc-dpc" style={styles.label}>Dist. peso/corpo (cm)</label>
          <input id="mmc-dpc" type="text" value={distanzaPesoCorpo} onChange={(e) => setDistanzaPesoCorpo(e.target.value)} placeholder="cm" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(distanzaPesoCorpo ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="mmc-da" style={styles.label}>Disloc. angolare (°)</label>
          <input id="mmc-da" type="text" value={dislocazioneAngolare} onChange={(e) => setDislocazioneAngolare(e.target.value)} placeholder="gradi" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(dislocazioneAngolare ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="mmc-fg" style={styles.label}>Frequenza gesti</label>
          <div style={styles.freqRow}>
            <input id="mmc-fg" type="text" value={frequenzaGesti} onChange={(e) => setFrequenzaGesti(e.target.value)} placeholder="es. 12" disabled={saving} inputMode="decimal"
              style={{ ...styles.inputFreq, ...(frequenzaGesti ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
            <select value={frequenzaUnita} onChange={(e) => setFrequenzaUnita(e.target.value as FrequenzaUnita)} disabled={saving}
              style={{ ...styles.unitSelect, ...(saving ? styles.inputDisabled : {}) }}>
              <option value="atti/min">atti/min</option>
              <option value="atti/ora">atti/ora</option>
              <option value="atti/turno">atti/turno</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.grid2col}>
        <div style={styles.cell}>
          <label htmlFor="mmc-gp" style={styles.label}>Giudizio presa</label>
          <select id="mmc-gp" value={giudizioPresa} onChange={(e) => setGiudizioPresa(e.target.value as GiudizioPresa)} disabled={saving}
            style={{ ...styles.input, ...(giudizioPresa ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}>
            <option value="">— seleziona —</option>
            <option value="Buona">Buona</option>
            <option value="Discreta">Discreta</option>
            <option value="Scarsa">Scarsa</option>
          </select>
        </div>
        <div style={styles.cell}>
          <label htmlFor="mmc-np" style={styles.label}>N° persone</label>
          <input id="mmc-np" type="text" value={nPersone} onChange={(e) => setNPersone(e.target.value)} placeholder="n." disabled={saving} inputMode="numeric"
            style={{ ...styles.input, ...(nPersone ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
      </div>

      <div style={styles.sectionHeader}>Spinta / Traino</div>

      <div style={styles.field}>
        <label htmlFor="mmc-fm" style={styles.label}>Forza di mantenimento (kg)</label>
        <input id="mmc-fm" type="text" value={forzaMantenimento} onChange={(e) => setForzaMantenimento(e.target.value)} placeholder="kg (dinamometro)" disabled={saving} inputMode="decimal"
          style={{ ...styles.input, ...(forzaMantenimento ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
      </div>

      <div style={styles.grid2col}>
        <div style={styles.cell}>
          <label htmlFor="mmc-sp" style={styles.label}>Spinta (kg)</label>
          <input id="mmc-sp" type="text" value={spinta} onChange={(e) => setSpinta(e.target.value)} placeholder="kg" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(spinta ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
        <div style={styles.cell}>
          <label htmlFor="mmc-tr" style={styles.label}>Traino (kg)</label>
          <input id="mmc-tr" type="text" value={traino} onChange={(e) => setTraino(e.target.value)} placeholder="kg" disabled={saving} inputMode="decimal"
            style={{ ...styles.input, ...(traino ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
        </div>
      </div>

      <div style={styles.sectionHeader}>Trasporto</div>

      <div style={styles.field}>
        <label htmlFor="mmc-dt" style={styles.label}>Distanza di trasporto del peso (m)</label>
        <input id="mmc-dt" type="text" value={distanzaTrasporto} onChange={(e) => setDistanzaTrasporto(e.target.value)} placeholder="metri" disabled={saving} inputMode="decimal"
          style={{ ...styles.input, ...(distanzaTrasporto ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }} />
      </div>

      <div style={styles.field}>
        <label htmlFor="mmc-note" style={styles.label}>Note</label>
        <textarea id="mmc-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annotazioni libere" disabled={saving} rows={3} maxLength={1000}
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
  grid2col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  cell: { display: 'flex', flexDirection: 'column', gap: 0 },
  freqRow: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 },
  inputFreq: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  unitSelect: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
}
