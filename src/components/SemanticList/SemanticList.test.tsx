import SemanticList, { SemanticListItem } from '@components/SemanticList'
import { render, screen } from '@testing-library/react'
import type { CSSProperties } from 'react'

describe('SemanticList', () => {
  it('renders its children inside an element with role list', () => {
    render(
      <SemanticList>
        <SemanticListItem>Item one</SemanticListItem>
      </SemanticList>
    )

    const list = screen.getByRole('list')

    expect(list).toBeInTheDocument()
    expect(screen.getByText('Item one')).toBeInTheDocument()
  })

  it('passes className through to the list element', () => {
    render(<SemanticList className="custom-list">Content</SemanticList>)

    expect(screen.getByRole('list')).toHaveClass('custom-list')
  })

  it('passes other props such as style and arbitrary attributes through to the list element', () => {
    render(
      <SemanticList
        style={{ '--grid-min-width': '200px' } as CSSProperties}
        data-testid="grid-list"
      >
        Content
      </SemanticList>
    )

    const list = screen.getByRole('list')

    expect(list).toHaveStyle('--grid-min-width: 200px')
    expect(list).toHaveAttribute('data-testid', 'grid-list')
  })
})

describe('SemanticListItem', () => {
  it('renders its children inside an element with role listitem', () => {
    render(
      <SemanticList>
        <SemanticListItem>Item content</SemanticListItem>
      </SemanticList>
    )

    const item = screen.getByRole('listitem')

    expect(item).toBeInTheDocument()
    expect(item).toHaveTextContent('Item content')
  })

  it('passes className through to the list item element', () => {
    render(
      <SemanticList>
        <SemanticListItem className="custom-item">Content</SemanticListItem>
      </SemanticList>
    )

    expect(screen.getByRole('listitem')).toHaveClass('custom-item')
  })

  it('passes other props such as arbitrary attributes through to the list item element', () => {
    render(
      <SemanticList>
        <SemanticListItem data-testid="grid-item">Content</SemanticListItem>
      </SemanticList>
    )

    expect(screen.getByRole('listitem')).toHaveAttribute('data-testid', 'grid-item')
  })
})
