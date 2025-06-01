import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Layout from './Layout'

describe('Layout', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Layout>
        <p>Test Child</p>
      </Layout>
    )
    expect(getByText('Test Child')).toBeInTheDocument()
  })

  it('applies pt-20 class when isHomePage is false', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    const main = container.querySelector('main')
    expect(main?.className).toContain('pt-20')
  })

  it('does not apply pt-20 class when isHomePage is true', () => {
    const { container } = render(
      <Layout isHomePage>
        <div>Content</div>
      </Layout>
    )
    const main = container.querySelector('main')
    expect(main?.className).not.toContain('pt-20')
  })
})
