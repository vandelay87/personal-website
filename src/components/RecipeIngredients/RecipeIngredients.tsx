import type { FC } from 'react'
import type { Ingredient } from '../../types/recipe'
import styles from './RecipeIngredients.module.css'

export interface RecipeIngredientsProps {
  ingredients: Ingredient[]
}

const RecipeIngredients: FC<RecipeIngredientsProps> = ({ ingredients }) => (
  <ul className={styles.list}>
    {ingredients.map((ingredient) => (
      <li key={ingredient.item} className={styles.item}>
        {ingredient.quantity} {ingredient.item}
      </li>
    ))}
  </ul>
)

export default RecipeIngredients
