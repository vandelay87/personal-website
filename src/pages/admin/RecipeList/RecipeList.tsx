import { handleSessionError } from '@api/auth'
import {
  deleteRecipe,
  fetchAllRecipes,
  publishRecipe,
  unpublishRecipe,
} from '@api/recipes'
import ConfirmDialog from '@components/ConfirmDialog'
import {
  IconPlus,
  IconPreview,
  iconDelete,
  iconDocument,
  iconEdit,
  iconPublish,
  iconRetry,
  iconUnpublish,
  iconWarning,
} from '@components/icons'
import Link from '@components/Link'
import StateBox from '@components/StateBox'
import StatusBadge from '@components/StatusBadge'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import { useToast } from '@contexts/ToastContext'
import type { Recipe } from '@models/recipe'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import interactions from '../../../styles/interactions.module.css'
import stateBox from '../../../styles/stateBox.module.css'
import text from '../../../styles/text.module.css'
import { pluralize } from '../../../utils/pluralize'
import { relativeUpdatedLabel } from '../../../utils/relativeTime'
import styles from './RecipeList.module.css'

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
      return <StateBox variant="loading" label="Loading recipes…" />
    }

    if (error) {
      return (
        <StateBox
          variant="error"
          icon={iconWarning}
          heading="Couldn't load recipes"
          body="Something went wrong reaching the server. Check your connection and try again."
          action={{ label: 'Retry', onClick: loadRecipes, icon: iconRetry }}
        />
      )
    }

    if (sortedRecipes.length === 0) {
      return (
        <div className={`${stateBox.box} ${styles.emptyBox}`}>
          <div className={`${stateBox.icon} ${styles.emptyIcon}`}>{iconDocument}</div>
          <Typography variant="heading2" className={stateBox.heading}>
            No recipes yet
          </Typography>
          <Typography variant="body" className={stateBox.body}>
            Your kitchen is empty. Create your first recipe to start building the collection.
          </Typography>
          <Link to="/admin/recipes/new" variant="solid" className={styles.newButton}>
            <IconPlus size={15} />
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
                    <li key={tag} className={`${text.tagChipBase} ${styles.tagChip}`}>
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
                  className={`${interactions.focusRing} ${styles.actionButton}`}
                  nudge="none"
                >
                  {iconEdit}
                  Edit
                </Link>
                <Link
                  to={`/admin/recipes/${recipe.id}/preview`}
                  className={`${interactions.focusRing} ${styles.actionButton}`}
                  nudge="none"
                >
                  <IconPreview size={14} />
                  Preview
                </Link>
                <button
                  type="button"
                  className={`${interactions.focusRing} ${styles.actionButton} ${styles.publishAction}`}
                  onClick={() => handlePublish(recipe)}
                >
                  {isPublished ? iconUnpublish : iconPublish}
                  {isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className={`${interactions.focusRing} ${styles.actionButton} ${styles.deleteAction}`}
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
          <IconPlus size={15} />
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
