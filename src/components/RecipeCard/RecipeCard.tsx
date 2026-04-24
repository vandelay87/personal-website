import Image from '@components/Image'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import Typography from '@components/Typography'
import { recipeImageUrl, type RecipeIndex } from '@models/recipe'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import styles from './RecipeCard.module.css'

export interface RecipeCardProps {
  recipe: RecipeIndex
  eager?: boolean
  hideTags?: boolean
  hideMeta?: boolean
}


const RecipeCard: FC<RecipeCardProps> = ({ recipe, eager = false, hideTags = false, hideMeta = false }) => {
  const thumbnailSrc = recipeImageUrl(recipe.coverImage.key, 'thumb')

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {recipe.coverImage.processedAt ? (
          <Image
            src={thumbnailSrc}
            alt={recipe.coverImage.alt}
            aspectRatio="16/9"
            className={styles.image}
            lazy={!eager}
          />
        ) : (
          <ProcessingPlaceholder aspectRatio="16/9" className={styles.image} />
        )}
      </div>

      <div className={styles.body}>
        <Typography variant="heading3" as="h2" className={styles.title}>
          <Link to={`/recipes/${recipe.slug}`} className={styles.titleLink}>
            {recipe.title}
          </Link>
        </Typography>

        {!hideTags && (
          <div className={styles.tags}>
            {recipe.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {!hideMeta && (
          <div className={styles.meta}>
            <span>Prep: {recipe.prepTime} min</span>
            <span className={styles.separator}>·</span>
            <span>Cook: {recipe.cookTime} min</span>
            <span className={styles.separator}>·</span>
            <span>Serves: {recipe.servings}</span>
          </div>
        )}
      </div>
    </article>
  )
}

export default RecipeCard
