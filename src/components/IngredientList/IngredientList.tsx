import Button from '@components/Button'
import type { Ingredient } from '@models/recipe'
import type { FC } from 'react'

import styles from './IngredientList.module.css'

export interface IngredientListProps {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

const IngredientList: FC<IngredientListProps> = ({ ingredients, onChange }) => {
  const handleFieldChange = (index: number, field: keyof Ingredient, value: string) => {
    const next = ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    )
    onChange(next)
  }

  const handleAdd = () => {
    onChange([...ingredients, { item: '', quantity: '', unit: '' }])
  }

  const handleRemove = (index: number) => {
    if (ingredients.length <= 1) return
    onChange(ingredients.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const next = [...ingredients]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  const handleMoveDown = (index: number) => {
    if (index >= ingredients.length - 1) return
    const next = [...ingredients]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  return (
    <div className={styles.container}>
      {ingredients.map((ingredient, index) => (
        <div key={index} className={styles.row}>
          <label className={styles.quantityInput}>
            <span className="sr-only">Quantity</span>
            <input
              type="text"
              aria-label={`Ingredient ${index + 1} quantity`}
              value={ingredient.quantity}
              onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
              className={[styles.input, styles.quantityInput].join(' ')}
            />
          </label>
          <label className={styles.unitInput}>
            <span className="sr-only">Unit</span>
            <input
              type="text"
              aria-label={`Ingredient ${index + 1} unit`}
              value={ingredient.unit}
              onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
              className={[styles.input, styles.unitInput].join(' ')}
            />
          </label>
          <label className={styles.itemInput}>
            <span className="sr-only">Item</span>
            <input
              type="text"
              aria-label={`Ingredient ${index + 1} item`}
              value={ingredient.item}
              onChange={(e) => handleFieldChange(index, 'item', e.target.value)}
              className={[styles.input, styles.itemInput].join(' ')}
            />
          </label>
          <div className={styles.actions}>
            <Button
              onClick={() => handleMoveUp(index)}
              ariaLabel={`Move up ingredient ${index + 1}`}
              variant="secondary"
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              onClick={() => handleMoveDown(index)}
              ariaLabel={`Move down ingredient ${index + 1}`}
              variant="secondary"
              disabled={index === ingredients.length - 1}
            >
              ↓
            </Button>
            <Button
              onClick={() => handleRemove(index)}
              ariaLabel={`Remove ingredient ${index + 1}`}
              variant="secondary"
              disabled={ingredients.length <= 1}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={handleAdd} variant="secondary">
        Add ingredient
      </Button>
    </div>
  )
}

export default IngredientList
