import AutosaveStatus from '@components/AutosaveStatus'
import { render, screen, act, fireEvent } from '@testing-library/react'

const FIXED_NOW = new Date('2026-04-19T12:00:00.000Z')

describe('AutosaveStatus', () => {
  const noop = (): void => {}

  describe('idle state', () => {
    it('renders no visible text in idle state', () => {
      const { container } = render(
        <AutosaveStatus status="idle" lastSavedAt={null} onRetry={noop} />
      )

      expect(container.textContent ?? '').toBe('')
    })
  })

  describe('saving state', () => {
    it('renders the "Saving…" text', () => {
      render(<AutosaveStatus status="saving" lastSavedAt={null} onRetry={noop} />)

      expect(screen.getByText(/saving…/i)).toBeInTheDocument()
    })

    it('renders an icon marker alongside the text', () => {
      const { container } = render(
        <AutosaveStatus status="saving" lastSavedAt={null} onRetry={noop} />
      )

      const icon = container.querySelector('[aria-hidden="true"]')

      expect(icon).not.toBeNull()
    })
  })

  describe('saved state — relative time', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(FIXED_NOW)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('renders "Saved · just now" when saved less than a minute ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      expect(screen.getByText(/saved · just now/i)).toBeInTheDocument()
    })

    it('renders "Saved · 2m ago" when saved 2 minutes ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 2 * 60 * 1000)

      render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      expect(screen.getByText(/saved · 2m ago/i)).toBeInTheDocument()
    })

    it('renders "Saved · 1h ago" when saved ~65 minutes ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 65 * 60 * 1000)

      render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      expect(screen.getByText(/saved · 1h ago/i)).toBeInTheDocument()
    })

    it('renders "Saved · 3d ago" when saved ~72 hours ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 72 * 60 * 60 * 1000)

      render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      expect(screen.getByText(/saved · 3d ago/i)).toBeInTheDocument()
    })

    it('renders an icon marker alongside the text', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const icon = container.querySelector('[aria-hidden="true"]')

      expect(icon).not.toBeNull()
    })
  })

  describe('error state', () => {
    it('renders "Failed to save" text', () => {
      render(<AutosaveStatus status="error" lastSavedAt={null} onRetry={noop} />)

      expect(screen.getByText(/failed to save/i)).toBeInTheDocument()
    })

    it('renders a Retry button with accessible name', () => {
      render(<AutosaveStatus status="error" lastSavedAt={null} onRetry={noop} />)

      const button = screen.getByRole('button', { name: /retry/i })

      expect(button).toBeInTheDocument()
    })

    it('invokes onRetry when the Retry button is clicked', () => {
      const onRetry = vi.fn()

      render(<AutosaveStatus status="error" lastSavedAt={null} onRetry={onRetry} />)

      const button = screen.getByRole('button', { name: /retry/i })

      fireEvent.click(button)

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith()
    })

    it('renders an icon marker alongside the text', () => {
      const { container } = render(
        <AutosaveStatus status="error" lastSavedAt={null} onRetry={noop} />
      )

      const icon = container.querySelector('[aria-hidden="true"]')

      expect(icon).not.toBeNull()
    })
  })

  describe('ARIA live region', () => {
    it('uses role="status" and aria-live="polite" on the saving state', () => {
      render(<AutosaveStatus status="saving" lastSavedAt={null} onRetry={noop} />)

      const region = screen.getByRole('status')

      expect(region).toHaveAttribute('aria-live', 'polite')
    })

    it('uses role="status" and aria-live="polite" on the saved state', () => {
      vi.useFakeTimers()
      vi.setSystemTime(FIXED_NOW)
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const region = screen.getByRole('status')

      expect(region).toHaveAttribute('aria-live', 'polite')

      vi.useRealTimers()
    })

    it('uses role="status" and aria-live="polite" on the idle state', () => {
      render(<AutosaveStatus status="idle" lastSavedAt={null} onRetry={noop} />)

      const region = screen.getByRole('status')

      expect(region).toHaveAttribute('aria-live', 'polite')
    })

    it('uses aria-live="assertive" on the error state', () => {
      render(<AutosaveStatus status="error" lastSavedAt={null} onRetry={noop} />)

      const region = screen.getByRole('status')

      expect(region).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('relative-time tick updates', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(FIXED_NOW)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('updates the relative-time text from "just now" to "1m ago" after 60s', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      expect(screen.getByText(/saved · just now/i)).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(60 * 1000)
      })

      expect(screen.getByText(/saved · 1m ago/i)).toBeInTheDocument()
    })

    it('wraps the relative-time text in a node whose aria-live is absent or "off" so ticks are not announced', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const relativeTimeNode = screen.getByText(/just now/i)
      const ariaLive = relativeTimeNode.getAttribute('aria-live')

      // Acceptable: absent, or explicitly "off"
      expect(ariaLive === null || ariaLive === 'off').toBe(true)
    })
  })
})
