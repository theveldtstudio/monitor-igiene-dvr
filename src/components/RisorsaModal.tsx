import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import type { RisorsaCantiere, TipoRisorsa } from '../types'
import { useCreateRisorsa } from '../hooks/useCreateRisorsa'
import { useUpdateRisorsa } from '../hooks/useUpdateRisorsa'

interface RisorsaModalProps {
  open: boolean
  onClose: () => void
  onSaved: (risorsa: RisorsaCantiere) => void
  cantiereId: string
  tipo: TipoRisorsa
  risorsaDaModificare?: RisorsaCantiere | null
  esistenti: RisorsaCantiere[]
  labelSingolare: string
}

function articoloDeterminativo(label: string): string {
  return `la ${label}`
}

export default function RisorsaModal({ open, onClose, onSaved, cantiereId, tipo, risorsaDaModificare, esistenti, labelSingolare }: RisorsaModalProps) {
  const [valore, setValore] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isModifica = risorsaDaModificare != null
  const createHook = useCreateRisorsa()
  const updateHook = useUpdateRisorsa()
  const saving = isModifica ? updateHook.saving : createHook.saving
  const error = isModifica ? updateHook.error : createHook.error
  const resetError = isModifica ? updateHook.resetError : createHook.resetError

  useEffect(() => {
    if (open) {
      setValore(risorsaDaModificare?.valore ?? '')
      setConfirmDiscard(false)
      resetError()
      const t = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [open, risorsaDaModificare, resetError])

  useEffect(() => {
    if (error && open) {
      resetError()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valore])

  if (!open) return null

  const valoreTrim = valore.trim()
  const isValid = valoreTrim.length >= 2
  const isDirty = isModifica
    ? valore !== (risorsaDaModificare?.valore ?? '')
    : valore.length > 0

  const handleAttemptClose = () => {
    if (saving) return
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleAttemptClose()
    }
  }

  const handleSubmit = async () => {
    if (!isValid || saving) return
    let result: RisorsaCantiere | null
    if (isModifica && risorsaDaModificare) {
      result = await updateHook.updateRisorsa({
        id: risorsaDaModificare.id,
        valore: valoreTrim,
        esistenti,
      })
    } else {
      result = await createHook.createRisorsa({
        cantiere_id: cantiereId,
        tipo,
        valore: valoreTrim,
        esistenti,
      })
    }
    if (result) {
      onSaved(result)
      onClose()
    }
  }

  const titolo = isModifica ? `Modifica ${labelSingolare}` : `Nuova ${labelSingolare}`

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="rm-title">
        <div style={styles.header}>
          <h2 id="rm-title" style={styles.title}>{titolo}</h2>
          <button type="button" onClick={handleAttemptClose} disabled={saving} style={styles.closeBtn} aria-label="Chiudi">×</button>
        </div>

        {confirmDiscard && (
          <div style={styles.confirmBox}>
            <div style={styles.confirmText}>
              {isModifica ? 'Hai modificato dei dati. Vuoi davvero scartare le modifiche?' : 'Hai scritto dei dati. Vuoi davvero scartarli?'}
            </div>
            <div style={styles.confirmActions}>
              <button type="button" onClick={() => setConfirmDiscard(false)} style={styles.confirmBtnSecondary}>
                Continua a scrivere
              </button>
              <button type="button" onClick={onClose} style={styles.confirmBtnDanger}>
                Scarta
              </button>
            </div>
          </div>
        )}

        {!confirmDiscard && (
          <>
            <div style={styles.field}>
              <label htmlFor="ris-nome" style={styles.label}>
                Nome <span style={styles.required}>*</span>
              </label>
              <input
                id="ris-nome"
                ref={inputRef}
                type="text"
                value={valore}
                onChange={(e) => setValore(e.target.value)}
                placeholder={`Nome ${articoloDeterminativo(labelSingolare)}`}
                disabled={saving}
                maxLength={120}
                style={{ ...styles.input, ...(valore ? styles.inputFilled : {}), ...(saving ? styles.inputDisabled : {}) }}
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <div style={styles.errorTitle}>Errore</div>
                <div style={styles.errorMessage}>{error}</div>
              </div>
            )}

            <div style={styles.actions}>
              <button
                type="button"
                onClick={handleAttemptClose}
                disabled={saving}
                style={{ ...styles.btnSecondary, ...(saving ? styles.btnDisabled : {}) }}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || saving}
                style={{ ...styles.btnPrimary, ...((!isValid || saving) ? styles.btnPrimaryDisabled : {}) }}
              >
                {saving ? (
                  <span style={styles.savingWrap}>
                    <span style={styles.spinner} />
                    Salvataggio...
                  </span>
                ) : isModifica ? 'Salva' : 'Crea'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--bg-app)', borderRadius: '18px 18px 0 0', padding: '18px 16px 22px', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: 0 },
  closeBtn: { width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-toggle)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', fontSize: 18, lineHeight: 1, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 2, fontFamily: 'inherit' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 },
  required: { color: '#A32D2D' },
  input: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  inputFilled: { borderColor: 'var(--accent)' },
  inputDisabled: { background: 'var(--bg-toggle)', opacity: 0.7, cursor: 'not-allowed' },
  errorBox: { background: '#FCEBEB', borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#F09595', borderRadius: 8, padding: '10px 12px', marginBottom: 16 },
  errorTitle: { fontSize: 12, fontWeight: 500, color: '#501313', marginBottom: 2 },
  errorMessage: { fontSize: 11, color: '#791F1F', wordBreak: 'break-word' },
  actions: { display: 'flex', gap: 8, marginTop: 4 },
  btnSecondary: { flex: 1, background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { flex: 1, background: 'var(--accent)', color: 'var(--text-on-accent)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  btnPrimaryDisabled: { background: '#B4B2A9', cursor: 'not-allowed', opacity: 0.7 },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  savingWrap: { display: 'inline-flex', alignItems: 'center', gap: 8 },
  spinner: { width: 14, height: 14, borderWidth: 2, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'var(--text-on-accent)', borderRadius: '50%', animation: 'modal-spinner 0.8s linear infinite' },
  confirmBox: { background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 12, padding: 16 },
  confirmText: { fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.5 },
  confirmActions: { display: 'flex', flexDirection: 'column', gap: 8 },
  confirmBtnSecondary: { background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-primary)', padding: 10, borderRadius: 22, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  confirmBtnDanger: { background: '#A32D2D', color: '#FFFFFF', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: 10, borderRadius: 22, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
