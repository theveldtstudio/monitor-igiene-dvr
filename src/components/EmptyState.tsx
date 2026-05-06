import type React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
}

export default function EmptyState({ icon, title, message, actionLabel, onAction, compact = false }: EmptyStateProps) {
  const paddingY = compact ? 24 : 60
  const iconSize = compact ? 32 : 48

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      padding: `${paddingY}px 24px`,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {icon && (
        <div style={{
          color: 'var(--text-tertiary)',
          marginBottom: compact ? 10 : 16,
          width: iconSize,
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
      )}
      <div style={{
        fontSize: compact ? 14 : 16,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 6,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        maxWidth: 280,
        marginBottom: actionLabel && onAction ? (compact ? 16 : 20) : 0,
      }}>
        {message}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            padding: compact ? '8px 16px' : '10px 20px',
            borderRadius: 'var(--radius-fab)',
            fontSize: compact ? 12 : 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 2px 8px var(--accent-shadow)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
