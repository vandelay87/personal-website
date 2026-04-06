import { useRef } from 'react'

import type { HTMLAttributes } from 'react'

import styles from './CodeBlock.module.css'

export type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  'data-meta'?: string
}

const extractTitle = (meta: string | undefined): string | null => {
  if (!meta) return null
  const match = meta.match(/title="([^"]+)"/)
  return match ? match[1] : null
}

const CodeBlock = ({
  children,
  'data-meta': dataMeta,
  className,
  ...rest
}: CodeBlockProps) => {
  const preRef = useRef<HTMLPreElement>(null)

  const title = extractTitle(dataMeta)

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const text = preRef.current?.textContent ?? ''
      navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className={styles.wrapper}>
      {title && (
        <div className={styles.filenameHeader} data-testid="code-block-filename">
          {title}
        </div>
      )}
      <button
        type="button"
        className={styles.copyButton}
        onClick={handleCopy}
        aria-label="Copy code"
      >
        Copy
      </button>
      <pre
        ref={preRef}
        className={`${styles.pre} line-numbers${className ? ` ${className}` : ''}`}
        data-line-numbers
        {...rest}
      >
        {children}
      </pre>
    </div>
  )
}

export default CodeBlock
