import { fetchRecipes, fetchTags } from '@api/recipes'
import Button from '@components/Button'
import Grid from '@components/Grid'
import Loading from '@components/Loading'
import RecipeCard from '@components/RecipeCard'
import RecipeSearch from '@components/RecipeSearch'
import RecipeTagFilter from '@components/RecipeTagFilter'
import Tag from '@components/Tag'
import Typography from '@components/Typography'
import type { RecipeIndex, Tag as TagModel } from '@models/recipe'
import { useState, useEffect, useCallback, useMemo, type FC, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { pluralize } from '../../utils/pluralize'
import styles from './Recipes.module.css'

const RecipesHero: FC<{ intro?: ReactNode }> = ({ intro }) => (
  <section className={styles.hero}>
    <Typography variant="caption" as="p" className={styles.eyebrow}>
      From the Kitchen
    </Typography>
    <Typography variant="heading1" className={styles.heading}>
      The meals I cook on repeat.
    </Typography>
    {intro && (
      <Typography variant="bodyLarge" className={styles.intro}>
        {intro}
      </Typography>
    )}
  </section>
)

const Recipes: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')

  const [recipes, setRecipes] = useState<RecipeIndex[] | null>(null)
  const [tags, setTags] = useState<TagModel[]>([])
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setError(false)
    try {
      const [recipesData, tagsData] = await Promise.all([
        fetchRecipes(),
        fetchTags(),
      ])
      setRecipes(recipesData)
      setTags(tagsData)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setSearchParams({})
    } else {
      setSearchParams({ tag })
    }
  }

  const handleClearTag = () => setSearchParams({})

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleClearFilters = () => {
    setSearchParams({})
    setSearchQuery('')
  }

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return (recipes ?? []).filter((recipe) => {
      const matchesTag = !activeTag || recipe.tags.includes(activeTag)
      const matchesSearch =
        !searchQuery ||
        recipe.title.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query))
      return matchesTag && matchesSearch
    })
  }, [recipes, activeTag, searchQuery])

  if (recipes === null && !error) {
    return (
      <>
        <RecipesHero />
        <div className={styles.loadingWrapper}>
          <Loading />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <RecipesHero />
        <div className={styles.empty}>
          <Typography variant="bodyLarge">
            Something went wrong loading recipes.
          </Typography>
          <Button variant="outline" onClick={loadData}>
            Retry
          </Button>
        </div>
      </>
    )
  }

  if (recipes !== null && recipes.length === 0) {
    return <RecipesHero intro="Recipes coming soon." />
  }

  return (
    <div className={styles.page}>
      <RecipesHero
        intro={
          <>
            A small, growing collection of recipes I cook on repeat — written
            down so they&apos;re easy to make again. Tried, refined, and worth
            the effort.
          </>
        }
      />

      <div className={styles.countRow}>
        <span role="status" aria-live="polite">
          {pluralize(filteredRecipes.length, 'recipe')}
        </span>
      </div>

      <RecipeSearch value={searchQuery} onSearch={handleSearch} />
      <RecipeTagFilter
        tags={tags}
        activeTag={activeTag}
        onTagClick={handleTagClick}
        onClear={handleClearTag}
      />

      {filteredRecipes.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyMessage}>Nothing in the kitchen matches that.</p>
          <Tag as="button" onClick={handleClearFilters}>
            ✕ clear filters
          </Tag>
        </div>
      ) : (
        <Grid columns={3}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} hideTags />
          ))}
        </Grid>
      )}
    </div>
  )
}

export default Recipes
