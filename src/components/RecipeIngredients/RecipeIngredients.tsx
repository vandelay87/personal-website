import type { Ingredient } from '@models/recipe'
import type { FC } from 'react'
import styles from './RecipeIngredients.module.css'

export interface RecipeIngredientsProps {
  ingredients: Ingredient[]
  /**
   * Recipe identity used to key per-recipe checked-state persistence in
   * localStorage (mirrors the `slug` prop on the sibling `RecipeSteps`
   * component). Optional stub for now — checkbox/localStorage behavior is
   * implemented separately.
   */
  slug?: string
}

const RecipeIngredients: FC<RecipeIngredientsProps> = ({ ingredients }) => (
  <ul className={styles.list}>
    {ingredients.map((ingredient, idx) => (
      <li key={`${ingredient.item}-${idx}`} className={styles.item}>
        {ingredient.quantity} {ingredient.unit} {ingredient.item}
      </li>
    ))}
  </ul>
)

export default RecipeIngredients
