import { isSessionError } from '@api/auth'
import {
  createDraft,
  deleteRecipe,
  fetchMyRecipes,
  fetchTags,
  publishRecipe,
  unpublishRecipe,
  updateRecipe,
} from '@api/recipes'
import AutosaveStatus from '@components/AutosaveStatus'
import Button from '@components/Button'
import ConfirmDialog from '@components/ConfirmDialog'
import ImageUpload from '@components/ImageUpload'
import IngredientList from '@components/IngredientList'
import Link from '@components/Link'
import Loading from '@components/Loading'
import StatusBadge from '@components/StatusBadge'
import StepList from '@components/StepList'
import TagInput from '@components/TagInput'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import { useToast } from '@contexts/ToastContext'
import { useAutosave } from '@hooks/useAutosave'
import {
  useImageProcessingPoll,
  type ImageReadyUpdate,
} from '@hooks/useImageProcessingPoll'
import { applyStepReadiness, sluggify } from '@models/recipe'
import type { Ingredient, Recipe, Step, Tag } from '@models/recipe'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type FC } from 'react'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom'

import { pluralize } from '../../../utils/pluralize'
import styles from './RecipeEditor.module.css'

type EditorMode = Recipe['status']

interface FormState {
  id: string
  slug: string
  slugManuallyEdited: boolean
  title: string
  intro: string
  prepTime: number
  cookTime: number
  servings: number
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
  coverImageAlt: string
  coverImageProcessedAt?: number
  // True when the recipe was loaded with at least one already-processed image.
  // Locks the slug because uploaded image objects are keyed by slug. Captured at
  // load time only — images that become ready mid-session do not retroactively
  // lock a slug the user is still choosing.
  hasPersistedImages: boolean
  mode: EditorMode
  dirty: boolean
}

type SettableField = Exclude<
  keyof FormState,
  'dirty' | 'mode' | 'id' | 'coverImageProcessedAt' | 'slugManuallyEdited' | 'hasPersistedImages'
>

type FormAction =
  | { type: 'SET_FIELD'; field: SettableField; value: FormState[SettableField] }
  | { type: 'LOAD_RECIPE'; recipe: Recipe; freshDraft?: boolean }
  | { type: 'MARK_PRISTINE' }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'RESET_SLUG_TO_TITLE' }
  | { type: 'IMAGE_STATUS_UPDATE'; updates: ImageReadyUpdate[] }

const MISSING_FIELDS_ID = 'publish-missing-fields'

const initialFormState: FormState = {
  id: '',
  slug: '',
  slugManuallyEdited: false,
  title: '',
  intro: '',
  prepTime: 0,
  cookTime: 0,
  servings: 0,
  tags: [],
  ingredients: [{ item: '', quantity: '', unit: '' }],
  steps: [{ stepId: '', order: 1, text: '' }],
  coverImageAlt: '',
  coverImageProcessedAt: undefined,
  hasPersistedImages: false,
  mode: 'draft',
  dirty: false,
}

const recipeToFormState = (recipe: Recipe, freshDraft = false): FormState => {
  const ingredients = recipe.ingredients ?? []
  const steps = recipe.steps ?? []
  return {
    id: recipe.id,
    slug: recipe.slug,
    // A freshly-created placeholder draft keeps auto-fill on (the user hasn't
    // chosen a slug yet); a genuinely-loaded existing recipe carries a
    // deliberate slug that typing the title must not clobber.
    slugManuallyEdited: !freshDraft,
    title: recipe.title ?? '',
    intro: recipe.intro ?? '',
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    tags: recipe.tags ?? [],
    ingredients: ingredients.length > 0 ? ingredients : [{ item: '', quantity: '', unit: '' }],
    steps: steps.length > 0 ? steps : [{ stepId: crypto.randomUUID(), order: 1, text: '' }],
    coverImageAlt: recipe.coverImage?.alt ?? '',
    coverImageProcessedAt: recipe.coverImage?.processedAt,
    hasPersistedImages:
      recipe.coverImage?.processedAt !== undefined ||
      steps.some((s) => s.image?.processedAt !== undefined),
    mode: recipe.status,
    dirty: false,
  }
}

const applyImageStatusUpdates = (
  state: FormState,
  updates: ImageReadyUpdate[]
): FormState => {
  if (updates.length === 0) return state

  const coverUpdate = updates.find((u) => u.imageType === 'cover')
  const nextSteps = applyStepReadiness(state.steps, updates)
  const stepsChanged = nextSteps !== state.steps

  if (!coverUpdate && !stepsChanged) return state

  // Server-originated readiness must not mark the form dirty — the `...state`
  // spread carries the existing `dirty` value unchanged.
  return {
    ...state,
    coverImageProcessedAt: coverUpdate?.processedAt ?? state.coverImageProcessedAt,
    steps: nextSteps,
  }
}

const withStepIds = (steps: Step[]): Step[] =>
  steps.map((step) => (step.stepId ? step : { ...step, stepId: crypto.randomUUID() }))

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD': {
      if (action.field === 'slug') {
        return { ...state, slug: action.value as string, slugManuallyEdited: true, dirty: true }
      }
      if (action.field === 'title' && !state.slugManuallyEdited) {
        const title = action.value as string
        return { ...state, title, slug: sluggify(title), dirty: true }
      }
      if (action.field === 'steps') {
        return { ...state, steps: withStepIds(action.value as Step[]), dirty: true }
      }
      return { ...state, [action.field]: action.value, dirty: true }
    }
    case 'LOAD_RECIPE':
      return recipeToFormState(action.recipe, action.freshDraft)
    case 'MARK_PRISTINE':
      return { ...state, dirty: false }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'RESET_SLUG_TO_TITLE':
      return { ...state, slug: sluggify(state.title), slugManuallyEdited: false, dirty: true }
    case 'IMAGE_STATUS_UPDATE':
      return applyImageStatusUpdates(state, action.updates)
  }
}

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const isValidSlug = (slug: string): boolean => slug.length <= 100 && SLUG_REGEX.test(slug)

const buildPatchPayload = (form: FormState): Partial<Recipe> => ({
  title: form.title,
  intro: form.intro,
  prepTime: form.prepTime,
  cookTime: form.cookTime,
  servings: form.servings,
  tags: form.tags,
  ingredients: form.ingredients,
  steps: form.steps,
  coverImage: { alt: form.coverImageAlt },
  status: form.mode,
  // Autosave fires mid-typing — only persist a slug the backend will accept,
  // otherwise it returns 400 invalid_slug. An invalid value is omitted so the
  // rest of the form still saves and the server keeps the last valid slug.
  ...(isValidSlug(form.slug) ? { slug: form.slug } : {}),
})

const computeMissingFields = (form: FormState): string[] => {
  const missing: string[] = []
  if (!form.title.trim()) missing.push('Title')
  if (!form.intro.trim()) missing.push('Intro')
  if (form.coverImageProcessedAt === undefined) missing.push('Cover image')
  if (!form.coverImageAlt.trim()) missing.push('Alt text')
  if (!form.ingredients.some((ing) => ing.item.trim())) missing.push('At least one ingredient')
  if (!form.steps.some((s) => s.text.trim())) missing.push('At least one step')
  form.steps.forEach((step, index) => {
    if (step.image && step.image.processedAt === undefined) {
      missing.push(`Step ${index + 1} image still processing`)
    }
    if (step.image?.processedAt !== undefined && !step.image.alt?.trim()) {
      missing.push(`Step ${index + 1} image alt text`)
    }
  })
  return missing
}

const draftFromCreated = (id: string, slug: string): Recipe => ({
  id,
  slug,
  title: '',
  intro: '',
  coverImage: { alt: '' },
  tags: [],
  prepTime: 0,
  cookTime: 0,
  servings: 0,
  ingredients: [],
  steps: [],
  authorId: '',
  authorName: '',
  createdAt: '',
  updatedAt: '',
  status: 'draft',
})

const NEW_PATH = '/admin/recipes/new'

const iconAlertCircle = (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const iconLock = (
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
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const iconPreview = (
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
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const RecipeEditor: FC = () => {
  const { id: routeId } = useParams<{ id: string }>()
  const { getAccessToken } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const isNewPath = location.pathname === NEW_PATH

  const [form, dispatch] = useReducer(formReducer, initialFormState)
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [loading, setLoading] = useState(Boolean(routeId))
  const [submitting, setSubmitting] = useState(false)
  const [announcement, setAnnouncement] = useState({ message: '', toggle: false })
  const [sessionExpired, setSessionExpired] = useState(false)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [isCoverUploading, setIsCoverUploading] = useState(false)
  const [uploadingStepIds, setUploadingStepIds] = useState<Set<string>>(new Set())
  const [slugError, setSlugError] = useState<string | null>(null)
  // True once a cover upload starts this session. A loaded recipe with no
  // processed cover is indistinguishable from one whose cover is still
  // processing, so only the in-session upload signal tells us a cover exists
  // and should be polled. Reset whenever a different recipe loads.
  const [coverUploadedThisSession, setCoverUploadedThisSession] = useState(false)

  const recentlyCreatedIdRef = useRef<string | null>(null)
  const creatingDraftRef = useRef(false)

  const setField = useCallback(
    <K extends SettableField>(field: K, value: FormState[K]) => {
      dispatch({ type: 'SET_FIELD', field, value })
    },
    []
  )

  const handleError = useCallback((err: unknown, fallback?: string) => {
    if (isSessionError(err)) {
      setSessionExpired(true)
      return
    }
    const message = err instanceof Error ? err.message : 'An error occurred'
    if (err instanceof Error && /^409\b/.test(message)) {
      setSlugError(message.replace(/^409\s*/, ''))
    }
    showToast(fallback ?? `Error: ${message}`, 'error')
  }, [showToast])

  const blocker = useBlocker(form.dirty)

  useEffect(() => {
    if (!form.dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form.dirty])

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagData: Tag[] = await fetchTags()
        setExistingTags(tagData.map((t) => t.tag))
      } catch {
        // Tags are non-critical
      }
    }
    loadTags()
  }, [])

  // Draft-on-mount: when landing on /admin/recipes/new, create a draft and
  // replace the URL with /admin/recipes/:id/edit so subsequent saves use PATCH.
  useEffect(() => {
    if (!isNewPath) return
    if (creatingDraftRef.current) return
    creatingDraftRef.current = true
    const createNewDraft = async () => {
      try {
        const token = await getAccessToken()
        const { id, slug } = await createDraft(token)
        recentlyCreatedIdRef.current = id
        dispatch({ type: 'LOAD_RECIPE', recipe: draftFromCreated(id, slug), freshDraft: true })
        navigate(`/admin/recipes/${id}/edit`, { replace: true })
      } catch (err) {
        handleError(err, 'Error creating draft')
      }
    }
    createNewDraft()
  }, [isNewPath, getAccessToken, navigate, handleError])

  // Fetch on edit mount, skipping the draft we just created.
  useEffect(() => {
    if (!routeId) return
    if (recentlyCreatedIdRef.current === routeId) {
      setLoading(false)
      return
    }
    const loadRecipe = async () => {
      let token = ''
      try {
        token = await getAccessToken()
      } catch (err) {
        handleError(err)
      }
      try {
        const recipes = await fetchMyRecipes(token)
        const recipe = recipes.find((r) => r.id === routeId)
        if (!recipe) throw new Error('Recipe not found')
        dispatch({ type: 'LOAD_RECIPE', recipe })
      } catch (err) {
        handleError(err, 'Error loading recipe')
      } finally {
        setLoading(false)
      }
    }
    loadRecipe()
  }, [routeId, getAccessToken, handleError])

  const saveFn = useCallback(
    async (state: FormState, signal: AbortSignal) => {
      if (!state.id) throw new Error('autosave skipped: no recipe id yet')
      const token = await getAccessToken()
      await updateRecipe(token, state.id, buildPatchPayload(state), signal)
    },
    [getAccessToken]
  )

  const { status: autosaveStatus, lastSavedAt, retry, flush } = useAutosave(form, saveFn, {
    intervalMs: 2000,
  })

  useEffect(() => {
    if (autosaveStatus === 'saved') {
      dispatch({ type: 'MARK_PRISTINE' })
    }
  }, [autosaveStatus, lastSavedAt])

  // A freshly-loaded recipe brings its own cover-presence truth (processedAt),
  // so drop any in-session upload signal carried over from a previous recipe.
  useEffect(() => {
    setCoverUploadedThisSession(false)
  }, [form.id])

  const announce = useCallback((message: string) => {
    setAnnouncement((prev) => ({ message, toggle: !prev.toggle }))
  }, [])

  // `useImageProcessingPoll` only reads `id`, `coverImage`, and `steps` off the
  // recipe it receives. Memoising over those fields keeps polling stable across
  // unrelated form edits (title, ingredients, etc.) — which would otherwise
  // rebuild the object on every keystroke and churn the hook's effect.
  const loadedRecipe = useMemo<Recipe | null>(() => {
    if (!form.id) return null
    const coverImagePresent =
      form.coverImageProcessedAt !== undefined || coverUploadedThisSession
    return {
      id: form.id,
      slug: form.slug,
      title: form.title,
      intro: form.intro,
      prepTime: form.prepTime,
      cookTime: form.cookTime,
      servings: form.servings,
      tags: form.tags,
      ingredients: form.ingredients,
      steps: form.steps,
      coverImage: {
        alt: form.coverImageAlt,
        processedAt: form.coverImageProcessedAt,
        // No cover this session → not a poll target, so the hook never treats a
        // never-uploaded cover as "still processing" and never falsely times out.
        absent: !coverImagePresent,
      },
      authorId: '',
      authorName: '',
      createdAt: '',
      updatedAt: '',
      status: form.mode,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id, form.coverImageAlt, form.coverImageProcessedAt, form.steps, coverUploadedThisSession])

  const { timedOut } = useImageProcessingPoll(loadedRecipe, (updates) => {
    dispatch({ type: 'IMAGE_STATUS_UPDATE', updates })
    announce('Image ready')
  })

  const isAnyImageUploading = isCoverUploading || uploadingStepIds.size > 0
  const slugLocked = form.hasPersistedImages || isAnyImageUploading

  const slugValid = isValidSlug(form.slug)

  const missingFields = computeMissingFields(form)
  const canPublish = missingFields.length === 0 && slugValid

  const handlePublish = async () => {
    if (!form.id) return
    setSubmitting(true)
    try {
      // Flush any pending autosave so the server has the latest field values
      // before the publish endpoint runs its validation.
      await flush()
      const token = await getAccessToken()
      const updated = await publishRecipe(token, form.id)
      dispatch({ type: 'MARK_PRISTINE' })
      dispatch({ type: 'SET_MODE', mode: updated.status })
      showToast('Recipe published', 'success')
    } catch (err) {
      handleError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!form.id) return
    setSubmitting(true)
    try {
      const token = await getAccessToken()
      await updateRecipe(token, form.id, buildPatchPayload(form))
      dispatch({ type: 'MARK_PRISTINE' })
      showToast('Recipe updated', 'success')
    } catch (err) {
      handleError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnpublish = async () => {
    if (!form.id) return
    setSubmitting(true)
    try {
      // Flush any pending autosave first so an in-flight PATCH with
      // status: 'published' cannot race the unpublish and silently re-publish.
      await flush()
      const token = await getAccessToken()
      const updated = await unpublishRecipe(token, form.id)
      dispatch({ type: 'SET_MODE', mode: updated.status })
      showToast('Recipe unpublished', 'success')
    } catch (err) {
      handleError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDiscardConfirm = async () => {
    if (!form.id) {
      setDiscardDialogOpen(false)
      return
    }
    try {
      const token = await getAccessToken()
      await deleteRecipe(token, form.id)
      dispatch({ type: 'MARK_PRISTINE' })
      setDiscardDialogOpen(false)
      navigate('/admin/recipes')
    } catch (err) {
      setDiscardDialogOpen(false)
      handleError(err)
    }
  }

  const setIngredients = useCallback((next: Ingredient[]) => setField('ingredients', next), [setField])
  const setSteps = useCallback((next: Step[]) => setField('steps', next), [setField])
  const setTags = useCallback((next: string[]) => setField('tags', next), [setField])

  const handleCoverUploadStarted = useCallback(() => {
    setIsCoverUploading(true)
    setCoverUploadedThisSession(true)
  }, [])
  const handleCoverUploadCompleted = useCallback(() => {
    setIsCoverUploading(false)
  }, [])
  const handleStepUploadStarted = useCallback((stepId: string) => {
    setUploadingStepIds((prev) => new Set(prev).add(stepId))
  }, [])
  const handleStepUploadCompleted = useCallback((stepId: string) => {
    setUploadingStepIds((prev) => {
      const next = new Set(prev)
      next.delete(stepId)
      return next
    })
  }, [])

  // Block form render while createDraft is in-flight — prevents the user
  // typing into a form whose autosave cannot yet PATCH (no id).
  if (loading || (isNewPath && !form.id && !sessionExpired)) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <Loading label="Loading recipe…" />
        </div>
      </div>
    )
  }

  const loginHref = `/admin/login?redirect=${encodeURIComponent(location.pathname)}`
  const recipeId = form.id || routeId
  const isPublished = form.mode === 'published'
  const slugResettable = !slugLocked && form.slugManuallyEdited && sluggify(form.title) !== form.slug

  return (
    <div className={styles.container}>
      {sessionExpired && (
        <div className={styles.sessionBanner} role="alert">
          <span className={styles.bannerMessage}>
            <span className={styles.bannerIcon} aria-hidden="true">
              {iconAlertCircle}
            </span>
            <span>Your session has expired. Log in again to keep editing — your latest changes are saved.</span>
          </span>
          <Link to={loginHref} className={styles.bannerAction}>
            Log in again
          </Link>
        </div>
      )}

      {timedOut && (
        <div role="status" aria-live="polite" className={styles.timeoutBanner}>
          <span className={styles.timeoutSpinner} aria-hidden="true" />
          <span>Processing is taking longer than expected — try refreshing the page.</span>
        </div>
      )}

      <Link to="/admin/recipes" icon="←" iconSide="left" nudge="left" className={styles.backLink}>
        Back to recipes
      </Link>

      <div className={styles.titleBar}>
        <Typography variant="heading1" className={styles.pageHeading}>
          {isPublished ? 'Edit recipe' : 'New recipe'}
        </Typography>
        <StatusBadge tone={isPublished ? 'success' : 'warning'}>
          {isPublished ? 'Published' : 'Draft'}
        </StatusBadge>
      </div>

      <div className={styles.editorGrid}>
        <form
          className={styles.formColumn}
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <section className={styles.basics}>
            <div className={styles.field}>
              <label htmlFor="recipe-title" className={styles.fieldLabel}>
                Title
              </label>
              <input
                id="recipe-title"
                type="text"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="recipe-slug" className={styles.fieldLabel}>
                URL slug
              </label>
              <input
                id="recipe-slug"
                type="text"
                value={form.slug}
                readOnly={slugLocked}
                aria-disabled={slugLocked || undefined}
                aria-describedby={
                  slugError ? 'recipe-slug-preview recipe-slug-error' : 'recipe-slug-preview'
                }
                onChange={(e) => {
                  setSlugError(null)
                  setField('slug', e.target.value)
                }}
                className={styles.input}
              />
              <div className={styles.slugHintRow}>
                <p id="recipe-slug-preview" className={styles.hint}>
                  Public URL: akli.dev/recipes/{form.slug}
                </p>
                {slugResettable && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'RESET_SLUG_TO_TITLE' })}
                    className={styles.textButton}
                  >
                    Reset to title
                  </button>
                )}
              </div>
              {slugLocked && (
                <p className={styles.slugLockHint}>
                  <span className={styles.slugLockIcon} aria-hidden="true">
                    {iconLock}
                  </span>
                  <span>Locked — images reference this URL. Remove all images to change it.</span>
                </p>
              )}
              {slugError && (
                <p id="recipe-slug-error" role="alert" className={styles.slugError}>
                  {slugError}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="recipe-intro" className={styles.fieldLabel}>
                Intro
              </label>
              <textarea
                id="recipe-intro"
                value={form.intro}
                onChange={(e) => setField('intro', e.target.value)}
                className={styles.textarea}
              />
            </div>
          </section>

          <fieldset className={styles.section}>
            <legend className={styles.sectionLabel}>Cover image</legend>
            <div className={styles.field}>
              {recipeId && (
                <ImageUpload
                  slug={form.slug}
                  imageType="cover"
                  currentAlt={form.coverImageAlt || undefined}
                  processedAt={form.coverImageProcessedAt}
                  getToken={getAccessToken}
                  recipeId={recipeId}
                  onUploadStarted={handleCoverUploadStarted}
                  onUploadCompleted={handleCoverUploadCompleted}
                />
              )}
            </div>

            {form.coverImageProcessedAt !== undefined && (
              <div className={styles.field}>
                <label htmlFor="recipe-cover-alt" className={styles.fieldLabel}>
                  Alt text
                </label>
                <input
                  id="recipe-cover-alt"
                  type="text"
                  value={form.coverImageAlt}
                  onChange={(e) => setField('coverImageAlt', e.target.value)}
                  className={styles.input}
                />
              </div>
            )}
          </fieldset>

          <fieldset className={styles.sectionTight}>
            <legend className={styles.sectionLabel}>Timing &amp; servings</legend>
            <div className={styles.metadataRow}>
              <div className={styles.field}>
                <label htmlFor="recipe-prep-time" className={styles.fieldLabel}>
                  Prep (min)
                </label>
                <input
                  id="recipe-prep-time"
                  type="number"
                  value={form.prepTime}
                  onChange={(e) => setField('prepTime', Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="recipe-cook-time" className={styles.fieldLabel}>
                  Cook (min)
                </label>
                <input
                  id="recipe-cook-time"
                  type="number"
                  value={form.cookTime}
                  onChange={(e) => setField('cookTime', Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="recipe-servings" className={styles.fieldLabel}>
                  Servings
                </label>
                <input
                  id="recipe-servings"
                  type="number"
                  value={form.servings}
                  onChange={(e) => setField('servings', Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.sectionTight}>
            <legend className={styles.sectionLabel}>Tags</legend>
            <TagInput
              inputId="recipe-tags"
              tags={form.tags}
              onChange={setTags}
              existingTags={existingTags}
              placeholder="Add a tag and press Enter"
            />
          </fieldset>

          <fieldset className={styles.sectionTight}>
            <legend className={styles.sectionLabelRow}>
              <span className={styles.sectionLabel}>Ingredients</span>
              <span className={styles.hint}>{pluralize(form.ingredients.length, 'item')}</span>
            </legend>
            <IngredientList
              ingredients={form.ingredients}
              onChange={setIngredients}
              onAnnounce={announce}
            />
          </fieldset>

          <fieldset className={styles.sectionTight}>
            <legend className={styles.sectionLabelRow}>
              <span className={styles.sectionLabel}>Method</span>
              <span className={styles.hint}>{pluralize(form.steps.length, 'step')}</span>
            </legend>
            {recipeId && (
              <StepList
                steps={form.steps}
                onChange={setSteps}
                recipeId={recipeId}
                slug={form.slug}
                getToken={getAccessToken}
                onAnnounce={announce}
                onStepUploadStarted={handleStepUploadStarted}
                onStepUploadCompleted={handleStepUploadCompleted}
              />
            )}
          </fieldset>
        </form>

        <aside className={styles.rail}>
          <div className={styles.railCard}>
            <div className={styles.autosaveRow}>
              <AutosaveStatus
                status={autosaveStatus}
                lastSavedAt={lastSavedAt}
                onRetry={retry}
              />
            </div>

            <div className={styles.divider} aria-hidden="true" />

            {!isPublished ? (
              <>
                <div className={styles.actionsCol}>
                  <Button
                    onClick={handlePublish}
                    type="button"
                    loading={submitting}
                    disabled={!canPublish}
                    fullWidth
                    ariaDescribedBy={!canPublish ? MISSING_FIELDS_ID : undefined}
                  >
                    Publish
                  </Button>
                  <Button
                    onClick={() => setDiscardDialogOpen(true)}
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    fullWidth
                    className={styles.discardButton}
                  >
                    Discard draft
                  </Button>
                </div>

                {!canPublish && (
                  <div className={styles.checklistWrap}>
                    <p id={`${MISSING_FIELDS_ID}-label`} className={styles.checklistLabel}>
                      Before publishing
                    </p>
                    <ul
                      id={MISSING_FIELDS_ID}
                      aria-labelledby={`${MISSING_FIELDS_ID}-label`}
                      className={styles.checklist}
                    >
                      {missingFields.map((field) => (
                        <li key={field} className={styles.checklistItem}>
                          <span className={styles.checklistIcon} aria-hidden="true" />
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.actionsCol}>
                  <Button onClick={handleUpdate} type="button" loading={submitting} fullWidth>
                    Update
                  </Button>
                  <Button
                    onClick={handleUnpublish}
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    fullWidth
                  >
                    Unpublish
                  </Button>
                </div>

                <div className={styles.previewWrap}>
                  <Link
                    to={`/recipes/${form.slug}`}
                    icon={iconPreview}
                    iconSide="right"
                    nudge="right"
                    className={styles.previewLink}
                  >
                    View live recipe
                  </Link>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {announcement.message && `${announcement.message}${announcement.toggle ? '​' : ''}`}
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave with unsaved changes?"
        confirmLabel="Leave anyway"
        cancelLabel="Stay"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Your changes are still saving. If you leave now they might not be stored.
      </ConfirmDialog>

      <ConfirmDialog
        open={discardDialogOpen}
        title="Discard this draft?"
        danger
        confirmLabel="Discard draft"
        cancelLabel="Keep editing"
        onConfirm={handleDiscardConfirm}
        onCancel={() => setDiscardDialogOpen(false)}
      >
        This draft and everything in it will be permanently deleted. This can&rsquo;t be undone.
      </ConfirmDialog>
    </div>
  )
}

export default RecipeEditor
