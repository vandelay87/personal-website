/* global __dirname */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { PassThrough } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RecipeDataContext } from './contexts/RecipeDataContext'
import type { RecipeData } from './contexts/RecipeDataContext'
import { getMetaTags, escapeHtml } from './meta'
import { routes } from './routes'

// Read the client-built index.html (copied into dist/server/ by build:prod).
// Has hashed CSS/JS asset links. Falls back to minimal template for tests.
let template: string
try {
  template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
} catch {
  template = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--ssr-head-->
  </head>
  <body>
    <div id="root"><!--ssr-outlet--></div>
  </body>
</html>`
}

const [templateBeforeOutlet, templateAfterOutlet] = template.split('<!--ssr-outlet-->')

const buildHeadHtml = (routePath: string, data?: RecipeData): string => {
  const meta = getMetaTags(routePath, data)
  const lines: string[] = []

  lines.push(`<title>${escapeHtml(meta.title)}</title>`)
  lines.push(
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  )

  if (meta.robots) {
    lines.push(`<meta name="robots" content="${escapeHtml(meta.robots)}" />`)
  }

  lines.push(`<meta property="og:type" content="${escapeHtml(meta.og.type)}" />`)
  lines.push(`<meta property="og:url" content="${escapeHtml(meta.og.url)}" />`)
  lines.push(
    `<meta property="og:title" content="${escapeHtml(meta.og.title)}" />`
  )
  lines.push(
    `<meta property="og:description" content="${escapeHtml(meta.og.description)}" />`
  )

  if (meta.og.image) {
    lines.push(
      `<meta property="og:image" content="${escapeHtml(meta.og.image)}" />`
    )
  }

  lines.push(
    `<meta name="twitter:card" content="${escapeHtml(meta.twitter.card)}" />`
  )
  lines.push(
    `<meta name="twitter:title" content="${escapeHtml(meta.twitter.title)}" />`
  )
  lines.push(
    `<meta name="twitter:description" content="${escapeHtml(meta.twitter.description)}" />`
  )

  if (meta.twitter.image) {
    lines.push(
      `<meta name="twitter:image" content="${escapeHtml(meta.twitter.image)}" />`
    )
  }

  lines.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`)

  return lines.join('\n    ')
}

const handler = createStaticHandler(routes)

export const render = async (url: string, data?: RecipeData): Promise<string> => {
  const request = new Request(`http://localhost${url}`)
  const context = await handler.query(request)

  if (context instanceof Response) {
    throw new Error(`Unexpected redirect response during SSR: ${context.status}`)
  }

  const router = createStaticRouter(handler.dataRoutes, context)
  const head = buildHeadHtml(url, data)
  const beforeHtml = templateBeforeOutlet.replace('<!--ssr-head-->', head)

  return new Promise<string>((resolve, reject) => {
    const { pipe } = renderToPipeableStream(
      <AuthProvider>
        <RecipeDataContext.Provider value={data ?? {}}>
          <StaticRouterProvider router={router} context={context} />
        </RecipeDataContext.Provider>
      </AuthProvider>,
      {
        onAllReady() {
          const reactStream = new PassThrough({ encoding: 'utf-8' })
          let reactHtml = ''

          reactStream.on('data', (chunk: string) => {
            reactHtml += chunk
          })

          reactStream.on('end', () => {
            const fullHtml = beforeHtml + reactHtml + templateAfterOutlet
            resolve(fullHtml)
          })

          pipe(reactStream)
        },
        onShellError(error) {
          reject(error)
        },
        onError(error) {
          console.error('SSR stream error:', error)
        },
      }
    )
  })
}
