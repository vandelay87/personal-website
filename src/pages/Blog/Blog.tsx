import Typography from '@components/Typography'
import { Link } from 'react-router-dom'
import { posts } from './posts'

export default function Blog() {
  return (
    <>
      <Typography variant="heading1">Blog</Typography>
      {posts.length === 0 ? (
        <Typography variant="bodyLarge">Posts coming soon</Typography>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              <span> - {post.readingTime} min read</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
