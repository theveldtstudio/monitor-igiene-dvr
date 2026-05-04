import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import type { RisorsaCantiere, TipoRisorsa } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useCreateRisorsa } from '../hooks/useCreateRisorsa'

interface SelezionaRisorseModalSingleProps {
  open: boolean
  onClose: () => void
  onSaveSingola: (id: string | null) => Promise<boolean>
  modalita: 'singola'
  initialSelectedId: string | null
  cantiereId: string
  tipo: TipoRisorsa
  titolo: string
  labelSingolare: string
  labelPlurale: string
  permettiNessuno?: boolean
  saving: boolean
  saveError: string | null
}

interface SelezionaRisorseModalMultiProps {
  open: boolean
  onClose: () => void
  onSaveMultipla: (ids: string[]) => Promise<boolean>
  modalita: 'multipla'
  initialSelectedIds: string[]
  cantiereId: string
  tipo: TipoRisorsa
  titolo: string
  labelSingolare: string
  labelPlurale: string
  saving: boolean
  saveError: string | null
}

type SelezionaRisorseModalProps = SelezionaRisorseModalSingleProps | SelezionaRisorseModalMultiProps

export default function SelezionaRisorseModal(props: SelezionaRisorseModalProps) {
  const { open, onClose, modalita, cantiereId, tipo, titolo, labelSingolare, labelPlurale, saving, saveError } = props
  const permettiNessuno = modalita === 'singola' ? (props.permettiNessuno ?? true) : false

  const { risorse, loading: loadingList, error: errorList, refetch } = useRisorseCantiere(cantiereId, tipo)
  const createHook = useCreateRisorsa()

  const [selectedSingola, setSelectedSingola] = useState<string | null>(null)
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [aggiungiOpen, setAggiungiOpen] = useState(false)
  const [nuovoNome, setNuovoNome] = useState('')

  useEffect(() => {
    if (open) {
      if (modalita === 'singola') {
        setSelectedSingola((props as SelezionaRisorseModalSingleProps).initialSelectedId)
      } else {
        setSelectedMulti(new Set((props as SelezionaRisorseModalMultiProps).initialSelectedIds))
      }
      setSearch('')
      setAggiungiOpen(false)
      setNuovoNome('')
      createHook.resetError()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filtrati: RisorsaCantiere[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return risorse
    return risorse.filter((r) => r.valore.toLowerCase().includes(q))
  }, [risorse, search])

  if (!open) return null

  const handleToggleMulti = (id: string) => {
    if (saving) return
    const next = new Set(selectedMulti)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedMulti(next)
  }

  const handleSelectSingola = (id: string | null) => {
    if (saving) return
    setSelectedSingola(id)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) {
      onClose()
    }
  }

  const handleSave = async () => {
    if (saving) return
    let ok = false
    if (modalita === 'singola') {
      ok = await (props as SelezionaRisorseModalSingleProps).onSaveSingola(selectedSingola)
    } else {
      ok = await (props as SelezionaRisorseModalMultiProps).onSaveMultipla(Array.from(selectedMulti))
    }
    if (ok) onClose()
  }

  const handleAggiungiInline = async () => {
    const valore = nuovoNome.trim()
    if (valore.length < 2) return
    const created = await createHook.createRisorsa({
      cantiere_id: cantiereId,
      tipo,
      valore,
      esistenti: risorse,
    })
    if (created) {
      // Refresh della lista DAL DB prima di selezionare, così la nuova risorsa è in `risorse`
      await refetch()
      // Auto-seleziona la nuova risorsa (id stabile dal server)
      if (modalita === 'singola') {
        setSelectedSingola(created.id)
      } else {
        setSelectedMulti((prev) => {
          const next = new Set(prev)
          next.add(created.id)
          return next
        })
      }
      setNuovoNome('')
      setAggiungiOpen(false)
    }
  }

  const conteggioSelezionati = modalita === 'multipla' ? selectedMulti.size : (selectedSingola ? 1 : 0)
  const labelBottoneSalva = modalita === 'multipla' ? `Salva (${conteggioSelezionati})` : 'Salva'

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="srm-title">
        <div style={styles.header}>
          <h2 id="srm-title" style={styles.title}>{titolo}</h2>
          <button type="button" onClick={onClose} disabled={saving} style={styles.closeBtn} aria-label="Chiudi">×</button>
        </div>

        {risorse.length > 0 && !loadingList && !errorList && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cerca ${labelSingolare}`}
            disabled={saving}
            style={styles.searchInput}
          />
        )}

        <div style={styles.body}>
          {loadingList && <div style={styles.statusBox}>Caricamento {labelPlurale}...</div>}

          {!loadingList && errorList && (
            <div style={styles.errorBox}>
              <div style={styles.errorTitle}>Errore di caricamento</div>
              <div style={styles.errorMessage}>{errorList}</div>
              <button type="button" onClick={() => refetch()} style={styles.retryBtn}>Riprova</button>
            </div>
          )}

          {!loadingList && !errorList && risorse.length === 0 && !aggiungiOpen && (
            <div style={styles.emptyBox}>
              <div style={styles.emptyTitle}>Nessuna {labelSingolare} configurata</div>
              <div style={styles.emptyMessage}>Aggiungi la prima qui sotto, oppure dalla pagina cantiere → Configurazione.</div>
              <button type="button" onClick={() => setAggiungiOpen(true)} style={styles.addBtnPrimary}>
                + Aggiungi {labelSingolare}
              </button>
            </div>
          )}

          {!loadingList && !errorList && risorse.length > 0 && (
            <div style={styles.list}>
              {modalita === 'singola' && permettiNessuno && (
                <button
                  type="button"
                  onClick={() => handleSelectSingola(null)}
                  disabled={saving}
                  style={{ ...styles.row, ...(selectedSingola === null ? styles.rowChecked : {}) }}
                >
                  <div style={styles.rowAvatarMuted}>—</div>
                  <div style={styles.rowName}>Nessuna {labelSingolare}</div>
                  <div style={{ ...styles.radio, ...(selectedSingola === null ? styles.radioChecked : {}) }}>
                    {selectedSingola === null && <div style={styles.radioDot} />}
                  </div>
                </button>
              )}

              {filtrati.length === 0 && search && (
                <div style={styles.statusBox}>Nessun risultato per "{search}"</div>
              )}

              {filtrati.map((r) => {
                if (modalita === 'singola') {
                  const checked = selectedSingola === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectSingola(r.id)}
                      disabled={saving}
                      style={{ ...styles.row, ...(checked ? styles.rowChecked : {}) }}
                    >
                      <div style={styles.rowAvatar}>•</div>
                      <div style={styles.rowName}>{r.valore}</div>
                      <div style={{ ...styles.radio, ...(checked ? styles.radioChecked : {}) }}>
                        {checked && <div style={styles.radioDot} />}
                      </div>
                    </button>
                  )
                } else {
                  const checked = selectedMulti.has(r.id)
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleToggleMulti(r.id)}
                      disabled={saving}
                      style={{ ...styles.row, ...(checked ? styles.rowChecked : {}) }}
                    >
                      <div style={styles.rowAvatar}>•</div>
                      <div style={styles.rowName}>{r.valore}</div>
                      <div style={{ ...styles.checkbox, ...(checked ? styles.checkboxChecked : {}) }}>
                        {checked && <span style={styles.checkmark}>✓</span>}
                      </div>
                    </button>
                  )
                }
              })}

              {!aggiungiOpen && (
                <button type="button" onClick={() => setAggiungiOpen(true)} disabled={saving || createHook.saving} style={styles.addBtnDashed}>
                  + Aggiungi {labelSingolare}
                </button>
              )}
            </div>
          )}

          {aggiungiOpen && (
            <div style={styles.aggiungiBox}>
              <div style={styles.aggiungiLabel}>Nuova {labelSingolare}</div>
              <input
                type="text"
                value={nuovoNome}
                onChange={(e) => {
                  setNuovoNome(e.target.value)
                  if (createHook.error) createHook.resetError()
                }}
                placeholder={`Nome ${labelSingolare}`}
                disabled={createHook.saving || saving}
                maxLength={120}
                autoFocus
                style={styles.searchInput}
              />
              {createHook.error && (
                <div style={styles.inlineError}>{createHook.error}</div>
              )}
              <div style={styles.aggiungiActions}>
                <button
                  type="button"
                  onClick={() => { setAggiungiOpen(false); setNuovoNome(''); createHook.resetError() }}
                  disabled={createHook.saving}
                  style={styles.btnSecondarySmall}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleAggiungiInline}
                  disabled={createHook.saving || nuovoNome.trim().length < 2}
                  style={{ ...styles.btnPrimarySmall, ...((createHook.saving || nuovoNome.trim().length < 2) ? styles.btnPrimaryDisabled : {}) }}
                >
                  {createHook.saving ? 'Salvataggio...' : 'Crea e seleziona'}
                </button>
              </div>
            </div>
          )}

          {saveError && (
            <div style={styles.errorBox}>
              <div style={styles.errorTitle}>Errore durante il salvataggio</div>
              <div style={styles.errorMessage}>{saveError}</div>
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={onClose} disabled={saving} style={{ ...styles.btnSecondary, ...(saving ? styles.btnDisabled : {}) }}>
            Annulla
          </button>
          <button type="button" onClick={handleSave} disabled={saving || loadingList} style={{ ...styles.btnPrimary, ...((saving || loadingList) ? styles.btnPrimaryDisabled : {}) }}>
            {saving ? (
              <span style={styles.savingWrap}><span style={styles.spinner} />Salvataggio...</span>
            ) : labelBottoneSalva}
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
  searchInput: { width: '100%', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
  body: { flex: 1, minHeight: 100, marginBottom: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' },
  rowChecked: { borderColor: 'var(--accent)', background: 'var(--bg-badge-open)' },
  rowAvatar: { width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-toggle)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 },
  rowAvatarMuted: { width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-toggle)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 },
  rowName: { flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: '1.5px', borderStyle: 'solid', borderColor: 'var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { background: 'var(--accent)', borderColor: 'var(--accent)' },
  checkmark: { color: 'var(--text-on-accent)', fontSize: 13, lineHeight: 1, fontWeight: 500 },
  radio: { width: 20, height: 20, borderRadius: '50%', borderWidth: '1.5px', borderStyle: 'solid', borderColor: 'var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioChecked: { borderColor: 'var(--accent)' },
  radioDot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' },
  statusBox: { padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 },
  emptyBox: { background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-card)', padding: 24, textAlign: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 },
  emptyMessage: { fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 },
  addBtnPrimary: { background: 'var(--accent)', color: 'var(--text-on-accent)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: '8px 14px', borderRadius: 18, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  addBtnDashed: { background: 'transparent', borderWidth: '1px', borderStyle: 'dashed', borderColor: '#B4B2A9', color: 'var(--accent)', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  aggiungiBox: { background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--accent)', borderRadius: 10, padding: 12, marginTop: 8 },
  aggiungiLabel: { fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 },
  aggiungiActions: { display: 'flex', gap: 6, marginTop: 4 },
  btnSecondarySmall: { flex: 1, background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimarySmall: { flex: 1, background: 'var(--accent)', color: 'var(--text-on-accent)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: '8px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  inlineError: { color: '#A32D2D', fontSize: 11, marginTop: 4, marginBottom: 8 },
  errorBox: { background: '#FCEBEB', borderWidth: '0.5px', borderStyle: 'solid', borderColor: '#F09595', borderRadius: 8, padding: '10px 12px', marginTop: 10 },
  errorTitle: { fontSize: 12, fontWeight: 500, color: '#501313', marginBottom: 2 },
  errorMessage: { fontSize: 11, color: '#791F1F', wordBreak: 'break-word', marginBottom: 8 },
  retryBtn: { background: '#A32D2D', color: '#FFFFFF', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: '6px 14px', borderRadius: 14, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  actions: { display: 'flex', gap: 8 },
  btnSecondary: { flex: 1, background: 'var(--bg-card)', borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { flex: 1, background: 'var(--accent)', color: 'var(--text-on-accent)', borderWidth: 0, borderStyle: 'solid', borderColor: 'transparent', padding: 12, borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  btnPrimaryDisabled: { background: '#B4B2A9', cursor: 'not-allowed', opacity: 0.7 },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  savingWrap: { display: 'inline-flex', alignItems: 'center', gap: 8 },
  spinner: { width: 14, height: 14, borderWidth: 2, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'var(--text-on-accent)', borderRadius: '50%', animation: 'modal-spinner 0.8s linear infinite' },
}
