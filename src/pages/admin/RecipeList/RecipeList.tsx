import { handleSessionError } from '@api/auth'
import { deleteRecipe, fetchMyRecipes, publishRecipe, unpublishRecipe } from '@api/recipes'
import Button from '@components/Button'
import ConfirmDialog from '@components/ConfirmDialog'
import Link from '@components/Link'
import Loading from '@components/Loading'
import Toast, { type ToastState } from '@components/Toast'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import type { Recipe } from '@models/recipe'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import styles from './RecipeList.module.css'

const RecipeList = () => {
  const { getAccessToken, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    const state = location.state as { accessDenied?: boolean } | null
    if (state?.accessDenied) {
      setToast({ message: 'Access denied', type: 'error' })
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRecipes = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const token = await getAccessToken()
      const data = await fetchMyRecipes(token)
      setRecipes(data)
    } catch (err) {
      if (!handleSessionError(err, logout, navigate)) {
        setError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, logout, navigate])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const handlePublish = async (recipe: Recipe) => {
    try {
      const token = await getAccessToken()
      if (recipe.status === 'published') {
        await unpublishRecipe(token, recipe.id)
      } else {
        await publishRecipe(token, recipe.id)
      }
      await loadRecipes()
    } catch {
      setError(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      const token = await getAccessToken()
      await deleteRecipe(token, deleteTarget.id)
      setDeleteTarget(null)
      await loadRecipes()
    } catch {
      setError(true)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingWrapper}>
          <Loading />
        </div>
      )
    }

    if (error) {
      return (
        <>
          <Typography variant="body">Something went wrong.</Typography>
          <Button onClick={loadRecipes}>Retry</Button>
        </>
      )
    }

    if (recipes.length === 0) {
      return (
        <>
          <Typography variant="heading2">Recipes</Typography>
          <Typography variant="body">No recipes yet.</Typography>
          <Link to="/admin/recipes/new" ariaLabel="Create your first recipe">
            Create your first recipe
          </Link>
        </>
      )
    }

    return (
      <>
        <div className={styles.header}>
          <Typography variant="heading2">Recipes</Typography>
          <Link to="/admin/recipes/new" className={styles.newRecipeLink}>
            New recipe
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Last updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id}>
                  <td>{recipe.title}</td>
                  <td>
                    <span className={styles.badge} data-status={recipe.status}>
                      {recipe.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{recipe.tags.join(', ')}</td>
                  <td>{new Date(recipe.updatedAt).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <div className={styles.actionsInner}>
                      <Link to={`/admin/recipes/${recipe.id}/edit`} ariaLabel={`Edit ${recipe.title}`}>
                        Edit
                      </Link>
                      <Link
                        to={`/admin/recipes/${recipe.id}/preview`}
                        ariaLabel={`Preview ${recipe.title}`}
                      >
                        Preview
                      </Link>
                      <button type="button" className={styles.actionLink} onClick={() => handlePublish(recipe)}>
                        {recipe.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" className={styles.actionLink} onClick={() => setDeleteTarget(recipe)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ConfirmDialog
          title="Delete recipe"
          message={`Are you sure you want to delete "${deleteTarget?.title ?? ''}"?`}
          isOpen={deleteTarget !== null}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      </>
    )
  }

  return (
    <div className={styles.page}>
      {renderContent()}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}

export default RecipeList
