// @vitest-environment node
import { Writable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Mock for the awslambda global that the Lambda runtime provides.
 *
 * streamifyResponse: extracts the inner handler so we can invoke it directly.
 * HttpResponseStream.from: captures the metadata (statusCode, headers) and
 *   returns the writable stream so we can inspect what the handler wrote.
 */

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

beforeEach(() => {
  capturedMetadata = {}
  innerHandler = null

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

  // Set the global so the module sees it when imported
  ;(globalThis as Record<string, unknown>).awslambda = mockAwsLambda
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).awslambda
  vi.resetModules()
})

/**
 * Helper: import the handler fresh (so it picks up the global mock),
 * then invoke the inner streaming handler with a mock writable.
 *
 * Returns the captured metadata and the collected stream chunks.
 */
const invokeHandler = async (rawPath?: string) => {
  const mod = await import('./lambda-handler')

  // The handler should have been registered via streamifyResponse
  expect(innerHandler).not.toBeNull()

  const { writable, chunks } = createMockWritable()

  const event: Record<string, unknown> = {
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
  }

  await new Promise<void>((resolve, reject) => {
    writable.on('finish', resolve)
    writable.on('error', reject)
    innerHandler!(event, writable, {}).catch(reject)
  })

  const body = chunks.join('')
  return { metadata: capturedMetadata, body, handler: mod.handler }
}

describe('lambda-handler (streaming)', () => {
  describe('streamifyResponse wrapping', () => {
    it('exports a handler created via awslambda.streamifyResponse', async () => {
      await import('./lambda-handler')
      expect(innerHandler).not.toBeNull()
    })
  })

  describe('200 routes — writes HTML to the stream', () => {
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

  describe('error handling', () => {
    it('writes a 500 error page when render fails', async () => {
      // Mock the render function to throw
      vi.doMock('./entry-server', () => ({
        render: () => Promise.reject(new Error('boom')),
      }))

      const mod = await import('./lambda-handler')
      expect(innerHandler).not.toBeNull()

      const { writable, chunks } = createMockWritable()
      const event: Record<string, unknown> = {
        version: '2.0',
        routeKey: '$default',
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestContext: {
          http: { method: 'GET', path: '/' },
        },
        isBase64Encoded: false,
      }

      await new Promise<void>((resolve, reject) => {
        writable.on('finish', resolve)
        writable.on('error', reject)
        innerHandler!(event, writable, {}).catch(reject)
      })

      expect(capturedMetadata.statusCode).toBe(500)
      const body = chunks.join('')
      expect(body).toContain('Internal Server Error')

      // Ensure the handler reference is used so TS doesn't complain
      expect(mod.handler).toBeDefined()
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
