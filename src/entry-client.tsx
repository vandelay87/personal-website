import { AuthProvider } from '@contexts/AuthContext'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { routes } from './routes'
import './index.css'

const router = createBrowserRouter(routes)

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)
