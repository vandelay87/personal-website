/* global __dirname */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { PassThrough } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
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

/**
 * Resolve streaming Suspense boundaries in the HTML produced by
 * renderToPipeableStream.  The stream contains:
 *   1. Fallback markers: <!--$?--><template id="B:N"></template>…fallback…<!--/$-->
 *   2. Resolved content: <div hidden id="S:N">…real content…</div>
 *   3. Replacement scripts: <script>…$RC("B:N","S:N")</script>
 *
 * This function inlines the resolved content in place of the fallback,
 * then strips the hidden divs and scripts so crawlers see clean HTML.
 */
const resolveSuspenseBoundaries = (html: string): string => {
  // Extract all $RC("B:N","S:N") pairs
  const rcPattern = /\$RC\("B:(\d+)","S:(\d+)"\)/g
  let match: RegExpExecArray | null
  let result = html

  while ((match = rcPattern.exec(html)) !== null) {
    const bId = match[1]
    const sId = match[2]

    // Extract resolved content from <div hidden id="S:N">…</div>
    const hiddenDivOpen = `<div hidden id="S:${sId}">`
    const hiddenStart = result.indexOf(hiddenDivOpen)
    if (hiddenStart === -1) continue

    const contentStart = hiddenStart + hiddenDivOpen.length
    // Find the matching closing </div> — we need to handle nested divs
    let depth = 1
    let pos = contentStart
    while (depth > 0 && pos < result.length) {
      const nextOpen = (() => {
        let i = result.indexOf('<div', pos)
        while (i !== -1) {
          const ch = result[i + 4]
          if (ch === '>' || ch === ' ' || ch === undefined) return i
          i = result.indexOf('<div', i + 4)
        }
        return -1
      })()
      const nextClose = result.indexOf('</div>', pos)
      if (nextClose === -1) break
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++
        pos = nextOpen + 4
      } else {
        depth--
        if (depth === 0) {
          const resolvedContent = result.slice(contentStart, nextClose)

          // Replace the fallback boundary with the resolved content
          const fallbackPattern = new RegExp(
            `<!--\\$\\?--><template id="B:${bId}"></template>[\\s\\S]*?<!--/\\$-->`,
          )
          result = result.replace(fallbackPattern, resolvedContent)

          // Remove the hidden div
          result = result.slice(0, hiddenStart) + result.slice(nextClose + 6)
        } else {
          pos = nextClose + 6
        }
      }
    }
  }

  // Remove the React streaming runtime scripts
  result = result.replace(/<script>\$R[A-Z][\s\S]*?<\/script>/g, '')

  return result
}

export const render = (url: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const head = buildHeadHtml(url)
    const [beforeOutlet, afterOutlet] = template.split('<!--ssr-outlet-->')
    const beforeHtml = beforeOutlet.replace('<!--ssr-head-->', head)

    const { pipe } = renderToPipeableStream(
      <StaticRouter location={url}>
        <App />
      </StaticRouter>,
      {
        onAllReady() {
          const reactStream = new PassThrough({ encoding: 'utf-8' })
          let reactHtml = ''

          reactStream.on('data', (chunk: string) => {
            reactHtml += chunk
          })

          reactStream.on('end', () => {
            const fullHtml = beforeHtml + reactHtml + afterOutlet
            resolve(resolveSuspenseBoundaries(fullHtml))
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
