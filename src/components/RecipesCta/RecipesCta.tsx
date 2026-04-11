import Grid from '@components/Grid'
import Link from '@components/Link'
import RecipeCard from '@components/RecipeCard'
import Typography from '@components/Typography'
import { FC, useEffect, useState } from 'react'
import { fetchRecipes } from '../../api/recipes'
import type { RecipeIndex } from '../../types/recipe'
import styles from './RecipesCta.module.css'

type Status = 'loading' | 'loaded' | 'empty' | 'error'

const MAX_RECIPES = 3

const RecipesCta: FC = () => {
  const [recipes, setRecipes] = useState<RecipeIndex[]>([])
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    fetchRecipes()
      .then((data) => {
        const latest = data.slice(0, MAX_RECIPES)
        if (latest.length === 0) {
          setStatus('empty')
        } else {
          setRecipes(latest)
          setStatus('loaded')
        }
      })
      .catch(() => {
        setStatus('error')
      })
  }, [])

  if (status !== 'loaded') {
    return null
  }

  return (
    <section className={styles.section} aria-labelledby="recipes-section-title">
      <div className={styles.inner}>
        <Typography variant="heading2" id="recipes-section-title" className={styles.heading}>
          Favourite Recipes
        </Typography>
        <Grid columns={3}>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} eager hideTags hideMeta />
          ))}
        </Grid>
        <Typography variant="bodyLarge" className={styles.body}>
          A collection of my favourite recipes. Browse all{' '}
          <Link to="/recipes" underline={true}>
            recipes
          </Link>
          .
        </Typography>
      </div>
    </section>
  )
}

export default RecipesCta
