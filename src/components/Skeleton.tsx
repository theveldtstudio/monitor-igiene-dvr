import type React from 'react'

const pulseKeyframes = `
@keyframes _skeleton_pulse {
  0%, 100% { opacity: 1 }
  50% { opacity: 0.4 }
}
`

let injected = false
function injectKeyframes() {
  if (injected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = pulseKeyframes
  document.head.appendChild(style)
  injected = true
}

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  marginBottom?: string | number
  style?: React.CSSProperties
}

export default function Skeleton({ width = '100%', height = 12, borderRadius = 4, marginBottom, style }: SkeletonProps) {
  injectKeyframes()
  return (
    <div style={{
      background: 'var(--skeleton-bg)',
      width,
      height,
      borderRadius,
      marginBottom,
      animation: '_skeleton_pulse 1.5s ease-in-out infinite',
      ...style,
    }} />
  )
}

interface SkeletonTextProps {
  lines?: number
}

export function SkeletonText({ lines = 2 }: SkeletonTextProps) {
  const widths = ['70%', '85%', '60%', '75%', '55%']
  return (
    <>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={widths[i % widths.length]}
          height={12}
          marginBottom={i < lines - 1 ? 6 : 0}
        />
      ))}
    </>
  )
}

interface SkeletonCardProps {
  iconSize?: number
}

export function SkeletonCard({ iconSize = 40 }: SkeletonCardProps) {
  injectKeyframes()
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-card-pad)',
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    }}>
      <div style={{
        width: iconSize,
        height: iconSize,
        borderRadius: 8,
        background: 'var(--skeleton-bg)',
        animation: '_skeleton_pulse 1.5s ease-in-out infinite',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <Skeleton width="55%" height={14} marginBottom={6} />
        <Skeleton width="35%" height={10} />
      </div>
    </div>
  )
}
