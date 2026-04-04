import type { ElementType, FC, ReactNode } from 'react'

import styles from './Typography.module.css'

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

const defaultElements: Record<TypographyVariant, ElementType> = {
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
  heading4: 'h4',
  body: 'p',
  bodyLarge: 'p',
  label: 'span',
  caption: 'span',
}

const Typography: FC<TypographyProps> = ({
  variant,
  as,
  children,
  className,
}) => {
  const Component = as ?? defaultElements[variant]
  const combinedClassName = [styles[variant], className]
    .filter(Boolean)
    .join(' ')

  return <Component className={combinedClassName}>{children}</Component>
}

export default Typography
