import Button from '@components/Button'
import { iconChevronDown, iconChevronUp, iconPlus, iconRemove } from '@components/icons'
import Input from '@components/Input'
import { useReorderableList } from '@hooks/useReorderableList'
import type { Ingredient } from '@models/recipe'
import type { FC } from 'react'

import interactions from '../../styles/interactions.module.css'
import styles from './IngredientList.module.css'

const moveActionClassName = `${interactions.iconButtonHover} ${styles.actionButton}`
const removeActionClassName = `${interactions.dangerIconButtonHover} ${styles.actionButton}`

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
    <>
      <ul className={styles.container}>
        {ingredients.map((ingredient, index) => (
          <li key={index} className={styles.row}>
            <div className={styles.quantityField}>
              <Input
                ariaLabel={`Ingredient ${index + 1} quantity`}
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
              />
            </div>
            <div className={styles.unitField}>
              <Input
                ariaLabel={`Ingredient ${index + 1} unit`}
                placeholder="Unit"
                value={ingredient.unit}
                onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
              />
            </div>
            <div className={styles.itemField}>
              <Input
                ariaLabel={`Ingredient ${index + 1} item`}
                placeholder="Ingredient"
                value={ingredient.item}
                onChange={(e) => handleFieldChange(index, 'item', e.target.value)}
              />
            </div>
            <div className={styles.actions}>
              <Button
                onClick={() => handleMoveUp(index)}
                ariaLabel={`Move up ingredient ${index + 1}`}
                variant="outline"
                disabled={index === 0}
                className={moveActionClassName}
              >
                {iconChevronUp}
              </Button>
              <Button
                onClick={() => handleMoveDown(index)}
                ariaLabel={`Move down ingredient ${index + 1}`}
                variant="outline"
                disabled={index === ingredients.length - 1}
                className={moveActionClassName}
              >
                {iconChevronDown}
              </Button>
              <Button
                onClick={() => handleRemove(index)}
                ariaLabel={`Remove ingredient ${index + 1}`}
                variant="outline"
                disabled={ingredients.length <= 1}
                className={removeActionClassName}
              >
                {iconRemove}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button onClick={handleAdd} variant="outline" iconLeft={iconPlus} className={styles.addButton}>
        Add ingredient
      </Button>
    </>
  )
}

export default IngredientList
