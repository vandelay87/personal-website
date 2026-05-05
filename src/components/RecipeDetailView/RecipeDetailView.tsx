import Image from '@components/Image'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import RecipeIngredients from '@components/RecipeIngredients'
import RecipeSteps from '@components/RecipeSteps'
import Typography from '@components/Typography'
import { recipeImageUrl, type Recipe } from '@models/recipe'
import type { FC } from 'react'
import { Link } from 'react-router-dom'

import styles from './RecipeDetailView.module.css'

export interface RecipeDetailViewProps {
  recipe: Recipe
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const RecipeDetailView: FC<RecipeDetailViewProps> = ({ recipe }) => (
  <article className={styles.page}>
    {recipe.coverImage.processedAt ? (
      <Image
        src={recipeImageUrl(recipe.coverImage.key, 'medium')}
        srcSet={`${recipeImageUrl(recipe.coverImage.key, 'medium')} 800w, ${recipeImageUrl(recipe.coverImage.key, 'full')} 1200w`}
        alt={recipe.coverImage.alt}
        priority
        maxWidth="var(--max-w-site)"
        aspectRatio="16/9"
        containerClassName={styles.coverImageWrapper}
      />
    ) : (
      <div className={styles.coverImageWrapper}>
        <ProcessingPlaceholder aspectRatio="16/9" />
      </div>
    )}

    <Typography variant="heading1" className={styles.title}>{recipe.title}</Typography>

    <Typography variant="body">
      <time dateTime={recipe.createdAt}>{formatDate(recipe.createdAt)}</time> · {recipe.prepTime} min prep · {recipe.cookTime} min cook · Serves {recipe.servings}
    </Typography>

    <div className={styles.tags}>
      {recipe.tags.map((tag) => (
        <Link key={tag} to={`/recipes?tag=${tag}`} className={styles.tag}>
          {tag}
        </Link>
      ))}
    </div>

    <Typography variant="bodyLarge" className={styles.intro}>{recipe.intro}</Typography>

    <section className={styles.section}>
      <Typography variant="heading2" className={styles.sectionHeading}>Ingredients</Typography>
      <RecipeIngredients ingredients={recipe.ingredients} />
    </section>

    <section className={styles.section}>
      <Typography variant="heading2" className={styles.sectionHeading}>Method</Typography>
      <RecipeSteps steps={recipe.steps} />
    </section>
  </article>
)

export default RecipeDetailView
