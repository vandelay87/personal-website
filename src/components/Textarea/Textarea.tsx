import type { ChangeEvent, FC } from 'react'

import interactions from '../../styles/interactions.module.css'
import styles from './Textarea.module.css'

export interface TextareaProps {
  value?: string
  placeholder?: string
  /** @default 3 */
  rows?: number
  disabled?: boolean
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  id?: string
  name?: string
  required?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  className?: string
}

const Textarea: FC<TextareaProps> = ({
  value,
  placeholder,
  rows = 3,
  disabled = false,
  onChange,
  id,
  name,
  required,
  ariaLabel,
  ariaDescribedBy,
  className: extraClassName,
}) => {
  const className = [interactions.fieldFocusRing, styles.field, extraClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <textarea
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required={required}
      onChange={onChange}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={className}
    />
  )
}

export default Textarea
