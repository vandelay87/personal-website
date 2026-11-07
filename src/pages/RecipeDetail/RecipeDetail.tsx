import { Button, Loading } from '@akli-dev/ui'
import { fetchRecipe } from '@api/recipes'
import RecipeDetailView from '@components/RecipeDetailView'
import { RecipeDataContext } from '@contexts/RecipeDataContext'
import type { Recipe } from '@models/recipe'
import NotFound from '@pages/NotFound'
import { useContext, useEffect, useState, type FC } from 'react'
import { useParams } from 'react-router-dom'

import styles from './RecipeDetail.module.css'

// SSR data is read once on hydration and stays in context for the whole
// session, so it only describes the recipe whose slug it carries. After a
// client-side navigation to another slug it must be ignored.
const RecipeDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { recipe: ssrData } = useContext(RecipeDataContext)
  const ssrRecipe = ssrData && ssrData.slug === slug ? ssrData : undefined

  // Keyed by slug so loading/error state never leaks between recipes.
  return <RecipeDetailContent key={slug} slug={slug} ssrRecipe={ssrRecipe} />
}

interface RecipeDetailContentProps {
  slug: string | undefined
  ssrRecipe: Recipe | undefined
}

const RecipeDetailContent: FC<RecipeDetailContentProps> = ({ slug, ssrRecipe }) => {

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
          variant="outline"
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

  return <RecipeDetailView recipe={recipe} />
}

export default RecipeDetail
