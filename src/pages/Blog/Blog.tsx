import Typography from '@components/Typography'
import { Link, useSearchParams } from 'react-router-dom'
import styles from './Blog.module.css'
import { posts } from './posts'

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')

  const filteredPosts = activeTag
    ? posts.filter((post) => post.tags.includes(activeTag))
    : posts

  function handleTagClick(tag: string) {
    if (activeTag === tag) {
      setSearchParams({})
    } else {
      setSearchParams({ tag })
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (posts.length === 0) {
    return (
      <>
        <Typography variant="heading1">Blog</Typography>
        <Typography variant="bodyLarge">Posts coming soon</Typography>
      </>
    )
  }

  return (
    <>
      <Typography variant="heading1" className={styles.heading}>
        Blog
      </Typography>

      {filteredPosts.length === 0 ? (
        <div className={styles.empty}>
          <Typography variant="bodyLarge">
            No posts found for this tag.
          </Typography>
          <Link to="/blog" className={styles.clearLink}>
            Clear filter
          </Link>
        </div>
      ) : (
        <ul className={styles.postList}>
          {filteredPosts.map((post) => (
            <li key={post.slug} className={styles.postCard}>
              <Typography variant="heading3">
                <Link to={`/blog/${post.slug}`} className={styles.postTitle}>
                  {post.title}
                </Link>
              </Typography>
              <div className={styles.meta}>
                <span>{formatDate(post.date)}</span>
                <span className={styles.separator}>·</span>
                <span>{post.readingTime} min read</span>
              </div>
              <p className={styles.description}>{post.description}</p>
              <div className={styles.tags}>
                {post.tags.map((tag) => (
                  <button
                    key={tag}
                    className={styles.tag}
                    aria-pressed={activeTag === tag}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
