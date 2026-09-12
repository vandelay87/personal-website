import { AuthProvider } from '@contexts/AuthContext'
import { RecipeDataContext } from '@contexts/RecipeDataContext'
import { ToastProvider } from '@contexts/ToastContext'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { routes } from './routes'
import { readRecipeData } from './ssrData'
import './index.css'

const router = createBrowserRouter(routes)
const ssrData = readRecipeData()

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RecipeDataContext.Provider value={ssrData}>
          <RouterProvider router={router} />
        </RecipeDataContext.Provider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
)
