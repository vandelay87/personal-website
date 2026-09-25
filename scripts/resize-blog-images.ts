import { readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Mirrors the size/quality scheme akli-infrastructure's recipe ImageResizer
// Lambda uses (lambda/image-resizer.ts VARIANT_SIZING), so blog and recipe
// images share one mental model: thumb/medium/full, webp, same widths.
const VARIANTS = [
  { suffix: 'thumb', width: 400, quality: 80 },
  { suffix: 'medium', width: 800, quality: 85 },
  { suffix: 'full', width: 1200, quality: 90 },
] as const

const VARIANT_SUFFIXES = VARIANTS.map((v) => v.suffix)

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOG_IMAGES_DIR = resolve(__dirname, '../public/images/blog')

const isAlreadyVariant = (basename: string): boolean =>
  VARIANT_SUFFIXES.some((suffix) => basename.endsWith(`-${suffix}`))

const resizeOne = async (filename: string): Promise<void> => {
  const ext = extname(filename)
  const basename = filename.slice(0, -ext.length)
  if (isAlreadyVariant(basename)) return

  const sourcePath = join(BLOG_IMAGES_DIR, filename)
  const sourceBuffer = await readFile(sourcePath)

  await Promise.all(
    VARIANTS.map(async (variant) => {
      const variantBuffer = await sharp(sourceBuffer)
        .resize(variant.width, undefined, { withoutEnlargement: true })
        .webp({ quality: variant.quality })
        .toBuffer()

      await writeFile(join(BLOG_IMAGES_DIR, `${basename}-${variant.suffix}.webp`), variantBuffer)
    }),
  )

  await unlink(sourcePath)
  console.log(`resized ${filename} -> ${basename}-{${VARIANT_SUFFIXES.join(',')}}.webp`)
}

const main = async (): Promise<void> => {
  const entries = await readdir(BLOG_IMAGES_DIR)
  const sources = entries.filter((name) => extname(name) === '.webp')

  if (sources.length === 0) {
    console.log('No unprocessed .webp files found in public/images/blog/.')
    return
  }

  for (const filename of sources) {
    await resizeOne(filename)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
