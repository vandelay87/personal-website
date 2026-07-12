import SemanticList, { SemanticListItem } from '@components/SemanticList'
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

/**
 * A checked-off ingredient list represents progress through a single
 * cooking session, not a durable preference — coming back a week later to
 * cook the same recipe again should start from a clean list. localStorage
 * has no native expiry, so it's tracked by hand: `expiresAt` is
 * recomputed on every write, and a read past that time is treated as
 * empty (a stale entry is left in place rather than removed here, since
 * that removal isn't safe to do as a render-time side effect — it's
 * simply overwritten the next time this recipe's list is touched again).
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000

interface StoredIngredientsState {
  checked: string[]
  expiresAt: number
}

const storageKey = (slug: string): string => `recipe-ingredients:${slug}`

const loadChecked = (slug?: string): Set<string> => {
  if (!slug) return new Set()
  try {
    const raw = localStorage.getItem(storageKey(slug))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as Partial<StoredIngredientsState>
    if (
      !Array.isArray(parsed.checked) ||
      typeof parsed.expiresAt !== 'number' ||
      Date.now() > parsed.expiresAt
    ) {
      return new Set()
    }
    return new Set(parsed.checked)
  } catch {
    return new Set()
  }
}

const saveChecked = (slug: string, checked: Set<string>): void => {
  const state: StoredIngredientsState = {
    checked: Array.from(checked),
    expiresAt: Date.now() + TTL_MS,
  }
  localStorage.setItem(storageKey(slug), JSON.stringify(state))
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
      saveChecked(slug, next)
    }
  }

  return (
    <SemanticList className={styles.list}>
      {ingredients.map((ingredient, idx) => {
        const key = `${ingredient.item}-${idx}`
        return (
          <SemanticListItem key={key} className={styles.item}>
            <label className={styles.row}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={checked.has(key)}
                onChange={() => toggle(key)}
              />
              <span className={styles.name}>{ingredient.item}</span>
              <span className={styles.qty}>
                {ingredient.quantity} {ingredient.unit}
              </span>
            </label>
          </SemanticListItem>
        )
      })}
    </SemanticList>
  )
}

export default RecipeIngredients
