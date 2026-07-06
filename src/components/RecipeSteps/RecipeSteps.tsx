import Image from '@components/Image'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import Typography from '@components/Typography'
import { recipeImageUrl, stepImageType, type Step } from '@models/recipe'
import type { FC } from 'react'
import styles from './RecipeSteps.module.css'

export interface RecipeStepsProps {
  steps: Step[]
  slug: string
}


const RecipeSteps: FC<RecipeStepsProps> = ({ steps, slug }) => (
  <ol className={styles.list}>
    {steps.map((step, idx) => (
      <li key={step.stepId} className={styles.item}>
        <span className={styles.number} aria-hidden="true">
          {idx + 1}
        </span>
        <div className={styles.content}>
          <Typography variant="body" className={styles.text}>{step.text}</Typography>
          {step.image && (step.image.processedAt ? (
            <Image
              src={recipeImageUrl(slug, stepImageType(step.stepId), 'medium')}
              alt={step.image.alt}
              className={styles.image}
            />
          ) : (
            <ProcessingPlaceholder aspectRatio="4/3" className={styles.image} />
          ))}
        </div>
      </li>
    ))}
  </ol>
)

export default RecipeSteps
