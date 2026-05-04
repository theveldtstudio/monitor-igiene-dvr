import type React from 'react'
import { useState, useEffect } from 'react'
import type { Campagna } from '../types'
import type { ModuloCampionamento } from '../data/moduliCampionamento'
import { CATEGORIE } from '../data/moduliCampionamento'
import { useCreateCampagna } from '../hooks/useCreateCampagna'

interface NuovaCampagnaModalProps {
  open: boolean
  onClose: () => void
  onCreated: (campagna: Campagna) => void
  cantiereId: string
  cantiereNome: string
  modulo: ModuloCampionamento
}

function ModuloIcona({ id, color }: { id: string; color: string }) {
  const stroke = color
  const sw = 1.4
  switch (id) {
    case 'rumore':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 9 L5 9 M5 5 L5 13 M7 3 L7 15 M9 6 L9 12 M11 4 L11 14 M13 7 L13 11" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'vibrazioni-wbv':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2" stroke={stroke} strokeWidth={sw}/><circle cx="9" cy="9" r="5" stroke={stroke} strokeWidth={sw} opacity="0.5"/><circle cx="9" cy="9" r="7.5" stroke={stroke} strokeWidth={sw} opacity="0.25"/></svg>
    case 'vibrazioni-hav':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M5 13 Q5 7 9 7 Q13 7 13 11" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/><path d="M9 7 L9 4" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'microclima':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 3 L9 13 M5 9 L13 9" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/><circle cx="9" cy="9" r="6" stroke={stroke} strokeWidth={sw}/></svg>
    case 'cem':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 9 Q5 6 7 9 T11 9 T15 9" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'roa':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" fill={stroke}/><path d="M9 2 L9 4 M9 14 L9 16 M2 9 L4 9 M14 9 L16 9 M4 4 L5.5 5.5 M12.5 12.5 L14 14 M14 4 L12.5 5.5 M5.5 12.5 L4 14" stroke={stroke} strokeWidth={1.2} strokeLinecap="round"/></svg>
    case 'gas':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M7 2 L11 2 L11 6 L13 9 Q13 14 9 14 Q5 14 5 9 L7 6 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'polveri':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="9" r="1.5" fill={stroke}/><circle cx="11" cy="6" r="1" fill={stroke}/><circle cx="13" cy="11" r="1.2" fill={stroke}/><circle cx="9" cy="13" r="0.8" fill={stroke}/></svg>
    case 'carbonio-elementare':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="5" stroke={stroke} strokeWidth={sw}/><text x="9" y="11" textAnchor="middle" fontSize="6" fill={stroke} fontWeight="500">C</text></svg>
    case 'ipa':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M5 6 L7 4 L9 6 L7 8 Z M9 10 L11 8 L13 10 L11 12 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'amianto':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 6 L15 6 M3 9 L15 9 M3 12 L15 12" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'biologico-sas':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke={stroke} strokeWidth={sw}/><circle cx="5" cy="5" r="1.5" stroke={stroke} strokeWidth={sw}/><circle cx="13" cy="13" r="1.5" stroke={stroke} strokeWidth={sw}/></svg>
    case 'acqua':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 3 Q5 8 5 11 Q5 14 9 14 Q13 14 13 11 Q13 8 9 3 Z" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
    case 'mmc':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="6" y="6" width="6" height="6" stroke={stroke} strokeWidth={sw} fill="none"/><path d="M9 3 L9 6 M3 9 L6 9 M9 12 L9 15" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'owas':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="1.5" stroke={stroke} strokeWidth={sw}/><path d="M9 6 L9 11 M9 11 L6 15 M9 11 L12 15 M5 8 L13 8" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>
    case 'ocra':
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M5 9 Q9 5 13 9 Q9 13 5 9 Z" stroke={stroke} strokeWidth={sw} fill="none"/><circle cx="9" cy="9" r="1" fill={stroke}/></svg>
    default:
      return <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="4" y="4" width="10" height="10" stroke={stroke} strokeWidth={sw} fill="none"/></svg>
  }
}

function nowLocalDatetimeInputValue(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localDatetimeToISO(localValue: string): string {
  const d = new Date(localValue)
  return d.toISOString()
}

export default function NuovaCampagnaModal({ open, onClose, onCreated, cantiereId, cantiereNome, modulo }: NuovaCampagnaModalProps) {
  const [dataOra, setDataOra] = useState<string>('')
  const { saving, error, createCampagna, resetError } = useCreateCampagna()
  const cat = CATEGORIE[modulo.categoria]

  useEffect(() => {
    if (open) {
      setDataOra(nowLocalDatetimeInputValue())
      resetError()
    }
  }, [open, resetError])

  if (!open) return null

  const isValid = dataOra.length > 0

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) {
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!isValid || saving) return
    const isoData = localDatetimeToISO(dataOra)
    const created = await createCampagna({
      cantiere_id: cantiereId,
      tipo_campionamento: modulo.id,
      data_ora: isoData,
    })
    if (created) {
      onCreated(created)
    }
  }

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="nc-title">
        <div style={styles.header}>
          <h2 id="nc-title" style={styles.title}>Nuova campagna</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={styles.closeBtn}
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>

        <div style={styles.context}>
          <div style={{ ...styles.contextIcon, background: cat.bgIcona }}>
            <ModuloIcona id={modulo.id} color={cat.colorAccento} />
          </div>
          <div style={styles.contextBody}>
            <div style={styles.contextTitle}>{modulo.nome}</div>
            <div style={styles.contextSub}>{cantiereNome}</div>
          </div>
        </div>

        <div style={styles.field}>
          <label htmlFor="campagna-datetime" style={styles.label}>
            Data e ora <span style={styles.required}>*</span>
          </label>
          <input
            id="campagna-datetime"
            type="datetime-local"
            value={dataOra}
            onChange={(e) => setDataOra(e.target.value)}
            disabled={saving}
            style={{
              ...styles.input,
              ...(saving ? styles.inputDisabled : {}),
            }}
          />
          <div style={styles.helperText}>Predefinita all'ora corrente, modificabile</div>
        </div>

        <div style={styles.hint}>
          ℹ Tecnici e strumento si aggiungono dal foglio campagna.<br />
          La campagna parte come <strong>bozza</strong>.
        </div>

        {error && (
          <div style={styles.errorBox}>
            <div style={styles.errorTitle}>Errore durante il salvataggio</div>
            <div style={styles.errorMessage}>{error}</div>
          </div>
        )}

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onClose}
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
              'Crea e apri'
            )}
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
    fontFamily: 'inherit',
  },
  context: {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  contextIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contextBody: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  contextSub: {
    fontSize: 10,
    color: 'var(--text-secondary)',
    marginTop: 1,
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
    border: '0.5px solid var(--accent)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputDisabled: {
    background: 'var(--bg-toggle)',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  helperText: {
    fontSize: 10,
    color: 'var(--text-tertiary)',
    marginTop: 4,
  },
  hint: {
    background: 'var(--bg-badge-open)',
    color: 'var(--text-badge-open)',
    fontSize: 11,
    padding: '10px 12px',
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 1.5,
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
    fontFamily: 'inherit',
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
    fontFamily: 'inherit',
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
}
