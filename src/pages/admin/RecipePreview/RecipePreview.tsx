import { isSessionError } from '@api/auth'
import { fetchRecipeByIdAdmin, publishRecipe } from '@api/recipes'
import Button from '@components/Button'
import { iconEdit, iconNotFound, iconPublish, iconViewPublic } from '@components/iconGlyphs'
import { IconPreview } from '@components/icons'
import Link from '@components/Link'
import Loading from '@components/Loading'
import RecipeDetailView from '@components/RecipeDetailView'
import ThemeToggle from '@components/ThemeToggle'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import {
  useImageProcessingPoll,
  type ImageReadyUpdate,
} from '@hooks/useImageProcessingPoll'
import { useMeasuredHeightVar } from '@hooks/useMeasuredHeightVar'
import { applyStepReadiness, type Recipe } from '@models/recipe'
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { MAIN_LANDMARK_ID } from '../../../constants/mainLandmark'
import stateBox from '../../../styles/stateBox.module.css'
import styles from './RecipePreview.module.css'

// Hoisted element, not a component — it never takes props, so there's no
// need to re-invoke a function (and rebuild the tree) on every render. Path
// matches Admin Recipe Preview.dc.html's inline SVG (line 76) exactly.
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
  const bannerRef = useRef<HTMLDivElement>(null)

  useMeasuredHeightVar(bannerRef, '--banner-height')

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
      <main id={MAIN_LANDMARK_ID} tabIndex={-1} className={styles.main}>
        <div className={styles.stateWrapper}>
          <Loading />
        </div>
      </main>
    )
  }

  if (notFound || !recipe) {
    return (
      <main id={MAIN_LANDMARK_ID} tabIndex={-1} className={styles.main}>
        <div className={`${stateBox.box} ${styles.notFoundBox}`}>
          <div className={`${stateBox.icon} ${styles.notFoundIcon}`}>{iconNotFound}</div>
          <Typography variant="heading1" className={`${stateBox.heading} ${styles.notFoundHeading}`}>
            Recipe not found
          </Typography>
          <Typography variant="body" className={`${stateBox.body} ${styles.notFoundBody}`}>
            This recipe may have been deleted, or the link is incorrect.
          </Typography>
          <Link
            to="/admin/recipes"
            icon="←"
            iconSide="left"
            nudge="left"
            variant="ghost"
            className={styles.notFoundBackLink}
          >
            Back to recipes
          </Link>
        </div>
      </main>
    )
  }

  const editHref = `/admin/recipes/${recipe.id}/edit`
  const isDraft = recipe.status !== 'published'
  const bannerToneClassName = isDraft ? styles.draft : styles.published

  return (
    <div className={styles.container}>
      <div
        ref={bannerRef}
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
              {isDraft ? <IconPreview size={17} /> : iconStatusPublished}
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
              variant="ghost"
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
                variant="solid"
                className={styles.viewLink}
              >
                View public page
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main
        id={MAIN_LANDMARK_ID}
        tabIndex={-1}
        className={[styles.main, styles.mainWithBanner].join(' ')}
      >
        <RecipeDetailView recipe={recipe} />
      </main>
    </div>
  )
}

export default RecipePreview
