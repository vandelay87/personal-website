declare module '*.mdx' {
  import type { ComponentType, ReactNode, JSX } from 'react'

  export interface MDXComponents {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: ComponentType<any>
  }

  interface MDXProps {
    components?: MDXComponents
    children?: ReactNode
  }

  const MdxComponent: (props: MDXProps) => JSX.Element
  export default MdxComponent
}
