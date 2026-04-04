import { render } from './entry-server'
import { normalisePath } from './meta'

const KNOWN_ROUTES = new Set(['/', '/apps'])

export async function handler(
  event: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const rawPath = (event.rawPath as string) || '/'
  const path = normalisePath(rawPath)

  const html = render(path)
  const statusCode = KNOWN_ROUTES.has(path) ? 200 : 404

  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
    body: html,
  }
}
