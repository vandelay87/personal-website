import { isSessionError } from '@api/auth'
import { fetchRecipeByIdAdmin, publishRecipe } from '@api/recipes'
import Button from '@components/Button'
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

// Hoisted elements, not components — these never take props, so there's no
// need to re-invoke a function (and rebuild the tree) on every render. Same
// established pattern as `iconRetry` in RecipeList.tsx / `iconLock` in
// RecipeEditor.tsx. Paths match Admin Recipe Preview.dc.html's inline SVGs
// (lines 76, 81-82, 88, 93, 100) exactly.
const iconStatusPublished = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const iconStatusDraft = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const iconEdit = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
)

const iconPublish = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
)

const iconViewPublic = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </svg>
)

// Search-with-exclamation glyph — matches Admin Recipe Preview.dc.html's
// not-found icon (lines 123) exactly.
const iconNotFound = (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-3.5-3.5" />
    <path d="M11 8v3" />
    <path d="M11 14h.01" />
  </svg>
)

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
      <div className={styles.notFoundBox}>
        <div className={styles.notFoundIcon}>{iconNotFound}</div>
        <Typography variant="heading1" className={styles.notFoundHeading}>
          Recipe not found
        </Typography>
        <Typography variant="body" className={styles.notFoundBody}>
          This recipe may have been deleted, or the link is incorrect.
        </Typography>
        <Link
          to="/admin/recipes"
          icon="←"
          iconSide="left"
          nudge="left"
          className={styles.notFoundBackLink}
        >
          Back to recipes
        </Link>
      </div>
    )
  }

  const editHref = `/admin/recipes/${recipe.id}/edit`
  const isDraft = recipe.status !== 'published'
  const bannerToneClassName = isDraft ? styles.draft : styles.published

  return (
    <div className={styles.container}>
      <div
        className={[styles.banner, bannerToneClassName].join(' ')}
        role="status"
        aria-live="polite"
      >
        <div className={styles.bannerInner}>
          <div className={styles.bannerLeft}>
            <Link
              to="/admin/recipes"
              icon="←"
              iconSide="left"
              nudge="left"
              className={styles.backLink}
            >
              Recipes
            </Link>
            <span aria-hidden="true" className={styles.bannerDivider} />
            <span aria-hidden="true" className={styles.statusIcon}>
              {isDraft ? iconStatusDraft : iconStatusPublished}
            </span>
            <Typography variant="body" className={styles.bannerMessage}>
              {isDraft
                ? 'Preview — this recipe is not yet published.'
                : 'This recipe is published.'}
            </Typography>
          </div>
          <div className={styles.bannerActions}>
            <Link
              to={editHref}
              icon={iconEdit}
              iconSide="left"
              nudge="none"
              className={styles.editLink}
            >
              Edit
            </Link>
            {isDraft ? (
              <Button
                onClick={handlePublish}
                size="sm"
                loading={publishing}
                iconLeft={iconPublish}
                className={styles.publishButton}
              >
                Publish
              </Button>
            ) : (
              <Link
                to={`/recipes/${recipe.slug}`}
                icon={iconViewPublic}
                iconSide="right"
                nudge="up-right"
                className={styles.viewLink}
              >
                View public page
              </Link>
            )}
          </div>
        </div>
      </div>

      <RecipeDetailView recipe={recipe} />
    </div>
  )
}

export default RecipePreview
