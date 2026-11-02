// @vitest-environment node
import { Writable } from 'node:stream'
import type { Recipe } from '@models/recipe'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

interface CapturedMetadata {
  statusCode?: number
  headers?: Record<string, string>
}

const createMockWritable = () => {
  const chunks: string[] = []
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString())
      callback()
    },
  })
  return { writable, chunks }
}

let capturedMetadata: CapturedMetadata = {}
let innerHandler: ((
  event: Record<string, unknown>,
  responseStream: Writable,
  context: unknown
) => Promise<void>) | null = null

// Set up the awslambda global mock once before all tests
beforeAll(() => {
  const mockAwsLambda = {
    streamifyResponse: (
      fn: (
        event: Record<string, unknown>,
        responseStream: Writable,
        context: unknown
      ) => Promise<void>
    ) => {
      innerHandler = fn
      return fn
    },
    HttpResponseStream: {
      from: (stream: Writable, metadata: CapturedMetadata) => {
        capturedMetadata = metadata
        return stream
      },
    },
  }

  ;(globalThis as Record<string, unknown>).awslambda = mockAwsLambda
})

afterAll(() => {
  delete (globalThis as Record<string, unknown>).awslambda
})

beforeEach(() => {
  capturedMetadata = {}
})

const createEvent = (rawPath?: string): Record<string, unknown> => ({
  version: '2.0',
  routeKey: '$default',
  rawPath,
  rawQueryString: '',
  headers: { 'content-type': 'text/html' },
  requestContext: {
    accountId: '123456789012',
    apiId: 'api-id',
    domainName: 'id.execute-api.us-east-1.amazonaws.com',
    domainPrefix: 'id',
    http: {
      method: 'GET',
      path: rawPath ?? '/',
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'test',
    },
    requestId: 'id',
    routeKey: '$default',
    stage: '$default',
    time: '01/Jan/2024:00:00:00 +0000',
    timeEpoch: 1704067200000,
  },
  isBase64Encoded: false,
})

const invokeHandler = async (rawPath?: string) => {
  // Import is cached after first call — innerHandler stays set
  await import('./lambda-handler')
  expect(innerHandler).not.toBeNull()

  const { writable, chunks } = createMockWritable()

  await new Promise<void>((resolve, reject) => {
    writable.on('finish', resolve)
    writable.on('error', reject)
    innerHandler!(createEvent(rawPath), writable, {}).catch(reject)
  })

  return { metadata: capturedMetadata, body: chunks.join('') }
}

describe('lambda-handler (streaming)', { timeout: 30_000 }, () => {
  describe('streamifyResponse wrapping', () => {
    it('exports a handler created via awslambda.streamifyResponse', async () => {
      await import('./lambda-handler')
      expect(innerHandler).not.toBeNull()
    })
  })

  describe('200 routes', () => {
    it('sets statusCode 200 and correct headers for the home route', async () => {
      const { metadata } = await invokeHandler('/')
      expect(metadata.statusCode).toBe(200)
      expect(metadata.headers?.['Content-Type']).toBe(
        'text/html; charset=utf-8'
      )
    })

    it('writes HTML containing a <title> tag for /', async () => {
      const { body } = await invokeHandler('/')
      expect(body).toContain(
        '<title>Akli Aissat — Full-Stack Engineer</title>'
      )
    })

    it('sets statusCode 200 for the /apps route', async () => {
      const { metadata } = await invokeHandler('/apps')
      expect(metadata.statusCode).toBe(200)
    })
  })

  describe('404 routes', () => {
    it('sets statusCode 404 for an unmatched route', async () => {
      const { metadata } = await invokeHandler('/nonexistent')
      expect(metadata.statusCode).toBe(404)
    })

    it('sets correct Content-Type header for 404 routes', async () => {
      const { metadata } = await invokeHandler('/nonexistent')
      expect(metadata.headers?.['Content-Type']).toBe(
        'text/html; charset=utf-8'
      )
    })

    it('writes noindex meta tag for 404 routes', async () => {
      const { body } = await invokeHandler('/nonexistent')
      expect(body).toContain('<meta name="robots" content="noindex"')
    })
  })

  describe('recipe routes', () => {
    const recipe: Recipe = {
      id: 'r1',
      title: 'Spaghetti Bolognese',
      slug: 'spaghetti-bolognese',
      coverImage: { alt: 'A bowl of spaghetti bolognese' },
      tags: ['Italian'],
      prepTime: 15,
      cookTime: 45,
      servings: 4,
      createdAt: '2026-03-01T12:00:00Z',
      intro: 'A classic Italian pasta dish.',
      ingredients: [{ item: 'spaghetti', quantity: '400', unit: 'g' }],
      steps: [{ stepId: '9d904a59-e83f-43b8-9f40-fbdb3008974c', order: 1, text: 'Boil the pasta.' }],
      authorId: 'a1',
      authorName: 'Akli Aissat',
      updatedAt: '2026-03-02T10:00:00Z',
      status: 'published',
    }

    const fetchMock = vi.fn<typeof fetch>()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('returns 200 with public caching for a recipe the API finds', async () => {
      fetchMock.mockResolvedValue(Response.json(recipe))
      const { metadata } = await invokeHandler('/recipes/spaghetti-bolognese')
      expect(fetchMock).toHaveBeenCalledWith('https://api.akli.dev/recipes/spaghetti-bolognese')
      expect(metadata.statusCode).toBe(200)
      expect(metadata.headers?.['Cache-Control']).toBe('public, max-age=60')
    })

    it('returns 404 with no-cache for a recipe the API does not find', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 404 }))
      const { metadata } = await invokeHandler('/recipes/unknown-slug')
      expect(metadata.statusCode).toBe(404)
      expect(metadata.headers?.['Cache-Control']).toBe('no-cache')
    })

    it('returns 404 with no-cache for a nested recipe path without calling the API', async () => {
      const { metadata } = await invokeHandler('/recipes/some-slug/extra')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(metadata.statusCode).toBe(404)
      expect(metadata.headers?.['Cache-Control']).toBe('no-cache')
    })
  })

  describe('error handling', () => {
    it('writes a 500 error page when render fails', async () => {
      vi.resetModules()

      vi.doMock('./entry-server', () => ({
        render: () => Promise.reject(new Error('boom')),
      }))

      try {
        innerHandler = null
        const { metadata, body } = await invokeHandler('/')
        expect(metadata.statusCode).toBe(500)
        expect(body).toContain('Internal Server Error')
      } finally {
        vi.doUnmock('./entry-server')
        vi.resetModules()
      }
    })
  })

  describe('rawPath handling', () => {
    it('treats /index.html as / (200 status)', async () => {
      const { metadata } = await invokeHandler('/index.html')
      expect(metadata.statusCode).toBe(200)
    })

    it('strips trailing slashes — /apps/ returns 200', async () => {
      const { metadata } = await invokeHandler('/apps/')
      expect(metadata.statusCode).toBe(200)
    })

    it('defaults to / when rawPath is missing', async () => {
      const { metadata } = await invokeHandler(undefined)
      expect(metadata.statusCode).toBe(200)
    })
  })
})
