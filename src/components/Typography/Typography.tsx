import type { ElementType, ReactNode } from 'react'

type TypographyVariant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'body'
  | 'bodyLarge'
  | 'label'
  | 'caption'

interface TypographyProps {
  variant: TypographyVariant
  as?: ElementType
  children: ReactNode
  className?: string
}

export default function Typography(_props: TypographyProps) {
  return null
}
