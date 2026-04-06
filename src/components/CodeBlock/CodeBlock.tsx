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
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="8" y="8" width="14" height="14" />
              <path d="M8 16H2V2H16V8" />
            </svg>
          )}
        </button>
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
