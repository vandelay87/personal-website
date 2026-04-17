import Button from '@components/Button'
import ImageUpload from '@components/ImageUpload'
import { useReorderableList } from '@hooks/useReorderableList'
import type { RecipeImage, Step } from '@models/recipe'
import { useCallback, type FC } from 'react'

import styles from './StepList.module.css'

export interface StepListProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
  recipeId?: string
  getToken?: () => Promise<string>
}

const renumber = (steps: Step[]): Step[] =>
  steps.map((step, i) => ({ ...step, order: i + 1 }))

const StepList: FC<StepListProps> = ({ steps, onChange, recipeId, getToken }) => {
  const onChangeRenumbered = useCallback(
    (next: Step[]) => onChange(renumber(next)),
    [onChange]
  )
  const { add, remove, update, moveUp, moveDown } = useReorderableList(steps, onChangeRenumbered)

  const handleTextChange = (index: number, text: string) => {
    update(index, { ...steps[index], text })
  }

  const updateImage = (index: number, patch: Partial<RecipeImage>) => {
    const existing = steps[index].image
    update(index, {
      ...steps[index],
      image: { key: existing?.key ?? '', alt: existing?.alt ?? '', ...patch },
    })
  }

  const handleAdd = () => {
    add({ order: steps.length + 1, text: '' })
  }

  return (
    <div className={styles.container}>
      {steps.map((step, index) => (
        <div key={index} className={styles.row}>
          <span className={styles.stepNumber}>{index + 1}</span>
          <div className={styles.body}>
            <textarea
              aria-label={`Step ${index + 1} text`}
              value={step.text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              className={styles.textarea}
            />
            {getToken && (
              <div className={styles.imageBlock}>
                <ImageUpload
                  id={recipeId}
                  imageType="step"
                  stepOrder={index + 1}
                  currentKey={step.image?.key}
                  getToken={getToken}
                  onUpload={(key) => updateImage(index, { key })}
                />
                <input
                  type="text"
                  aria-label={`Step ${index + 1} image alt text`}
                  placeholder="Image alt text"
                  value={step.image?.alt ?? ''}
                  onChange={(e) => updateImage(index, { alt: e.target.value })}
                  className={styles.altInput}
                />
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <Button
              onClick={() => moveUp(index)}
              ariaLabel={`Move up step ${index + 1}`}
              variant="secondary"
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              onClick={() => moveDown(index)}
              ariaLabel={`Move down step ${index + 1}`}
              variant="secondary"
              disabled={index === steps.length - 1}
            >
              ↓
            </Button>
            <Button
              onClick={() => remove(index)}
              ariaLabel={`Remove step ${index + 1}`}
              variant="secondary"
              disabled={steps.length <= 1}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={handleAdd} variant="secondary">
        Add step
      </Button>
    </div>
  )
}

export default StepList
