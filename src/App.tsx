import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AppLockProvider, useAppLock } from './contexts/AppLockContext'
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
  )
}

export default App
