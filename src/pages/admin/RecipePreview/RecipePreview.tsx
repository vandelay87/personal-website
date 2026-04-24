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
import type { Recipe } from '@models/recipe'
import { useCallback, useEffect, useState, type FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import styles from './RecipePreview.module.css'

const mergeReadiness = (recipe: Recipe, updates: ImageReadyUpdate[]): Recipe => {
  const byKey = new Map(
    updates.filter((u) => u.key).map((u) => [u.key, u.processedAt])
  )
  if (byKey.size === 0) return recipe

  const coverUpdate = byKey.get(recipe.coverImage.key)
  const nextCover =
    coverUpdate !== undefined
      ? { ...recipe.coverImage, processedAt: coverUpdate }
      : recipe.coverImage

  let stepsChanged = false
  const nextSteps = recipe.steps.map((step) => {
    const stepUpdate = step.image?.key ? byKey.get(step.image.key) : undefined
    if (stepUpdate === undefined) return step
    stepsChanged = true
    return { ...step, image: { ...step.image!, processedAt: stepUpdate } }
  })

  if (nextCover === recipe.coverImage && !stepsChanged) return recipe
  return {
    ...recipe,
    coverImage: nextCover,
    steps: stepsChanged ? nextSteps : recipe.steps,
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
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const token = await getAccessToken()
        const found = await fetchRecipeByIdAdmin(token, id, controller.signal)
        if (cancelled) return
        setRecipe(found)
      } catch (err) {
        if (cancelled) return
        if (isSessionError(err)) {
          logout()
          navigate('/admin/login')
          return
        }
        setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [id, getAccessToken, logout, navigate])

  useImageProcessingPoll(recipe ?? null, (updates) => {
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
