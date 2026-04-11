import Button from '@components/Button'
import Grid from '@components/Grid'
import Loading from '@components/Loading'
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

  const [recipes, setRecipes] = useState<RecipeIndex[] | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleClearFilters = () => {
    setSearchParams({})
    setSearchQuery('')
  }

  const filteredRecipes = useMemo(
    () =>
      (recipes ?? []).filter((recipe) => {
        const matchesTag = !activeTag || recipe.tags.includes(activeTag)
        const matchesSearch =
          !searchQuery ||
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTag && matchesSearch
      }),
    [recipes, activeTag, searchQuery]
  )

  if (recipes === null && !error) {
    return (
      <>
        <Typography variant="heading1" className={styles.heading}>
          Recipes
        </Typography>
        <div className={styles.loadingWrapper}>
          <Loading />
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

  if (recipes !== null && recipes.length === 0) {
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

      <RecipeSearch value={searchQuery} onSearch={handleSearch} />
      <RecipeTagFilter
        tags={tags}
        activeTag={activeTag}
        onTagClick={handleTagClick}
      />

      <div role="status" aria-live="polite" className={styles.srOnly}>
        {filteredRecipes.length}{' '}
        {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
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
