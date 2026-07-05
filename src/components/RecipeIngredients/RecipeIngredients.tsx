import type { Ingredient } from '@models/recipe'
import { useState, type FC } from 'react'
import styles from './RecipeIngredients.module.css'

export interface RecipeIngredientsProps {
  ingredients: Ingredient[]
  /**
   * Recipe identity used to key per-recipe checked-state persistence in
   * localStorage (mirrors the `slug` prop on the sibling `RecipeSteps`
   * component).
   */
  slug?: string
}

const storageKey = (slug: string): string => `recipe-ingredients:${slug}`

const loadChecked = (slug?: string): Set<string> => {
  if (!slug) return new Set()
  try {
    const raw = localStorage.getItem(storageKey(slug))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : [])
  } catch {
    return new Set()
  }
}

const RecipeIngredients: FC<RecipeIngredientsProps> = ({ ingredients, slug }) => {
  const [loadedSlug, setLoadedSlug] = useState(slug)
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked(slug))

  // Re-derive checked state from localStorage when `slug` changes on an
  // already-mounted instance (e.g. client-side navigation between recipes
  // that reuses the same <RecipeIngredients> element rather than
  // unmounting it). Adjusting state during render — rather than in a
  // useEffect — avoids a stale frame where the previous recipe's checked
  // items would flash before being reset.
  if (slug !== loadedSlug) {
    setLoadedSlug(slug)
    setChecked(loadChecked(slug))
  }

  const toggle = (key: string): void => {
    const next = new Set(checked)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setChecked(next)
    if (slug) {
      localStorage.setItem(storageKey(slug), JSON.stringify(Array.from(next)))
    }
  }

  return (
    <ul className={styles.list}>
      {ingredients.map((ingredient, idx) => {
        const key = `${ingredient.item}-${idx}`
        return (
          <li key={key} className={styles.item}>
            <label className={styles.label}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={checked.has(key)}
                onChange={() => toggle(key)}
              />
              {ingredient.quantity} {ingredient.unit} {ingredient.item}
            </label>
          </li>
        )
      })}
    </ul>
  )
}

export default RecipeIngredients
