import Tag from '@components/Tag'
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [suggestionsClosed, setSuggestionsClosed] = useState(false)
  const listboxId = useId()

  const filtered = inputValue
    ? existingTags.filter(
        (t) => t.toLowerCase().startsWith(inputValue.toLowerCase()) && !tags.includes(t)
      )
    : []

  const isExpanded = filtered.length > 0 && !suggestionsClosed

  const resetHighlight = () => {
    setHighlightedIndex(-1)
    setSuggestionsClosed(false)
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onChange([...tags, tag.trim()])
    }
    setInputValue('')
    resetHighlight()
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    resetHighlight()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const highlighted = isExpanded ? filtered[highlightedIndex] : undefined
      if (highlighted) {
        addTag(highlighted)
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
      return
    }

    if (!isExpanded) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSuggestionsClosed(true)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.chips}>
        {tags.map((tag, i) => (
          <Tag
            key={tag}
            removable
            onRemove={() => removeTag(i)}
            className={styles.chip}
            removeClassName={styles.chipRemove}
          >
            {tag}
          </Tag>
        ))}
      </div>

      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          role="combobox"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          aria-activedescendant={
            isExpanded && highlightedIndex >= 0
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
          placeholder={placeholder}
        />

        {isExpanded && (
          <ul id={listboxId} role="listbox" className={styles.listbox}>
            {filtered.map((tag, index) => (
              // Keyboard selection is handled by the input's own onKeyDown (Enter
              // selects filtered[highlightedIndex] via the same addTag call); DOM
              // focus never leaves the input, per the WAI-ARIA combobox pattern.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={tag}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
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
