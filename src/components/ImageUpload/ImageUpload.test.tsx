import { getUploadUrl } from '@api/recipes'
import ImageUpload from '@components/ImageUpload'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('@api/recipes', () => ({
  getUploadUrl: vi.fn(),
}))

const mockGetUploadUrl = vi.mocked(getUploadUrl)

describe('ImageUpload', () => {
  let mockOnUpload = vi.fn()
  let mockGetToken = vi.fn()

  beforeEach(() => {
    mockOnUpload = vi.fn()
    mockGetToken = vi.fn().mockResolvedValue('test-token')
    mockGetUploadUrl.mockReset()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal(
      'URL',
      Object.assign({}, URL, {
        createObjectURL: vi.fn(() => 'blob:http://localhost/fake-preview'),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders an upload area', () => {
    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    expect(
      screen.getByRole('button', { name: /upload/i }) || screen.getByText(/upload/i)
    ).toBeInTheDocument()
  })

  it('rejects files over 10MB', async () => {
    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    const file = new File(['x'], 'large.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })

    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]')

    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/10MB/i)).toBeInTheDocument()
    })

    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('rejects non-image MIME types', async () => {
    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })

    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]')

    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/image/i)).toBeInTheDocument()
    })

    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('shows local preview after file selection', async () => {
    mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload', key: 'img/123.jpg' })
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 200 }))

    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]')

    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      const preview = screen.getByRole('img')

      expect(preview).toHaveAttribute('src', 'blob:http://localhost/fake-preview')
    })
  })

  it('calls getUploadUrl and uploads to S3 on file select', async () => {
    mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload', key: 'img/123.jpg' })
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 200 }))

    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]')

    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockGetUploadUrl).toHaveBeenCalledWith('test-token', expect.any(Object))
    })

    expect(globalThis.fetch).toHaveBeenCalledWith('https://s3.example.com/upload', expect.objectContaining({ method: 'PUT' }))
    expect(mockOnUpload).toHaveBeenCalledWith('img/123.jpg')
  })

  it('shows error with retry on upload failure', async () => {
    mockGetUploadUrl.mockRejectedValue(new Error('Network error'))

    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]')

    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('has "Replace" button when currentKey is set', () => {
    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} currentKey="img/existing.jpg" />)

    expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument()
  })

  it('clicking the Upload button opens the file picker', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})

    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /upload/i }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it('clicking the Replace button opens the file picker', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})

    render(
      <ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} currentKey="img/existing.jpg" />
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /replace/i }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it('clicking Retry after a failed upload re-attempts the upload', async () => {
    mockGetUploadUrl.mockRejectedValueOnce(new Error('Network error'))

    render(<ImageUpload onUpload={mockOnUpload} getToken={mockGetToken} />)

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]')
    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    // Set the second attempt to succeed
    mockGetUploadUrl.mockResolvedValue({
      uploadUrl: 'https://s3.example.com/upload',
      key: 'img/123.jpg',
    })
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 200 }))

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(mockGetUploadUrl).toHaveBeenCalledTimes(2)
    })
    expect(mockOnUpload).toHaveBeenCalledWith('img/123.jpg')
  })
})
