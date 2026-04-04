// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { handler } from './lambda-handler'

/**
 * Helper to build a mock API Gateway v2 event with the given rawPath.
 * Only includes fields the handler is expected to use.
 */
function createApiGatewayEvent(
  rawPath?: string
): Record<string, unknown> {
  return {
    version: '2.0',
    routeKey: '$default',
    rawPath: rawPath,
    rawQueryString: '',
    headers: {
      'content-type': 'text/html',
    },
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
}

describe('lambda-handler', () => {
  describe('status codes', () => {
    it('returns 200 for the home route /', async () => {
      const event = createApiGatewayEvent('/')
      const result = await handler(event)
      expect(result).not.toBeNull()
      expect((result as Record<string, unknown>).statusCode).toBe(200)
    })

    it('returns 200 for the /apps route', async () => {
      const event = createApiGatewayEvent('/apps')
      const result = await handler(event)
      expect(result).not.toBeNull()
      expect((result as Record<string, unknown>).statusCode).toBe(200)
    })

    it('returns 404 for an unmatched route', async () => {
      const event = createApiGatewayEvent('/nonexistent')
      const result = await handler(event)
      expect(result).not.toBeNull()
      expect((result as Record<string, unknown>).statusCode).toBe(404)
    })
  })

  describe('Content-Type header', () => {
    it('sets Content-Type to text/html; charset=utf-8', async () => {
      const event = createApiGatewayEvent('/')
      const result = await handler(event)
      expect(result).not.toBeNull()
      const headers = (result as Record<string, unknown>).headers as Record<
        string,
        string
      >
      expect(headers['Content-Type'] ?? headers['content-type']).toBe(
        'text/html; charset=utf-8'
      )
    })
  })

  describe('rawPath handling', () => {
    it('defaults to / when rawPath is missing', async () => {
      const event = createApiGatewayEvent(undefined)
      const result = await handler(event)
      expect(result).not.toBeNull()
      expect((result as Record<string, unknown>).statusCode).toBe(200)
    })

    it('defaults to / when rawPath is empty string', async () => {
      const event = createApiGatewayEvent('')
      const result = await handler(event)
      expect(result).not.toBeNull()
      expect((result as Record<string, unknown>).statusCode).toBe(200)
    })
  })

  describe('trailing slash stripping', () => {
    it('treats /apps/ the same as /apps (returns 200)', async () => {
      const event = createApiGatewayEvent('/apps/')
      const result = await handler(event)
      expect(result).not.toBeNull()
      expect((result as Record<string, unknown>).statusCode).toBe(200)
    })
  })

  describe('HTML response content', () => {
    it('returns HTML containing a <title> tag for /', async () => {
      const event = createApiGatewayEvent('/')
      const result = await handler(event)
      expect(result).not.toBeNull()
      const body = (result as Record<string, unknown>).body as string
      expect(body).toContain('<title>Akli Aissat — Full-Stack Engineer</title>')
    })

    it('returns HTML containing a <title> tag for /apps', async () => {
      const event = createApiGatewayEvent('/apps')
      const result = await handler(event)
      expect(result).not.toBeNull()
      const body = (result as Record<string, unknown>).body as string
      expect(body).toContain(
        '<title>Apps &amp; Experiments | Akli Aissat</title>'
      )
    })

    it('returns HTML containing noindex meta tag for 404 routes', async () => {
      const event = createApiGatewayEvent('/nonexistent')
      const result = await handler(event)
      expect(result).not.toBeNull()
      const body = (result as Record<string, unknown>).body as string
      expect(body).toContain('<meta name="robots" content="noindex"')
    })
  })
})
