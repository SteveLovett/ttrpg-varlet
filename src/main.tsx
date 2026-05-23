import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './themes/themes.css'
import { bootstrapCachedAuthTheme } from './themes/themeBootstrap'
import App from './App.tsx'

bootstrapCachedAuthTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
