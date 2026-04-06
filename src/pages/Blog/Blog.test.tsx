import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Blog from './Blog'

const mockPosts = vi.hoisted(() => ({
  value: [
    {
      title: 'Building a Pokedex with React and AWS',
      date: '2026-04-06',
      description:
        'How I built a searchable Pokemon encyclopedia with React 19, AWS CDK, DynamoDB, and Lambda.',
      tags: ['react', 'aws', 'cdk'],
      slug: 'building-a-pokedex',
      readingTime: 8,
    },
    {
      title: 'CDK Custom Resources Deep Dive',
      date: '2026-03-15',
      description:
        'A deep dive into AWS CDK custom resources and providers.',
      tags: ['aws', 'cdk'],
      slug: 'cdk-custom-resources',
      readingTime: 12,
    },
    {
      title: 'React Testing Patterns',
      date: '2026-02-01',
      description: 'Practical patterns for testing React components.',
      tags: ['react', 'testing'],
      slug: 'react-testing-patterns',
      readingTime: 5,
    },
  ],
}))

vi.mock('./posts', () => ({
  get posts() {
    return mockPosts.value
  },
}))

function renderBlog(initialRoute = '/blog') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Blog />
    </MemoryRouter>
  )
}

describe('Blog', () => {
  beforeEach(() => {
    mockPosts.value = [
      {
        title: 'Building a Pokedex with React and AWS',
        date: '2026-04-06',
        description:
          'How I built a searchable Pokemon encyclopedia with React 19, AWS CDK, DynamoDB, and Lambda.',
        tags: ['react', 'aws', 'cdk'],
        slug: 'building-a-pokedex',
        readingTime: 8,
      },
      {
        title: 'CDK Custom Resources Deep Dive',
        date: '2026-03-15',
        description:
          'A deep dive into AWS CDK custom resources and providers.',
        tags: ['aws', 'cdk'],
        slug: 'cdk-custom-resources',
        readingTime: 12,
      },
      {
        title: 'React Testing Patterns',
        date: '2026-02-01',
        description: 'Practical patterns for testing React components.',
        tags: ['react', 'testing'],
        slug: 'react-testing-patterns',
        readingTime: 5,
      },
    ]
  })

  it('renders the page heading', () => {
    renderBlog()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' })
    ).toBeInTheDocument()
  })

  describe('post rendering', () => {
    it('renders all posts sorted by date (newest first)', () => {
      renderBlog()
      const links = screen.getAllByRole('link')
      const postLinks = links.filter((link) =>
        link.getAttribute('href')?.startsWith('/blog/')
      )
      expect(postLinks).toHaveLength(3)
      expect(postLinks[0]).toHaveTextContent(
        'Building a Pokedex with React and AWS'
      )
      expect(postLinks[1]).toHaveTextContent(
        'CDK Custom Resources Deep Dive'
      )
      expect(postLinks[2]).toHaveTextContent('React Testing Patterns')
    })

    it('renders the title as a link to the post', () => {
      renderBlog()
      const link = screen.getByRole('link', {
        name: 'Building a Pokedex with React and AWS',
      })
      expect(link).toHaveAttribute('href', '/blog/building-a-pokedex')
    })

    it('renders the date for each post', () => {
      renderBlog()
      expect(screen.getByText(/Apr(il)?\s+6,?\s+2026/)).toBeInTheDocument()
      expect(
        screen.getByText(/Mar(ch)?\s+15,?\s+2026/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Feb(ruary)?\s+1,?\s+2026/)
      ).toBeInTheDocument()
    })

    it('renders the reading time for each post', () => {
      renderBlog()
      expect(screen.getByText(/8 min read/)).toBeInTheDocument()
      expect(screen.getByText(/12 min read/)).toBeInTheDocument()
      expect(screen.getByText(/5 min read/)).toBeInTheDocument()
    })

    it('renders the description for each post', () => {
      renderBlog()
      expect(
        screen.getByText(
          'How I built a searchable Pokemon encyclopedia with React 19, AWS CDK, DynamoDB, and Lambda.'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'A deep dive into AWS CDK custom resources and providers.'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText('Practical patterns for testing React components.')
      ).toBeInTheDocument()
    })

    it('renders tag pills for each post', () => {
      renderBlog()
      // Tags should appear as clickable buttons
      expect(
        screen.getAllByRole('button', { name: 'react' })
      ).toHaveLength(2)
      expect(
        screen.getAllByRole('button', { name: 'aws' })
      ).toHaveLength(2)
      expect(
        screen.getAllByRole('button', { name: 'cdk' })
      ).toHaveLength(2)
      expect(
        screen.getAllByRole('button', { name: 'testing' })
      ).toHaveLength(1)
    })
  })

  describe('tag filtering', () => {
    it('filters posts when a tag is clicked', () => {
      renderBlog()

      // Click the "testing" tag — only "React Testing Patterns" has it
      const testingTags = screen.getAllByRole('button', { name: 'testing' })
      fireEvent.click(testingTags[0])

      // Only the matching post should remain
      expect(
        screen.getByText('React Testing Patterns')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Building a Pokedex with React and AWS')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('CDK Custom Resources Deep Dive')
      ).not.toBeInTheDocument()
    })

    it('highlights the active tag with aria-pressed', () => {
      renderBlog()

      const awsTags = screen.getAllByRole('button', { name: 'aws' })
      fireEvent.click(awsTags[0])

      // All visible "aws" tag buttons should be pressed
      const pressedButtons = screen.getAllByRole('button', { name: 'aws' })
      pressedButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('deselects tag when clicking the active tag again', () => {
      renderBlog()

      const testingTags = screen.getAllByRole('button', { name: 'testing' })
      fireEvent.click(testingTags[0])

      // Only one post visible
      expect(
        screen.queryByText('Building a Pokedex with React and AWS')
      ).not.toBeInTheDocument()

      // Click the active tag again to clear the filter
      const activeTag = screen.getByRole('button', { name: 'testing' })
      fireEvent.click(activeTag)

      // All posts should be visible again
      expect(
        screen.getByText('Building a Pokedex with React and AWS')
      ).toBeInTheDocument()
      expect(
        screen.getByText('CDK Custom Resources Deep Dive')
      ).toBeInTheDocument()
      expect(
        screen.getByText('React Testing Patterns')
      ).toBeInTheDocument()
    })

    it('shows only posts matching the clicked tag', () => {
      renderBlog()

      const awsTags = screen.getAllByRole('button', { name: 'aws' })
      fireEvent.click(awsTags[0])

      // "aws" tagged posts should show
      expect(
        screen.getByText('Building a Pokedex with React and AWS')
      ).toBeInTheDocument()
      expect(
        screen.getByText('CDK Custom Resources Deep Dive')
      ).toBeInTheDocument()

      // Non-"aws" post should be hidden
      expect(
        screen.queryByText('React Testing Patterns')
      ).not.toBeInTheDocument()
    })

    it('pre-filters posts when loaded with ?tag= in the URL', () => {
      renderBlog('/blog?tag=testing')

      // Only the "testing"-tagged post should be visible
      expect(
        screen.getByText('React Testing Patterns')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Building a Pokedex with React and AWS')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('CDK Custom Resources Deep Dive')
      ).not.toBeInTheDocument()
    })

    it('highlights the pre-filtered tag from URL', () => {
      renderBlog('/blog?tag=aws')

      const awsButtons = screen.getAllByRole('button', { name: 'aws' })
      awsButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'true')
      })
    })
  })

  describe('empty states', () => {
    it('shows "No posts found" with a clear filter link when tag matches nothing', () => {
      renderBlog('/blog?tag=nonexistent')

      expect(screen.getByText(/no posts found/i)).toBeInTheDocument()

      // There should be a link to clear the filter
      const clearLink = screen.getByRole('link', { name: /clear/i })
      expect(clearLink).toBeInTheDocument()
    })

    it('shows "Posts coming soon" when no posts exist', () => {
      mockPosts.value = []
      renderBlog()

      expect(screen.getByText(/posts coming soon/i)).toBeInTheDocument()
    })

    it('does not show tag filter buttons when no posts exist', () => {
      mockPosts.value = []
      renderBlog()

      expect(
        screen.queryByRole('button', { name: 'react' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'aws' })
      ).not.toBeInTheDocument()
    })
  })
})
