import { createRecipe, fetchMyRecipes, fetchTags, updateRecipe } from '@api/recipes'
import Button from '@components/Button'
import ImageUpload from '@components/ImageUpload'
import IngredientList from '@components/IngredientList'
import Loading from '@components/Loading'
import StepList from '@components/StepList'
import TagInput from '@components/TagInput'
import Toast from '@components/Toast'
import { useAuth } from '@contexts/AuthContext'
import type { Ingredient, Step, Tag } from '@models/recipe'
import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { useParams } from 'react-router-dom'

import styles from './RecipeEditor.module.css'

interface FormErrors {
  title?: string
  intro?: string
  ingredients?: string
  steps?: string
}

const RecipeEditor: FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const { getAccessToken } = useAuth()

  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [prepTime, setPrepTime] = useState(0)
  const [cookTime, setCookTime] = useState(0)
  const [servings, setServings] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { item: '', quantity: '', unit: '' },
  ])
  const [steps, setSteps] = useState<Step[]>([{ order: 1, text: '' }])
  const [coverImageKey, setCoverImageKey] = useState('')
  const [coverImageAlt, setCoverImageAlt] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const titleRef = useRef<HTMLInputElement>(null)
  const introRef = useRef<HTMLTextAreaElement>(null)

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
        setTitle(recipe.title)
        setIntro(recipe.intro)
        setPrepTime(recipe.prepTime)
        setCookTime(recipe.cookTime)
        setServings(recipe.servings)
        setTags(recipe.tags)
        setIngredients(recipe.ingredients)
        setSteps(recipe.steps)
        setCoverImageKey(recipe.coverImage.key)
        setCoverImageAlt(recipe.coverImage.alt)
        setStatus(recipe.status)
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
    if (!title.trim()) next.title = 'Title is required'
    if (!intro.trim()) next.intro = 'Intro is required'
    if (!ingredients.some((ing) => ing.item.trim())) {
      next.ingredients = 'At least one ingredient with an item is required'
    }
    if (!steps.some((s) => s.text.trim())) {
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
        title,
        intro,
        prepTime,
        cookTime,
        servings,
        tags,
        ingredients,
        steps,
        coverImage: { key: coverImageKey, alt: coverImageAlt },
        status: targetStatus,
      }

      if (isEditMode && id) {
        await updateRecipe(token, id, data)
      } else {
        await createRecipe(token, data)
      }

      const message = targetStatus === 'published' ? 'Recipe published' : 'Recipe saved'
      setToast({ message, type: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setToast({ message: `Error: ${message}`, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDismissToast = useCallback(() => {
    setToast(null)
  }, [])

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loading />
      </div>
    )
  }

  return (
    <div className={styles.container}>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className={styles.textarea}
              aria-invalid={errors.intro ? 'true' : undefined}
            />
            {errors.intro && <span className={styles.error}>{errors.intro}</span>}
          </div>
        </div>

        <div className={styles.section}>
          <ImageUpload
            onUpload={setCoverImageKey}
            currentKey={coverImageKey || undefined}
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
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="recipe-cook-time">Cook time (min)</label>
              <input
                id="recipe-cook-time"
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value))}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="recipe-servings">Servings</label>
              <input
                id="recipe-servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
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
              tags={tags}
              onChange={setTags}
              existingTags={existingTags}
              placeholder="Add a tag and press Enter"
            />
          </div>
        </div>

        <div className={styles.section}>
          <IngredientList ingredients={ingredients} onChange={setIngredients} />
          {errors.ingredients && <span className={styles.error}>{errors.ingredients}</span>}
        </div>

        <div className={styles.section}>
          <StepList
            steps={steps}
            onChange={setSteps}
            recipeId={id}
            getToken={getAccessToken}
          />
          {errors.steps && <span className={styles.error}>{errors.steps}</span>}
        </div>

        <div className={styles.actions}>
          {isEditMode ? (
            <Button
              onClick={() => handleSubmit(status)}
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={handleDismissToast} />
      )}
    </div>
  )
}

export default RecipeEditor
