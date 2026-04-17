import Button from '@components/Button'
import { useId, useState, type FC, type KeyboardEvent } from 'react'


import styles from './TagInput.module.css'

export interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  existingTags?: string[]
  inputId?: string
  placeholder?: string
}

const TagInput: FC<TagInputProps> = ({
  tags,
  onChange,
  existingTags = [],
  inputId,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState('')
  const listboxId = useId()

  const filtered = inputValue
    ? existingTags.filter(
        (t) => t.toLowerCase().startsWith(inputValue.toLowerCase()) && !tags.includes(t)
      )
    : []

  const isExpanded = filtered.length > 0

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onChange([...tags, tag.trim()])
    }
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.chips}>
        {tags.map((tag, i) => (
          <span key={tag} className={styles.chip}>
            {tag}
            <Button
              onClick={() => removeTag(i)}
              ariaLabel={`Remove ${tag}`}
              variant="secondary"
              className={styles.removeBtn}
            >
              &times;
            </Button>
          </span>
        ))}
      </div>

      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          role="combobox"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
          placeholder={placeholder}
        />

        {isExpanded && (
          <ul id={listboxId} role="listbox" className={styles.listbox}>
            {filtered.map((tag) => (
              <li
                key={tag}
                role="option"
                className={styles.option}
                onClick={() => addTag(tag)}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TagInput
