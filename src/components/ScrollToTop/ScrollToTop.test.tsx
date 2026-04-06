import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ScrollToTop from './ScrollToTop'

const mockNavigationType = vi.fn(() => 'PUSH')

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigationType: () => mockNavigationType(),
  }
})

const renderWithRouter = (initialPath: string) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ScrollToTop />
    </MemoryRouter>
  )
}

describe('ScrollToTop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigationType.mockReturnValue('PUSH')
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('scrolls to top on PUSH navigation', () => {
    renderWithRouter('/apps')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('does not scroll on POP navigation (back/forward)', () => {
    mockNavigationType.mockReturnValue('POP')
    renderWithRouter('/apps')
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls to top on REPLACE navigation', () => {
    mockNavigationType.mockReturnValue('REPLACE')
    renderWithRouter('/apps')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('scrolls to anchor element when hash is present', () => {
    const mockElement = { scrollIntoView: vi.fn() }
    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as unknown as Element)

    renderWithRouter('/apps#section')

    expect(document.querySelector).toHaveBeenCalledWith('#section')
    expect(mockElement.scrollIntoView).toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls to top when hash element does not exist', () => {
    vi.spyOn(document, 'querySelector').mockReturnValue(null)

    renderWithRouter('/apps#nonexistent')

    expect(document.querySelector).toHaveBeenCalledWith('#nonexistent')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('does not scroll to anchor on POP navigation with hash', () => {
    mockNavigationType.mockReturnValue('POP')
    const querySpy = vi.spyOn(document, 'querySelector')

    renderWithRouter('/apps#section')

    expect(querySpy).not.toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls to top when hash is an invalid CSS selector', () => {
    vi.spyOn(document, 'querySelector').mockImplementation(() => {
      throw new DOMException('Invalid selector')
    })

    renderWithRouter('/apps#123invalid')

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
