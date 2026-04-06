import Typography from '@components/Typography'
import NotFound from '@pages/NotFound'
import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { getLazyPost, getPost } from './posts'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined
  const PostContent = slug ? getLazyPost(slug) : undefined

  if (!post || !PostContent) {
    return <NotFound />
  }

  return (
    <article>
      <Typography variant="heading1">{post.title}</Typography>
      <Typography variant="body">
        {post.date} - {post.readingTime} min read
      </Typography>
      <Suspense fallback={<Typography variant="body">Loading...</Typography>}>
        <PostContent components={{}} />
      </Suspense>
    </article>
  )
}
