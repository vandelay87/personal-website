import NotFound from '@pages/NotFound'
import { Suspense, lazy, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getPost, loadPostContent } from './posts'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined
  const loader = slug ? loadPostContent(slug) : undefined

  const PostContent = useMemo(() => {
    if (!loader) return undefined
    return lazy(() => loader())
  }, [loader])

  if (!post || !PostContent) {
    return <NotFound />
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>
        {post.date} - {post.readingTime} min read
      </p>
      <Suspense fallback={<p>Loading...</p>}>
        <PostContent components={{}} />
      </Suspense>
    </article>
  )
}
