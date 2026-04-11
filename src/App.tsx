import Header from '@components/Header'
import Layout from '@components/Layout'
import Loading from '@components/Loading'
import ProtectedRoute from '@components/ProtectedRoute'
import Apps from '@pages/Apps'
import Blog from '@pages/Blog'
import BlogPost from '@pages/Blog/BlogPost'
import Home from '@pages/Home'
import NotFound from '@pages/NotFound'
import RecipeDetail from '@pages/RecipeDetail'
import Recipes from '@pages/Recipes'
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Login = lazy(() => import('@pages/admin/Login'))
const RecipeList = lazy(() => import('@pages/admin/RecipeList'))
const RecipeEditor = lazy(() => import('@pages/admin/RecipeEditor'))
const RecipePreview = lazy(() => import('@pages/admin/RecipePreview'))
const UserManagement = lazy(() => import('@pages/admin/UserManagement'))

const App = () => {
  return (
    <>
      <Header />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:slug" element={<RecipeDetail />} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12) 0' }}><Loading /></div>}>
                <Routes>
                  <Route path="login" element={<Login />} />
                  <Route path="recipes" element={<ProtectedRoute><RecipeList /></ProtectedRoute>} />
                  <Route path="recipes/new" element={<ProtectedRoute><RecipeEditor /></ProtectedRoute>} />
                  <Route path="recipes/:id/edit" element={<ProtectedRoute><RecipeEditor /></ProtectedRoute>} />
                  <Route path="recipes/:id/preview" element={<ProtectedRoute><RecipePreview /></ProtectedRoute>} />
                  <Route path="users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
