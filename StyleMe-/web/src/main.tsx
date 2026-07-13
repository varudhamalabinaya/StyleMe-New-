import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import './design-system/styleme-tokens.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
