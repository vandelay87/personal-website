import { writeFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createTempTestDir } from '../tests/tempTestDir'
import { blogPostsMeta, extractPlainText, parseFrontmatter } from './blog-posts-meta'

type LoadFn = (this: { addWatchFile: (file: string) => void }, id: string) => string | undefined

describe('parseFrontmatter', () => {
  it('parses flat key/value pairs', () => {
    const raw = `---
title: Building a Pokedex
date: 2026-04-07
description: How I built a Pokedex
---

Body text.`

    expect(parseFrontmatter(raw)).toEqual({
      title: 'Building a Pokedex',
      date: '2026-04-07',
      description: 'How I built a Pokedex',
    })
  })

  it('parses an array field', () => {
    const raw = `---
tags: [react, aws, cdk]
---`

    expect(parseFrontmatter(raw)).toEqual({
      tags: ['react', 'aws', 'cdk'],
    })
  })

  it('strips surrounding quotes from scalar and array values', () => {
    const raw = `---
title: "Quoted Title"
tags: ['react', "aws"]
---`

    expect(parseFrontmatter(raw)).toEqual({
      title: 'Quoted Title',
      tags: ['react', 'aws'],
    })
  })

  it('parses a nested hero mapping into an object, stripping quotes, alongside flat and array keys', () => {
    const raw = `---
title: Building a Pokedex
tags: [react, aws]
image: https://images.akli.dev/blog/pokedex-full.webp
hero:
  src: https://images.akli.dev/blog/pokedex-medium.webp
  srcSet: "https://images.akli.dev/blog/pokedex-medium.webp 800w, https://images.akli.dev/blog/pokedex-full.webp 1200w"
  sizes: '(max-width: 768px) 100vw, 720px'
  alt: Pokedex app showing the Pokemon list
  caption: The finished Pokedex
date: 2026-04-07
---`

    expect(parseFrontmatter(raw)).toEqual({
      title: 'Building a Pokedex',
      tags: ['react', 'aws'],
      image: 'https://images.akli.dev/blog/pokedex-full.webp',
      hero: {
        src: 'https://images.akli.dev/blog/pokedex-medium.webp',
        srcSet:
          'https://images.akli.dev/blog/pokedex-medium.webp 800w, https://images.akli.dev/blog/pokedex-full.webp 1200w',
        sizes: '(max-width: 768px) 100vw, 720px',
        alt: 'Pokedex app showing the Pokemon list',
        caption: 'The finished Pokedex',
      },
      date: '2026-04-07',
    })
  })

  it('keeps a top-level key with an empty value and no indented children as an empty string, not a mapping', () => {
    const raw = `---
title: A Post
image:
date: 2026-01-01
caption:
---`

    expect(parseFrontmatter(raw)).toEqual({
      title: 'A Post',
      image: '',
      date: '2026-01-01',
      caption: '',
    })
  })

  it('returns an empty object when there is no frontmatter block', () => {
    expect(parseFrontmatter('Just body text, no frontmatter.')).toEqual({})
  })

  it('ignores blank lines and lines without a colon', () => {
    const raw = `---
title: A Post

not-a-key-value-line
date: 2026-01-01
---`

    expect(parseFrontmatter(raw)).toEqual({
      title: 'A Post',
      date: '2026-01-01',
    })
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

describe('blogPostsMeta hero validation', () => {
  const validHeroLines = {
    src: '  src: https://images.akli.dev/blog/post/hero-medium.webp',
    srcSet: '  srcSet: https://images.akli.dev/blog/post/hero-medium.webp 800w',
    alt: '  alt: A hero image',
  }

  const loadWithHero = (heroLines: string[]): string | undefined => {
    const temp = createTempTestDir('blog-posts-meta-hero-test-')
    try {
      writeFileSync(
        join(temp.dir, 'broken-hero.mdx'),
        `---
title: Broken Hero
date: 2026-03-03
hero:
${heroLines.join('\n')}
---

Body.`
      )
      const load = blogPostsMeta(temp.dir).load as unknown as LoadFn
      return load.call({ addWatchFile: () => {} }, '\0virtual:blog-posts-meta')
    } finally {
      temp.cleanup()
    }
  }

  const heroLinesWithout = (missingKey: keyof typeof validHeroLines): string[] =>
    Object.entries(validHeroLines)
      .filter(([key]) => key !== missingKey)
      .map(([, line]) => line)

  it.each([
    ...(Object.keys(validHeroLines) as (keyof typeof validHeroLines)[]).map((missingKey) => ({
      scenario: `is missing the required ${missingKey} key`,
      heroLines: heroLinesWithout(missingKey),
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
    expect(() => loadWithHero(heroLines)).toThrow(new RegExp(`broken-hero\\.mdx.*${missingKey}`))
  })

  it('accepts a hero mapping without the optional caption', () => {
    expect(() => loadWithHero(Object.values(validHeroLines))).not.toThrow()
  })
})
