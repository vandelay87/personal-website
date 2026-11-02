import { readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import sharp from 'sharp'
import { IMAGE_VARIANT_WIDTHS, type ImageVariant } from '../src/types/image.ts'

// Mirrors the size/quality scheme akli-infrastructure's recipe ImageResizer
// Lambda uses (lambda/image-resizer.ts VARIANT_SIZING), so blog and recipe
// images share one mental model: thumb/medium/full, webp, same widths.
const VARIANT_QUALITIES: Record<ImageVariant, number> = {
  thumb: 80,
  medium: 85,
  full: 90,
}

const VARIANTS = Object.keys(VARIANT_QUALITIES) as ImageVariant[]

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOG_DIR = resolve(__dirname, '../public/blog')

const isAlreadyVariant = (path: string): boolean =>
  VARIANTS.some((variant) => path.endsWith(`-${variant}.webp`))

const resizeOne = async (sourcePath: string): Promise<void> => {
  const stem = sourcePath.slice(0, -'.webp'.length)
  const absoluteSourcePath = join(BLOG_DIR, sourcePath)
  const sourceBuffer = await readFile(absoluteSourcePath)

  await Promise.all(
    VARIANTS.map(async (variant) => {
      const variantBuffer = await sharp(sourceBuffer)
        .resize(IMAGE_VARIANT_WIDTHS[variant], undefined, {
          withoutEnlargement: true,
        })
        .webp({ quality: VARIANT_QUALITIES[variant] })
        .toBuffer()

      await writeFile(
        join(BLOG_DIR, `${stem}-${variant}.webp`),
        variantBuffer
      )
    })
  )

  await unlink(absoluteSourcePath)
  console.log(
    `resized ${sourcePath} -> ${stem}-{${VARIANTS.join(',')}}.webp`
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
