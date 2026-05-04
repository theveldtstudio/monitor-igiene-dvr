import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import type { Cantiere } from '../types'
import { useCreateCantiere } from '../hooks/useCreateCantiere'
import { useUpdateCantiere } from '../hooks/useUpdateCantiere'

interface NuovoCantiereModalProps {
  open: boolean
  onClose: () => void
  onCreated: (cantiere: Cantiere) => void
  cantiereDaModificare?: Cantiere | null
}

export default function NuovoCantiereModal({ open, onClose, onCreated, cantiereDaModificare }: NuovoCantiereModalProps) {
  const [nome, setNome] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [committente, setCommittente] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const isModifica = cantiereDaModificare != null
  const createHook = useCreateCantiere()
  const updateHook = useUpdateCantiere()
  const saving = isModifica ? updateHook.saving : createHook.saving
  const error = isModifica ? updateHook.error : createHook.error
  const resetError = isModifica ? updateHook.resetError : createHook.resetError
  const nomeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setNome(cantiereDaModificare?.nome ?? '')
      setIndirizzo(cantiereDaModificare?.indirizzo ?? '')
      setCommittente(cantiereDaModificare?.committente ?? '')
      setConfirmDiscard(false)
      resetError()
      const t = setTimeout(() => nomeInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [open, cantiereDaModificare, resetError])

  if (!open) return null

  const nomeTrim = nome.trim()
  const isValid = nomeTrim.length >= 2
  const isDirty = isModifica
    ? (nome !== (cantiereDaModificare?.nome ?? '') || indirizzo !== (cantiereDaModificare?.indirizzo ?? '') || committente !== (cantiereDaModificare?.committente ?? ''))
    : (nome.length > 0 || indirizzo.length > 0 || committente.length > 0)

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
    let result: Cantiere | null
    if (isModifica && cantiereDaModificare) {
      result = await updateHook.updateCantiere({
        id: cantiereDaModificare.id,
        nome: nomeTrim,
        indirizzo: indirizzo.trim(),
        committente: committente.trim() || null,
      })
    } else {
      result = await createHook.createCantiere({
        nome: nomeTrim,
        indirizzo: indirizzo.trim(),
        committente: committente.trim() || null,
      })
    }
    if (result) {
      onCreated(result)
      onClose()
    }
  }

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div style={styles.header}>
          <h2 id="modal-title" style={styles.title}>{isModifica ? 'Modifica cantiere' : 'Nuovo cantiere'}</h2>
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

        {confirmDiscard && (
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
        )}

        {!confirmDiscard && (
          <>
            <div style={styles.field}>
              <label htmlFor="cantiere-nome" style={styles.label}>
                Nome <span style={styles.required}>*</span>
              </label>
              <input
                id="cantiere-nome"
                ref={nomeInputRef}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="es. A1 — Lotto 4"
                disabled={saving}
                maxLength={120}
                style={{
                  ...styles.input,
                  ...(nome ? styles.inputFilled : {}),
                  ...(saving ? styles.inputDisabled : {}),
                }}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="cantiere-indirizzo" style={styles.label}>Indirizzo</label>
              <input
                id="cantiere-indirizzo"
                type="text"
                value={indirizzo}
                onChange={(e) => setIndirizzo(e.target.value)}
                placeholder="es. Milano"
                disabled={saving}
                maxLength={200}
                style={{
                  ...styles.input,
                  ...(indirizzo ? styles.inputFilled : {}),
                  ...(saving ? styles.inputDisabled : {}),
                }}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="cant-comm" style={styles.label}>Committente / Impresa (opzionale)</label>
              <input
                id="cant-comm"
                type="text"
                value={committente}
                onChange={(e) => setCommittente(e.target.value)}
                placeholder="es. Costruzioni Rossi SpA"
                disabled={saving}
                maxLength={120}
                style={{
                  ...styles.input,
                  ...(committente ? styles.inputFilled : {}),
                  ...(saving ? styles.inputDisabled : {}),
                }}
              />
            </div>

            {!isModifica && (
              <div style={styles.hint}>Il cantiere sarà creato come <strong>aperto</strong></div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <div style={styles.errorTitle}>Errore durante il salvataggio</div>
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
                style={{
                  ...styles.btnPrimary,
                  ...((!isValid || saving) ? styles.btnPrimaryDisabled : {}),
                }}
              >
                {saving ? (
                  <span style={styles.savingWrap}>
                    <span style={styles.spinner} />
                    Salvataggio...
                  </span>
                ) : (
                  isModifica ? 'Salva' : 'Crea'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--bg-app)',
    borderRadius: '18px 18px 0 0',
    padding: '18px 16px 22px',
    width: '100%',
    maxWidth: 640,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 500,
    color: 'var(--text-primary)',
    margin: 0,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--bg-toggle)',
    border: 'none',
    fontSize: 18,
    lineHeight: 1,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginBottom: 6,
  },
  required: {
    color: '#A32D2D',
  },
  input: {
    width: '100%',
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputFilled: {
    borderColor: 'var(--accent)',
  },
  inputDisabled: {
    background: 'var(--bg-toggle)',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  hint: {
    background: 'var(--bg-badge-open)',
    color: 'var(--text-badge-open)',
    fontSize: 12,
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBox: {
    background: '#FCEBEB',
    border: '0.5px solid #F09595',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: '#501313',
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 11,
    color: '#791F1F',
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  btnSecondary: {
    flex: 1,
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    color: 'var(--text-secondary)',
    padding: 12,
    borderRadius: 22,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnPrimary: {
    flex: 1,
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    padding: 12,
    borderRadius: 22,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryDisabled: {
    background: '#B4B2A9',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  savingWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255, 255, 255, 0.4)',
    borderTopColor: 'var(--text-on-accent)',
    borderRadius: '50%',
    animation: 'modal-spinner 0.8s linear infinite',
  },
  confirmBox: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 12,
    padding: 16,
  },
  confirmText: {
    fontSize: 14,
    color: 'var(--text-primary)',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  confirmActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  confirmBtnSecondary: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    color: 'var(--text-primary)',
    padding: 10,
    borderRadius: 22,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  confirmBtnDanger: {
    background: '#A32D2D',
    color: '#FFFFFF',
    border: 'none',
    padding: 10,
    borderRadius: 22,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
}
