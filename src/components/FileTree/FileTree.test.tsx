import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FileTree from './FileTree'

describe('FileTree', () => {
  const sampleTree = `src/
  components/
    Button/
      Button.tsx
      index.ts
  hooks/
    useTheme.ts`

  it('parses indented text into a tree structure', () => {
    render(<FileTree>{sampleTree}</FileTree>)

    expect(screen.getByText(/src/)).toBeInTheDocument()
    expect(screen.getByText(/Button\.tsx/)).toBeInTheDocument()
    expect(screen.getByText(/useTheme\.ts/)).toBeInTheDocument()
  })

  it('renders folder names for lines ending with /', () => {
    render(<FileTree>{sampleTree}</FileTree>)

    // Folders (ending with /) should be rendered distinctly
    const srcFolder = screen.getByText(/src/)
    const componentsFolder = screen.getByText(/components/)
    const buttonFolder = screen.getByText(/Button\//)

    expect(srcFolder).toBeInTheDocument()
    expect(componentsFolder).toBeInTheDocument()
    expect(buttonFolder).toBeInTheDocument()
  })

  it('renders file names for lines not ending with /', () => {
    render(<FileTree>{sampleTree}</FileTree>)

    expect(screen.getByText(/Button\.tsx/)).toBeInTheDocument()
    expect(screen.getByText(/index\.ts/)).toBeInTheDocument()
    expect(screen.getByText(/useTheme\.ts/)).toBeInTheDocument()
  })

  it('handles nested indentation', () => {
    const nestedTree = `root/
  level1/
    level2/
      deepFile.ts`

    const { container } = render(<FileTree>{nestedTree}</FileTree>)

    expect(screen.getByText(/deepFile\.ts/)).toBeInTheDocument()
    // The tree should contain nested elements reflecting the hierarchy
    expect(container.querySelectorAll('ul, li, [role="treeitem"]').length).toBeGreaterThan(0)
  })

  it('renders empty tree gracefully', () => {
    const { container } = render(<FileTree>{''}</FileTree>)

    // Should render an empty container without errors
    expect(container).toBeInTheDocument()
    expect(container.querySelectorAll('li, [role="treeitem"]').length).toBe(0)
  })
})
