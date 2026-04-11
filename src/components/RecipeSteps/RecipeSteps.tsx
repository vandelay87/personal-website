import Image from '@components/Image'
import Typography from '@components/Typography'
import type { FC } from 'react'
import { RECIPE_IMAGE_BASE, type Step } from '../../types/recipe'
import styles from './RecipeSteps.module.css'

export interface RecipeStepsProps {
  steps: Step[]
}


const RecipeSteps: FC<RecipeStepsProps> = ({ steps }) => (
  <ol className={styles.list}>
    {steps.map((step) => (
      <li key={step.order} className={styles.item}>
        <Typography variant="body" className={styles.text}>{step.text}</Typography>
        {step.image && (
          <Image
            src={`${RECIPE_IMAGE_BASE}/${step.image.key}-medium.webp`}
            alt={step.image.alt}
            className={styles.image}
          />
        )}
      </li>
    ))}
  </ol>
)

export default RecipeSteps
