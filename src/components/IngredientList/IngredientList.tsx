import Button from '@components/Button'
import { useReorderableList } from '@hooks/useReorderableList'
import type { Ingredient } from '@models/recipe'
import type { FC } from 'react'

import styles from './IngredientList.module.css'

export interface IngredientListProps {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
  onAnnounce?: (message: string) => void
}

const IngredientList: FC<IngredientListProps> = ({ ingredients, onChange, onAnnounce }) => {
  const { add, remove, update, moveUp, moveDown } = useReorderableList(ingredients, onChange)

  const handleFieldChange = (index: number, field: keyof Ingredient, value: string) => {
    update(index, { ...ingredients[index], [field]: value })
  }

  const handleAdd = () => {
    add({ item: '', quantity: '', unit: '' })
    onAnnounce?.('Ingredient added')
  }

  const handleRemove = (index: number) => {
    remove(index)
    onAnnounce?.('Ingredient removed')
  }

  const handleMoveUp = (index: number) => {
    moveUp(index)
    onAnnounce?.(`Ingredient ${index + 1} moved up`)
  }

  const handleMoveDown = (index: number) => {
    moveDown(index)
    onAnnounce?.(`Ingredient ${index + 1} moved down`)
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
              className={styles.actionButton}
            >
              ↑
            </Button>
            <Button
              onClick={() => handleMoveDown(index)}
              ariaLabel={`Move down ingredient ${index + 1}`}
              variant="secondary"
              disabled={index === ingredients.length - 1}
              className={styles.actionButton}
            >
              ↓
            </Button>
            <Button
              onClick={() => handleRemove(index)}
              ariaLabel={`Remove ingredient ${index + 1}`}
              variant="secondary"
              disabled={ingredients.length <= 1}
              className={styles.actionButton}
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
