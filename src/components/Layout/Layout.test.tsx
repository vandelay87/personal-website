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
})
