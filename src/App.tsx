import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AppLockProvider, useAppLock } from './contexts/AppLockContext'
import { useAuth } from './contexts/AuthContext'
import LoginScreen from './components/LoginScreen'
import PinScreen from './components/PinScreen'
import Spinner from './components/Spinner'
import AppErrorBoundary from './components/AppErrorBoundary'

const Home = lazy(() => import('./pages/Home'))
const Anagrafica = lazy(() => import('./pages/Anagrafica'))
const NuovoCantiere = lazy(() => import('./pages/NuovoCantiere'))
const PaginaCantiere = lazy(() => import('./pages/PaginaCantiere'))
const ListaCampagne = lazy(() => import('./pages/ListaCampagne'))
const FoglioCampagna = lazy(() => import('./pages/FoglioCampagna'))

function RouteFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--text-secondary)',
      }}
    >
      <Spinner size={20} />
    </div>
  )
}

function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const bypassAuth = import.meta.env.DEV === true && import.meta.env.VITE_E2E_AUTH_BYPASS === 'true'

  if (loading && !bypassAuth) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: 'var(--text-secondary)',
        }}
      >
        <Spinner size={20} />
      </div>
    )
  }

  if (!session && !bypassAuth) {
    return <LoginScreen />
  }

  return <>{children}</>
}

function AppGate({ children }: { children: ReactNode }) {
  const { state, unlock, resetPin } = useAppLock()

  if (state === 'setup') {
    return (
      <PinScreen
        mode="setup"
        onSetupDone={() => {
          unlock()
        }}
      />
    )
  }

  if (state === 'locked') {
    return (
      <PinScreen
        mode="unlock"
        onUnlock={() => unlock()}
        onForgotPin={() => {
          resetPin()
        }}
      />
    )
  }

  return <>{children}</>
}

function App() {
  const location = useLocation()
  return (
    <AuthGate>
      <AppLockProvider>
        <AppGate>
          <AppErrorBoundary key={location.pathname}>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/anagrafica" element={<Anagrafica />} />
                <Route path="/cantieri/:id" element={<PaginaCantiere />} />
                <Route path="/cantieri/:id/moduli/:moduloId" element={<ListaCampagne />} />
                <Route path="/cantieri/:id/moduli/:moduloId/campagne/:campagnaId" element={<FoglioCampagna />} />
                <Route path="/cantieri/nuovo" element={<NuovoCantiere />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </AppGate>
      </AppLockProvider>
    </AuthGate>
  )
}

export default App
