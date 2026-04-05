import { render } from './entry-server'
import { KNOWN_ROUTES, normalisePath } from './meta'

export async function handler(
  event: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let rawPath = (event.rawPath as string) || '/'
  // CloudFront defaultRootObject rewrites / to /index.html
  if (rawPath === '/index.html') rawPath = '/'
  const path = normalisePath(rawPath)

  try {
    const html = render(path)
    const statusCode = KNOWN_ROUTES.has(path) ? 200 : 404

    return {
      statusCode,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
      body: html,
    }
  } catch {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: '<!DOCTYPE html><html><body><h1>Internal Server Error</h1></body></html>',
    }
  }
}
