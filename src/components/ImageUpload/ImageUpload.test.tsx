import { getUploadUrl } from '@api/recipes'
import ImageUpload from '@components/ImageUpload'
import { recipeImageUrl } from '@models/recipe'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('@api/recipes', () => ({
  getUploadUrl: vi.fn(),
}))

const mockGetUploadUrl = vi.mocked(getUploadUrl)

const STEP_ID = '9d904a59-e83f-43b8-9f40-fbdb3008974c'

describe('ImageUpload', () => {
  let mockGetToken = vi.fn()

  beforeEach(() => {
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

  const selectFile = (sizeBytes = 1024, type = 'image/png') => {
    const file = new File(['x'], 'photo.png', { type })
    Object.defineProperty(file, 'size', { value: sizeBytes })
    const input = screen.getByLabelText(/upload/i)
    fireEvent.change(input, { target: { files: [file] } })
    return file
  }

  it('renders an upload area', () => {
    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
  })

  it('rejects files over 10MB', async () => {
    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    selectFile(11 * 1024 * 1024)

    await waitFor(() => {
      expect(screen.getByText(/10MB/i)).toBeInTheDocument()
    })
  })

  it('rejects non-image MIME types', async () => {
    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText(/upload/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      // Scope to the alert region so the ProcessingPlaceholder caption
      // ("Processing image…") doesn't satisfy the /image/i match.
      expect(screen.getByRole('alert')).toHaveTextContent(/must be an image/i)
    })
  })

  it('shows local preview after file selection', async () => {
    mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload' })
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 200 }))

    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    selectFile()

    await waitFor(() => {
      const preview = screen.getByRole('img')
      expect(preview).toHaveAttribute('src', 'blob:http://localhost/fake-preview')
    })
  })

  // NEW (#198): callback contract — onUploadStarted before the PUT, onUploadCompleted after.
  it('fires onUploadStarted before the PUT and onUploadCompleted on success, with no key argument', async () => {
    mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload' })
    const order: string[] = []
    const onUploadStarted = vi.fn(() => order.push('started'))
    const onUploadCompleted = vi.fn(() => order.push('completed'))
    const fetchMock = vi.fn(async () => {
      order.push('put')
      return new Response(null, { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        onUploadStarted={onUploadStarted}
        onUploadCompleted={onUploadCompleted}
      />
    )

    selectFile()

    await waitFor(() => {
      expect(onUploadCompleted).toHaveBeenCalledTimes(1)
    })

    expect(onUploadStarted).toHaveBeenCalledTimes(1)
    // Started must fire before the network PUT; completed must fire after it.
    expect(order).toEqual(['started', 'put', 'completed'])
    // No `key` argument flows through either callback.
    expect(onUploadStarted).toHaveBeenCalledWith()
    expect(onUploadCompleted).toHaveBeenCalledWith()
  })

  // NEW (#198): derives the getUploadUrl params from the imageType prop.
  it('requests a cover upload-url with { recipeId, imageType: "cover" } and no stepId', async () => {
    mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload' })
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 200 }))

    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    selectFile()

    await waitFor(() => {
      expect(mockGetUploadUrl).toHaveBeenCalledWith('test-token', {
        recipeId: 'test-recipe-id',
        imageType: 'cover',
      })
    })
  })

  // NEW (#198): step image parses the stepId out of `step-<uuid>`.
  it('requests a step upload-url with the stepId parsed from the imageType prop', async () => {
    mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload' })
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 200 }))

    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType={`step-${STEP_ID}`}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    selectFile()

    await waitFor(() => {
      expect(mockGetUploadUrl).toHaveBeenCalledWith('test-token', {
        recipeId: 'test-recipe-id',
        imageType: 'step',
        stepId: STEP_ID,
      })
    })
  })

  it('shows error with retry on upload failure', async () => {
    mockGetUploadUrl.mockRejectedValue(new Error('Network error'))

    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    selectFile()

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows a "Replace" button when the image is already processed', () => {
    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        processedAt={1234567890}
      />
    )

    expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument()
  })

  it('clicking the Upload button opens the file picker', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})

    render(
      <ImageUpload
        slug="beans-on-toast"
        imageType="cover"
        getToken={mockGetToken}
        recipeId="test-recipe-id"
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /upload/i }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it('requires recipeId, slug, and imageType props (compile-time check)', () => {
    // @ts-expect-error — recipeId, slug, imageType are required
    render(<ImageUpload getToken={vi.fn()} />)
    expect(true).toBe(true)
  })

  describe('render branches (preview / processing / ready)', () => {
    it('renders the processing placeholder when processedAt is not set', () => {
      render(
        <ImageUpload
          slug="beans-on-toast"
          imageType="cover"
          getToken={mockGetToken}
          recipeId="test-recipe-id"
        />
      )

      expect(screen.getByText(/processing image/i)).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    // NEW (#198): the current image src is built from recipeImageUrl(slug, imageType, 'medium').
    it('renders the ready image from recipeImageUrl(slug, imageType, "medium") when processedAt is set', () => {
      render(
        <ImageUpload
          slug="beans-on-toast"
          imageType="cover"
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          currentAlt="A tasty dish"
          processedAt={1234567890}
        />
      )

      const image = screen.getByRole('img')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('alt', 'A tasty dish')
      expect(image).toHaveAttribute('src', recipeImageUrl('beans-on-toast', 'cover', 'medium'))
      expect(screen.queryByText(/processing image/i)).not.toBeInTheDocument()
    })

    it('builds the step image src from the step-<uuid> imageType', () => {
      render(
        <ImageUpload
          slug="beans-on-toast"
          imageType={`step-${STEP_ID}`}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          currentAlt="Step image"
          processedAt={1234567890}
        />
      )

      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        recipeImageUrl('beans-on-toast', `step-${STEP_ID}`, 'medium')
      )
    })

    it('shows the blob preview even when processedAt is set (blob preview wins)', async () => {
      mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload' })
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 200 }))

      render(
        <ImageUpload
          slug="beans-on-toast"
          imageType="cover"
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          processedAt={1234567890}
        />
      )

      selectFile()

      await waitFor(() => {
        const preview = screen.getByRole('img')
        expect(preview).toHaveAttribute('src', 'blob:http://localhost/fake-preview')
      })

      expect(screen.queryByText(/processing image/i)).not.toBeInTheDocument()
    })
  })
})
