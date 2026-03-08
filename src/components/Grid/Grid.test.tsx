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

  it('applies the correct default column classes (3 columns)', () => {
    render(
      <Grid>
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list).toHaveClass('grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
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
