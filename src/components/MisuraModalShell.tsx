import type React from 'react'
import { useState, useEffect } from 'react'

interface MisuraModalShellProps {
  open: boolean
  onClose: () => void
  /**
   * true = stiamo modificando una misura esistente; false = stiamo creandone una nuova
   */
  isModifica: boolean
  /**
   * Numero della misura in modifica (visualizzato nel titolo). Ignorato in modalità creazione.
   */
  numeroMisura?: number
  /**
   * true se almeno un campo è valorizzato (criterio di salvabilità definito dal modulo)
   */
  isValid: boolean
  /**
   * true se l'utente ha modificato qualcosa rispetto allo stato iniziale (definito dal modulo)
   */
  isDirty: boolean
  saving: boolean
  /**
   * Messaggio di errore di salvataggio o null
   */
  saveError: string | null
  /**
   * Callback chiamata quando l'utente preme "Salva". Lo shell NON costruisce i dati: il modulo
   * specifico chiama il suo updateHook/createHook e ritorna void quando completa.
   */
  onSubmit: () => void | Promise<void>
  /**
   * Il form vero e proprio: campi specifici del modulo
   */
  children: React.ReactNode
}

export default function MisuraModalShell({
  open,
  onClose,
  isModifica,
  numeroMisura,
  isValid,
  isDirty,
  saving,
  saveError,
  onSubmit,
  children,
}: MisuraModalShellProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Reset confirmDiscard quando il modale si apre
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfirmDiscard(false)
    }
  }, [open])

  if (!open) return null

  const handleAttemptClose = () => {
    if (saving) return
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleAttemptClose()
  }

  const handleSubmit = async () => {
    if (!isValid || saving) return
    if (isModifica && !isDirty) return
    await onSubmit()
  }

  const titolo = isModifica && numeroMisura !== undefined
    ? `Modifica misura #${numeroMisura}`
    : 'Nuova misura'

  const labelBottoneSalva = isModifica ? 'Salva modifiche' : 'Salva misura'
  const submitDisabled = !isValid || saving || (isModifica && !isDirty)

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="mms-title">
        <div style={styles.header}>
          <h2 id="mms-title" style={styles.title}>{titolo}</h2>
          <button
            type="button"
            onClick={handleAttemptClose}
            disabled={saving}
            style={styles.closeBtn}
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>

        {confirmDiscard ? (
          <div style={styles.confirmBox}>
            <div style={styles.confirmText}>
              {isModifica
                ? 'Hai modificato dei dati. Vuoi davvero scartare le modifiche?'
                : 'Hai scritto dei dati. Vuoi davvero scartarli?'}
            </div>
            <div style={styles.confirmActions}>
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                style={styles.confirmBtnSecondary}
              >
                Continua a scrivere
              </button>
              <button
                type="button"
                onClick={onClose}
                style={styles.confirmBtnDanger}
              >
                Scarta
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Form fields del modulo specifico */}
            {children}

            {saveError && (
              <div style={styles.errorBox}>
                <div style={styles.errorTitle}>Errore durante il salvataggio</div>
                <div style={styles.errorMessage}>{saveError}</div>
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
                disabled={submitDisabled}
                style={{ ...styles.btnPrimary, ...(submitDisabled ? styles.btnPrimaryDisabled : {}) }}
              >
                {saving ? (
                  <span style={styles.savingWrap}>
                    <span style={styles.spinner} />
                    Salvataggio...
                  </span>
                ) : labelBottoneSalva}
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
  modal: { background: 'var(--bg-app)', borderRadius: '18px 18px 0 0', padding: '18px 16px 22px', width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: 0 },
  closeBtn: { width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-toggle)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', fontSize: 18, lineHeight: 1, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 2, fontFamily: 'inherit' },
  confirmBox: { background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 12, padding: 16 },
  confirmText: { fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.5 },
  confirmActions: { display: 'flex', flexDirection: 'column', gap: 8 },
  confirmBtnSecondary: { background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-primary)', padding: 10, borderRadius: 22, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  confirmBtnDanger: { background: '#A32D2D', color: '#FFFFFF', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: 10, borderRadius: 22, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
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
}
