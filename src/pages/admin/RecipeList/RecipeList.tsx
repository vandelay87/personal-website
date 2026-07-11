import { handleSessionError } from '@api/auth'
import {
  deleteRecipe,
  fetchAllRecipes,
  publishRecipe,
  unpublishRecipe,
} from '@api/recipes'
import Button from '@components/Button'
import ConfirmDialog from '@components/ConfirmDialog'
import { iconEdit, iconPreview, iconPublish, iconRetry, iconWarning } from '@components/icons'
import Link from '@components/Link'
import Loading from '@components/Loading'
import StatusBadge from '@components/StatusBadge'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import { useToast } from '@contexts/ToastContext'
import type { Recipe } from '@models/recipe'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { pluralize } from '../../../utils/pluralize'
import { relativeUpdatedLabel } from '../../../utils/relativeTime'
import styles from './RecipeList.module.css'

const iconPlus = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const iconUnpublish = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
)

const iconDelete = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
)

const iconDocument = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v5h5" />
  </svg>
)

const RecipeList = () => {
  const { getAccessToken, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)

  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [recipes]
  )

  useEffect(() => {
    const state = location.state as { accessDenied?: boolean } | null
    if (state?.accessDenied) {
      showToast('Access denied', 'error')
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRecipes = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const token = await getAccessToken()
      const data = await fetchAllRecipes(token)
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

  const renderBody = () => {
    if (loading) {
      return (
        <div className={styles.loadingBox}>
          <Loading label="Loading recipes…" />
        </div>
      )
    }

    if (error) {
      return (
        <div className={styles.errorBox}>
          <div className={styles.errorIcon}>{iconWarning}</div>
          <Typography variant="heading2" className={styles.errorHeading}>
            Couldn&apos;t load recipes
          </Typography>
          <Typography variant="body" className={styles.errorBody}>
            Something went wrong reaching the server. Check your connection and try again.
          </Typography>
          <Button variant="outline" onClick={loadRecipes} iconLeft={iconRetry}>
            Retry
          </Button>
        </div>
      )
    }

    if (sortedRecipes.length === 0) {
      return (
        <div className={styles.emptyBox}>
          <div className={styles.emptyIcon}>{iconDocument}</div>
          <Typography variant="heading2" className={styles.emptyHeading}>
            No recipes yet
          </Typography>
          <Typography variant="body" className={styles.emptyBody}>
            Your kitchen is empty. Create your first recipe to start building the collection.
          </Typography>
          <Link to="/admin/recipes/new" variant="solid" className={styles.newButton}>
            {iconPlus}
            Create your first recipe
          </Link>
        </div>
      )
    }

    const now = new Date()

    return (
      <ul className={styles.list}>
        {sortedRecipes.map((recipe) => {
          const isPublished = recipe.status === 'published'
          return (
            <li key={recipe.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowTop}>
                  <StatusBadge tone={isPublished ? 'success' : 'warning'}>
                    {isPublished ? 'Published' : 'Draft'}
                  </StatusBadge>
                  <Typography variant="heading2" className={styles.rowTitle}>
                    {recipe.title}
                  </Typography>
                </div>
                <ul className={styles.rowMeta}>
                  {recipe.tags.map((tag) => (
                    <li key={tag} className={styles.tagChip}>
                      {tag}
                    </li>
                  ))}
                  <li className={styles.updatedLabel}>
                    {relativeUpdatedLabel(recipe.updatedAt, now)}
                  </li>
                </ul>
              </div>
              <div className={styles.rowActions}>
                <Link
                  to={`/admin/recipes/${recipe.id}/edit`}
                  className={styles.actionButton}
                  nudge="none"
                >
                  {iconEdit}
                  Edit
                </Link>
                <Link
                  to={`/admin/recipes/${recipe.id}/preview`}
                  className={styles.actionButton}
                  nudge="none"
                >
                  {iconPreview}
                  Preview
                </Link>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.publishAction}`}
                  onClick={() => handlePublish(recipe)}
                >
                  {isPublished ? iconUnpublish : iconPublish}
                  {isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.deleteAction}`}
                  onClick={() => setDeleteTarget(recipe)}
                >
                  {iconDelete}
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Typography variant="heading1" className={styles.heading}>
            Recipes
          </Typography>
          <Typography variant="body" className={styles.subtitle}>
            {pluralize(sortedRecipes.length, 'recipe')}
          </Typography>
        </div>
        <Link to="/admin/recipes/new" variant="solid" className={styles.newButton}>
          {iconPlus}
          New recipe
        </Link>
      </div>

      {renderBody()}

      <ConfirmDialog
        title="Delete recipe"
        danger
        open={deleteTarget !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      >
        Are you sure you want to delete &quot;{deleteTarget?.title ?? ''}
        &quot;?
      </ConfirmDialog>
    </div>
  )
}

export default RecipeList
