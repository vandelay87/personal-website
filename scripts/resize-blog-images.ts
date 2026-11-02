import { readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import sharp from 'sharp'
import { IMAGE_VARIANT_WIDTHS } from '../src/types/image.ts'

// Mirrors the size/quality scheme akli-infrastructure's recipe ImageResizer
// Lambda uses (lambda/image-resizer.ts VARIANT_SIZING), so blog and recipe
// images share one mental model: thumb/medium/full, webp, same widths.
const VARIANTS = [
  { suffix: 'thumb', width: IMAGE_VARIANT_WIDTHS.thumb, quality: 80 },
  { suffix: 'medium', width: IMAGE_VARIANT_WIDTHS.medium, quality: 85 },
  { suffix: 'full', width: IMAGE_VARIANT_WIDTHS.full, quality: 90 },
] as const

const VARIANT_SUFFIXES = VARIANTS.map((v) => v.suffix)

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOG_DIR = resolve(__dirname, '../public/blog')

const isAlreadyVariant = (path: string): boolean =>
  VARIANT_SUFFIXES.some((suffix) => path.endsWith(`-${suffix}.webp`))

const resizeOne = async (sourcePath: string): Promise<void> => {
  const stem = sourcePath.slice(0, -'.webp'.length)
  const sourceBuffer = await readFile(join(BLOG_DIR, sourcePath))

  await Promise.all(
    VARIANTS.map(async (variant) => {
      const variantBuffer = await sharp(sourceBuffer)
        .resize(variant.width, undefined, { withoutEnlargement: true })
        .webp({ quality: variant.quality })
        .toBuffer()

      await writeFile(
        join(BLOG_DIR, `${stem}-${variant.suffix}.webp`),
        variantBuffer
      )
    })
  )

  await unlink(join(BLOG_DIR, sourcePath))
  console.log(
    `resized ${sourcePath} -> ${stem}-{${VARIANT_SUFFIXES.join(',')}}.webp`
  )
}

const main = async (): Promise<void> => {
  const sources = globSync('*/*.webp', { cwd: BLOG_DIR })
    .filter((path) => !isAlreadyVariant(path))
    .sort()

  if (sources.length === 0) {
    console.log('No unprocessed .webp files found in public/blog/<post-slug>/.')
    return
  }

  for (const sourcePath of sources) {
    await resizeOne(sourcePath)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
