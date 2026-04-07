import type { Writable } from 'node:stream'
import { render } from './entry-server'
import { isKnownRoute, normalisePath } from './meta'

export const handler = awslambda.streamifyResponse(
  async (
    event: Record<string, unknown>,
    responseStream: Writable,
    _context: unknown
  ) => {
    let rawPath = (event.rawPath as string) || '/'
    // CloudFront defaultRootObject rewrites / to /index.html
    if (rawPath === '/index.html') rawPath = '/'
    const path = normalisePath(rawPath)
    const statusCode = isKnownRoute(path) ? 200 : 404

    try {
      const html = await render(path)
      const httpStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control':
            statusCode === 200 ? 'public, max-age=60' : 'no-cache',
        },
      })
      httpStream.write(html)
      httpStream.end()
    } catch (err) {
      console.error('SSR render failed:', err)
      const httpStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
      httpStream.write(
        '<!DOCTYPE html><html><body><h1>Internal Server Error</h1></body></html>'
      )
      httpStream.end()
    }
  }
)
