import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#17171B',
            color: '#F5F5F5',
            border: '1px solid #2A2A30',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#17171B' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#17171B' },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
