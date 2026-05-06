import type React from 'react'

interface SpinnerProps {
  size?: number
  color?: string
}

const spinKeyframes = `
@keyframes _spinner_spin {
  to { transform: rotate(360deg); }
}
`

let injected = false
function injectKeyframes() {
  if (injected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = spinKeyframes
  document.head.appendChild(style)
  injected = true
}

const Spinner: React.FC<SpinnerProps> = ({ size = 14, color = 'currentColor' }) => {
  injectKeyframes()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        animation: '_spinner_spin 0.8s linear infinite',
      }}
      aria-hidden="true"
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="26"
        strokeDashoffset="8"
        opacity="0.85"
      />
    </svg>
  )
}

export default Spinner
