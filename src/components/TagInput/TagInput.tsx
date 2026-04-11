import type { FC } from 'react'

export interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  existingTags?: string[]
}

export const TagInput: FC<TagInputProps> = () => {
  return null
}

export default TagInput
