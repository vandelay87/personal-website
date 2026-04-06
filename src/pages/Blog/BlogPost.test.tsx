import { render, screen } from '@testing-library/react'
import { lazy } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import BlogPost from './BlogPost'

const LazyTestPost = lazy(() =>
  Promise.resolve({
    default: ({ components: _components }: { components?: Record<string, unknown> }) => (
      <div>MDX content here</div>
    ),
  })
)

vi.mock('./posts', () => ({
  getPost: (slug: string) => {
    if (slug === 'test-post') {
      return {
        title: 'Test Post',
        date: '2026-04-06',
        description: 'A test post.',
        tags: ['test'],
        slug: 'test-post',
        readingTime: 1,
      }
    }
    return undefined
  },
  getLazyPost: (slug: string) => {
    if (slug === 'test-post') {
      return LazyTestPost
    }
    return undefined
  },
}))

vi.mock('@pages/NotFound', () => ({
  default: () => <div data-testid="not-found">404</div>,
}))

function renderWithRoute(slug: string) {
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
    expect(screen.getByText('2026-04-06 - 1 min read')).toBeInTheDocument()
  })

  it('renders MDX content', async () => {
    renderWithRoute('test-post')
    expect(await screen.findByText('MDX content here')).toBeInTheDocument()
  })

  it('renders NotFound for invalid slug', () => {
    renderWithRoute('nonexistent')
    expect(screen.getByTestId('not-found')).toBeInTheDocument()
  })
})
