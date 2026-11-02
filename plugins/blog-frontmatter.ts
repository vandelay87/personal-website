import { z } from 'zod'

const nonEmptyString = z.string().min(1)

const optional = <T extends z.ZodType>(schema: T) => z.preprocess((value) => value ?? undefined, schema.optional())

const postHeroFrontmatterSchema = z.object({
  stem: nonEmptyString,
  alt: nonEmptyString,
  caption: optional(nonEmptyString),
})

export const postFrontmatterSchema = z.object({
  title: nonEmptyString,
  date: z.iso.date(),
  description: nonEmptyString,
  tags: z.array(nonEmptyString),
  hero: optional(postHeroFrontmatterSchema),
})

export type PostHeroFrontmatter = z.output<typeof postHeroFrontmatterSchema>
export type PostFrontmatter = z.output<typeof postFrontmatterSchema>
