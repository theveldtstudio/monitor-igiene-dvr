import type React from 'react'
import { useState } from 'react'
import type { RisorsaCantiere, TipoRisorsa } from '../types'
import { useRisorseCantiere } from '../hooks/useRisorseCantiere'
import { useDeleteRisorsa } from '../hooks/useDeleteRisorsa'
import RisorsaModal from './RisorsaModal'
import ConfirmDialog from './ConfirmDialog'

interface SezioneRisorseProps {
  cantiereId: string
  tipo: TipoRisorsa
  titolo: string
  labelSingolare: string
  labelPlurale: string
}

export default function SezioneRisorse({ cantiereId, tipo, titolo, labelSingolare, labelPlurale }: SezioneRisorseProps) {
  const [open, setOpen] = useState(false)
  const { risorse, loading, error, refetch } = useRisorseCantiere(cantiereId, tipo)
  const [editorOpen, setEditorOpen] = useState(false)
  const [risorsaInModifica, setRisorsaInModifica] = useState<RisorsaCantiere | null>(null)
  const [risorsaDaEliminare, setRisorsaDaEliminare] = useState<RisorsaCantiere | null>(null)
  const { deleteRisorsa, deleting, error: deleteError, resetError: resetDeleteError } = useDeleteRisorsa()

  const sottotitolo = (() => {
    if (loading) return 'Caricamento...'
    if (error) return 'Errore'
    if (risorse.length === 0) return 'Nessuna ancora'
    return `${risorse.length} ${risorse.length === 1 ? labelSingolare : labelPlurale}`
  })()

  const handleApriCreazione = () => {
    setRisorsaInModifica(null)
    setEditorOpen(true)
  }

  const handleApriModifica = (r: RisorsaCantiere) => {
    setRisorsaInModifica(r)
    setEditorOpen(true)
  }

  const handleSaved = () => {
    refetch()
  }

  const handleRichiediElimina = (r: RisorsaCantiere) => {
    resetDeleteError()
    setRisorsaDaEliminare(r)
  }

  const handleConfermaElimina = async () => {
    if (!risorsaDaEliminare) return
    const ok = await deleteRisorsa(risorsaDaEliminare.id)
    if (ok) {
      setRisorsaDaEliminare(null)
      refetch()
    }
  }

  return (
    <div style={styles.card}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ ...styles.headerBtn, ...(open ? styles.headerBtnOpen : {}) }}
        aria-expanded={open}
      >
        <div style={styles.headerLeft}>
          <div style={styles.titolo}>{titolo}</div>
          <div style={{ ...styles.sottotitolo, ...(risorse.length === 0 && !loading ? styles.sottotitoloEmpty : {}) }}>
            {sottotitolo}
          </div>
        </div>
        <div style={{ ...styles.chevron, ...(open ? styles.chevronOpen : {}) }}>⌄</div>
      </button>

      {open && (
        <div style={styles.body}>
          {loading && (
            <div style={styles.statusBox}>Caricamento {labelPlurale}...</div>
          )}

          {!loading && error && (
            <div style={styles.errorBox}>
              <div style={styles.errorTitle}>Errore di caricamento</div>
              <div style={styles.errorMessage}>{error}</div>
              <button type="button" onClick={() => refetch()} style={styles.retryBtn}>Riprova</button>
            </div>
          )}

          {!loading && !error && risorse.length === 0 && (
            <div style={styles.emptyBox}>
              <div style={styles.emptyMessage}>Nessuna {labelSingolare} ancora.</div>
              <button type="button" onClick={handleApriCreazione} style={styles.addBtnPrimary}>
                + Aggiungi {labelSingolare}
              </button>
            </div>
          )}

          {!loading && !error && risorse.length > 0 && (
            <div style={styles.list}>
              {risorse.map((r: RisorsaCantiere) => (
                <div key={r.id} style={styles.item}>
                  <div style={styles.itemValue}>{r.valore}</div>
                  <div style={styles.itemActions}>
                    <button type="button" onClick={() => handleApriModifica(r)} style={styles.itemActionBtn} aria-label="Modifica">
                      ✎
                    </button>
                    <button type="button" onClick={() => handleRichiediElimina(r)} style={styles.itemActionBtnDanger} aria-label="Elimina">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleApriCreazione} style={styles.addBtnDashed}>
                + Aggiungi {labelSingolare}
              </button>
            </div>
          )}
        </div>
      )}

      <RisorsaModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
        cantiereId={cantiereId}
        tipo={tipo}
        risorsaDaModificare={risorsaInModifica}
        esistenti={risorse}
        labelSingolare={labelSingolare}
      />

      <ConfirmDialog
        open={risorsaDaEliminare != null}
        title={`Eliminare ${labelSingolare === 'fase' ? 'la fase' : labelSingolare === 'postazione' ? 'la postazione' : 'la macchina'}?`}
        message={
          <>
            <strong style={{ color: 'var(--text-primary)' }}>{risorsaDaEliminare?.valore}</strong> verrà rimossa da questo cantiere. Le misure registrate in passato manterranno il valore testuale e non saranno alterate.
            {deleteError && (
              <>
                <br /><br /><span style={{ color: '#A32D2D' }}>Errore: {deleteError}</span>
              </>
            )}
          </>
        }
        confirmLabel="Sì, elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfermaElimina}
        onCancel={() => {
          if (!deleting) {
            setRisorsaDaEliminare(null)
            resetDeleteError()
          }
        }}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-card)',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  headerBtn: {
    width: '100%',
    background: 'transparent',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  headerBtnOpen: {
    background: 'var(--bg-app)',
    borderBottomWidth: '0.5px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--border)',
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  titolo: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  sottotitolo: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 1,
  },
  sottotitoloEmpty: {
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
  },
  chevron: {
    color: 'var(--text-tertiary)',
    fontSize: 14,
    transition: 'transform 0.15s ease',
    paddingLeft: 8,
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
    color: 'var(--accent)',
  },
  body: {
    padding: 8,
  },
  statusBox: {
    padding: 16,
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: 12,
  },
  errorBox: {
    background: '#FCEBEB',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: '#F09595',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: '#501313',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 11,
    color: '#791F1F',
    marginBottom: 10,
    wordBreak: 'break-word',
  },
  retryBtn: {
    background: '#A32D2D',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 14,
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  emptyBox: {
    padding: '8px 4px',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 10,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  item: {
    background: 'var(--bg-card)',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'var(--bg-toggle)',
    borderRadius: 8,
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemValue: {
    fontSize: 13,
    color: 'var(--text-primary)',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dotsBtn: {
    width: 26,
    height: 26,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-tertiary)',
    fontSize: 14,
    lineHeight: 1,
    cursor: 'pointer',
    paddingBottom: 4,
    borderRadius: 6,
    fontFamily: 'inherit',
    opacity: 0.5,
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  itemActionBtn: {
    width: 28,
    height: 28,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    borderRadius: 6,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActionBtnDanger: {
    width: 28,
    height: 28,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    background: 'transparent',
    color: '#A32D2D',
    fontSize: 12,
    cursor: 'pointer',
    borderRadius: 6,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPrimary: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 18,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  addBtnDashed: {
    background: 'transparent',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: '#B4B2A9',
    color: 'var(--accent)',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
