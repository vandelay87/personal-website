import { render, screen, fireEvent } from '@testing-library/react'
import CodeBlock from './CodeBlock'

/**
 * Mock pre-highlighted HTML that Shiki would produce at build time.
 * The CodeBlock component receives this as children (mapped to `pre` in MDX).
 */
const mockCodeContent = 'const greeting = "hello";\nconsole.log(greeting);'

const mockShikiChildren = (
  <code className="shiki" data-language="typescript">
    <span className="line">
      <span style={{ color: '#1f2328' }}>const greeting = &quot;hello&quot;;</span>
    </span>
    <span className="line">
      <span style={{ color: '#1f2328' }}>console.log(greeting);</span>
    </span>
  </code>
)

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders pre-highlighted code content', () => {
    render(<CodeBlock>{mockShikiChildren}</CodeBlock>)

    expect(screen.getByText(/const greeting/)).toBeInTheDocument()
    expect(screen.getByText(/console\.log/)).toBeInTheDocument()
  })

  it('displays filename header when data-meta contains title', () => {
    render(
      <CodeBlock data-meta='title="handler.ts"'>
        {mockShikiChildren}
      </CodeBlock>
    )

    expect(screen.getByText('handler.ts')).toBeInTheDocument()
  })

  it('does not display filename header when no data-meta is provided', () => {
    render(<CodeBlock>{mockShikiChildren}</CodeBlock>)

    expect(screen.queryByText('handler.ts')).not.toBeInTheDocument()
    // There should be no element with a filename-header role or class
    expect(screen.queryByTestId('code-block-filename')).not.toBeInTheDocument()
  })

  it('does not display filename header when data-meta has no title', () => {
    render(
      <CodeBlock data-meta="highlight={1}">
        {mockShikiChildren}
      </CodeBlock>
    )

    expect(screen.queryByTestId('code-block-filename')).not.toBeInTheDocument()
  })

  it('has a copy button', () => {
    render(<CodeBlock>{mockShikiChildren}</CodeBlock>)

    const copyButton = screen.getByRole('button', { name: /copy/i })
    expect(copyButton).toBeInTheDocument()
  })

  it('copy button calls navigator.clipboard.writeText with the code text content', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    render(<CodeBlock>{mockShikiChildren}</CodeBlock>)

    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)

    expect(writeText).toHaveBeenCalledTimes(1)
    // The clipboard should receive the plain text content of the code element
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('const greeting')
    )
  })

  it('copy button does not call clipboard when navigator.clipboard is undefined (SSR guard)', () => {
    // Simulate SSR environment where clipboard is unavailable
    const originalClipboard = navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    render(<CodeBlock>{mockShikiChildren}</CodeBlock>)

    // Either the copy button should not render, or clicking it should not throw
    const copyButton = screen.queryByRole('button', { name: /copy/i })
    if (copyButton) {
      // If it renders, clicking should not throw
      expect(() => fireEvent.click(copyButton)).not.toThrow()
    }

    // Restore
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    })
  })

  it('has line numbers via CSS counter class', () => {
    const { container } = render(<CodeBlock>{mockShikiChildren}</CodeBlock>)

    // The component should apply a class or data attribute that enables CSS line numbers
    const preElement = container.querySelector('pre')
    expect(preElement).toBeInTheDocument()

    // Check that the component adds a line-numbers class or attribute for CSS counters
    const hasLineNumbers =
      preElement?.classList.contains('line-numbers') ||
      preElement?.hasAttribute('data-line-numbers') ||
      container.querySelector('[class*="lineNumbers"]') !== null ||
      container.querySelector('[data-line-numbers]') !== null

    expect(hasLineNumbers).toBe(true)
  })
})
