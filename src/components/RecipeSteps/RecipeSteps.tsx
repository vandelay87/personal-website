import Image from '@components/Image'
import type { FC } from 'react'
import type { Step } from '../../types/recipe'
import styles from './RecipeSteps.module.css'

export interface RecipeStepsProps {
  steps: Step[]
}

const IMAGE_BASE = 'https://akli.dev/images'

const RecipeSteps: FC<RecipeStepsProps> = ({ steps }) => (
  <ol className={styles.list}>
    {steps.map((step) => (
      <li key={step.order} className={styles.item}>
        <p className={styles.text}>{step.text}</p>
        {step.image && (
          <Image
            src={`${IMAGE_BASE}/${step.image.key}-medium.webp`}
            alt={step.image.alt}
            className={styles.image}
          />
        )}
      </li>
    ))}
  </ol>
)

export default RecipeSteps
