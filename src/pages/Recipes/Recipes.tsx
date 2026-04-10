import Button from '@components/Button'
import Grid from '@components/Grid'
import Typography from '@components/Typography'
import { useState, useEffect, useCallback, useMemo, type FC } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchRecipes, fetchTags } from '../../api/recipes'
import RecipeCard from '../../components/RecipeCard'
import RecipeSearch from '../../components/RecipeSearch'
import RecipeTagFilter from '../../components/RecipeTagFilter'
import type { RecipeIndex, Tag } from '../../types/recipe'
import styles from './Recipes.module.css'

const Recipes: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')

  const [recipes, setRecipes] = useState<RecipeIndex[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setShowSkeleton(false)
    setError(false)
    try {
      const [recipesData, tagsData] = await Promise.all([fetchRecipes(), fetchTags()])
      setRecipes(recipesData)
      setTags(tagsData)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setShowSkeleton(true), 200)
    return () => clearTimeout(timer)
  }, [loading])

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setSearchParams({})
    } else {
      setSearchParams({ tag })
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleClearFilters = () => {
    setSearchParams({})
    setSearchQuery('')
  }

  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) => {
        const matchesTag = !activeTag || recipe.tags.includes(activeTag)
        const matchesSearch =
          !searchQuery ||
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTag && matchesSearch
      }),
    [recipes, activeTag, searchQuery],
  )

  if (loading) {
    if (!showSkeleton) return null
    return (
      <>
        <Typography variant="heading1" className={styles.heading}>
          Recipes
        </Typography>
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={styles.skeleton}
              role="status"
              aria-label="Loading"
            />
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Typography variant="heading1" className={styles.heading}>
          Recipes
        </Typography>
        <div className={styles.empty}>
          <Typography variant="bodyLarge">
            Something went wrong loading recipes.
          </Typography>
          <Button variant="secondary" onClick={loadData}>
            Retry
          </Button>
        </div>
      </>
    )
  }

  if (recipes.length === 0) {
    return (
      <>
        <Typography variant="heading1" className={styles.heading}>
          Recipes
        </Typography>
        <Typography variant="bodyLarge">Recipes coming soon</Typography>
      </>
    )
  }

  return (
    <>
      <Typography variant="heading1" className={styles.heading}>
        Recipes
      </Typography>
      <Typography variant="bodyLarge" className={styles.intro}>
        A collection of tried-and-tested recipes from my kitchen.
      </Typography>

      <RecipeSearch onSearch={handleSearch} />
      <RecipeTagFilter tags={tags} activeTag={activeTag} onTagClick={handleTagClick} />

      <div role="status" aria-live="polite" className={styles.srOnly}>
        {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
      </div>

      {filteredRecipes.length === 0 ? (
        <div className={styles.empty}>
          <Typography variant="bodyLarge">No recipes found</Typography>
          <Button variant="secondary" onClick={handleClearFilters}>
            Clear filter
          </Button>
        </div>
      ) : (
        <Grid columns={3}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </Grid>
      )}
    </>
  )
}

export default Recipes
