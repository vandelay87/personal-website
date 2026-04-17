import { createRecipe, fetchMyRecipes, fetchTags, updateRecipe } from '@api/recipes'
import Button from '@components/Button'
import ConfirmDialog from '@components/ConfirmDialog'
import ImageUpload from '@components/ImageUpload'
import IngredientList from '@components/IngredientList'
import Link from '@components/Link'
import Loading from '@components/Loading'
import StepList from '@components/StepList'
import TagInput from '@components/TagInput'
import Toast from '@components/Toast'
import { useAuth } from '@contexts/AuthContext'
import type { Ingredient, Recipe, Step, Tag } from '@models/recipe'
import { useCallback, useEffect, useReducer, useRef, useState, type FC } from 'react'
import { useBlocker, useLocation, useParams } from 'react-router-dom'

import styles from './RecipeEditor.module.css'

interface FormErrors {
  title?: string
  intro?: string
  ingredients?: string
  steps?: string
}

interface FormState {
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
  status: string
  dirty: boolean
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'dirty'>; value: FormState[keyof Omit<FormState, 'dirty'>] }
  | { type: 'LOAD_RECIPE'; recipe: Recipe }
  | { type: 'MARK_PRISTINE' }

const initialFormState: FormState = {
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
  status: 'draft',
  dirty: false,
}

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, dirty: true }
    case 'LOAD_RECIPE':
      return {
        title: action.recipe.title,
        intro: action.recipe.intro,
        prepTime: action.recipe.prepTime,
        cookTime: action.recipe.cookTime,
        servings: action.recipe.servings,
        tags: action.recipe.tags,
        ingredients: action.recipe.ingredients,
        steps: action.recipe.steps,
        coverImageKey: action.recipe.coverImage.key,
        coverImageAlt: action.recipe.coverImage.alt,
        status: action.recipe.status,
        dirty: false,
      }
    case 'MARK_PRISTINE':
      return { ...state, dirty: false }
  }
}

const isSessionError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : ''
  return /session expired|no session/i.test(message)
}

const RecipeEditor: FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const { getAccessToken } = useAuth()
  const location = useLocation()

  const [form, dispatch] = useReducer(formReducer, initialFormState)
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const introRef = useRef<HTMLTextAreaElement>(null)

  const setField = useCallback(
    <K extends keyof Omit<FormState, 'dirty'>>(field: K, value: FormState[K]) => {
      dispatch({ type: 'SET_FIELD', field, value })
    },
    []
  )

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

  useEffect(() => {
    if (!id) return
    const loadRecipe = async () => {
      try {
        const token = await getAccessToken()
        const recipes = await fetchMyRecipes(token)
        const recipe = recipes.find((r) => r.id === id)
        if (!recipe) throw new Error('Recipe not found')
        dispatch({ type: 'LOAD_RECIPE', recipe })
      } catch {
        setToast({ message: 'Error loading recipe', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadRecipe()
  }, [id, getAccessToken])

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.intro.trim()) next.intro = 'Intro is required'
    if (!form.ingredients.some((ing) => ing.item.trim())) {
      next.ingredients = 'At least one ingredient with an item is required'
    }
    if (!form.steps.some((s) => s.text.trim())) {
      next.steps = 'At least one step with text is required'
    }
    return next
  }

  const focusFirstError = useCallback((validationErrors: FormErrors) => {
    if (validationErrors.title) {
      titleRef.current?.focus()
    } else if (validationErrors.intro) {
      introRef.current?.focus()
    }
  }, [])

  const handleSubmit = async (targetStatus: string) => {
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      const token = await getAccessToken()
      const data = {
        title: form.title,
        intro: form.intro,
        prepTime: form.prepTime,
        cookTime: form.cookTime,
        servings: form.servings,
        tags: form.tags,
        ingredients: form.ingredients,
        steps: form.steps,
        coverImage: { key: form.coverImageKey, alt: form.coverImageAlt },
        status: targetStatus,
      }

      if (isEditMode && id) {
        await updateRecipe(token, id, data)
      } else {
        await createRecipe(token, data)
      }

      dispatch({ type: 'MARK_PRISTINE' })
      const message = targetStatus === 'published' ? 'Recipe published' : 'Recipe saved'
      setToast({ message, type: 'success' })
    } catch (err) {
      if (isSessionError(err)) {
        setSessionExpired(true)
      } else {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setToast({ message: `Error: ${message}`, type: 'error' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const announce = useCallback((message: string) => {
    setAnnouncement(message)
  }, [])

  const setIngredients = useCallback((next: Ingredient[]) => setField('ingredients', next), [setField])
  const setSteps = useCallback((next: Step[]) => setField('steps', next), [setField])
  const setTags = useCallback((next: string[]) => setField('tags', next), [setField])
  const setCoverImageKey = useCallback((key: string) => setField('coverImageKey', key), [setField])

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loading />
      </div>
    )
  }

  const loginHref = `/admin/login?redirect=${encodeURIComponent(location.pathname)}`

  return (
    <div className={styles.container}>
      {sessionExpired && (
        <div className={styles.sessionBanner} role="alert">
          <span>Session expired — please log in again</span>
          <Link to={loginHref}>Log in again</Link>
        </div>
      )}

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
              ref={titleRef}
              id="recipe-title"
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className={styles.input}
              aria-invalid={errors.title ? 'true' : undefined}
            />
            {errors.title && <span className={styles.error}>{errors.title}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="recipe-intro">Intro</label>
            <textarea
              ref={introRef}
              id="recipe-intro"
              value={form.intro}
              onChange={(e) => setField('intro', e.target.value)}
              className={styles.textarea}
              aria-invalid={errors.intro ? 'true' : undefined}
            />
            {errors.intro && <span className={styles.error}>{errors.intro}</span>}
          </div>
        </div>

        <div className={styles.section}>
          <ImageUpload
            onUpload={setCoverImageKey}
            currentKey={form.coverImageKey || undefined}
            getToken={getAccessToken}
            id={id}
          />
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
          {errors.ingredients && <span className={styles.error}>{errors.ingredients}</span>}
        </div>

        <div className={styles.section}>
          <StepList
            steps={form.steps}
            onChange={setSteps}
            recipeId={id}
            getToken={getAccessToken}
            onAnnounce={announce}
          />
          {errors.steps && <span className={styles.error}>{errors.steps}</span>}
        </div>

        <div className={styles.actions}>
          {isEditMode ? (
            <Button
              onClick={() => handleSubmit(form.status)}
              type="button"
              disabled={submitting}
            >
              {submitting ? <Loading size="small" /> : 'Save changes'}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => handleSubmit('draft')}
                type="button"
                variant="secondary"
                disabled={submitting}
              >
                {submitting ? <Loading size="small" /> : 'Save as draft'}
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                type="button"
                disabled={submitting}
              >
                {submitting ? <Loading size="small" /> : 'Publish'}
              </Button>
            </>
          )}
        </div>
      </form>

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
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
    </div>
  )
}

export default RecipeEditor
