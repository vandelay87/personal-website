import ProtectedRoute from '@components/ProtectedRoute'
import Apps from '@pages/Apps'
import Blog from '@pages/Blog'
import BlogPost from '@pages/Blog/BlogPost'
import Home from '@pages/Home'
import NotFound from '@pages/NotFound'
import RecipeDetail from '@pages/RecipeDetail'
import Recipes from '@pages/Recipes'
import { type RouteObject } from 'react-router-dom'
import {
  Login,
  RecipeEditor,
  RecipeList,
  RecipePreview,
  UserManagement,
} from './lazyRoutes'
import {
  AdminRootLayout,
  AdminSuspense,
  LoginLayout,
  RecipePreviewLayout,
  RootLayout,
} from './routeLayouts'

export interface RouteMeta {
  title: string
  description: string
}

const withCaseSensitivePaths = (routeTable: RouteObject[]): RouteObject[] =>
  routeTable.map((route) =>
    route.index
      ? route
      : { ...route, caseSensitive: true, children: route.children && withCaseSensitivePaths(route.children) }
  )

export const routes: RouteObject[] = withCaseSensitivePaths([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
        handle: {
          title: 'Akli Aissat — Full-Stack Engineer',
          description:
            'Full-stack engineer building responsive web applications with React, TypeScript, and modern web technologies. Explore my projects and experiments.',
        } satisfies RouteMeta,
      },
      {
        path: '/apps',
        element: <Apps />,
        handle: {
          title: 'Apps & Experiments | Akli Aissat',
          description:
            'Interactive side projects and experiments built to explore ideas and learn how things work.',
        } satisfies RouteMeta,
      },
      {
        path: '/blog',
        element: <Blog />,
        handle: {
          title: 'Blog | Akli Aissat',
          description:
            'Articles on web development, engineering, and lessons learned building software.',
        } satisfies RouteMeta,
      },
      { path: '/blog/:slug', element: <BlogPost /> },
      {
        path: '/recipes',
        element: <Recipes />,
        handle: {
          title: 'Recipes | Akli Aissat',
          description: 'Browse recipes for delicious home-cooked meals.',
        } satisfies RouteMeta,
      },
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
  {
    element: (
      <ProtectedRoute>
        <RecipePreviewLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/admin/recipes/:id/preview',
        element: (
          <AdminSuspense>
            <RecipePreview />
          </AdminSuspense>
        ),
      },
    ],
  },
])
