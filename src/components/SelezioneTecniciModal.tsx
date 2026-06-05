import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tecnico } from '../types'
import { useTecnici } from '../hooks/useTecnici'

interface SelezioneTecniciModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (tecniciIds: string[]) => Promise<void>
  selezionatiAttuali: string[]
  saving?: boolean
}

function iniziali(nome: string, cognome: string): string {
  const a = (nome ?? '').trim().charAt(0).toUpperCase()
  const b = (cognome ?? '').trim().charAt(0).toUpperCase()
  return `${a}${b}` || '—'
}

export default function SelezioneTecniciModal({
  open,
  onClose,
  onConfirm,
  selezionatiAttuali,
  saving = false,
}: SelezioneTecniciModalProps) {
  const navigate = useNavigate()
  const { tecnici, loading, error, refetch } = useTecnici()
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set())
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelezionati(new Set(selezionatiAttuali))
      setFiltro('')
    }
  }, [open, selezionatiAttuali])

  if (!open) return null

  const tecniciFiltrati: Tecnico[] = tecnici.filter((t) => {
    const f = filtro.trim().toLowerCase()
    if (!f) return true
    const full = `${t.nome} ${t.cognome}`.toLowerCase()
    return full.includes(f)
  })

  const isDirty = (() => {
    if (selezionati.size !== selezionatiAttuali.length) return true
    for (const id of selezionatiAttuali) {
      if (!selezionati.has(id)) return true
    }
    return false
  })()

  const toggle = (id: string) => {
    if (saving) return
    setSelezionati((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) {
      onClose()
    }
  }

  const handleSalva = async () => {
    if (saving) return
    await onConfirm(Array.from(selezionati))
  }

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="st-title">
        <div style={styles.header}>
          <h2 id="st-title" style={styles.title}>Seleziona tecnici</h2>
          <button type="button" onClick={onClose} disabled={saving} style={styles.closeBtn} aria-label="Chiudi">×</button>
        </div>

        {!loading && !error && tecnici.length > 0 && (
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Cerca per nome o cognome…"
            disabled={saving}
            style={styles.searchInput}
          />
        )}

        <div style={styles.listWrap}>
          {loading && (
            <div style={styles.muted}>Caricamento tecnici…</div>
          )}

          {!loading && error && (
            <div style={styles.errorBox}>
              <div style={styles.errorTitle}>Errore di caricamento</div>
              <div style={styles.errorMessage}>{error}</div>
              <button type="button" onClick={() => refetch()} style={styles.retryBtnSmall}>Riprova</button>
            </div>
          )}

          {!loading && !error && tecnici.length === 0 && (
            <div style={styles.emptyBox}>
              <div style={styles.emptyTitle}>Nessun tecnico in anagrafica</div>
              <div style={styles.emptyMessage}>Aggiungi prima i tecnici dalla pagina Anagrafica.</div>
              <button type="button" onClick={() => { onClose(); navigate('/anagrafica') }} style={styles.retryBtnSmall}>
                Apri Anagrafica
              </button>
            </div>
          )}

          {!loading && !error && tecnici.length > 0 && tecniciFiltrati.length === 0 && (
            <div style={styles.muted}>Nessun risultato per "{filtro}"</div>
          )}

          {!loading && !error && tecniciFiltrati.length > 0 && (
            <div style={styles.list}>
              {tecniciFiltrati.map((t) => {
                const checked = selezionati.has(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    disabled={saving}
                    style={{
                      ...styles.row,
                      ...(checked ? styles.rowChecked : {}),
                    }}
                  >
                    <div style={styles.avatar}>{iniziali(t.nome, t.cognome)}</div>
                    <div style={styles.rowBody}>
                      <div style={styles.rowName}>{t.nome} {t.cognome}</div>
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

        <div style={styles.footer}>
          <div style={styles.counter}>
            {selezionati.size === 0
              ? 'Nessuno selezionato'
              : selezionati.size === 1
                ? '1 tecnico selezionato'
                : `${selezionati.size} tecnici selezionati`}
          </div>
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
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-badge-open)', color: 'var(--text-badge-open)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, flexShrink: 0 },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 },
  checkbox: { width: 20, height: 20, borderRadius: 4, border: '1.5px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { background: 'var(--accent)', borderColor: 'var(--accent)' },
  checkmark: { color: 'var(--text-on-accent)', fontSize: 13, fontWeight: 500, lineHeight: 1 },
  footer: { borderTop: '0.5px solid var(--border)', paddingTop: 12 },
  counter: { fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 10 },
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
