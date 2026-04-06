import Button from '@components/Button'
import Typography from '@components/Typography'
import { Link, useSearchParams } from 'react-router-dom'
import styles from './Blog.module.css'
import { formatDate, posts } from './posts'

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
      <Typography variant="bodyLarge" className={styles.intro}>
        Thoughts on building things, technical deep-dives, and lessons learned along the way.
      </Typography>

      {filteredPosts.length === 0 ? (
        <div className={styles.empty}>
          <Typography variant="bodyLarge">
            No posts found for this tag.
          </Typography>
          <button
            onClick={() => setSearchParams({})}
            className={styles.clearLink}
          >
            Clear filter
          </button>
        </div>
      ) : (
        <ul className={styles.postList}>
          {filteredPosts.map((post) => (
            <li key={post.slug} className={styles.postCard}>
              <Typography variant="heading3" className={styles.postHeading}>
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
                  <Button
                    key={tag}
                    variant="secondary"
                    className={styles.tag}
                    ariaPressed={activeTag === tag ? 'true' : 'false'}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default Blog
