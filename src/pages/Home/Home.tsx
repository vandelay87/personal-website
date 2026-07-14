import { fetchRecipes } from '@api/recipes'
import Grid from '@components/Grid'
import Image from '@components/Image'
import Link from '@components/Link'
import RecipeCard from '@components/RecipeCard'
import Typography from '@components/Typography'
import type { RecipeIndex } from '@models/recipe'
import { useEffect, useState, type FC, type ReactNode } from 'react'
import cvFileUrl from '../../assets/Akli-Aissat-CV.pdf'
import profileImgSrc from '../../assets/profile.webp'
import profileImgSrcSet from '../../assets/profile.webp?w=150;200;300;400&format=webp&as=srcset'
import { formatDate, posts } from '../Blog/posts'
import styles from './Home.module.css'

const MAX_KITCHEN_RECIPES = 3

interface LinkRow {
  title: string
  description: string
  href: string
}

const APPS_ROWS: LinkRow[] = [
  {
    title: 'Pokedex',
    description:
      'A searchable encyclopedia of Gen 1 Pokemon, styled after the classic Game Boy Color Pokedex.',
    href: 'https://akli.dev/apps/pokedex',
  },
  {
    title: 'Sand box',
    description:
      'A real-time particle physics simulation of falling sand grains on a black canvas.',
    href: 'https://akli.dev/apps/sand-box',
  },
]

const BLOG_ROWS: LinkRow[] = posts.slice(0, 2).map((post) => ({
  title: post.title,
  description: `${formatDate(post.date)} · ${post.readingTime} min read`,
  href: `/blog/${post.slug}`,
}))

interface LinkSectionProps {
  headingId: string
  eyebrow: string
  allHref: string
  rows: LinkRow[]
}

const LinkSection: FC<LinkSectionProps> = ({ headingId, eyebrow, allHref, rows }) => (
  <section className={styles.linkSection} aria-labelledby={headingId}>
    <div className={styles.sectionHeader}>
      <Typography
        variant="label"
        as="h2"
        id={headingId}
        className={styles.sectionHeading}
      >
        {eyebrow}
      </Typography>
      <Link to={allHref} icon="↗" nudge="right" rotateIcon className={styles.sectionAll}>
        All
      </Link>
    </div>
    <ul className={styles.rowList}>
      {rows.map((row) => (
        <li key={row.href}>
          <Link to={row.href} icon="↗" nudge="up-right" className={styles.row}>
            <span>
              <Typography variant="heading4" as="h3" className={styles.rowTitle}>
                {row.title}
              </Typography>
              <Typography variant="body" as="p" className={styles.rowSub}>
                {row.description}
              </Typography>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </section>
)

const Divider = (): ReactNode => <hr className={styles.divider} aria-hidden="true" />

const Home: FC = () => {
  const [recipes, setRecipes] = useState<RecipeIndex[]>([])

  useEffect(() => {
    let cancelled = false
    fetchRecipes()
      .then((data) => {
        if (!cancelled) setRecipes(data.slice(0, MAX_KITCHEN_RECIPES))
      })
      .catch(() => {
        // Loading/empty/error all render the same way here: no kitchen
        // section. This is a homepage teaser, not the Recipes page itself.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className={styles.hero}>
        <Image
          src={profileImgSrc}
          srcSet={profileImgSrcSet}
          alt="Portrait of Akli Aissat"
          priority
          lazy={false}
          aspectRatio="1/1"
          objectPosition="50% 10%"
          containerClassName={styles.photo}
          className={styles.photoImage}
        />
        <Typography variant="heading1" className={styles.heading}>
          Akli Aissat
        </Typography>
        <Typography variant="bodyLarge" as="p" className={styles.role}>
          Full-stack engineer
        </Typography>
        <Typography variant="body" as="p" className={styles.bio}>
          I build beautiful, responsive web applications with React,
          TypeScript, and modern web technologies — with a focus on
          accessible, user-friendly experiences.
        </Typography>
        <div className={styles.ctaRow}>
          <a
            className={`${styles.cta} ${styles.ctaOutline}`}
            href={cvFileUrl}
            download="Akli-Aissat-CV.pdf"
          >
            Download CV
          </a>
        </div>
      </section>

      <Divider />

      <LinkSection
        headingId="apps-section-heading"
        eyebrow="Apps & experiments"
        allHref="/apps"
        rows={APPS_ROWS}
      />

      {recipes.length > 0 && (
        <>
          <Divider />

          <section className={styles.kitchenSection} aria-labelledby="kitchen-section-heading">
            <div className={styles.kitchenIntro}>
              <Typography variant="caption" as="p" className={styles.kitchenKicker}>
                From the kitchen
              </Typography>
              <Typography
                variant="heading2"
                as="h2"
                id="kitchen-section-heading"
                className={styles.kitchenHeading}
              >
                Lately I&apos;ve been cooking.
              </Typography>
              <Typography variant="body" as="p" className={styles.kitchenText}>
                A small, growing collection of recipes I keep coming back to —
                written down so they&apos;re easy to make again.
              </Typography>
            </div>
            <Grid minWidth="sm" className={styles.recipeGridSpacing}>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} eager hideTags />
              ))}
            </Grid>
            <div className={styles.browseAll}>
              <Link
                to="/recipes"
                icon="↗"
                nudge="right"
                rotateIcon
                variant="solid"
                className={styles.cta}
              >
                Browse all recipes
              </Link>
            </div>
          </section>
        </>
      )}

      <Divider />

      <LinkSection
        headingId="blog-section-heading"
        eyebrow="The blog"
        allHref="/blog"
        rows={BLOG_ROWS}
      />
    </>
  )
}

export default Home
