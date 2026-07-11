import Tag from '@components/Tag'
import Typography from '@components/Typography'
import type { FC } from 'react'
import { useMemo } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
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

  const filteredPosts = useMemo(
    () => (activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts),
    [activeTag]
  )

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setSearchParams({})
    } else {
      setSearchParams({ tag })
    }
  }

  const clearFilter = () => setSearchParams({})

  const countLabel = pluralize(filteredPosts.length, 'post')

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
          Thoughts on building things, technical deep-dives, and the lessons
          you only learn the hard way. I write these mostly to document how
          I solved a problem, in case it&apos;s useful to someone hitting the
          same wall — or to me, six months from now.
        </Typography>
      </section>

      <div className={styles.countRow}>
        <span aria-live="polite">
          {countLabel}
          {activeTag && (
            <>
              {' tagged '}
              <span className={styles.activeTagName}>{activeTag}</span>
            </>
          )}
        </span>
        {activeTag && filteredPosts.length > 0 && (
          <button type="button" onClick={clearFilter} className={styles.clearLink}>
            ✕ clear
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
          <p className={styles.emptyMessage}>
            No posts tagged <span className={styles.emptyTagName}>{activeTag}</span> yet.
          </p>
          <button type="button" onClick={clearFilter} className={styles.showAllLink}>
            Show all posts
          </button>
        </div>
      ) : (
        // Safari/VoiceOver drops list semantics from a <ul>/<li> pair once
        // `list-style: none` is applied anywhere in it; role="list" (paired
        // with role="listitem" below) restores it explicitly.
        // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above
        <ul className={styles.postList} role="list">
          {filteredPosts.map((post) => (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment on the <ul> above
            <li key={post.slug} role="listitem">
              <article className={styles.postCard}>
                <RouterLink to={`/blog/${post.slug}`} className={styles.postLink}>
                  <div className={styles.meta}>
                    <span>{formatDate(post.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                  <div className={styles.titleRow}>
                    <Typography variant="heading3" as="h2" className={styles.postTitle}>
                      {post.title}
                    </Typography>
                    <span className={styles.arrowIcon} aria-hidden="true">
                      ↗
                    </span>
                  </div>
                  <p className={styles.description}>{post.description}</p>
                </RouterLink>
                {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- .tags sets list-style: none, which drops implicit list semantics in Safari/VoiceOver; role="list" (paired with role="listitem" below) restores it */}
                <ul className={styles.tags} role="list">
                  {post.tags.map((tag) => (
                    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment on the <ul> above
                    <li key={tag} role="listitem">
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
