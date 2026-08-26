import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../globals.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <h1>n-puzzles</h1>
  </StrictMode>,
)
