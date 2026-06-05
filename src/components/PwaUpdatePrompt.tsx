import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Avviso "Nuova versione disponibile" (registerType 'prompt').
 * Quando il SW nuovo resta in attesa (needRefresh), mostra un riquadro
 * con stile coerente ai toast: "Aggiorna" applica l'update e ricarica,
 * "Più tardi" chiude l'avviso lasciando la versione corrente.
 * L'avviso offline-ready viene ignorato.
 */

const KEYFRAMES = `
@keyframes _pwa_slide_in_right {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes _pwa_slide_in_top {
  from { transform: translateY(-110%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
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

const cardStyle: CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  paddingTop: 12,
  paddingRight: 14,
  paddingBottom: 12,
  paddingLeft: 14,
  borderRadius: 8,
  borderTopWidth: 1,
  borderTopStyle: 'solid',
  borderTopColor: 'var(--border)',
  borderRightWidth: 1,
  borderRightStyle: 'solid',
  borderRightColor: 'var(--border)',
  borderBottomWidth: 1,
  borderBottomStyle: 'solid',
  borderBottomColor: 'var(--border)',
  borderLeftWidth: 4,
  borderLeftStyle: 'solid',
  borderLeftColor: 'var(--accent)',
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-primary)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  minWidth: 280,
  maxWidth: 360,
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  lineHeight: 1.4,
}

const updateBtnStyle: CSSProperties = {
  flex: 1,
  paddingTop: 8,
  paddingRight: 14,
  paddingBottom: 8,
  paddingLeft: 14,
  borderTopWidth: 0,
  borderRightWidth: 0,
  borderBottomWidth: 0,
  borderLeftWidth: 0,
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderRadius: 'var(--radius-badge)',
  backgroundColor: 'var(--accent)',
  color: 'var(--text-on-accent)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}

const laterBtnStyle: CSSProperties = {
  flex: 1,
  paddingTop: 8,
  paddingRight: 14,
  paddingBottom: 8,
  paddingLeft: 14,
  borderTopWidth: 1,
  borderRightWidth: 1,
  borderBottomWidth: 1,
  borderLeftWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--border)',
  borderRadius: 'var(--radius-badge)',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

export function PwaUpdatePrompt() {
  const isMobile = useIsMobile()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW() {
      // Nessun polling necessario: l'update viene rilevato al reload della tab.
    },
  })

  useEffect(() => {
    injectKeyframes()
  }, [])

  if (!needRefresh) return null

  const positionStyle: CSSProperties = isMobile
    ? { top: 12, left: 12, right: 12 }
    : { top: 16, right: 16 }

  const enterAnim = isMobile ? '_pwa_slide_in_top' : '_pwa_slide_in_right'

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        ...positionStyle,
      }}
    >
      <div style={{ ...cardStyle, animation: `${enterAnim} 200ms ease-out forwards` }}>
        <span style={{ fontWeight: 600 }}>Nuova versione disponibile</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            style={updateBtnStyle}
            onClick={() => updateServiceWorker(true)}
          >
            Aggiorna
          </button>
          <button
            type="button"
            style={laterBtnStyle}
            onClick={() => setNeedRefresh(false)}
          >
            Più tardi
          </button>
        </div>
      </div>
    </div>
  )
}
