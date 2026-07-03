import { ToastProvider, useToast } from '@contexts/ToastContext'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC } from 'react'

// A minimal consumer that exercises `showToast` for different tones, so the
// provider's timer/aria-live behaviour can be driven through real usage
// rather than reaching into its internals.
const TestConsumer: FC = () => {
  const { showToast } = useToast()
  return (
    <>
      <button onClick={() => showToast('Recipe saved', 'success')}>Show success</button>
      <button onClick={() => showToast('Something broke', 'error')}>Show error</button>
    </>
  )
}

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-dismisses a toast after ~3.6s', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    await user.click(screen.getByRole('button', { name: /show success/i }))
    expect(screen.getByText('Recipe saved')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3600)
    })

    expect(screen.queryByText('Recipe saved')).not.toBeInTheDocument()
  })

  it('escalates the live region to aria-live="assertive" when an error toast is present, and is "polite" otherwise', async () => {
    const user = userEvent.setup()

    // The live region wrapping the toast list has no accessible role/name of
    // its own (it exists purely for AT announcement, per the PRD's jsdom
    // testing notes), so there is no semantic role/text query for it —
    // asserting its `aria-live` attribute directly is the documented
    // exception.
    const { container } = render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )
    const getLiveRegion = () => container.querySelector('[aria-live]') as HTMLElement

    expect(getLiveRegion()).toHaveAttribute('aria-live', 'polite')

    await user.click(screen.getByRole('button', { name: /show success/i }))
    expect(getLiveRegion()).toHaveAttribute('aria-live', 'polite')

    await user.click(screen.getByRole('button', { name: /show error/i }))
    expect(getLiveRegion()).toHaveAttribute('aria-live', 'assertive')
  })

  it('clicking a toast dismisses it immediately, without waiting for the auto-dismiss timer', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    await user.click(screen.getByRole('button', { name: /show success/i }))

    const toast = screen.getByRole('button', { name: /recipe saved/i })
    await user.click(toast)

    expect(screen.queryByText('Recipe saved')).not.toBeInTheDocument()
  })
})
