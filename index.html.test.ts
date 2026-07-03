import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Static-content check for the blocking no-flash theme script that must live
// in index.html's <head>, before React ever mounts. jsdom can't observe an
// actual paint, so this only verifies the mechanism has the right shape
// (reads persisted theme, falls back to prefers-color-scheme, sets
// data-theme before first paint, fails safe) — it does not prove there is
// zero visual flash. That's a manual/build-verification concern.
describe('index.html no-flash theme script', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const html = fs.readFileSync(path.join(currentDir, 'index.html'), 'utf-8')

  const headSection = html.slice(html.indexOf('<head>'), html.indexOf('<!--ssr-head-->'))
  const inlineScriptMatch = headSection.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)

  it('has a blocking inline <script> in <head>, before <!--ssr-head-->', () => {
    expect(inlineScriptMatch).not.toBeNull()
  })

  const scriptBody = inlineScriptMatch?.[1] ?? ''

  it('reads the persisted theme from localStorage', () => {
    expect(scriptBody).toMatch(/localStorage/)
  })

  it('falls back to prefers-color-scheme via matchMedia', () => {
    expect(scriptBody).toMatch(/matchMedia/)
    expect(scriptBody).toMatch(/prefers-color-scheme/)
  })

  it('sets data-theme on document.documentElement', () => {
    expect(scriptBody).toMatch(/documentElement/)
    expect(scriptBody).toMatch(/setAttribute\(\s*['"]data-theme['"]/)
  })

  it('is wrapped in try/catch so a storage/API failure never blocks render', () => {
    expect(scriptBody).toMatch(/\btry\b/)
    expect(scriptBody).toMatch(/\bcatch\b/)
  })
})
