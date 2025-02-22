declare module '*.mdx' {
  import type { ComponentProps, JSX } from 'react'

  interface MDXProps extends ComponentProps<'div'> {
    frontMatter?: {
      title?: string
      date?: string
    }
  }

  const MDXComponent: (props: MDXProps) => JSX.Element
  export default MDXComponent
}
