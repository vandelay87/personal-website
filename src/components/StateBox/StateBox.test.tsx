import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import StateBox from './StateBox'

describe('StateBox', () => {
  describe('loading variant', () => {
    it('renders a status spinner with the given label', () => {
      render(<StateBox variant="loading" label="Loading recipes…" />)

      expect(screen.getByRole('status', { name: 'Loading recipes…' })).toBeInTheDocument()
    })
  })

  describe('error variant', () => {
    it('renders the icon, heading, and body', () => {
      render(
        <StateBox
          variant="error"
          icon={<span data-testid="error-icon">!</span>}
          heading="Couldn't load recipes"
          body="Something went wrong reaching the server."
        />
      )

      expect(screen.getByTestId('error-icon')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { level: 2, name: "Couldn't load recipes" })
      ).toBeInTheDocument()
      expect(
        screen.getByText('Something went wrong reaching the server.')
      ).toBeInTheDocument()
    })

    it('renders an action button and calls its onClick when clicked', () => {
      const onClick = vi.fn()

      render(
        <StateBox
          variant="error"
          icon={<span aria-hidden="true">!</span>}
          heading="Couldn't load recipes"
          body="Something went wrong."
          action={{ label: 'Retry', onClick, icon: <span aria-hidden="true">↻</span> }}
        />
      )

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      fireEvent.click(retryButton)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders no action button when action is omitted', () => {
      render(
        <StateBox
          variant="error"
          icon={<span aria-hidden="true">!</span>}
          heading="Couldn't load recipes"
          body="Something went wrong."
        />
      )

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
