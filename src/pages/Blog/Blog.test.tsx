import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Blog from './Blog'

const mockPosts = vi.hoisted(() => ({
  value: [
    {
      title: 'Test Post',
      date: '2026-04-06',
      description: 'A test post.',
      tags: ['test'],
      slug: 'test-post',
      readingTime: 1,
    },
    {
      title: 'Second Post',
      date: '2026-03-01',
      description: 'Another post.',
      tags: ['misc'],
      slug: 'second-post',
      readingTime: 3,
    },
  ],
}))

vi.mock('./posts', () => ({
  get posts() {
    return mockPosts.value
  },
}))

describe('Blog', () => {
  it('renders the page heading', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' })
    ).toBeInTheDocument()
  })

  it('renders post titles as links', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: 'Test Post' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/blog/test-post')
  })

  it('renders reading time for each post', () => {
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    )
    expect(screen.getByText('- 1 min read')).toBeInTheDocument()
    expect(screen.getByText('- 3 min read')).toBeInTheDocument()
  })

  it('renders coming soon message when no posts', () => {
    const original = mockPosts.value
    mockPosts.value = []
    render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>
    )
    expect(screen.getByText('Posts coming soon')).toBeInTheDocument()
    mockPosts.value = original
  })
})
