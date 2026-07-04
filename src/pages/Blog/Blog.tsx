import Tag from '@components/Tag'
import Typography from '@components/Typography'
import type { FC } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { pluralize } from '../../utils/pluralize'
import styles from './Blog.module.css'
import { formatDate, posts } from './posts'

const ALL_TAGS = Array.from(new Set(posts.flatMap((post) => post.tags)))

interface TagChipProps {
  tag: string
  activeTag: string | null
  onSelect: (tag: string) => void
}

const TagChip: FC<TagChipProps> = ({ tag, activeTag, onSelect }) => (
  <Tag as="button" active={activeTag === tag} onClick={() => onSelect(tag)}>
    {tag}
  </Tag>
)

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')

  const filteredPosts = activeTag
    ? posts.filter((post) => post.tags.includes(activeTag))
    : posts

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setSearchParams({})
    } else {
      setSearchParams({ tag })
    }
  }

  const clearFilter = () => setSearchParams({})

  const countLabel = activeTag
    ? `${pluralize(filteredPosts.length, 'post')} tagged ${activeTag}`
    : pluralize(posts.length, 'post')

  if (posts.length === 0) {
    return (
      <section className={styles.hero}>
        <Typography variant="caption" as="p" className={styles.eyebrow}>
          The blog
        </Typography>
        <Typography variant="heading1">Blog</Typography>
        <Typography variant="bodyLarge">Posts coming soon.</Typography>
      </section>
    )
  }

  return (
    <>
      <section className={styles.hero}>
        <Typography variant="caption" as="p" className={styles.eyebrow}>
          The blog
        </Typography>
        <Typography variant="heading1" className={styles.heading}>
          Blog
        </Typography>
        <Typography variant="bodyLarge" className={styles.intro}>
          Thoughts on building things, technical deep-dives, and lessons
          learned along the way.
        </Typography>
      </section>

      <div className={styles.countRow}>
        <span aria-live="polite">{countLabel}</span>
        {activeTag && filteredPosts.length > 0 && (
          <button type="button" onClick={clearFilter} className={styles.clearLink}>
            ✕ Clear filter
          </button>
        )}
      </div>

      <div role="group" aria-label="Filter posts by tag" className={styles.filterBar}>
        <Tag as="button" active={!activeTag} onClick={clearFilter}>
          All
        </Tag>
        {ALL_TAGS.map((tag) => (
          <TagChip key={tag} tag={tag} activeTag={activeTag} onSelect={handleTagClick} />
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className={styles.empty}>
          <Typography variant="bodyLarge">
            No posts found for this tag.
          </Typography>
          <button type="button" onClick={clearFilter} className={styles.clearLink}>
            Clear filter
          </button>
        </div>
      ) : (
        <ul className={styles.postList}>
          {filteredPosts.map((post) => (
            <li key={post.slug}>
              <article className={styles.postCard}>
                <Typography variant="heading3" as="h2" className={styles.postHeading}>
                  <Link to={`/blog/${post.slug}`} className={styles.postTitle}>
                    {post.title}
                  </Link>
                </Typography>
                <div className={styles.meta}>
                  <span>{formatDate(post.date)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.readingTime} min read</span>
                </div>
                <p className={styles.description}>{post.description}</p>
                <ul className={styles.tags}>
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <TagChip tag={tag} activeTag={activeTag} onSelect={handleTagClick} />
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default Blog
