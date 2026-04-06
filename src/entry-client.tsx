import ScrollToTop from '@components/ScrollToTop'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
    </BrowserRouter>
  </StrictMode>
)
