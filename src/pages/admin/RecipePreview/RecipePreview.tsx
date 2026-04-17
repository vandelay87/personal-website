import { fetchMyRecipes, publishRecipe } from '@api/recipes'
import Link from '@components/Link'
import Loading from '@components/Loading'
import RecipeDetailView from '@components/RecipeDetailView'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import type { Recipe } from '@models/recipe'
import { useCallback, useEffect, useState, type FC } from 'react'
import { useParams } from 'react-router-dom'

import styles from './RecipePreview.module.css'

const RecipePreview: FC = () => {
  const { id } = useParams<{ id: string }>()
  const { getAccessToken } = useAuth()

  const [recipe, setRecipe] = useState<Recipe | undefined>()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const token = await getAccessToken()
        const recipes = await fetchMyRecipes(token)
        if (cancelled) return
        const found = recipes.find((r) => r.id === id)
        if (!found) {
          setNotFound(true)
        } else {
          setRecipe(found)
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, getAccessToken])

  const handlePublish = useCallback(async () => {
    if (!recipe) return
    setPublishing(true)
    try {
      const token = await getAccessToken()
      await publishRecipe(token, recipe.id)
      setRecipe({ ...recipe, status: 'published' })
    } finally {
      setPublishing(false)
    }
  }, [recipe, getAccessToken])

  if (loading) {
    return (
      <div className={styles.stateWrapper}>
        <Loading />
      </div>
    )
  }

  if (notFound || !recipe) {
    return (
      <div className={styles.stateWrapper}>
        <Typography variant="body">Recipe not found.</Typography>
      </div>
    )
  }

  const editHref = `/admin/recipes/${recipe.id}/edit`
  const isDraft = recipe.status !== 'published'

  return (
    <div className={styles.container}>
      <div className={styles.banner} role="status" aria-live="polite">
        {isDraft ? (
          <>
            <Typography variant="body" className={styles.bannerMessage}>
              Preview — this recipe is not yet published
            </Typography>
            <div className={styles.bannerActions}>
              <Link to={editHref}>Edit</Link>
              <button
                type="button"
                className={styles.actionLink}
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </>
        ) : (
          <>
            <Typography variant="body" className={styles.bannerMessage}>
              This recipe is published
            </Typography>
            <div className={styles.bannerActions}>
              <Link to={editHref}>Edit</Link>
              <Link to={`/recipes/${recipe.slug}`}>View public page</Link>
            </div>
          </>
        )}
      </div>

      <RecipeDetailView recipe={recipe} />
    </div>
  )
}

export default RecipePreview
