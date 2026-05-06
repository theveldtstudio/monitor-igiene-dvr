import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { Misura } from '../types'
import { useCreateMisura } from '../hooks/useCreateMisura'
import { useUpdateMisura } from '../hooks/useUpdateMisura'
import MisuraModalShell from './MisuraModalShell'
import DurationPicker from './DurationPicker'
import FotoUploader from './FotoUploader'
import { calcolaClasseOwas, coloriClasseOwas } from '../data/owasLookup'
import type { SchienaCode, BracciaCode, GambeCode, CaricoCode } from '../data/owasLookup'
import {
  SchienaIcon1, SchienaIcon2, SchienaIcon3, SchienaIcon4,
  BracciaIcon1, BracciaIcon2, BracciaIcon3,
  GambeIcon1, GambeIcon2, GambeIcon3, GambeIcon4, GambeIcon5, GambeIcon6, GambeIcon7,
} from './OwasIcons'

interface MisuraOwasModalProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

const SCHIENA_OPZIONI: { code: SchienaCode; label: string }[] = [
  { code: 1, label: 'Diritta' },
  { code: 2, label: 'Curva' },
  { code: 3, label: 'Torsione' },
  { code: 4, label: 'C+T' },
]

const BRACCIA_OPZIONI: { code: BracciaCode; label: string }[] = [
  { code: 1, label: 'Sotto spalle' },
  { code: 2, label: 'Uno sopra' },
  { code: 3, label: 'Entrambe sopra' },
]

const GAMBE_OPZIONI: { code: GambeCode; label: string }[] = [
  { code: 1, label: 'Seduto' },
  { code: 2, label: 'Piedi' },
  { code: 3, label: '1 gamba' },
  { code: 4, label: 'Piegate' },
  { code: 5, label: '1 piegata' },
  { code: 6, label: 'Ginocchio' },
  { code: 7, label: 'In moto' },
]

const CARICO_OPZIONI: { code: CaricoCode; label: string }[] = [
  { code: 1, label: '<10 kg' },
  { code: 2, label: '10-20 kg' },
  { code: 3, label: '>20 kg' },
]

const SCHIENA_ICONS = {
  1: SchienaIcon1, 2: SchienaIcon2, 3: SchienaIcon3, 4: SchienaIcon4,
} as const;
const BRACCIA_ICONS = {
  1: BracciaIcon1, 2: BracciaIcon2, 3: BracciaIcon3,
} as const;
const GAMBE_ICONS = {
  1: GambeIcon1, 2: GambeIcon2, 3: GambeIcon3, 4: GambeIcon4, 5: GambeIcon5, 6: GambeIcon6, 7: GambeIcon7,
} as const;

export default function MisuraOwasModal({ open, onClose, onSaved, campagnaId, misuraDaModificare }: MisuraOwasModalProps) {
  const [mansione, setMansione] = useState('')
  const [attivita, setAttivita] = useState('')
  const [durata, setDurata] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [schiena, setSchiena] = useState<SchienaCode>(1)
  const [braccia, setBraccia] = useState<BracciaCode>(1)
  const [gambe, setGambe] = useState<GambeCode>(1)
  const [carico, setCarico] = useState<CaricoCode>(1)
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
      mansione: (d.mansione as string) ?? '',
      attivita: (d.attivita as string) ?? '',
      durata: typeof d.durata === 'number' ? d.durata : null,
      schiena: (d.schiena as SchienaCode) ?? 1,
      braccia: (d.braccia as BracciaCode) ?? 1,
      gambe: (d.gambe as GambeCode) ?? 1,
      carico: (d.carico as CaricoCode) ?? 1,
      note: misuraDaModificare.note ?? '',
    }
  }, [misuraDaModificare])

  useEffect(() => {
    if (open) {
      if (initialSnapshot) {
        setMansione(initialSnapshot.mansione)
        setAttivita(initialSnapshot.attivita)
        setDurata(initialSnapshot.durata)
        setSchiena(initialSnapshot.schiena)
        setBraccia(initialSnapshot.braccia)
        setGambe(initialSnapshot.gambe)
        setCarico(initialSnapshot.carico)
        setNote(initialSnapshot.note)
      } else {
        setMansione(''); setAttivita(''); setDurata(null)
        setSchiena(1); setBraccia(1); setGambe(1); setCarico(1)
        setNote('')
      }
      setPickerOpen(false)
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

  const classe = calcolaClasseOwas(schiena, braccia, gambe, carico)
  const codice = `${schiena}-${braccia}-${gambe}-${carico}`
  const colori = coloriClasseOwas(classe)

  const isAlmenoUnCampoCompilato = (
    durata !== null || mansione.trim() !== '' || attivita.trim() !== '' || note.trim() !== ''
  )
  const isValid = isAlmenoUnCampoCompilato

  const isDirty = isModifica && initialSnapshot
    ? (
      mansione !== initialSnapshot.mansione ||
      attivita !== initialSnapshot.attivita ||
      durata !== initialSnapshot.durata ||
      schiena !== initialSnapshot.schiena ||
      braccia !== initialSnapshot.braccia ||
      gambe !== initialSnapshot.gambe ||
      carico !== initialSnapshot.carico ||
      note !== initialSnapshot.note
    )
    : isAlmenoUnCampoCompilato

  const buildDati = (): Record<string, unknown> => {
    const dati: Record<string, unknown> = {}
    const mansioneTrim = mansione.trim()
    if (mansioneTrim) dati.mansione = mansioneTrim
    const attivitaTrim = attivita.trim()
    if (attivitaTrim) dati.attivita = attivitaTrim
    if (durata !== null) dati.durata = durata
    dati.schiena = schiena
    dati.braccia = braccia
    dati.gambe = gambe
    dati.carico = carico
    dati.classe = classe
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
          <label htmlFor="ow-mans" style={styles.label}>Mansione</label>
          <input
            id="ow-mans"
            type="text"
            value={mansione}
            onChange={(e) => setMansione(e.target.value)}
            placeholder="es. Escavatorista"
            disabled={saving}
            style={{ ...styles.input, ...(mansione ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="ow-att" style={styles.label}>Fase lavorativa / Attività</label>
          <input
            id="ow-att"
            type="text"
            value={attivita}
            onChange={(e) => setAttivita(e.target.value)}
            placeholder="es. Movimentazione terre"
            disabled={saving}
            style={{ ...styles.input, ...(attivita ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Durata</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={styles.durataButton}
          >
            <span style={styles.durataIcon}>🕐</span>
            <span style={durata !== null ? styles.durataValore : styles.durataPlaceholder}>
              {durata !== null
                ? `${String(Math.floor(durata / 60)).padStart(2, '0')}:${String(durata % 60).padStart(2, '0')}`
                : 'Tocca per impostare'}
            </span>
          </button>
        </div>

        <DurationPicker
          open={pickerOpen}
          initialMinutes={durata}
          onClose={() => setPickerOpen(false)}
          onConfirm={(min) => { setDurata(min); setPickerOpen(false) }}
          onCancel={() => { setDurata(null); setPickerOpen(false) }}
        />

        <div style={styles.sectionHeader}>Codice posturale OWAS</div>

        <div style={styles.codeGroup}>
          <div style={styles.codeGroupLabel}>Schiena</div>
          <div style={{ ...styles.btnGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {SCHIENA_OPZIONI.map(({ code, label }) => {
              const Icon = SCHIENA_ICONS[code];
              return (
                <button
                  key={code}
                  type="button"
                  disabled={saving}
                  onClick={() => setSchiena(code)}
                  style={schiena === code ? { ...styles.codeBtn, ...styles.codeBtnSelected } : styles.codeBtn}
                >
                  <span style={styles.codeBtnNum}>{code}</span>
                  <Icon size={50} style={{ marginBottom: 4 }} />
                  <span style={styles.codeBtnLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.codeGroup}>
          <div style={styles.codeGroupLabel}>Braccia</div>
          <div style={{ ...styles.btnGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {BRACCIA_OPZIONI.map(({ code, label }) => {
              const Icon = BRACCIA_ICONS[code];
              return (
                <button
                  key={code}
                  type="button"
                  disabled={saving}
                  onClick={() => setBraccia(code)}
                  style={braccia === code ? { ...styles.codeBtn, ...styles.codeBtnSelected } : styles.codeBtn}
                >
                  <span style={styles.codeBtnNum}>{code}</span>
                  <Icon size={50} style={{ marginBottom: 4 }} />
                  <span style={styles.codeBtnLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.codeGroup}>
          <div style={styles.codeGroupLabel}>Gambe</div>
          <div style={{ ...styles.btnGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {GAMBE_OPZIONI.map(({ code, label }) => {
              const Icon = GAMBE_ICONS[code];
              return (
                <button
                  key={code}
                  type="button"
                  disabled={saving}
                  onClick={() => setGambe(code)}
                  style={gambe === code ? { ...styles.codeBtn, minHeight: 86, ...styles.codeBtnSelected } : { ...styles.codeBtn, minHeight: 86 }}
                >
                  <span style={styles.codeBtnNum}>{code}</span>
                  <Icon size={40} style={{ marginBottom: 4 }} />
                  <span style={styles.codeBtnLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.codeGroup}>
          <div style={styles.codeGroupLabel}>Carico</div>
          <div style={{ ...styles.btnGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {CARICO_OPZIONI.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                disabled={saving}
                onClick={() => setCarico(code)}
                style={carico === code ? { ...styles.codeBtn, minHeight: 60, ...styles.codeBtnSelected } : { ...styles.codeBtn, minHeight: 60 }}
              >
                <span style={styles.caricoBtnLabel}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          ...styles.classeBox,
          backgroundColor: colori.bg,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: colori.border,
        }}>
          <div style={{ ...styles.classeCode, color: colori.text }}>OWAS: {codice}</div>
          <div style={{ ...styles.classeLabel, color: colori.text }}>Classe {classe}</div>
        </div>

        <div style={styles.field}>
          <label htmlFor="ow-note" style={styles.label}>Note</label>
          <textarea
            id="ow-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Annotazioni libere"
            disabled={saving}
            rows={3}
            maxLength={1000}
            style={{ ...styles.textarea, ...(note ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}
          />
        </div>

        <div style={styles.field}>
          <FotoUploader misuraId={misuraIdCorrente} maxFoto={5} />
        </div>
      </MisuraModalShell>

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
  durataButton: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14, backgroundColor: 'var(--bg-card)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-card)', fontSize: 15, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' },
  durataIcon: { fontSize: 18 },
  durataValore: { color: 'var(--text-primary)' },
  durataPlaceholder: { color: 'var(--text-tertiary)' },
  selectorBtn: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxSizing: 'border-box' },
  selectorBtnFilled: { borderColor: 'var(--accent)' },
  selectorValue: { color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 },
  selectorPlaceholder: { color: 'var(--text-tertiary)', flex: 1, marginRight: 8 },
  selectorChevron: { color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 },
  sectionHeader: { fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 8, marginBottom: 8, paddingBottom: 4, borderBottomWidth: '0.5px', borderBottomStyle: 'solid', borderBottomColor: 'var(--border)' },
  codeGroup: { marginBottom: 10 },
  codeGroupLabel: { fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 },
  btnGrid: { display: 'grid', gap: 6 },
  codeBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: '#d1d5db', backgroundColor: '#ffffff', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', minHeight: 100, position: 'relative' },
  codeBtnSelected: { borderWidth: 2, borderStyle: 'solid', borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e40af' },
  codeBtnNum: { position: 'absolute', top: 4, right: 6, fontSize: 11, fontWeight: 600, color: 'inherit', lineHeight: 1 },
  codeBtnLabel: { fontSize: 10, color: 'inherit', marginTop: 2, textAlign: 'center', lineHeight: 1.2 },
  caricoBtnLabel: { fontSize: 14, fontWeight: 600, color: 'inherit', textAlign: 'center', lineHeight: 1.2 },
  classeBox: { borderRadius: 8, padding: '12px 14px', marginBottom: 12 },
  classeCode: { fontSize: 14, fontWeight: 600 },
  classeLabel: { fontSize: 18, fontWeight: 700, marginTop: 2 },
}
