import { useRef, useEffect, useState, type CSSProperties } from 'react'

type DurationPickerProps = {
  open: boolean
  initialMinutes: number | null
  onClose: () => void
  onConfirm: (totaleMinuti: number) => void
  onCancel?: () => void
  title?: string
}

const MINUTES_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const ITEM_HEIGHT = 56
const WHEEL_HEIGHT = ITEM_HEIGHT * 3 // 168

function getItemStyle(dist: number): CSSProperties {
  const base: CSSProperties = {
    height: ITEM_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    scrollSnapAlign: 'center',
    scrollSnapStop: 'always',
    fontFamily: 'var(--font-sans)',
    userSelect: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease, color 0.15s ease',
  }
  if (dist === 0) return { ...base, opacity: 1, color: 'var(--text-primary)', fontWeight: 600, fontSize: 38 }
  if (dist === 1) return { ...base, opacity: 0.45, color: 'var(--text-tertiary)', fontWeight: 400, fontSize: 32 }
  return { ...base, opacity: 0 }
}

export default function DurationPicker({
  open,
  initialMinutes,
  onClose,
  onConfirm,
  onCancel,
  title = 'Durata della misura',
}: DurationPickerProps) {
  const [selectedHours, setSelectedHours] = useState(0)
  const [selectedMinutes, setSelectedMinutes] = useState(0)

  const hoursRef = useRef<HTMLUListElement>(null)
  const minutesRef = useRef<HTMLUListElement>(null)
  const hoursTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const minutesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return

    let initHours = 0
    let initMinsIdx = 0

    if (initialMinutes !== null) {
      initHours = Math.min(12, Math.max(0, Math.floor(initialMinutes / 60)))
      const rawMins = initialMinutes % 60
      initMinsIdx = Math.min(11, Math.max(0, Math.round(rawMins / 5)))
    }

    const rafId = requestAnimationFrame(() => {
      setSelectedHours(initHours)
      setSelectedMinutes(MINUTES_OPTIONS[initMinsIdx])
      if (hoursRef.current) hoursRef.current.scrollTop = initHours * ITEM_HEIGHT
      if (minutesRef.current) minutesRef.current.scrollTop = initMinsIdx * ITEM_HEIGHT
    })

    return () => cancelAnimationFrame(rafId)
  }, [open, initialMinutes])

  useEffect(() => {
    return () => {
      if (hoursTimerRef.current) clearTimeout(hoursTimerRef.current)
      if (minutesTimerRef.current) clearTimeout(minutesTimerRef.current)
    }
  }, [])

  const handleHoursScroll = () => {
    if (hoursTimerRef.current) clearTimeout(hoursTimerRef.current)
    hoursTimerRef.current = setTimeout(() => {
      if (!hoursRef.current) return
      const idx = Math.max(0, Math.min(12, Math.round(hoursRef.current.scrollTop / ITEM_HEIGHT)))
      setSelectedHours(idx)
    }, 50)
  }

  const handleMinutesScroll = () => {
    if (minutesTimerRef.current) clearTimeout(minutesTimerRef.current)
    minutesTimerRef.current = setTimeout(() => {
      if (!minutesRef.current) return
      const idx = Math.max(0, Math.min(11, Math.round(minutesRef.current.scrollTop / ITEM_HEIGHT)))
      setSelectedMinutes(MINUTES_OPTIONS[idx])
    }, 50)
  }

  const handleConfirm = () => {
    onConfirm(selectedHours * 60 + selectedMinutes)
  }

  const formatTime = () =>
    `${String(selectedHours).padStart(2, '0')}:${String(selectedMinutes).padStart(2, '0')}`

  if (!open) return null

  const selectedMinutesIdx = MINUTES_OPTIONS.indexOf(selectedMinutes)

  return (
    <>
      <style>{`.duration-picker-wheel::-webkit-scrollbar { display: none; }`}</style>
      <div
        style={styles.overlay}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div style={styles.card}>
          <div style={styles.header}>
            <button type="button" onClick={onClose} style={{ ...styles.btnClose, justifySelf: 'start' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div style={{ justifySelf: 'center' as const }}>
              {onCancel && (
                <button
                  type="button"
                  onClick={() => { onCancel(); onClose() }}
                  style={styles.btnCancella}
                >
                  Cancella
                </button>
              )}
            </div>
            <button type="button" onClick={onClose} style={{ ...styles.btnAnnulla, justifySelf: 'end' }}>
              Annulla
            </button>
          </div>

          <h2 style={styles.pageTitle}>{title}</h2>

          <div style={styles.wheelsContainer}>
            <div style={styles.wheelsWrapper}>
              <div style={styles.selectionBar} />
              <div style={styles.separator}>:</div>

              <div>
                <ul
                  ref={hoursRef}
                  className="duration-picker-wheel"
                  style={styles.wheel}
                  onScroll={handleHoursScroll}
                >
                  <li style={styles.spacer} />
                  {Array.from({ length: 13 }, (_, i) => (
                    <li
                      key={i}
                      style={getItemStyle(Math.abs(i - selectedHours))}
                      onClick={() =>
                        hoursRef.current?.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' })
                      }
                    >
                      {String(i).padStart(2, '0')}
                    </li>
                  ))}
                  <li style={styles.spacer} />
                </ul>
                <div style={styles.wheelLabel}>ore</div>
              </div>

              <div>
                <ul
                  ref={minutesRef}
                  className="duration-picker-wheel"
                  style={styles.wheel}
                  onScroll={handleMinutesScroll}
                >
                  <li style={styles.spacer} />
                  {MINUTES_OPTIONS.map((m, i) => (
                    <li
                      key={m}
                      style={getItemStyle(Math.abs(i - selectedMinutesIdx))}
                      onClick={() =>
                        minutesRef.current?.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' })
                      }
                    >
                      {String(m).padStart(2, '0')}
                    </li>
                  ))}
                  <li style={styles.spacer} />
                </ul>
                <div style={styles.wheelLabel}>minuti</div>
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={handleConfirm} style={styles.btnConferma}>
              Conferma {formatTime()}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
    width: '100%',
    maxWidth: 460,
    maxHeight: 'calc(100vh - 32px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    height: 56,
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 16,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--border)',
    flexShrink: 0,
  },
  btnClose: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'none',
    color: 'var(--text-primary)',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancella: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'none',
    color: 'var(--text-secondary)',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    cursor: 'pointer',
  },
  btnAnnulla: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'none',
    color: 'var(--text-secondary)',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    cursor: 'pointer',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 600,
    textAlign: 'center',
    color: 'var(--text-primary)',
    marginTop: 24,
    marginBottom: 32,
    marginLeft: 0,
    marginRight: 0,
    fontFamily: 'var(--font-sans)',
  },
  wheelsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 0,
    paddingRight: 0,
  },
  wheelsWrapper: {
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
    position: 'relative',
    width: 232,
  },
  selectionBar: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: 'var(--accent)',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--accent)',
    pointerEvents: 'none',
  },
  separator: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: '50%',
    transform: 'translateX(-50%)',
    height: ITEM_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 38,
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 1,
  },
  wheel: {
    width: 100,
    height: WHEEL_HEIGHT,
    overflowY: 'scroll',
    overflowX: 'hidden',
    scrollSnapType: 'y mandatory',
    scrollbarWidth: 'none',
    listStyle: 'none',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  spacer: {
    height: ITEM_HEIGHT,
    visibility: 'hidden',
    scrollSnapAlign: 'none',
  },
  wheelLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'var(--font-sans)',
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: 'var(--border)',
    flexShrink: 0,
  },
  btnConferma: {
    width: '100%',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: 'var(--radius-card)',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  },
}
