import type { CSSProperties } from 'react'
import type { ToastType } from './types'

export const TOAST_TYPE_STYLES: Record<
  ToastType,
  { bg: string; border: string; accent: string; text: string; icon: string }
> = {
  success: { bg: '#ECFDF5', border: '#10B981', accent: '#10B981', text: '#064E3B', icon: '✓' },
  error:   { bg: '#FEF2F2', border: '#EF4444', accent: '#EF4444', text: '#7F1D1D', icon: '✕' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', accent: '#F59E0B', text: '#78350F', icon: '⚠' },
  info:    { bg: '#EFF6FF', border: '#3B82F6', accent: '#3B82F6', text: '#1E3A8A', icon: 'ℹ' },
}

export const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  info:    3000,
  warning: 5000,
  error:   6000,
}

export const containerStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'none',
}

export const toastBaseStyle: CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  paddingTop: 12,
  paddingRight: 14,
  paddingBottom: 12,
  paddingLeft: 14,
  borderRadius: 8,
  borderTopWidth: 1,
  borderTopStyle: 'solid',
  borderRightWidth: 1,
  borderRightStyle: 'solid',
  borderBottomWidth: 1,
  borderBottomStyle: 'solid',
  borderLeftWidth: 4,
  borderLeftStyle: 'solid',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  minWidth: 280,
  maxWidth: 360,
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  lineHeight: 1.4,
}
