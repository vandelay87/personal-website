import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

// Behavioral check for the blocking no-flash theme script that must live in
// index.html's <head>, before React ever mounts. jsdom can't observe an
// actual paint, so this executes the *real* extracted script body against
// controlled mock inputs (document/localStorage/window) and asserts the
// resulting document.documentElement.setAttribute calls — proving the actual
// priority order and try/catch behavior, not just vocabulary. It still does
// not prove there is zero visual flash in a real browser — that's a
// manual/build-verification concern.
describe('index.html no-flash theme script', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const html = fs.readFileSync(path.join(currentDir, 'index.html'), 'utf-8')

  const headSection = html.slice(html.indexOf('<head>'), html.indexOf('<!--ssr-head-->'))
  const inlineScriptMatch = headSection.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)

  it('has a blocking inline <script> in <head>, before <!--ssr-head-->', () => {
    expect(inlineScriptMatch).not.toBeNull()
  })

  const scriptBody = inlineScriptMatch?.[1] ?? ''

  const run = (options: {
    getItem: (key: string) => string | null
    matches: boolean
  }) => {
    const setAttribute = vi.fn()
    const getAttribute = vi.fn()
    const documentElement = { getAttribute, setAttribute }
    const mockDocument = { documentElement }
    const mockLocalStorage = { getItem: vi.fn(options.getItem) }
    const mockMatchMedia = vi.fn(() => ({ matches: options.matches }))
    const mockWindow = { matchMedia: mockMatchMedia }

    const scriptFn = new Function('document', 'localStorage', 'window', scriptBody)
    scriptFn(mockDocument, mockLocalStorage, mockWindow)

    return { setAttribute, matchMedia: mockMatchMedia }
  }

  it('uses persisted dark theme over system preference', () => {
    const { setAttribute, matchMedia } = run({
      getItem: () => 'dark',
      matches: false, // system prefers light — persisted value should still win
    })

    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    expect(matchMedia).not.toHaveBeenCalled()
  })

  it('uses persisted light theme over system preference', () => {
    const { setAttribute, matchMedia } = run({
      getItem: () => 'light',
      matches: true, // system prefers dark — persisted value should still win
    })

    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    expect(matchMedia).not.toHaveBeenCalled()
  })

  it('falls back to prefers-color-scheme: dark when nothing is persisted', () => {
    const { setAttribute } = run({
      getItem: () => null,
      matches: true,
    })

    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
  })

  it('falls back to light when nothing is persisted and system prefers light', () => {
    const { setAttribute } = run({
      getItem: () => null,
      matches: false,
    })

    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'light')
  })

  it('does not throw when localStorage access fails (e.g. private browsing)', () => {
    const throwingRun = () =>
      run({
        getItem: () => {
          throw new Error('SecurityError: access denied')
        },
        matches: false,
      })

    expect(throwingRun).not.toThrow()
  })
})
