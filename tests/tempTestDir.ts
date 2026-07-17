import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export interface TempTestDir {
  dir: string
  cleanup: () => void
}

// Creates a real temp directory for tests that need real fs behavior rather
// than mocking `fs` — Vitest's module mocking doesn't reliably intercept
// `fs` calls made from root-level modules outside src/ (confirmed by hand:
// a `vi.mock('fs', ...)` never reached calls inside sitemap-plugin.ts or
// plugins/blog-posts-meta.ts, even with `node:fs` also mocked). Caller
// writes whatever fixture files it needs into the returned directory, and
// must call the returned `cleanup` in `afterAll`.
export const createTempTestDir = (prefix: string): TempTestDir => {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}
