import { useState } from 'react'
import type React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { humanizeError } from '../lib/humanizeError'

function isCredentialError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as Record<string, unknown>
  if (typeof e.status === 'number' && e.status === 400) return true
  if (typeof e.message === 'string') {
    const m = e.message.toLowerCase()
    if (m.includes('invalid login') || m.includes('credentials')) return true
  }
  return false
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function LoginScreen() {
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setResetMsg('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setError(isCredentialError(err) ? 'Email o password non corretti' : humanizeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Inserisci prima la tua email')
      return
    }
    setError('')
    setResetMsg('')
    try {
      await resetPassword(email.trim())
      setResetMsg('Email di reset inviata, controlla la posta')
    } catch (err: unknown) {
      setError(humanizeError(err))
    }
  }

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src="/logo.svg" alt="Monitor Igiene logo" style={styles.logo} />
          <h1 style={styles.title}>Monitor Igiene</h1>
          <p style={styles.subtitle}>Accedi al tuo account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="login-email" style={styles.label}>Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={{
                ...styles.input,
                borderColor: emailFocused ? 'var(--accent)' : 'var(--border)',
                boxShadow: emailFocused ? '0 0 0 3px var(--accent-shadow)' : 'none',
              }}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="login-password" style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={{
                  ...styles.input,
                  paddingRight: 44,
                  borderColor: passwordFocused ? 'var(--accent)' : 'var(--border)',
                  boxShadow: passwordFocused ? '0 0 0 3px var(--accent-shadow)' : 'none',
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          {resetMsg && (
            <div style={styles.successBox} role="status">
              {resetMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <div style={styles.footer}>
          <button type="button" onClick={handleResetPassword} style={styles.forgotBtn}>
            Password dimenticata?
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg-app)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-card)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    paddingTop: 32,
    paddingRight: 28,
    paddingBottom: 32,
    paddingLeft: 28,
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  input: {
    width: '100%',
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    fontSize: 15,
    color: 'var(--text-primary)',
    background: 'var(--bg-card)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 8,
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    cursor: 'pointer',
    color: 'var(--text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    background: 'var(--error-bg)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--error-border)',
    borderRadius: 8,
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    fontSize: 13,
    color: '#A32D2D',
  },
  successBox: {
    background: '#EBF5EB',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#8BC48B',
    borderRadius: 8,
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    fontSize: 13,
    color: '#2D622D',
  },
  submitBtn: {
    width: '100%',
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 12,
    paddingLeft: 16,
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
  },
  forgotBtn: {
    background: 'transparent',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    color: 'var(--accent)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    textDecoration: 'underline',
  },
}
