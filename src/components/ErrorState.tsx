interface SecondaryAction {
  label: string
  onClick: () => void
}

interface ErrorStateProps {
  title?: string
  message?: string
  error?: unknown
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
  secondaryAction?: SecondaryAction
}

export default function ErrorState({
  title = 'Errore di caricamento',
  message,
  error,
  onRetry,
  retryLabel = 'Riprova',
  compact = false,
  secondaryAction,
}: ErrorStateProps) {
  const msg = message
    ?? (error instanceof Error ? error.message : typeof error === 'string' ? error : 'Si è verificato un errore.')

  const hasActions = !!(onRetry || secondaryAction)

  return (
    <div style={{
      background: 'var(--error-bg)',
      border: '0.5px solid var(--error-border)',
      borderRadius: 'var(--radius-card)',
      padding: compact ? '12px 16px' : '20px 24px',
      textAlign: 'center',
    }}>
      {!compact && (
        <div style={{ fontSize: 16, fontWeight: 500, color: '#501313', marginBottom: 6 }}>
          {title}
        </div>
      )}
      <div style={{
        fontSize: 12,
        color: '#791F1F',
        lineHeight: 1.5,
        wordBreak: 'break-word',
        marginBottom: hasActions ? 14 : 0,
      }}>
        {msg}
      </div>
      {hasActions && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius-fab)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {retryLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              style={{
                background: 'transparent',
                color: 'var(--accent)',
                border: '0.5px solid var(--border)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-fab)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
