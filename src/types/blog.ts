import { z } from 'zod'

const nonEmptyString = z.string().min(1)

const postHeroFrontmatterSchema = z.object({
  stem: nonEmptyString,
  alt: nonEmptyString,
  caption: nonEmptyString.optional(),
})

export const postFrontmatterSchema = z.object({
  title: nonEmptyString,
  date: z.iso.date(),
  description: nonEmptyString,
  tags: z.array(nonEmptyString),
  hero: postHeroFrontmatterSchema.optional(),
})

export type PostHeroFrontmatter = z.output<typeof postHeroFrontmatterSchema>
export type PostFrontmatter = z.output<typeof postFrontmatterSchema>
