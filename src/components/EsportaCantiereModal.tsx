import { useEffect, useRef } from 'react'
import type { ExportProgress } from '../lib/exportCantiereZip'

interface Props {
  open: boolean
  onClose: () => void
  /**
   * Chiamato al click Annulla. Il chiamante chiama abortController.abort() e poi onClose.
   */
  onAnnulla: () => void
  progress: ExportProgress | null
  stato: 'in-corso' | 'completato' | 'annullato' | 'errore'
  errore?: string
}

export function EsportaCantiereModal({ open, onClose, onAnnulla, progress, stato, errore }: Props) {
  const actionButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open && actionButtonRef.current) {
      actionButtonRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const percentuale = progress
    ? Math.round((progress.fileCorrente / progress.totaleFile) * 100)
    : 0

  const fileLabel = progress
    ? `File ${progress.fileCorrente} di ${progress.totaleFile}`
    : 'Preparazione…'

  const faseLabel = progress?.fase === 'xlsx' ? 'Generazione Excel' : ''

  const isFinished = stato !== 'in-corso'

  const titolo =
    stato === 'completato' ? 'Esportazione completata' :
    stato === 'annullato'  ? 'Esportazione annullata'  :
    stato === 'errore'     ? "Errore durante l'esportazione" :
                             'Esportazione cantiere in corso'

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="esporta-cantiere-title">
      <div style={styles.modal}>
        <h2 id="esporta-cantiere-title" style={styles.title}>{titolo}</h2>

        {stato === 'in-corso' && (
          <>
            <div style={styles.barContainer} role="progressbar" aria-valuenow={percentuale} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ ...styles.barFill, width: `${percentuale}%` }} />
            </div>
            <div style={styles.percentuale}>{percentuale}%</div>

            <div style={styles.dettagli}>
              <div style={styles.riga}>
                <span style={styles.label}>Modulo:</span>
                <span style={styles.valore}>{progress?.moduloCorrente || '—'}</span>
              </div>
              <div style={styles.riga}>
                <span style={styles.label}>Campagna:</span>
                <span style={styles.valore}>{progress?.campagnaCorrente || '—'}</span>
              </div>
              <div style={styles.riga}>
                <span style={styles.label}>Stato:</span>
                <span style={styles.valore}>{faseLabel || fileLabel}</span>
              </div>
              <div style={styles.rigaContatore}>{fileLabel}</div>
            </div>
          </>
        )}

        {stato === 'completato' && (
          <p style={styles.messaggio}>Lo zip è stato scaricato correttamente.</p>
        )}

        {stato === 'annullato' && (
          <p style={styles.messaggio}>Operazione interrotta dall'utente.</p>
        )}

        {stato === 'errore' && (
          <p style={styles.messaggioErrore}>{errore ?? 'Errore non specificato.'}</p>
        )}

        <div style={styles.azioni}>
          {!isFinished && (
            <button ref={actionButtonRef} onClick={onAnnulla} style={styles.bottoneSecondario} type="button">
              Annulla
            </button>
          )}
          {isFinished && (
            <button ref={actionButtonRef} onClick={onClose} style={styles.bottonePrimario} type="button">
              Chiudi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    paddingLeft: 16,
    paddingRight: 16,
  },
  modal: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: 0,
    marginBottom: 20,
    fontFamily: 'var(--font-sans)',
  },
  barContainer: {
    width: '100%',
    height: 12,
    backgroundColor: 'var(--bg-app)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
  },
  barFill: {
    height: '100%',
    backgroundColor: 'var(--accent)',
    transition: 'width 0.3s ease',
  },
  percentuale: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 20,
  },
  dettagli: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 24,
  },
  riga: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--border)',
  },
  rigaContatore: {
    textAlign: 'right',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    marginTop: 8,
  },
  label: {
    fontWeight: 500,
    color: 'var(--text-tertiary)',
  },
  valore: {
    fontWeight: 500,
    color: 'var(--text-primary)',
    textAlign: 'right',
    maxWidth: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  messaggio: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginBottom: 24,
    marginTop: 0,
  },
  messaggioErrore: {
    fontSize: 14,
    color: '#791F1F',
    backgroundColor: 'var(--error-bg)',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 8,
    marginBottom: 24,
    marginTop: 0,
  },
  azioni: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  bottonePrimario: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: 'var(--accent)',
    color: 'var(--text-on-accent)',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  bottoneSecondario: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
}
