import { isSessionError } from '@api/auth'
import { fetchRecipeByIdAdmin, publishRecipe } from '@api/recipes'
import Link from '@components/Link'
import Loading from '@components/Loading'
import RecipeDetailView from '@components/RecipeDetailView'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import {
  useImageProcessingPoll,
  type ImageReadyUpdate,
} from '@hooks/useImageProcessingPoll'
import { applyStepReadiness, type Recipe } from '@models/recipe'
import { useCallback, useEffect, useMemo, useState, type FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import styles from './RecipePreview.module.css'

const mergeReadiness = (recipe: Recipe, updates: ImageReadyUpdate[]): Recipe => {
  const byImageType = new Map(updates.map((u) => [u.imageType, u.processedAt]))
  if (byImageType.size === 0) return recipe

  const coverUpdate = byImageType.get('cover')
  const nextCover =
    coverUpdate !== undefined
      ? { ...recipe.coverImage, processedAt: coverUpdate }
      : recipe.coverImage

  const nextSteps = applyStepReadiness(recipe.steps, updates)
  const stepsChanged = nextSteps !== recipe.steps

  if (nextCover === recipe.coverImage && !stepsChanged) return recipe
  return {
    ...recipe,
    coverImage: nextCover,
    steps: nextSteps,
  }
}

const RecipePreview: FC = () => {
  const { id } = useParams<{ id: string }>()
  const { getAccessToken, logout } = useAuth()
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState<Recipe | undefined>()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const token = await getAccessToken()
        const found = await fetchRecipeByIdAdmin(token, id, controller.signal)
        setRecipe(found)
      } catch (err) {
        if (controller.signal.aborted) return
        if (isSessionError(err)) {
          logout()
          navigate('/admin/login')
          return
        }
        setNotFound(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()

    return () => {
      controller.abort()
    }
  }, [id, getAccessToken, logout, navigate])

  // The preview only has fetched recipe data — it cannot tell a coverless
  // recipe from one whose cover is still processing (both lack processedAt).
  // With no presence signal, an unprocessed cover is marked absent so the hook
  // does not phantom-poll/time out a recipe that has no cover at all. A cover
  // that is already processed stays a (settled) image and never polls anyway.
  const pollRecipe = useMemo<Recipe | null>(() => {
    if (!recipe) return null
    if (recipe.coverImage.processedAt !== undefined) return recipe
    return { ...recipe, coverImage: { ...recipe.coverImage, absent: true } }
  }, [recipe])

  useImageProcessingPoll(pollRecipe, (updates) => {
    setRecipe((prev) => (prev ? mergeReadiness(prev, updates) : prev))
  })

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
