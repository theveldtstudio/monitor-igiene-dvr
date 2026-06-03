import { useEffect, useRef, useState } from 'react'
import { toast } from './toastApi'
import { useToastItems } from './useToast'
import { TOAST_TYPE_STYLES, containerStyle, toastBaseStyle } from './styles'
import type { ToastItem } from './types'

const KEYFRAMES = `
@keyframes _toast_slide_in_right {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes _toast_slide_out_right {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(110%); opacity: 0; }
}
@keyframes _toast_slide_in_top {
  from { transform: translateY(-110%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
@keyframes _toast_slide_out_top {
  from { transform: translateY(0);     opacity: 1; }
  to   { transform: translateY(-110%); opacity: 0; }
}
`

let keyframesInjected = false
function injectKeyframes(): void {
  if (keyframesInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = KEYFRAMES
  document.head.appendChild(style)
  keyframesInjected = true
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

interface ToastCardProps {
  item: ToastItem
  isMobile: boolean
  onDismiss: (id: string) => void
}

function ToastCard({ item, isMobile, onDismiss }: ToastCardProps) {
  const [exiting, setExiting] = useState(false)
  const [paused, setPaused] = useState(false)
  const exitingRef = useRef(false)
  const remainingRef = useRef(item.duration)
  const timerStartRef = useRef(0)

  const s = TOAST_TYPE_STYLES[item.type]
  const isAssertive = item.type === 'error' || item.type === 'warning'

  function triggerDismiss(): void {
    if (exitingRef.current) return
    exitingRef.current = true
    setExiting(true)
    setTimeout(() => onDismiss(item.id), 150)
  }

  // Inject keyframes once at module level
  useEffect(() => { injectKeyframes() }, [])

  // Timer: re-runs on [paused] change. Cleanup subtracts elapsed from remaining.
  useEffect(() => {
    if (item.duration <= 0 || paused) return
    timerStartRef.current = Date.now()
    const timeout = setTimeout(triggerDismiss, remainingRef.current)
    return () => {
      clearTimeout(timeout)
      const elapsed = Date.now() - timerStartRef.current
      remainingRef.current = Math.max(0, remainingRef.current - elapsed)
    }
    // triggerDismiss is stable: only reads exitingRef (ref) + onDismiss (module fn) + item.id (stable prop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  const enterAnim = isMobile ? '_toast_slide_in_top' : '_toast_slide_in_right'
  const exitAnim  = isMobile ? '_toast_slide_out_top' : '_toast_slide_out_right'
  const animation = exiting
    ? `${exitAnim} 150ms ease-in forwards`
    : `${enterAnim} 200ms ease-out forwards`

  return (
    <div
      role="alert"
      aria-live={isAssertive ? 'assertive' : 'polite'}
      onMouseEnter={isMobile ? undefined : () => { if (!exitingRef.current) setPaused(true) }}
      onMouseLeave={isMobile ? undefined : () => { if (!exitingRef.current) setPaused(false) }}
      style={{
        ...toastBaseStyle,
        backgroundColor: s.bg,
        borderTopColor: s.border,
        borderRightColor: s.border,
        borderBottomColor: s.border,
        borderLeftColor: s.accent,
        color: s.text,
        animation,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 15, flexShrink: 0, marginTop: 1 }}>
        {s.icon}
      </span>
      <span style={{ flex: 1 }}>{item.message}</span>
      <button
        type="button"
        aria-label="Chiudi notifica"
        onClick={triggerDismiss}
        style={{
          background: 'none',
          borderTopWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderStyle: 'solid',
          borderColor: 'transparent',
          cursor: 'pointer',
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 6,
          color: s.text,
          opacity: 0.6,
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
          alignSelf: 'flex-start',
        }}
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider() {
  const allItems = useToastItems()
  const isMobile = useIsMobile()

  const visibleItems = [...allItems].reverse().slice(0, 3)

  if (visibleItems.length === 0) return null

  const positionStyle = isMobile
    ? { top: 12, left: 12, right: 12, alignItems: 'stretch' as const }
    : { top: 16, right: 16, alignItems: 'flex-end' as const }

  return (
    <div
      role="status"
      aria-label="Notifiche"
      style={{ ...containerStyle, ...positionStyle }}
    >
      {visibleItems.map(item => (
        <ToastCard
          key={item.id}
          item={item}
          isMobile={isMobile}
          onDismiss={toast.dismiss}
        />
      ))}
    </div>
  )
}
