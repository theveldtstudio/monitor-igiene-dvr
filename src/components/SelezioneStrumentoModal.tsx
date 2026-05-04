import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Strumento } from '../types'
import { useStrumenti } from '../hooks/useStrumenti'

interface SelezioneStrumentoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (strumentoId: string | null) => Promise<void>
  selezionatoAttuale: string | null
  saving?: boolean
}

export default function SelezioneStrumentoModal({
  open,
  onClose,
  onConfirm,
  selezionatoAttuale,
  saving = false,
}: SelezioneStrumentoModalProps) {
  const navigate = useNavigate()
  const { strumenti, loading, error, refetch } = useStrumenti()
  const [selezionato, setSelezionato] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    if (open) {
      setSelezionato(selezionatoAttuale)
      setFiltro('')
    }
  }, [open, selezionatoAttuale])

  if (!open) return null

  const strumentiFiltrati: Strumento[] = strumenti.filter((s) => {
    const f = filtro.trim().toLowerCase()
    if (!f) return true
    const blob = `${s.nome} ${s.modello} ${s.matricola}`.toLowerCase()
    return blob.includes(f)
  })

  const isDirty = selezionato !== selezionatoAttuale

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) {
      onClose()
    }
  }

  const handleSalva = async () => {
    if (saving || !isDirty) return
    await onConfirm(selezionato)
  }

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="ss-title">
        <div style={styles.header}>
          <h2 id="ss-title" style={styles.title}>Seleziona strumento</h2>
          <button type="button" onClick={onClose} disabled={saving} style={styles.closeBtn} aria-label="Chiudi">×</button>
        </div>

        {!loading && !error && strumenti.length > 0 && (
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Cerca per nome, modello o matricola…"
            disabled={saving}
            style={styles.searchInput}
          />
        )}

        <div style={styles.listWrap}>
          {loading && <div style={styles.muted}>Caricamento strumenti…</div>}

          {!loading && error && (
            <div style={styles.errorBox}>
              <div style={styles.errorTitle}>Errore di caricamento</div>
              <div style={styles.errorMessage}>{error}</div>
              <button type="button" onClick={() => refetch()} style={styles.retryBtnSmall}>Riprova</button>
            </div>
          )}

          {!loading && !error && strumenti.length === 0 && (
            <div style={styles.emptyBox}>
              <div style={styles.emptyTitle}>Nessuno strumento in anagrafica</div>
              <div style={styles.emptyMessage}>Aggiungi prima gli strumenti dalla pagina Anagrafica.</div>
              <button type="button" onClick={() => { onClose(); navigate('/anagrafica') }} style={styles.retryBtnSmall}>
                Apri Anagrafica
              </button>
            </div>
          )}

          {!loading && !error && strumenti.length > 0 && (
            <div style={styles.list}>
              <button
                type="button"
                onClick={() => !saving && setSelezionato(null)}
                disabled={saving}
                style={{
                  ...styles.row,
                  ...(selezionato === null ? styles.rowChecked : {}),
                }}
              >
                <div style={styles.iconNone}>—</div>
                <div style={styles.rowBody}>
                  <div style={styles.rowName}>Nessuno strumento</div>
                  <div style={styles.rowSub}>Lascia la campagna senza strumento associato</div>
                </div>
                <div style={{ ...styles.radio, ...(selezionato === null ? styles.radioChecked : {}) }}>
                  {selezionato === null && <div style={styles.radioDot} />}
                </div>
              </button>

              {strumentiFiltrati.length === 0 && (
                <div style={styles.muted}>Nessun risultato per "{filtro}"</div>
              )}

              {strumentiFiltrati.map((s) => {
                const checked = selezionato === s.id
                const sub = [s.modello, s.matricola ? `S/N ${s.matricola}` : null].filter(Boolean).join(' · ')
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => !saving && setSelezionato(s.id)}
                    disabled={saving}
                    style={{
                      ...styles.row,
                      ...(checked ? styles.rowChecked : {}),
                    }}
                  >
                    <div style={styles.iconStrumento}>
                      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                        <rect x="4" y="6" width="10" height="8" stroke="#854F0B" strokeWidth={1.4} fill="none" rx={1}/>
                        <circle cx="9" cy="10" r="2" stroke="#854F0B" strokeWidth={1.4}/>
                        <path d="M7 4 L11 4" stroke="#854F0B" strokeWidth={1.4}/>
                      </svg>
                    </div>
                    <div style={styles.rowBody}>
                      <div style={styles.rowName}>{s.nome}</div>
                      {sub && <div style={styles.rowSub}>{sub}</div>}
                    </div>
                    <div style={{ ...styles.radio, ...(checked ? styles.radioChecked : {}) }}>
                      {checked && <div style={styles.radioDot} />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={styles.footer}>
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
              onClick={handleSalva}
              disabled={saving || !isDirty}
              style={{ ...styles.btnPrimary, ...((saving || !isDirty) ? styles.btnPrimaryDisabled : {}) }}
            >
              {saving ? (
                <span style={styles.savingWrap}>
                  <span style={styles.spinner} />
                  Salvataggio...
                </span>
              ) : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--bg-app)', borderRadius: '18px 18px 0 0', padding: '18px 16px 22px', width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: 0 },
  closeBtn: { width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-toggle)', border: 'none', fontSize: 18, lineHeight: 1, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 2, fontFamily: 'inherit' },
  searchInput: { width: '100%', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
  listWrap: { flex: 1, overflowY: 'auto', minHeight: 100, marginBottom: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 6 },
  muted: { fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 8px' },
  row: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
    background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)',
    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
  },
  rowChecked: { borderColor: 'var(--accent)', background: 'var(--bg-badge-open)' },
  iconNone: { width: 28, height: 28, borderRadius: 6, background: 'var(--bg-toggle)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, flexShrink: 0 },
  iconStrumento: { width: 28, height: 28, borderRadius: 6, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowSub: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  radio: { width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioChecked: { borderColor: 'var(--accent)' },
  radioDot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' },
  footer: { borderTop: '0.5px solid var(--border)', paddingTop: 12 },
  actions: { display: 'flex', gap: 8 },
  btnSecondary: { flex: 1, background: 'var(--bg-card)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { flex: 1, background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  btnPrimaryDisabled: { background: '#B4B2A9', cursor: 'not-allowed', opacity: 0.7 },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  savingWrap: { display: 'inline-flex', alignItems: 'center', gap: 8 },
  spinner: { width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'var(--text-on-accent)', borderRadius: '50%', animation: 'modal-spinner 0.8s linear infinite' },
  errorBox: { background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: 14, textAlign: 'center' },
  errorTitle: { fontSize: 13, fontWeight: 500, color: '#501313', marginBottom: 4 },
  errorMessage: { fontSize: 11, color: '#791F1F', marginBottom: 10 },
  emptyBox: { background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 18, textAlign: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 },
  emptyMessage: { fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 },
  retryBtnSmall: { background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', padding: '7px 14px', borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
