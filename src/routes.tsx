import ProtectedRoute from '@components/ProtectedRoute'
import Apps from '@pages/Apps'
import Blog from '@pages/Blog'
import BlogPost from '@pages/Blog/BlogPost'
import Home from '@pages/Home'
import NotFound from '@pages/NotFound'
import RecipeDetail from '@pages/RecipeDetail'
import Recipes from '@pages/Recipes'
import { lazy } from 'react'
import { type RouteObject } from 'react-router-dom'
import { AdminRootLayout, AdminSuspense, LoginLayout, RootLayout } from './routeLayouts'

const Login = lazy(() => import('@pages/admin/Login'))
const RecipeList = lazy(() => import('@pages/admin/RecipeList'))
const RecipeEditor = lazy(() => import('@pages/admin/RecipeEditor'))
const RecipePreview = lazy(() => import('@pages/admin/RecipePreview'))
const UserManagement = lazy(() => import('@pages/admin/UserManagement'))

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/apps', element: <Apps /> },
      { path: '/blog', element: <Blog /> },
      { path: '/blog/:slug', element: <BlogPost /> },
      { path: '/recipes', element: <Recipes /> },
      { path: '/recipes/:slug', element: <RecipeDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin/login',
    element: <LoginLayout />,
    children: [
      {
        index: true,
        element: (
          <AdminSuspense>
            <Login />
          </AdminSuspense>
        ),
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AdminRootLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/admin/recipes',
        element: (
          <AdminSuspense>
            <RecipeList />
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/recipes/new',
        element: (
          <AdminSuspense>
            <RecipeEditor />
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/recipes/:id/edit',
        element: (
          <AdminSuspense>
            <RecipeEditor />
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/recipes/:id/preview',
        element: (
          <AdminSuspense>
            <RecipePreview />
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <AdminSuspense>
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          </AdminSuspense>
        ),
      },
    ],
  },
]
