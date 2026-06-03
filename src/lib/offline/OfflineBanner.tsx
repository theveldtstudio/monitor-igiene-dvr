import type { CSSProperties } from 'react'
import { useOnlineStatus } from './useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  const containerStyle: CSSProperties = {
    height: isOnline ? 0 : 40,
    overflow: 'hidden',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: isOnline ? 0 : 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#F59E0B',
    transitionProperty: 'height, border-bottom-width',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-out',
    width: '100%',
  }

  const contentStyle: CSSProperties = {
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#78350F',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    fontWeight: 500,
    opacity: isOnline ? 0 : 1,
    transitionProperty: 'opacity',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-out',
  }

  return (
    <div style={containerStyle} role="status" aria-live="polite" aria-hidden={isOnline}>
      <div style={contentStyle}>⚠ Offline</div>
    </div>
  )
}
