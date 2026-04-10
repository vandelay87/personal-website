import Button from '@components/Button'
import Image from '@components/Image'
import Typography from '@components/Typography'
import NotFound from '@pages/NotFound'
import { useContext, useEffect, useState, type FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchRecipe } from '../../api/recipes'
import RecipeIngredients from '../../components/RecipeIngredients'
import RecipeSteps from '../../components/RecipeSteps'
import { RecipeDataContext } from '../../contexts/RecipeDataContext'
import type { Recipe } from '../../types/recipe'
import styles from './RecipeDetail.module.css'

const IMAGE_BASE = 'https://akli.dev/images'

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const RecipeDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { recipe: ssrRecipe } = useContext(RecipeDataContext)

  const [recipe, setRecipe] = useState<Recipe | undefined>(ssrRecipe)
  const [loading, setLoading] = useState(!ssrRecipe)
  const [error, setError] = useState<string | undefined>()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (ssrRecipe || !slug) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(undefined)
      setNotFound(false)
      try {
        const data = await fetchRecipe(slug)
        if (!cancelled) {
          setRecipe(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          if (message.includes('404')) {
            setNotFound(true)
          } else {
            setError(message)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [slug, ssrRecipe])

  if (notFound) return <NotFound />

  if (loading) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Something went wrong loading this recipe.</p>
        <Button
          variant="secondary"
          onClick={() => {
            setError(undefined)
            setLoading(true)
            setNotFound(false)
            if (slug) {
              fetchRecipe(slug)
                .then(setRecipe)
                .catch((err) => {
                  const message =
                    err instanceof Error ? err.message : 'Unknown error'
                  if (message.includes('404')) {
                    setNotFound(true)
                  } else {
                    setError(message)
                  }
                })
                .finally(() => setLoading(false))
            }
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!recipe) return null

  return (
    <article className={styles.page}>
      <Image
        src={`${IMAGE_BASE}/${recipe.coverImage.key}-medium.webp`}
        srcSet={`${IMAGE_BASE}/${recipe.coverImage.key}-medium.webp 800w, ${IMAGE_BASE}/${recipe.coverImage.key}-full.webp 1200w`}
        alt={recipe.coverImage.alt}
        priority
        maxWidth="var(--max-w-site)"
        className={styles.coverImage}
      />

      <Typography variant="heading1" className={styles.title}>{recipe.title}</Typography>

      <div className={styles.meta}>
        <span>{recipe.authorName}</span>
        <span className={styles.separator}>·</span>
        <time dateTime={recipe.createdAt}>{formatDate(recipe.createdAt)}</time>
      </div>

      <div className={styles.metaBar}>
        <span>Prep: {recipe.prepTime} min</span>
        <span className={styles.separator}>·</span>
        <span>Cook: {recipe.cookTime} min</span>
        <span className={styles.separator}>·</span>
        <span>Serves: {recipe.servings}</span>
      </div>

      <div className={styles.tags}>
        {recipe.tags.map((tag) => (
          <Link key={tag} to={`/recipes?tag=${tag}`} className={styles.tag}>
            {tag}
          </Link>
        ))}
      </div>

      <Typography variant="bodyLarge" className={styles.intro}>{recipe.intro}</Typography>

      <section>
        <Typography variant="heading2" className={styles.sectionHeading}>Ingredients</Typography>
        <RecipeIngredients ingredients={recipe.ingredients} />
      </section>

      <section>
        <Typography variant="heading2" className={styles.sectionHeading}>Method</Typography>
        <RecipeSteps steps={recipe.steps} />
      </section>
    </article>
  )
}

export default RecipeDetail
