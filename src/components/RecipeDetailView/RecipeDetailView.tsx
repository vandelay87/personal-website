import Image from '@components/Image'
import Link from '@components/Link'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import RecipeIngredients from '@components/RecipeIngredients'
import RecipeSteps from '@components/RecipeSteps'
import Typography from '@components/Typography'
import { recipeImageUrl, type Recipe } from '@models/recipe'
import type { FC } from 'react'
import { Link as RouterLink } from 'react-router-dom'

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
  <article className={styles.article}>
    <Link to="/recipes" icon="←" iconSide="left" nudge="left" className={styles.backLink}>
      All recipes
    </Link>

    <figure className={styles.hero}>
      {recipe.coverImage.processedAt ? (
        <Image
          src={recipeImageUrl(recipe.slug, 'cover', 'medium')}
          srcSet={`${recipeImageUrl(recipe.slug, 'cover', 'medium')} 800w, ${recipeImageUrl(recipe.slug, 'cover', 'full')} 1200w`}
          alt={recipe.coverImage.alt}
          priority
          aspectRatio="16/10"
          containerClassName={styles.heroImage}
        />
      ) : (
        <ProcessingPlaceholder aspectRatio="16/10" className={styles.heroImage} />
      )}
    </figure>

    <header className={styles.header}>
      <Typography variant="heading1" className={styles.title}>
        {recipe.title}
      </Typography>
      <p className={styles.meta}>
        <time dateTime={recipe.createdAt}>{formatDate(recipe.createdAt)}</time>
        <span aria-hidden="true"> · </span>
        {recipe.prepTime} min prep
        <span aria-hidden="true"> · </span>
        {recipe.cookTime} min cook
        <span aria-hidden="true"> · </span>
        Serves {recipe.servings}
      </p>
      <ul className={styles.tags}>
        {recipe.tags.map((tag) => (
          <li key={tag}>
            <RouterLink to={`/recipes?tag=${tag}`} className={styles.tag}>
              {tag}
            </RouterLink>
          </li>
        ))}
      </ul>
      <Typography variant="bodyLarge" className={styles.intro}>
        {recipe.intro}
      </Typography>
    </header>

    <hr className={styles.divider} />

    <div className={styles.grid}>
      <aside className={styles.ingredientsPanel}>
        <div className={styles.ingredientsHead}>
          <Typography variant="heading2" className={styles.ingredientsHeading}>
            Ingredients
          </Typography>
          <span className={styles.servesLabel}>Serves {recipe.servings}</span>
        </div>
        <p className={styles.ingredientsHint}>Tap to check off as you go.</p>
        <RecipeIngredients ingredients={recipe.ingredients} slug={recipe.slug} />
      </aside>

      <section>
        <Typography variant="heading2" className={styles.methodHeading}>
          Method
        </Typography>
        <p className={styles.stepsLabel}>{recipe.steps.length} steps</p>
        <RecipeSteps steps={recipe.steps} slug={recipe.slug} />
      </section>
    </div>
  </article>
)

export default RecipeDetailView
