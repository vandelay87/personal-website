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
import Callout from '@components/Callout'
import ConfirmDialog from '@components/ConfirmDialog'
import ImageUpload from '@components/ImageUpload'
import IngredientList from '@components/IngredientList'
import Link from '@components/Link'
import Loading from '@components/Loading'
import StepList from '@components/StepList'
import TagInput from '@components/TagInput'
import Toast from '@components/Toast'
import { useAuth } from '@contexts/AuthContext'
import { useAutosave } from '@hooks/useAutosave'
import type { Ingredient, Recipe, Step, Tag } from '@models/recipe'
import { useCallback, useEffect, useReducer, useRef, useState, type FC } from 'react'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom'

import styles from './RecipeEditor.module.css'

type EditorMode = Recipe['status']

interface FormState {
  id: string
  slug: string
  title: string
  intro: string
  prepTime: number
  cookTime: number
  servings: number
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
  coverImageKey: string
  coverImageAlt: string
  mode: EditorMode
  dirty: boolean
}

type SettableField = Exclude<keyof FormState, 'dirty' | 'mode' | 'id' | 'slug'>

type FormAction =
  | { type: 'SET_FIELD'; field: SettableField; value: FormState[SettableField] }
  | { type: 'LOAD_RECIPE'; recipe: Recipe }
  | { type: 'MARK_PRISTINE' }
  | { type: 'SET_MODE'; mode: EditorMode }

const MISSING_FIELDS_ID = 'publish-missing-fields'

const initialFormState: FormState = {
  id: '',
  slug: '',
  title: '',
  intro: '',
  prepTime: 0,
  cookTime: 0,
  servings: 0,
  tags: [],
  ingredients: [{ item: '', quantity: '', unit: '' }],
  steps: [{ order: 1, text: '' }],
  coverImageKey: '',
  coverImageAlt: '',
  mode: 'draft',
  dirty: false,
}

const recipeToFormState = (recipe: Recipe): FormState => {
  const ingredients = recipe.ingredients ?? []
  const steps = recipe.steps ?? []
  return {
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title ?? '',
    intro: recipe.intro ?? '',
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    tags: recipe.tags ?? [],
    ingredients: ingredients.length > 0 ? ingredients : [{ item: '', quantity: '', unit: '' }],
    steps: steps.length > 0 ? steps : [{ order: 1, text: '' }],
    coverImageKey: recipe.coverImage?.key ?? '',
    coverImageAlt: recipe.coverImage?.alt ?? '',
    mode: recipe.status,
    dirty: false,
  }
}

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, dirty: true }
    case 'LOAD_RECIPE':
      return recipeToFormState(action.recipe)
    case 'MARK_PRISTINE':
      return { ...state, dirty: false }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
  }
}

const buildPatchPayload = (form: FormState): Partial<Recipe> => ({
  title: form.title,
  intro: form.intro,
  prepTime: form.prepTime,
  cookTime: form.cookTime,
  servings: form.servings,
  tags: form.tags,
  ingredients: form.ingredients,
  steps: form.steps,
  coverImage: { key: form.coverImageKey, alt: form.coverImageAlt },
  status: form.mode,
})

const computeMissingFields = (form: FormState): string[] => {
  const missing: string[] = []
  if (!form.title.trim()) missing.push('Title')
  if (!form.intro.trim()) missing.push('Intro')
  if (!form.coverImageKey.trim()) missing.push('Cover image')
  if (!form.coverImageAlt.trim()) missing.push('Cover image alt text')
  if (!form.ingredients.some((ing) => ing.item.trim())) missing.push('At least one ingredient')
  if (!form.steps.some((s) => s.text.trim())) missing.push('At least one step')
  return missing
}

const draftFromCreated = (id: string, slug: string): Recipe => ({
  id,
  slug,
  title: '',
  intro: '',
  coverImage: { key: '', alt: '' },
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

const RecipeEditor: FC = () => {
  const { id: routeId } = useParams<{ id: string }>()
  const { getAccessToken } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isNewPath = location.pathname === NEW_PATH

  const [form, dispatch] = useReducer(formReducer, initialFormState)
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [loading, setLoading] = useState(Boolean(routeId))
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [announcement, setAnnouncement] = useState({ message: '', toggle: false })
  const [sessionExpired, setSessionExpired] = useState(false)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

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
    setToast({ message: fallback ?? `Error: ${message}`, type: 'error' })
  }, [])

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
        dispatch({ type: 'LOAD_RECIPE', recipe: draftFromCreated(id, slug) })
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

  const missingFields = computeMissingFields(form)
  const canPublish = missingFields.length === 0

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
      setToast({ message: 'Recipe published', type: 'success' })
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
      setToast({ message: 'Recipe updated', type: 'success' })
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
      setToast({ message: 'Recipe unpublished', type: 'success' })
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

  const handleDismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const announce = useCallback((message: string) => {
    setAnnouncement((prev) => ({ message, toggle: !prev.toggle }))
  }, [])

  const setIngredients = useCallback((next: Ingredient[]) => setField('ingredients', next), [setField])
  const setSteps = useCallback((next: Step[]) => setField('steps', next), [setField])
  const setTags = useCallback((next: string[]) => setField('tags', next), [setField])
  const setCoverImageKey = useCallback((key: string) => setField('coverImageKey', key), [setField])

  // Block form render while createDraft is in-flight — prevents the user
  // typing into a form whose autosave cannot yet PATCH (no id).
  if (loading || (isNewPath && !form.id && !sessionExpired)) {
    return (
      <div className={styles.loadingWrapper}>
        <Loading />
      </div>
    )
  }

  const loginHref = `/admin/login?redirect=${encodeURIComponent(location.pathname)}`
  const recipeId = form.id || routeId

  return (
    <div className={styles.container}>
      {sessionExpired && (
        <div className={styles.sessionBanner} role="alert">
          <span>Session expired — please log in again</span>
          <Link to={loginHref}>Log in again</Link>
        </div>
      )}

      <div className={styles.header}>
        <Link to="/admin/recipes" className={styles.backLink}>
          ← Back to recipes
        </Link>
        <AutosaveStatus
          status={autosaveStatus}
          lastSavedAt={lastSavedAt}
          onRetry={retry}
        />
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <div className={styles.section}>
          <div className={styles.field}>
            <label htmlFor="recipe-title">Title</label>
            <input
              id="recipe-title"
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="recipe-intro">Intro</label>
            <textarea
              id="recipe-intro"
              value={form.intro}
              onChange={(e) => setField('intro', e.target.value)}
              className={styles.textarea}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.field}>
            {recipeId && (
              <ImageUpload
                onUpload={setCoverImageKey}
                currentKey={form.coverImageKey || undefined}
                currentAlt={form.coverImageAlt || undefined}
                getToken={getAccessToken}
                recipeId={recipeId}
              />
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="recipe-cover-alt">Cover image alt text</label>
            <input
              id="recipe-cover-alt"
              type="text"
              value={form.coverImageAlt}
              onChange={(e) => setField('coverImageAlt', e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.metadataRow}>
            <div className={styles.field}>
              <label htmlFor="recipe-prep-time">Prep time (min)</label>
              <input
                id="recipe-prep-time"
                type="number"
                value={form.prepTime}
                onChange={(e) => setField('prepTime', Number(e.target.value))}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="recipe-cook-time">Cook time (min)</label>
              <input
                id="recipe-cook-time"
                type="number"
                value={form.cookTime}
                onChange={(e) => setField('cookTime', Number(e.target.value))}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="recipe-servings">Servings</label>
              <input
                id="recipe-servings"
                type="number"
                value={form.servings}
                onChange={(e) => setField('servings', Number(e.target.value))}
                className={styles.numberInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.field}>
            <label htmlFor="recipe-tags">Tags</label>
            <TagInput
              inputId="recipe-tags"
              tags={form.tags}
              onChange={setTags}
              existingTags={existingTags}
              placeholder="Add a tag and press Enter"
            />
          </div>
        </div>

        <div className={styles.section}>
          <IngredientList
            ingredients={form.ingredients}
            onChange={setIngredients}
            onAnnounce={announce}
          />
        </div>

        <div className={styles.section}>
          {recipeId && (
            <StepList
              steps={form.steps}
              onChange={setSteps}
              recipeId={recipeId}
              getToken={getAccessToken}
              onAnnounce={announce}
            />
          )}
        </div>

        <div className={styles.actions}>
          {form.mode === 'draft' ? (
            <>
              <Button
                onClick={handlePublish}
                type="button"
                disabled={submitting || !canPublish}
                ariaDescribedBy={!canPublish ? MISSING_FIELDS_ID : undefined}
              >
                {submitting ? <Loading size="small" /> : 'Publish'}
              </Button>
              <Button
                onClick={() => setDiscardDialogOpen(true)}
                type="button"
                variant="secondary"
                disabled={submitting}
              >
                Discard draft
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleUpdate} type="button" disabled={submitting}>
                {submitting ? <Loading size="small" /> : 'Update'}
              </Button>
              <Button
                onClick={handleUnpublish}
                type="button"
                variant="secondary"
                disabled={submitting}
              >
                Unpublish
              </Button>
            </>
          )}
        </div>

        {form.mode === 'draft' && !canPublish && (
          <Callout type="warning">
            <p id={`${MISSING_FIELDS_ID}-label`}>Add the following before publishing:</p>
            <ul
              id={MISSING_FIELDS_ID}
              aria-labelledby={`${MISSING_FIELDS_ID}-label`}
              className={styles.missingFieldsList}
            >
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </Callout>
        )}
      </form>

      <div className="sr-only" role="status" aria-live="polite">
        {announcement.message && `${announcement.message}${announcement.toggle ? '\u200B' : ''}`}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={handleDismissToast} />
      )}

      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        title="Unsaved changes"
        message="Are you sure you want to leave this page? Your edits will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Stay on this page"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />

      <ConfirmDialog
        isOpen={discardDialogOpen}
        title="Discard draft?"
        message="This will permanently delete this draft recipe. This action cannot be undone."
        confirmLabel="Discard"
        cancelLabel="Cancel"
        onConfirm={handleDiscardConfirm}
        onCancel={() => setDiscardDialogOpen(false)}
      />
    </div>
  )
}

export default RecipeEditor
