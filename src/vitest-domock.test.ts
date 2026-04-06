import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test if dynamic import() after vi.doMock resolves synchronously
describe('doMock with inline import test', () => {
  beforeEach(() => {
    vi.doMock('./pages/Blog/posts/index', () => ({
      posts: [],
      getPost: (slug: string) => {
        if (slug === 'mock-test') return { title: 'Mock Title', description: 'Mock Desc', slug: 'mock-test', date: '2025-01-01', tags: [], readingTime: 1 }
        return undefined
      },
    }))
  })

  it('check if import() inside a sync function works', async () => {
    const mod = await import('./pages/Blog/posts/index')
    const result = mod.getPost('mock-test')
    console.log('Dynamic import result:', JSON.stringify(result))
    expect(result).toBeDefined()
    expect(result!.title).toBe('Mock Title')
  })
})
