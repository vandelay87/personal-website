import { useRef, useState, useCallback } from 'react'

import type { HTMLAttributes } from 'react'

import styles from './CodeBlock.module.css'

export type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  'data-meta'?: string
}

const extractTitle = (meta: string | undefined): string | null => {
  if (!meta) return null
  const match = meta.match(/title=["']([^"']+)["']/)
  return match ? match[1] : null
}

const CodeBlock = ({
  children,
  'data-meta': dataMeta,
  className,
  ...rest
}: CodeBlockProps) => {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const title = extractTitle(dataMeta)

  const handleCopy = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const text = preRef.current?.textContent ?? ''
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {title && (
          <span className={styles.filenameHeader} data-testid="code-block-filename">
            {title}
          </span>
        )}
        <button
          type="button"
          className={`${styles.copyButton}${copied ? ` ${styles.copied}` : ''}`}
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </div>
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
