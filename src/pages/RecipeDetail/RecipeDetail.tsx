import { fetchRecipe } from '@api/recipes'
import Button from '@components/Button'
import Image from '@components/Image'
import Loading from '@components/Loading'
import RecipeIngredients from '@components/RecipeIngredients'
import RecipeSteps from '@components/RecipeSteps'
import Typography from '@components/Typography'
import { RecipeDataContext } from '@contexts/RecipeDataContext'
import { RECIPE_IMAGE_BASE, type Recipe } from '@models/recipe'
import NotFound from '@pages/NotFound'
import { useContext, useEffect, useState, type FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import styles from './RecipeDetail.module.css'


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
      <div className={styles.loading}>
        <Loading />
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
        src={`${RECIPE_IMAGE_BASE}/${recipe.coverImage.key}-medium.webp`}
        srcSet={`${RECIPE_IMAGE_BASE}/${recipe.coverImage.key}-medium.webp 800w, ${RECIPE_IMAGE_BASE}/${recipe.coverImage.key}-full.webp 1200w`}
        alt={recipe.coverImage.alt}
        priority
        maxWidth="var(--max-w-site)"
        className={styles.coverImage}
        containerClassName={styles.coverImageWrapper}
      />

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
}

export default RecipeDetail
