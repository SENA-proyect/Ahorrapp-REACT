import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // ← esta línea debe estar
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
