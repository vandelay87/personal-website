import Callout from '@components/Callout'
import CodeBlock from '@components/CodeBlock'
import FileTree from '@components/FileTree'
import Image from '@components/Image'
import Link from '@components/Link'
import Tag from '@components/Tag'
import Typography from '@components/Typography'
import NotFound from '@pages/NotFound'
import type { AnchorHTMLAttributes } from 'react'
import { Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styles from './BlogPost.module.css'
import { formatDate, getLazyPost, getPost, posts } from './posts'
import type { PostMeta } from './posts'

const BlogLink = ({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <Link to={href ?? '#'} tone="accent">{children}</Link>
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

  const relatedPosts = useMemo(
    () => (post ? getRelatedPosts(post, posts) : []),
    [post]
  )

  if (!post || !PostContent) {
    return <NotFound />
  }

  const shareUrl = encodeURIComponent(`https://akli.dev/blog/${post.slug}`)
  const shareText = encodeURIComponent(post.title)
  const twitterHref = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`

  const showRelated = posts.length > 1

  return (
    <article className={styles.article}>
      <Link
        to="/blog"
        icon="←"
        iconSide="left"
        nudge="left"
        className={styles.backLink}
      >
        All posts
      </Link>

      <header className={styles.header}>
        <p className={styles.meta}>
          {formatDate(post.date)} <span aria-hidden="true">·</span>{' '}
          {post.readingTime} min read
        </p>
        <Typography variant="heading1" className={styles.title}>
          {post.title}
        </Typography>
        <ul className={styles.tags}>
          {post.tags.map((tag) => (
            <li key={tag}>
              <Tag as="a" to={`/blog?tag=${tag}`}>
                {tag}
              </Tag>
            </li>
          ))}
        </ul>
      </header>

      <div className={styles.prose}>
        <Suspense fallback={<Typography variant="body">Loading...</Typography>}>
          <PostContent components={mdxComponents} />
        </Suspense>
      </div>

      <section className={styles.shareSection} aria-label="Share this post">
        <div className={styles.sectionLabel}>Share this post</div>
        <div className={styles.shareLinks}>
          <a
            href={twitterHref}
            target="_blank"
            rel="noreferrer"
            className={styles.shareLink}
          >
            Share on X
          </a>
          <a
            href={linkedinHref}
            target="_blank"
            rel="noreferrer"
            className={styles.shareLink}
          >
            Share on LinkedIn
          </a>
        </div>
      </section>

      {showRelated && (
        <section className={styles.relatedSection} aria-label="Related posts">
          <div className={styles.sectionLabel}>Related posts</div>
          <ul className={styles.relatedGrid}>
            {relatedPosts.map((rp) => (
              <li key={rp.slug}>
                <Link to={`/blog/${rp.slug}`} className={styles.relatedCard}>
                  <div className={styles.relatedMeta}>
                    {formatDate(rp.date)} <span aria-hidden="true">·</span>{' '}
                    {rp.readingTime} min read
                  </div>
                  <div className={styles.relatedTitle}>{rp.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

export default BlogPost
