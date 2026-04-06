import Callout from '@components/Callout'
import CodeBlock from '@components/CodeBlock'
import FileTree from '@components/FileTree'
import Image from '@components/Image'
import Link from '@components/Link'
import Typography from '@components/Typography'
import NotFound from '@pages/NotFound'
import type { AnchorHTMLAttributes } from 'react'
import { Suspense } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import styles from './BlogPost.module.css'
import { formatDate, getLazyPost, getPost, posts } from './posts'
import type { PostMeta } from './posts'

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

const getRelatedPosts = (current: PostMeta, allPosts: PostMeta[]): PostMeta[] => {
  const others = allPosts.filter((p) => p.slug !== current.slug)

  const scored = others.map((p) => {
    const overlap = p.tags.filter((t) => current.tags.includes(t)).length
    return { post: p, overlap }
  })

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
  })

  return scored.slice(0, 3).map((s) => s.post)
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined
  const PostContent = slug ? getLazyPost(slug) : undefined

  if (!post || !PostContent) {
    return <NotFound />
  }

  const shareUrl = encodeURIComponent(`https://akli.dev/blog/${post.slug}`)
  const shareText = encodeURIComponent(post.title)
  const twitterHref = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`

  const relatedPosts = getRelatedPosts(post, posts)
  const showRelated = posts.length > 1

  return (
    <article className={styles.article}>
      <Typography variant="heading1">{post.title}</Typography>
      <Typography variant="body">
        {formatDate(post.date)} - {post.readingTime} min read
      </Typography>
      <div className={styles.tags}>
        {post.tags.map((tag) => (
          <RouterLink key={tag} to={`/blog?tag=${tag}`} className={styles.tag}>{tag}</RouterLink>
        ))}
      </div>
      <Suspense fallback={<Typography variant="body">Loading...</Typography>}>
        <PostContent components={mdxComponents} />
      </Suspense>

      <section className={styles.shareSection} aria-label="Share this post">
        <Typography variant="heading3" as="h2">Share this post</Typography>
        <div className={styles.shareLinks}>
          <a
            href={twitterHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on X"
            className={styles.shareLink}
          >
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={linkedinHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on LinkedIn"
            className={styles.shareLink}
          >
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM2 9h6v12H2zM10 9h5.6v1.8h.1c.8-1.4 2.8-2 4.3-2 4.6 0 5.5 3 5.5 6.8V21h-6v-5.2c0-1.2 0-2.7-1.6-2.7s-1.8 1.3-1.8 2.6V21h-6z" />
            </svg>
          </a>
        </div>
      </section>

      {showRelated && (
        <section className={styles.relatedSection}>
          <Typography variant="heading3" as="h2">Related Posts</Typography>
          <div className={styles.relatedGrid}>
            {relatedPosts.map((rp) => (
              <Link key={rp.slug} to={`/blog/${rp.slug}`} className={styles.relatedCard}>
                  <Typography variant="heading4" as="h3">{rp.title}</Typography>
                  <Typography variant="body">
                    {formatDate(rp.date)} · {rp.readingTime} min read
                  </Typography>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

export default BlogPost
