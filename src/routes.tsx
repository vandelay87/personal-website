import Header from '@components/Header'
import Layout from '@components/Layout'
import Loading from '@components/Loading'
import ProtectedRoute from '@components/ProtectedRoute'
import ScrollToTop from '@components/ScrollToTop'
import Apps from '@pages/Apps'
import Blog from '@pages/Blog'
import BlogPost from '@pages/Blog/BlogPost'
import Home from '@pages/Home'
import NotFound from '@pages/NotFound'
import RecipeDetail from '@pages/RecipeDetail'
import Recipes from '@pages/Recipes'
import { lazy, Suspense, type ReactNode } from 'react'
import { Outlet, type RouteObject } from 'react-router-dom'

const Login = lazy(() => import('@pages/admin/Login'))
const RecipeList = lazy(() => import('@pages/admin/RecipeList'))
const RecipeEditor = lazy(() => import('@pages/admin/RecipeEditor'))
const RecipePreview = lazy(() => import('@pages/admin/RecipePreview'))
const UserManagement = lazy(() => import('@pages/admin/UserManagement'))

const AdminSuspense = ({ children }: { children: ReactNode }) => (
  <Suspense
    fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12) 0' }}>
        <Loading />
      </div>
    }
  >
    {children}
  </Suspense>
)

const RootLayout = () => (
  <>
    <Header />
    <ScrollToTop />
    <Layout>
      <Outlet />
    </Layout>
  </>
)

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
      {
        path: '/admin/login',
        element: (
          <AdminSuspense>
            <Login />
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/recipes',
        element: (
          <AdminSuspense>
            <ProtectedRoute>
              <RecipeList />
            </ProtectedRoute>
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/recipes/new',
        element: (
          <AdminSuspense>
            <ProtectedRoute>
              <RecipeEditor />
            </ProtectedRoute>
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/recipes/:id/edit',
        element: (
          <AdminSuspense>
            <ProtectedRoute>
              <RecipeEditor />
            </ProtectedRoute>
          </AdminSuspense>
        ),
      },
      {
        path: '/admin/recipes/:id/preview',
        element: (
          <AdminSuspense>
            <ProtectedRoute>
              <RecipePreview />
            </ProtectedRoute>
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
      { path: '*', element: <NotFound /> },
    ],
  },
]
