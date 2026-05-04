import type React from 'react'
import type { Misura } from '../types'
import type { SubtitleBuilder } from '../data/cardSubtitles'

interface CardMisuraGenericaProps {
  misura: Misura
  subtitleBuilder: SubtitleBuilder
  onModifica: () => void
  onElimina: () => void
  readOnly?: boolean
}

export default function CardMisuraGenerica({ misura, subtitleBuilder, onModifica, onElimina, readOnly = false }: CardMisuraGenericaProps) {
  const { subtitle, metaLines } = subtitleBuilder(misura)

  return (
    <div style={styles.card}>
      <div style={styles.numero}>#{misura.numero}</div>
      <div style={styles.body}>
        {subtitle ? (
          <div style={styles.subtitle}>{subtitle}</div>
        ) : (
          <div style={styles.subtitleEmpty}>Misura senza dettagli</div>
        )}
        {metaLines.map((line, idx) => (
          <div key={`meta-${idx}`} style={styles.note}>{line}</div>
        ))}
        {misura.note && <div style={styles.note}>{misura.note}</div>}
      </div>
      {!readOnly && (
        <div style={styles.actions}>
          <button type="button" onClick={onModifica} style={styles.actionBtn} aria-label={`Modifica misura ${misura.numero}`}>
            ✎
          </button>
          <button type="button" onClick={onElimina} style={styles.actionBtnDanger} aria-label={`Elimina misura ${misura.numero}`}>
            ✕
          </button>
        </div>
      )}
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
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  numero: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--accent)',
    minWidth: 32,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-primary)',
  },
  subtitleEmpty: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
  },
  note: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  actionBtn: {
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
  actionBtnDanger: {
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
}
