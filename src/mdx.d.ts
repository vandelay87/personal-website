declare module '*.mdx' {
  import { JSX } from 'react'
  const MDXComponent: (props: any) => JSX.Element
  export default MDXComponent
}
