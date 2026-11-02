import { writeFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createTempTestDir } from '../tests/tempTestDir'
import { blogPostsMeta, extractPlainText, parseFrontmatter } from './blog-posts-meta'

type LoadFn = (this: { addWatchFile: (file: string) => void }, id: string) => string | undefined

describe('parseFrontmatter', () => {
  it('parses the frontmatter block into an object', () => {
    const raw = `---
title: Building a Pokedex
date: 2026-04-07
tags: [react, aws]
hero:
  src: https://images.akli.dev/blog/pokedex-medium.webp
  alt: "Pokedex app"
---

Body text.`

    expect(parseFrontmatter(raw)).toEqual({
      title: 'Building a Pokedex',
      date: '2026-04-07',
      tags: ['react', 'aws'],
      hero: { src: 'https://images.akli.dev/blog/pokedex-medium.webp', alt: 'Pokedex app' },
    })
  })

  it('returns an empty object when there is no frontmatter block', () => {
    expect(parseFrontmatter('Just body text, no frontmatter.')).toEqual({})
  })

  it('only reads the first frontmatter block, ignoring later --- separators', () => {
    const raw = `---
title: A Post
---

Some text with a --- horizontal rule in the body.`

    expect(parseFrontmatter(raw)).toEqual({ title: 'A Post' })
  })
})

describe('extractPlainText', () => {
  it('strips the frontmatter block', () => {
    const raw = `---
title: A Post
---

Hello world.`

    expect(extractPlainText(raw)).not.toContain('title:')
    expect(extractPlainText(raw)).toContain('Hello world.')
  })

  it('strips fenced code blocks', () => {
    const raw = `Prose before.

\`\`\`ts
const codeShouldNotCount = true
\`\`\`

Prose after.`

    const text = extractPlainText(raw)
    expect(text).not.toContain('codeShouldNotCount')
    expect(text).toContain('Prose before.')
    expect(text).toContain('Prose after.')
  })

  it('strips import and export lines', () => {
    const raw = `import { Image } from '@components/Image'
export const readingTime = 3

Real prose content.`

    const text = extractPlainText(raw)
    expect(text).not.toContain('import')
    expect(text).not.toContain('export const readingTime')
    expect(text).toContain('Real prose content.')
  })

  it('strips JSX tags but keeps their text content', () => {
    const raw = `<Callout type="info">This is a callout.</Callout>

<Image src="/a.webp" alt="An image" />

Plain paragraph.`

    const text = extractPlainText(raw)
    expect(text).not.toContain('<Callout')
    expect(text).not.toContain('<Image')
    expect(text).toContain('This is a callout.')
    expect(text).toContain('Plain paragraph.')
  })
})

describe('blogPostsMeta', () => {
  // Uses real files on a temp directory rather than mocking `fs` — the
  // plugin is a root-level module outside src/, and Vitest's module mocking
  // doesn't reliably intercept `fs` calls made from those (confirmed by
  // hand: a `vi.mock('fs', ...)` in this file never reached readdirSync
  // calls made inside blog-posts-meta.ts, even with `node:fs` also mocked;
  // see tests/tempTestDir.ts).
  let postsDir: string
  let cleanup: () => void

  beforeAll(() => {
    const temp = createTempTestDir('blog-posts-meta-test-')
    postsDir = temp.dir
    cleanup = temp.cleanup
    writeFileSync(
      join(postsDir, 'post-a.mdx'),
      `---
title: Post A
date: 2026-01-01
description: First post
tags: [a, b]
---

Hello world, this is post A.`
    )
    writeFileSync(
      join(postsDir, 'post-b.mdx'),
      `---
title: Post B
date: 2026-02-02
description: Second post
tags: [c]
---

${Array(250).fill('word').join(' ')}`
    )
    writeFileSync(join(postsDir, 'README.md'), '# Not a post')
  })

  afterAll(() => {
    cleanup()
  })

  it('resolves the virtual module id to its internal id', () => {
    const plugin = blogPostsMeta(postsDir)
    const resolveId = plugin.resolveId as (id: string) => string | undefined

    expect(resolveId.call({}, 'virtual:blog-posts-meta')).toBe('\0virtual:blog-posts-meta')
  })

  it('does not resolve unrelated ids', () => {
    const plugin = blogPostsMeta(postsDir)
    const resolveId = plugin.resolveId as (id: string) => string | undefined

    expect(resolveId.call({}, './some-other-module')).toBeUndefined()
  })

  it('ignores load calls for ids other than the resolved virtual module id', () => {
    const plugin = blogPostsMeta(postsDir)
    const addWatchFile = vi.fn()
    const load = plugin.load as unknown as LoadFn

    expect(load.call({ addWatchFile }, './something-else.ts')).toBeUndefined()
    expect(addWatchFile).not.toHaveBeenCalled()
  })

  it('reads only .mdx files, watches each one, and emits frontmatter/reading-time maps', () => {
    const plugin = blogPostsMeta(postsDir)
    const addWatchFile = vi.fn()
    const load = plugin.load as unknown as LoadFn

    const source = load.call({ addWatchFile }, '\0virtual:blog-posts-meta')

    expect(addWatchFile).toHaveBeenCalledTimes(2)
    expect(addWatchFile).toHaveBeenCalledWith(join(postsDir, 'post-a.mdx'))
    expect(addWatchFile).toHaveBeenCalledWith(join(postsDir, 'post-b.mdx'))

    expect(source).toBeDefined()
    const frontmatterMap = JSON.parse(source!.match(/export const frontmatterMap = (.+)/)![1])
    const readingTimeMap = JSON.parse(source!.match(/export const readingTimeMap = (.+)/)![1])

    expect(frontmatterMap['./post-a.mdx']).toEqual({
      title: 'Post A',
      date: '2026-01-01',
      description: 'First post',
      tags: ['a', 'b'],
    })
    expect(readingTimeMap['./post-a.mdx']).toBe(1)
    expect(readingTimeMap['./post-b.mdx']).toBe(2)
    expect(frontmatterMap['./README.md']).toBeUndefined()
  })
})

describe('blogPostsMeta frontmatter validation', () => {
  const validFieldLines = {
    title: 'title: A Post',
    date: 'date: 2026-03-03',
    description: 'description: A post',
    tags: 'tags: [a, b]',
  }

  const validHeroLines = {
    src: '  src: https://images.akli.dev/blog/post/hero-medium.webp',
    srcSet: '  srcSet: https://images.akli.dev/blog/post/hero-medium.webp 800w',
    alt: '  alt: A hero image',
  }

  const loadPost = (frontmatterLines: string[]): string | undefined => {
    const temp = createTempTestDir('blog-posts-meta-validation-test-')
    try {
      writeFileSync(join(temp.dir, 'broken-post.mdx'), `---\n${frontmatterLines.join('\n')}\n---\n\nBody.`)
      const load = blogPostsMeta(temp.dir).load as unknown as LoadFn
      return load.call({ addWatchFile: () => {} }, '\0virtual:blog-posts-meta')
    } finally {
      temp.cleanup()
    }
  }

  const loadWithHero = (heroLines: string[]): string | undefined =>
    loadPost([...Object.values(validFieldLines), 'hero:', ...heroLines])

  const linesWithout = <T extends Record<string, string>>(lines: T, missingKey: keyof T): string[] =>
    Object.entries(lines)
      .filter(([key]) => key !== missingKey)
      .map(([, line]) => line)

  it.each(Object.keys(validFieldLines) as (keyof typeof validFieldLines)[])(
    'refuses to build when the required %s field is missing, naming the file and the field',
    (missingKey) => {
      expect(() => loadPost(linesWithout(validFieldLines, missingKey))).toThrow(
        `broken-post.mdx: missing required field "${missingKey}"`
      )
    }
  )

  it('refuses to build when a field has the wrong type, naming the file and the field', () => {
    const lines = [...linesWithout(validFieldLines, 'tags'), 'tags: react']

    expect(() => loadPost(lines)).toThrow('broken-post.mdx: invalid field "tags"')
  })

  it('refuses to build when the frontmatter is not valid YAML, naming the file', () => {
    expect(() => loadPost([...Object.values(validFieldLines), 'notes: [unclosed'])).toThrow(/^broken-post\.mdx: /)
  })

  const emittedFrontmatter = (source: string | undefined): Record<string, unknown> =>
    JSON.parse(source!.match(/export const frontmatterMap = (.+)/)![1])['./broken-post.mdx']

  it('refuses to build when the date is not a YYYY-MM-DD date, naming the file and the field', () => {
    const lines = [...linesWithout(validFieldLines, 'date'), 'date: soon']

    expect(() => loadPost(lines)).toThrow('broken-post.mdx: invalid field "date"')
  })

  it('accepts a full post without the optional hero', () => {
    expect(emittedFrontmatter(loadPost(Object.values(validFieldLines)))).not.toHaveProperty('hero')
  })

  it('accepts a hero mapping without the optional caption', () => {
    expect(emittedFrontmatter(loadWithHero(Object.values(validHeroLines))).hero).not.toHaveProperty('caption')
  })

  it('accepts a hero mapping with the optional caption and emits it', () => {
    expect(emittedFrontmatter(loadWithHero([...Object.values(validHeroLines), '  caption: A caption'])).hero).toEqual({
      src: 'https://images.akli.dev/blog/post/hero-medium.webp',
      srcSet: 'https://images.akli.dev/blog/post/hero-medium.webp 800w',
      alt: 'A hero image',
      caption: 'A caption',
    })
  })

  it('omits empty optional keys from the emitted frontmatter', () => {
    const frontmatter = emittedFrontmatter(loadPost([...Object.values(validFieldLines), 'image:']))

    expect(frontmatter).not.toHaveProperty('image')
  })

  it('omits empty optional keys nested in the hero from the emitted frontmatter', () => {
    const frontmatter = emittedFrontmatter(loadWithHero([...Object.values(validHeroLines), '  caption:']))

    expect(frontmatter.hero).not.toHaveProperty('caption')
  })

  it.each([
    ...(Object.keys(validHeroLines) as (keyof typeof validHeroLines)[]).map((missingKey) => ({
      scenario: `is missing the required ${missingKey} key`,
      heroLines: linesWithout(validHeroLines, missingKey),
      missingKey,
    })),
    {
      scenario: "has srcSet typo'd as srcset",
      heroLines: [
        validHeroLines.src,
        '  srcset: https://images.akli.dev/blog/post/hero-medium.webp 800w',
        validHeroLines.alt,
      ],
      missingKey: 'srcSet',
    },
  ])('refuses to build when a hero mapping $scenario, naming the file and the missing key', ({ heroLines, missingKey }) => {
    expect(() => loadWithHero(heroLines)).toThrow(`broken-post.mdx: missing required field "hero.${missingKey}"`)
  })
})
