import Grid from '@components/Grid'
import { render, screen } from '@testing-library/react'

describe('Grid', () => {
  it('renders as a semantic list', () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('applies the correct column classes (4 columns)', () => {
    render(
      <Grid columns={4}>
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list).toHaveClass('grid-cols-1')
    expect(list).toHaveClass('sm:grid-cols-2')
    expect(list).toHaveClass('lg:grid-cols-4')
  })

  it('renders correctly with a single child', () => {
    render(
      <Grid>
        <div>Only Child</div>
      </Grid>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent('Only Child')
  })
})
