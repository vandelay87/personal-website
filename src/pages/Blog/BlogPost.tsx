import Callout from '@components/Callout'
import CodeBlock from '@components/CodeBlock'
import FileTree from '@components/FileTree'
import Image from '@components/Image'
import Link from '@components/Link'
import Typography from '@components/Typography'
import NotFound from '@pages/NotFound'
import type { AnchorHTMLAttributes } from 'react'
import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import styles from './BlogPost.module.css'
import { getLazyPost, getPost } from './posts'

const BlogLink = ({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <Link to={href ?? '#'} underline>{children}</Link>
)

const mdxComponents = {
  pre: CodeBlock,
  a: BlogLink,
  Callout,
  Image,
  FileTree,
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined
  const PostContent = slug ? getLazyPost(slug) : undefined

  if (!post || !PostContent) {
    return <NotFound />
  }

  return (
    <article className={styles.article}>
      <Typography variant="heading1">{post.title}</Typography>
      <Typography variant="body">
        {post.date} - {post.readingTime} min read
      </Typography>
      <Suspense fallback={<Typography variant="body">Loading...</Typography>}>
        <PostContent components={mdxComponents} />
      </Suspense>
    </article>
  )
}
