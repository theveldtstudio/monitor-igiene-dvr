import type { ReactNode } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Anagrafica from './pages/Anagrafica'
import NuovoCantiere from './pages/NuovoCantiere'
import PaginaCantiere from './pages/PaginaCantiere'
import ListaCampagne from './pages/ListaCampagne'
import FoglioCampagna from './pages/FoglioCampagna'
import { AppLockProvider, useAppLock } from './contexts/AppLockContext'
import PinScreen from './components/PinScreen'

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
  return (
    <AppLockProvider>
      <AppGate>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anagrafica" element={<Anagrafica />} />
          <Route path="/cantieri/:id" element={<PaginaCantiere />} />
          <Route path="/cantieri/:id/moduli/:moduloId" element={<ListaCampagne />} />
          <Route path="/cantieri/:id/moduli/:moduloId/campagne/:campagnaId" element={<FoglioCampagna />} />
          <Route path="/cantieri/nuovo" element={<NuovoCantiere />} />
        </Routes>
      </AppGate>
    </AppLockProvider>
  )
}

export default App
