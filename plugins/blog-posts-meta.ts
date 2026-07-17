import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Plugin } from 'vite'
import { calculateReadingTime } from './remark-reading-time'

const VIRTUAL_MODULE_ID = 'virtual:blog-posts-meta'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

// Minimal YAML subset parser scoped to this project's frontmatter shape
// (flat `key: value` pairs plus one `key: [a, b, c]` array field) — not a
// general YAML parser. See docs/prds/blog.md's "MDX frontmatter" section
// for the authoritative shape.
export const parseFrontmatter = (raw: string): Record<string, string | string[]> => {
  const match = raw.match(FRONTMATTER_BLOCK)
  if (!match) return {}

  const result: Record<string, string | string[]> = {}
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const rawValue = line.slice(colonIndex + 1).trim()

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      result[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      result[key] = rawValue.replace(/^['"]|['"]$/g, '')
    }
  }
  return result
}

// Approximates the "prose text nodes only" word count that
// remark-reading-time computes from the real MDX AST, without running the
// MDX/remark pipeline: strips frontmatter, code fences, import/export
// statements, and JSX tags, leaving roughly the same text left to count.
export const extractPlainText = (raw: string): string => {
  const withoutFrontmatter = raw.replace(FRONTMATTER_BLOCK, '')
  const withoutCodeFences = withoutFrontmatter.replace(/```[\s\S]*?```/g, ' ')
  const withoutImportsExports = withoutCodeFences
    .split(/\r?\n/)
    .filter((line) => !/^\s*(import|export)\s/.test(line))
    .join('\n')
  return withoutImportsExports.replace(/<[^>]*>/g, ' ')
}

// Reads each post's frontmatter/reading-time straight from its raw file
// text via Node's fs, instead of `import.meta.glob(..., { eager: true })`
// on the compiled .mdx module. The glob approach makes each post's module
// statically reachable, which stops Rollup from ever splitting it into its
// own lazily-loaded chunk on the dynamic-import side (posts/index.ts's
// contentModules) — Rollup warns "dynamic import will not move module into
// another chunk" because the module is already part of the eager bundle
// regardless of which named export is referenced. Sourcing this metadata
// outside the module graph entirely is what lets each post's content
// actually code-split.
export const blogPostsMeta = (postsDir: string): Plugin => ({
  name: 'blog-posts-meta',
  resolveId(id) {
    if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
  },
  load(id) {
    if (id !== RESOLVED_VIRTUAL_MODULE_ID) return

    const files = readdirSync(postsDir).filter((file) => file.endsWith('.mdx'))
    const frontmatterMap: Record<string, Record<string, string | string[]>> = {}
    const readingTimeMap: Record<string, number> = {}

    for (const file of files) {
      const filePath = join(postsDir, file)
      this.addWatchFile(filePath)

      const raw = readFileSync(filePath, 'utf-8')
      const key = `./${file}`
      frontmatterMap[key] = parseFrontmatter(raw)
      readingTimeMap[key] = calculateReadingTime(extractPlainText(raw))
    }

    return `export const frontmatterMap = ${JSON.stringify(frontmatterMap)}
export const readingTimeMap = ${JSON.stringify(readingTimeMap)}
`
  },
})
