import { lazy } from 'react'

export const Login = lazy(() => import('@pages/admin/Login'))
export const RecipeList = lazy(() => import('@pages/admin/RecipeList'))
export const RecipeEditor = lazy(() => import('@pages/admin/RecipeEditor'))
export const RecipePreview = lazy(() => import('@pages/admin/RecipePreview'))
export const UserManagement = lazy(() => import('@pages/admin/UserManagement'))
