import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../globals.css'
import App from '@demos/2048/react'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
