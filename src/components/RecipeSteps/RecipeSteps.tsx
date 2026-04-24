import Image from '@components/Image'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import Typography from '@components/Typography'
import { recipeImageUrl, type Step } from '@models/recipe'
import type { FC } from 'react'
import styles from './RecipeSteps.module.css'

export interface RecipeStepsProps {
  steps: Step[]
}


const RecipeSteps: FC<RecipeStepsProps> = ({ steps }) => (
  <ol className={styles.list}>
    {steps.map((step) => (
      <li key={step.order} className={styles.item}>
        <Typography variant="body" className={styles.text}>{step.text}</Typography>
        {step.image && (step.image.processedAt ? (
          <Image
            src={recipeImageUrl(step.image.key, 'medium')}
            alt={step.image.alt}
            className={styles.image}
          />
        ) : (
          <ProcessingPlaceholder className={styles.image} />
        ))}
      </li>
    ))}
  </ol>
)

export default RecipeSteps
