import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ToastProvider } from './lib/toast'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import { OfflineBanner } from './lib/offline'
import { queryClient } from './lib/queryClient'
import { initOfflineSync } from './lib/offline/initSync'
import './index.css'
import './styles/globals.css'

// Registra il drain completo della coda offline al rientro online + drain all'avvio.
initOfflineSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ToastProvider />
      <PwaUpdatePrompt />
    </QueryClientProvider>
  </React.StrictMode>,
)
