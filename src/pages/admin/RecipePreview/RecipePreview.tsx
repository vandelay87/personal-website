import { fetchMyRecipes, publishRecipe } from '@api/recipes'
import Button from '@components/Button'
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
    if (!recipe || publishing) return
    setPublishing(true)
    try {
      const token = await getAccessToken()
      await publishRecipe(token, recipe.id)
      setRecipe({ ...recipe, status: 'published' })
    } finally {
      setPublishing(false)
    }
  }, [recipe, publishing, getAccessToken])

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
      <div className={styles.banner} role="region" aria-label="Preview status">
        {isDraft ? (
          <>
            <Typography variant="body" className={styles.bannerMessage}>
              Preview — this recipe is not yet published
            </Typography>
            <div className={styles.bannerActions}>
              <Link to={editHref} className={styles.bannerLink}>
                Edit
              </Link>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? <Loading size="small" /> : 'Publish'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Typography variant="body" className={styles.bannerMessage}>
              This recipe is published
            </Typography>
            <div className={styles.bannerActions}>
              <Link to={editHref} className={styles.bannerLink}>
                Edit
              </Link>
              <Link to={`/recipes/${recipe.slug}`} className={styles.bannerLink}>
                View public page
              </Link>
            </div>
          </>
        )}
      </div>

      <RecipeDetailView recipe={recipe} />
    </div>
  )
}

export default RecipePreview
