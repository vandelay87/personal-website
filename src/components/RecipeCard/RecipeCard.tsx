import Image from '@components/Image'
import Typography from '@components/Typography'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import type { RecipeIndex } from '../../types/recipe'
import styles from './RecipeCard.module.css'

export interface RecipeCardProps {
  recipe: RecipeIndex
}

const IMAGE_BASE = 'https://akli.dev/images'

const RecipeCard: FC<RecipeCardProps> = ({ recipe }) => {
  const thumbnailSrc = `${IMAGE_BASE}/${recipe.coverImage.key}-thumb.webp`

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={thumbnailSrc}
          alt={recipe.coverImage.alt}
          aspectRatio="16/9"
          className={styles.image}
        />
      </div>

      <div className={styles.body}>
        <Typography variant="heading3" as="h2" className={styles.title}>
          <Link to={`/recipes/${recipe.slug}`} className={styles.titleLink}>
            {recipe.title}
          </Link>
        </Typography>

        <div className={styles.tags}>
          {recipe.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.meta}>
          <span>Prep: {recipe.prepTime} min</span>
          <span className={styles.separator}>·</span>
          <span>Cook: {recipe.cookTime} min</span>
          <span className={styles.separator}>·</span>
          <span>Serves: {recipe.servings}</span>
        </div>
      </div>
    </article>
  )
}

export default RecipeCard
