import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ToastProvider } from './lib/toast'
import { OfflineBanner } from './lib/offline'
import { queryClient } from './lib/queryClient'
import { initFotoSync } from './lib/offline/initSync'
import './index.css'
import './styles/globals.css'

// Registra il drain delle foto pending al rientro online + drain all'avvio.
initFotoSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ToastProvider />
    </QueryClientProvider>
  </React.StrictMode>,
)
