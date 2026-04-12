import Button from '@components/Button'
import type { Step } from '@types/recipe'
import type { FC } from 'react'

import styles from './StepList.module.css'

export interface StepListProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
}

const renumber = (steps: Step[]): Step[] =>
  steps.map((step, i) => ({ ...step, order: i + 1 }))

const StepList: FC<StepListProps> = ({ steps, onChange }) => {
  const handleTextChange = (index: number, text: string) => {
    const next = steps.map((s, i) => (i === index ? { ...s, text } : s))
    onChange(next)
  }

  const handleAdd = () => {
    onChange([...steps, { order: steps.length + 1, text: '' }])
  }

  const handleRemove = (index: number) => {
    if (steps.length <= 1) return
    onChange(renumber(steps.filter((_, i) => i !== index)))
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const next = [...steps]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(renumber(next))
  }

  const handleMoveDown = (index: number) => {
    if (index >= steps.length - 1) return
    const next = [...steps]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(renumber(next))
  }

  return (
    <div className={styles.container}>
      {steps.map((step, index) => (
        <div key={index} className={styles.row}>
          <span className={styles.stepNumber}>{index + 1}</span>
          <textarea
            aria-label={`Step ${index + 1} text`}
            value={step.text}
            onChange={(e) => handleTextChange(index, e.target.value)}
            className={styles.textarea}
          />
          <div className={styles.actions}>
            <Button
              onClick={() => handleMoveUp(index)}
              ariaLabel={`Move up step ${index + 1}`}
              variant="secondary"
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              onClick={() => handleMoveDown(index)}
              ariaLabel={`Move down step ${index + 1}`}
              variant="secondary"
              disabled={index === steps.length - 1}
            >
              ↓
            </Button>
            <Button
              onClick={() => handleRemove(index)}
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
