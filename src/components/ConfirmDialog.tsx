import type React from 'react'
import { useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string | React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annulla',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, loading, onCancel])

  if (!open) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel()
    }
  }

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.dialog} role="alertdialog" aria-modal="true">
        <div style={styles.title}>{title}</div>
        <div style={styles.message}>{message}</div>
        <div style={styles.actions}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...styles.btnConfirm,
              ...(variant === 'danger' ? styles.btnDanger : {}),
              ...(loading ? styles.btnDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.savingWrap}>
                <span style={styles.spinner} />
                Salvataggio...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{ ...styles.btnCancel, ...(loading ? styles.btnDisabled : {}) }}
          >
            {cancelLabel}
          </button>
        </div>
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: 16,
  },
  dialog: {
    background: 'var(--bg-app)',
    borderRadius: 14,
    padding: '20px 18px',
    width: '100%',
    maxWidth: 360,
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  btnConfirm: {
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
    fontFamily: 'inherit',
  },
  btnDanger: {
    background: '#A32D2D',
  },
  btnCancel: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    color: 'var(--text-secondary)',
    padding: 12,
    borderRadius: 22,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
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
}
