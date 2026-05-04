import type React from 'react'
import { useEffect, useRef } from 'react'

export interface CardAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface CardActionsMenuProps {
  open: boolean
  onClose: () => void
  actions: CardAction[]
}

export default function CardActionsMenu({ open, onClose, actions }: CardActionsMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
    }, 0)

    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div ref={ref} style={styles.menu} role="menu">
      {actions.map((action, i) => (
        <div key={i}>
          {i > 0 && <div style={styles.separator} />}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
              onClose()
            }}
            style={{
              ...styles.item,
              ...(action.variant === 'danger' ? styles.itemDanger : {}),
            }}
            role="menuitem"
          >
            {action.label}
          </button>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  menu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    padding: 4,
    minWidth: 160,
    zIndex: 50,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  separator: {
    height: '0.5px',
    background: 'var(--bg-toggle)',
    margin: '2px 6px',
  },
  item: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--text-primary)',
    textAlign: 'left',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  itemDanger: {
    color: '#A32D2D',
  },
}
