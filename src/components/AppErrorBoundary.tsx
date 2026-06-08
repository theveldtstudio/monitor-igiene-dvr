import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import ErrorState from './ErrorState'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 24,
            paddingRight: 24,
            paddingBottom: 24,
            paddingLeft: 24,
            background: 'var(--bg-app)',
          }}
        >
          <ErrorState
            title="Si è verificato un errore"
            message="Qualcosa è andato storto. Ricarica la pagina per continuare."
            onRetry={() => window.location.reload()}
            retryLabel="Ricarica pagina"
          />
        </div>
      )
    }

    return this.props.children
  }
}
