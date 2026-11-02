import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Plugin } from 'vite'
import { parse } from 'yaml'
import { z } from 'zod'
import { postFrontmatterSchema, type PostFrontmatter } from './blog-frontmatter'
import { calculateReadingTime } from './remark-reading-time'

const VIRTUAL_MODULE_ID = 'virtual:blog-posts-meta'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

// `load()` below calls both parseFrontmatter and extractPlainText on the
// same raw file text; matching FRONTMATTER_BLOCK is shared work, so it's
// factored out and threaded through an optional param on each rather than
// each function re-running the same regex against the same string. Both
// still default to matching it themselves so they stay simple one-arg
// pure functions for standalone/test use.
const matchFrontmatterBlock = (raw: string): RegExpMatchArray | null => raw.match(FRONTMATTER_BLOCK)

export const parseFrontmatter = (
  raw: string,
  match: RegExpMatchArray | null = matchFrontmatterBlock(raw)
): unknown => (match ? parse(match[1]) : {})

const validateFrontmatter = (frontmatter: unknown): PostFrontmatter => {
  const result = postFrontmatterSchema.safeParse(frontmatter)
  if (!result.success) throw new Error(z.prettifyError(result.error))
  return result.data
}

// Approximates the "prose text nodes only" word count that
// remark-reading-time computes from the real MDX AST, without running the
// MDX/remark pipeline: strips frontmatter, code fences, import/export
// statements, and JSX tags, leaving roughly the same text left to count.
export const extractPlainText = (
  raw: string,
  match: RegExpMatchArray | null = matchFrontmatterBlock(raw)
): string => {
  const withoutFrontmatter = match ? raw.slice(match[0].length) : raw
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
    const frontmatterMap: Record<string, PostFrontmatter> = {}
    const readingTimeMap: Record<string, number> = {}

    for (const file of files) {
      const filePath = join(postsDir, file)
      this.addWatchFile(filePath)

      const raw = readFileSync(filePath, 'utf-8')
      const key = `./${file}`
      const frontmatterMatch = matchFrontmatterBlock(raw)
      try {
        frontmatterMap[key] = validateFrontmatter(parseFrontmatter(raw, frontmatterMatch))
      } catch (error) {
        throw new Error(`${file}: ${(error as Error).message}`, { cause: error })
      }
      readingTimeMap[key] = calculateReadingTime(extractPlainText(raw, frontmatterMatch))
    }

    return `export const frontmatterMap = ${JSON.stringify(frontmatterMap)}
export const readingTimeMap = ${JSON.stringify(readingTimeMap)}
`
  },
})
