import type React from 'react'
import { useState, useEffect } from 'react'
import type { Campagna } from '../types'
import { useCampagne } from '../hooks/useCampagne'

interface SelezionaCampagneModalProps {
  open: boolean
  onClose: () => void
  cantiereId: string
  moduloId: string
  campagnaAttuale: string
  onExport: (campagneIds: string[]) => void
}

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

function formatDataCampagna(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SelezionaCampagneModal({
  open,
  onClose,
  cantiereId,
  moduloId,
  campagnaAttuale,
  onExport,
}: SelezionaCampagneModalProps) {
  const { campagne, loading, error, refetch } = useCampagne(cantiereId, moduloId)
  const [selezionate, setSelezionate] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelezionate(new Set([campagnaAttuale]))
    }
  }, [open, campagnaAttuale])

  if (!open) return null

  const handleToggle = (id: string) => {
    const next = new Set(selezionate)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelezionate(next)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleEsporta = () => {
    if (selezionate.size === 0) return
    onExport(Array.from(selezionate))
    onClose()
  }

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="scm-title">
        <div style={styles.header}>
          <h2 id="scm-title" style={styles.title}>Seleziona campagne da esportare</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Chiudi">×</button>
        </div>

        <div style={styles.body}>
          {loading && <div style={styles.statusBox}>Caricamento campagne...</div>}

          {!loading && error && (
            <div style={styles.errorBox}>
              <div style={styles.errorTitle}>Errore di caricamento</div>
              <div style={styles.errorMessage}>{error}</div>
              <button type="button" onClick={() => refetch()} style={styles.retryBtn}>Riprova</button>
            </div>
          )}

          {!loading && !error && campagne.length === 0 && (
            <div style={styles.statusBox}>Nessuna campagna disponibile</div>
          )}

          {!loading && !error && campagne.length > 0 && (
            <div style={styles.list}>
              {campagne.map((c: Campagna) => {
                const checked = selezionate.has(c.id)
                const isAttuale = c.id === campagnaAttuale
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggle(c.id)}
                    style={{ ...styles.row, ...(checked ? styles.rowChecked : {}) }}
                  >
                    <div style={styles.rowInfo}>
                      <div style={styles.rowName}>
                        {formatDataCampagna(c.data_ora)}
                        {isAttuale && <span style={styles.attualeBadge}>attuale</span>}
                      </div>
                      <div style={styles.rowMeta}>{c.stato.toUpperCase()}</div>
                    </div>
                    <div style={{ ...styles.checkbox, ...(checked ? styles.checkboxChecked : {}) }}>
                      {checked && <span style={styles.checkmark}>✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={onClose} style={styles.btnSecondary}>
            Annulla
          </button>
          <button
            type="button"
            onClick={handleEsporta}
            disabled={selezionate.size === 0}
            style={{ ...styles.btnPrimary, ...(selezionate.size === 0 ? styles.btnPrimaryDisabled : {}) }}
          >
            Esporta ({selezionate.size})
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--bg-app)', borderRadius: '18px 18px 0 0', padding: '18px 16px 22px', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: 0 },
  closeBtn: { width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-toggle)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', fontSize: 18, lineHeight: 1, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 2, fontFamily: 'inherit' },
  body: { flex: 1, minHeight: 100, marginBottom: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' },
  rowChecked: { borderColor: 'var(--accent)', background: 'var(--bg-badge-open)' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 },
  rowMeta: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, letterSpacing: '0.3px' },
  attualeBadge: { fontSize: 9, fontWeight: 500, color: 'var(--accent)', background: 'var(--bg-badge-open)', borderRadius: 6, padding: '2px 6px', letterSpacing: '0.3px' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: '1.5px', borderStyle: 'solid', borderColor: 'var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { background: 'var(--accent)', borderColor: 'var(--accent)' },
  checkmark: { color: 'var(--text-on-accent)', fontSize: 13, lineHeight: 1, fontWeight: 500 },
  statusBox: { padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 },
  errorBox: { background: '#FCEBEB', borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#F09595', borderRadius: 8, padding: '10px 12px', marginTop: 10 },
  errorTitle: { fontSize: 12, fontWeight: 500, color: '#501313', marginBottom: 2 },
  errorMessage: { fontSize: 11, color: '#791F1F', wordBreak: 'break-word', marginBottom: 8 },
  retryBtn: { background: '#A32D2D', color: '#FFFFFF', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: '6px 14px', borderRadius: 14, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  actions: { display: 'flex', gap: 8 },
  btnSecondary: { flex: 1, background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { flex: 1, background: 'var(--accent)', color: 'var(--text-on-accent)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  btnPrimaryDisabled: { background: '#B4B2A9', cursor: 'not-allowed', opacity: 0.7 },
}
