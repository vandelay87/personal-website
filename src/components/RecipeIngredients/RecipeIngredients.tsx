import type { Ingredient } from '@models/recipe'
import type { FC } from 'react'
import styles from './RecipeIngredients.module.css'

export interface RecipeIngredientsProps {
  ingredients: Ingredient[]
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
