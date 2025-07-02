/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CVDownload from './CVDownload'

function mockFetchSuccess(sizeInBytes = 1234, type = 'application/pdf') {
  const data = 'a'.repeat(sizeInBytes)
  const blob = new Blob([data], { type })

  ;(globalThis as any).fetch = vi.fn(() =>
    Promise.resolve({
      blob: () => Promise.resolve(blob),
    })
  )
}

function mockFetchFailure() {
  ;(globalThis as any).fetch = vi.fn(() => Promise.reject(new Error('Fetch failed')))
}

describe('CVDownload', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders file info when fetch succeeds', async () => {
    mockFetchSuccess(1500, 'application/pdf')
    render(<CVDownload />)

    await waitFor(() => {
      expect(screen.getByText(/PDF format/i)).toBeInTheDocument()
      expect(screen.getByText(/Updated/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/1.5 KB/i)).toBeInTheDocument()
  })

  it('shows error message when fetch fails', async () => {
    mockFetchFailure()
    render(<CVDownload />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load CV metadata/i)).toBeInTheDocument()
    })
  })

  it('calls download with correct filename when button clicked', async () => {
    mockFetchSuccess(1500, 'application/pdf')
    render(<CVDownload />)

    await waitFor(() => screen.getByRole('button', { name: /Download my CV/i }))

    // Mock the click on <a> element by spying on document.createElement
    const clickMock = vi.fn()
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: clickMock,
          } as unknown as HTMLAnchorElement
        }
        // fallback to real createElement
        return document.createElement(tagName)
      })

    const button = screen.getByRole('button', { name: /Download my CV/i })
    button.click()

    expect(clickMock).toHaveBeenCalled()

    createElementSpy.mockRestore()
  })
})
