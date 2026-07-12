import Button from '@components/Button'
import { iconChevronDown, iconChevronUp, iconPlus, iconRemove } from '@components/icons'
import ImageUpload from '@components/ImageUpload'
import Input from '@components/Input'
import Textarea from '@components/Textarea'
import { useReorderableList } from '@hooks/useReorderableList'
import { stepImageType, type RecipeImage, type Step } from '@models/recipe'
import { useCallback, type FC } from 'react'

import interactions from '../../styles/interactions.module.css'
import styles from './StepList.module.css'

const moveActionClassName = `${interactions.iconButtonHover} ${styles.actionButton}`
const removeActionClassName = `${interactions.dangerIconButtonHover} ${styles.actionButton}`

export interface StepListProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
  recipeId: string
  slug: string
  getToken?: () => Promise<string>
  onAnnounce?: (message: string) => void
  onStepUploadStarted?: (stepId: string) => void
  onStepUploadCompleted?: (stepId: string) => void
}

const renumber = (steps: Step[]): Step[] =>
  steps.map((step, i) => ({ ...step, order: i + 1 }))

const StepList: FC<StepListProps> = ({
  steps,
  onChange,
  recipeId,
  slug,
  getToken,
  onAnnounce,
  onStepUploadStarted,
  onStepUploadCompleted,
}) => {
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
      image: { ...existing, alt: existing?.alt ?? '', ...patch },
    })
  }

  const handleStepImageUploaded = (index: number) => {
    const step = steps[index]
    onStepUploadCompleted?.(step.stepId)
    // Record that this step now has an image so it is persisted by buildPatchPayload
    // and polled for processing, even if the user never types alt text. Mirrors the
    // always-present coverImage; any alt the user already typed is preserved.
    update(index, { ...step, image: { alt: step.image?.alt ?? '' } })
  }

  const handleAdd = () => {
    add({ stepId: crypto.randomUUID(), order: steps.length + 1, text: '' })
    onAnnounce?.('Step added')
  }

  const handleRemove = (index: number) => {
    remove(index)
    onAnnounce?.('Step removed')
  }

  const handleMoveUp = (index: number) => {
    moveUp(index)
    onAnnounce?.(`Step ${index + 1} moved up`)
  }

  const handleMoveDown = (index: number) => {
    moveDown(index)
    onAnnounce?.(`Step ${index + 1} moved down`)
  }

  return (
    <>
      <ul className={styles.container}>
        {steps.map((step, index) => (
          <li key={step.stepId} className={styles.row}>
            <div className={styles.header}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <div className={styles.actions}>
                <Button
                  onClick={() => handleMoveUp(index)}
                  ariaLabel={`Move up step ${index + 1}`}
                  variant="outline"
                  disabled={index === 0}
                  className={moveActionClassName}
                >
                  {iconChevronUp}
                </Button>
                <Button
                  onClick={() => handleMoveDown(index)}
                  ariaLabel={`Move down step ${index + 1}`}
                  variant="outline"
                  disabled={index === steps.length - 1}
                  className={moveActionClassName}
                >
                  {iconChevronDown}
                </Button>
                <Button
                  onClick={() => handleRemove(index)}
                  ariaLabel={`Remove step ${index + 1}`}
                  variant="outline"
                  disabled={steps.length <= 1}
                  className={removeActionClassName}
                >
                  {iconRemove}
                </Button>
              </div>
            </div>
            <Textarea
              ariaLabel={`Step ${index + 1} text`}
              placeholder="Describe this step…"
              value={step.text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              className={styles.textarea}
            />
            {getToken && (
              <div className={styles.imageBlock}>
                <ImageUpload
                  recipeId={recipeId}
                  slug={slug}
                  imageType={stepImageType(step.stepId)}
                  currentAlt={step.image?.alt}
                  processedAt={step.image?.processedAt}
                  getToken={getToken}
                  onUploadStarted={() => onStepUploadStarted?.(step.stepId)}
                  onUploadCompleted={() => handleStepImageUploaded(index)}
                />
                {step.image?.processedAt !== undefined && (
                  <Input
                    ariaLabel={`Step ${index + 1} image alt text`}
                    placeholder="Alt text for this image"
                    value={step.image?.alt ?? ''}
                    onChange={(e) => updateImage(index, { alt: e.target.value })}
                  />
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Button onClick={handleAdd} variant="outline" iconLeft={iconPlus} className={styles.addButton}>
        Add step
      </Button>
    </>
  )
}

export default StepList
