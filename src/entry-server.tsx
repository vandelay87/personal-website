/* global __dirname */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import { getMetaTags, escapeHtml } from './meta'

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

const buildHeadHtml = (routePath: string): string => {
  const meta = getMetaTags(routePath)
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

  lines.push(
    `<meta name="twitter:card" content="${escapeHtml(meta.twitter.card)}" />`
  )
  lines.push(
    `<meta name="twitter:title" content="${escapeHtml(meta.twitter.title)}" />`
  )
  lines.push(
    `<meta name="twitter:description" content="${escapeHtml(meta.twitter.description)}" />`
  )

  lines.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`)

  return lines.join('\n    ')
}

export const render = (url: string): string => {
  const appHtml = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  )

  const head = buildHeadHtml(url)

  return template
    .replace('<!--ssr-head-->', head)
    .replace('<!--ssr-outlet-->', appHtml)
}
