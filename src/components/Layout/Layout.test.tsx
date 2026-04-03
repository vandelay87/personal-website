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

  it('applies withHeader class when isHomePage is false', () => {
    const { getByRole } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    expect(getByRole('main').className).toMatch(/withHeader/)
  })

  it('does not apply withHeader class when isHomePage is true', () => {
    const { getByRole } = render(
      <Layout isHomePage>
        <div>Content</div>
      </Layout>
    )
    expect(getByRole('main').className).not.toMatch(/withHeader/)
  })
})
