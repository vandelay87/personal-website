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

    it('renders "Saved" and "· just now" when saved less than a minute ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const text = (container.textContent ?? '').toLowerCase()

      expect(text).toContain('saved')
      expect(text).toContain('just now')
    })

    it('renders "Saved" and "· 2m ago" when saved 2 minutes ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 2 * 60 * 1000)

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const text = (container.textContent ?? '').toLowerCase()

      expect(text).toContain('saved')
      expect(text).toContain('2m ago')
    })

    it('renders "Saved" and "· 1h ago" when saved ~65 minutes ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 65 * 60 * 1000)

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const text = (container.textContent ?? '').toLowerCase()

      expect(text).toContain('saved')
      expect(text).toContain('1h ago')
    })

    it('renders "Saved" and "· 3d ago" when saved ~72 hours ago', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 72 * 60 * 60 * 1000)

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const text = (container.textContent ?? '').toLowerCase()

      expect(text).toContain('saved')
      expect(text).toContain('3d ago')
    })

    it('renders an icon marker alongside the text', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const liveRegion = container.querySelector('[role="status"]')
      const icon = liveRegion?.querySelector('[aria-hidden="true"]')

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

      const liveRegion = container.querySelector('[role="status"]')
      const icon = liveRegion?.querySelector('[aria-hidden="true"]')

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

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      expect((container.textContent ?? '').toLowerCase()).toContain('just now')

      act(() => {
        vi.advanceTimersByTime(60 * 1000)
      })

      expect((container.textContent ?? '').toLowerCase()).toContain('1m ago')
    })

    it('places the relative-time outside the live region and marks it aria-hidden so screen readers skip it', () => {
      const lastSavedAt = new Date(FIXED_NOW.getTime() - 10 * 1000)

      const { container } = render(
        <AutosaveStatus status="saved" lastSavedAt={lastSavedAt} onRetry={noop} />
      )

      const liveRegion = container.querySelector('[role="status"]')
      const relativeTimeNode = screen.getByText(/just now/i)

      expect(liveRegion).not.toBeNull()
      expect(relativeTimeNode).toHaveAttribute('aria-hidden', 'true')
      expect(liveRegion?.contains(relativeTimeNode)).toBe(false)
    })
  })
})
