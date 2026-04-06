import { render, screen, within } from '@testing-library/react'
import React, { lazy } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import BlogPost from './BlogPost'
import type { PostMeta } from './posts'

const mockPosts = vi.hoisted(() => {
  const posts: PostMeta[] = [
    {
      title: 'Test Post',
      date: '2026-04-06',
      description: 'A test post.',
      tags: ['react', 'aws'],
      slug: 'test-post',
      readingTime: 3,
    },
    {
      title: 'Second Post',
      date: '2026-04-05',
      description: 'A second post.',
      tags: ['react', 'typescript'],
      slug: 'second-post',
      readingTime: 5,
    },
    {
      title: 'Third Post',
      date: '2026-04-04',
      description: 'A third post.',
      tags: ['aws', 'cdk'],
      slug: 'third-post',
      readingTime: 4,
    },
    {
      title: 'Unrelated Post',
      date: '2026-04-03',
      description: 'An unrelated post.',
      tags: ['python', 'django'],
      slug: 'unrelated-post',
      readingTime: 2,
    },
  ]
  return posts
})

const createLazyPost = (content: string, hasExternalLink = false) =>
  lazy(() =>
    Promise.resolve({
      default: ({ components }: { components?: Record<string, unknown> }) => {
        const LinkComponent = components?.a as React.ComponentType<{
          href: string
          children: React.ReactNode
        }> | undefined
        return (
          <div>
            {content}
            {hasExternalLink && LinkComponent && (
              <LinkComponent href="https://external.com">External Link</LinkComponent>
            )}
          </div>
        )
      },
    })
  )

vi.mock('./posts', () => ({
  posts: mockPosts,
  getPost: (slug: string) => mockPosts.find((p: PostMeta) => p.slug === slug),
  getLazyPost: (slug: string) => {
    const post = mockPosts.find((p: PostMeta) => p.slug === slug)
    if (!post) return undefined
    if (slug === 'test-post') return createLazyPost('MDX content here', true)
    return createLazyPost(`Content for ${post.title}`)
  },
}))

vi.mock('@pages/NotFound', () => ({
  default: () => <div data-testid="not-found">404</div>,
}))

const renderWithRoute = (slug: string) => {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BlogPost', () => {
  it('renders post title for valid slug', async () => {
    renderWithRoute('test-post')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Test Post' })
    ).toBeInTheDocument()
  })

  it('renders post metadata', () => {
    renderWithRoute('test-post')
    expect(screen.getByText(/2026-04-06/)).toBeInTheDocument()
    expect(screen.getByText(/3 min read/)).toBeInTheDocument()
  })

  it('renders MDX content', async () => {
    renderWithRoute('test-post')
    expect(await screen.findByText('MDX content here')).toBeInTheDocument()
  })

  it('renders NotFound for invalid slug', () => {
    renderWithRoute('nonexistent')
    expect(screen.getByTestId('not-found')).toBeInTheDocument()
  })

  describe('tags', () => {
    it('displays tags in the post header', () => {
      renderWithRoute('test-post')
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('aws')).toBeInTheDocument()
    })
  })

  describe('social share links', () => {
    it('renders Twitter/X share link with correct aria-label', async () => {
      renderWithRoute('test-post')
      await screen.findByText('MDX content here')
      const twitterLink = screen.getByRole('link', { name: /share on (twitter|x)/i })
      expect(twitterLink).toBeInTheDocument()
    })

    it('renders LinkedIn share link with correct aria-label', async () => {
      renderWithRoute('test-post')
      await screen.findByText('MDX content here')
      const linkedinLink = screen.getByRole('link', { name: /share on linkedin/i })
      expect(linkedinLink).toBeInTheDocument()
    })

    it('Twitter share link contains post title and URL', async () => {
      renderWithRoute('test-post')
      await screen.findByText('MDX content here')
      const twitterLink = screen.getByRole('link', { name: /share on (twitter|x)/i })
      const href = twitterLink.getAttribute('href') ?? ''
      expect(href).toContain(encodeURIComponent('Test Post'))
      expect(href).toContain(encodeURIComponent('/blog/test-post'))
    })

    it('LinkedIn share link contains post URL', async () => {
      renderWithRoute('test-post')
      await screen.findByText('MDX content here')
      const linkedinLink = screen.getByRole('link', { name: /share on linkedin/i })
      const href = linkedinLink.getAttribute('href') ?? ''
      expect(href).toContain(encodeURIComponent('/blog/test-post'))
    })
  })

  describe('related posts', () => {
    it('shows related posts with overlapping tags', async () => {
      renderWithRoute('test-post')
      await screen.findByText('MDX content here')
      // test-post has tags ['react', 'aws']
      // second-post shares 'react', third-post shares 'aws'
      expect(screen.getByText('Second Post')).toBeInTheDocument()
      expect(screen.getByText('Third Post')).toBeInTheDocument()
    })

    it('excludes the current post from related posts', async () => {
      renderWithRoute('test-post')
      await screen.findByText('MDX content here')
      const relatedHeading = screen.getByRole('heading', { name: /related posts/i })
      const relatedSection = relatedHeading.closest('section') ?? relatedHeading.parentElement!
      expect(within(relatedSection).queryByText('Test Post')).not.toBeInTheDocument()
    })

    it('falls back to most recent posts when no tag overlap', async () => {
      renderWithRoute('unrelated-post')
      await screen.findByText('Content for Unrelated Post')
      // unrelated-post has tags ['python', 'django'] — no overlap with others
      // Should fall back to most recent posts (excluding current)
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })

    it('hides related posts when only one post exists', async () => {
      // Override mock to have only one post
      const original = [...mockPosts]
      mockPosts.length = 0
      mockPosts.push(original[0])

      renderWithRoute('test-post')
      await screen.findByText('MDX content here')
      expect(screen.queryByRole('heading', { name: /related posts/i })).not.toBeInTheDocument()

      // Restore
      mockPosts.length = 0
      mockPosts.push(...original)
    })
  })

  describe('external links', () => {
    it('opens external links in new tab with rel="noreferrer"', async () => {
      renderWithRoute('test-post')
      const externalLink = await screen.findByText('External Link')
      expect(externalLink.closest('a')).toHaveAttribute('target', '_blank')
      expect(externalLink.closest('a')).toHaveAttribute('rel', 'noreferrer')
    })
  })
})
