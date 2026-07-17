// Ambient type for vite-imagetools srcset query imports (e.g. `import s from '*.webp?...&as=srcset'`)
declare module '*&as=srcset' {
  const src: string
  export default src
}

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

// See plugins/blog-posts-meta.ts — build-time frontmatter/reading-time
// metadata for src/pages/Blog/posts, sourced from raw file text rather
// than the compiled .mdx module so posts/index.ts never statically
// imports the same module contentModules dynamically imports.
declare module 'virtual:blog-posts-meta' {
  export const frontmatterMap: Record<
    string,
    {
      title: string
      date: string
      description: string
      tags: string[]
      image?: string
    }
  >
  export const readingTimeMap: Record<string, number>
}
