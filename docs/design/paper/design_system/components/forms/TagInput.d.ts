import * as React from 'react';

/**
 * @startingPoint section="Forms" subtitle="Chips + add-on-Enter field + suggestions" viewport="700x180"
 */
export interface TagInputProps {
  tags: string[];
  /** Pool of existing tags to suggest (filtered against current). */
  suggestions?: string[];
  onAdd?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  placeholder?: string;
}

export function TagInput(props: TagInputProps): JSX.Element;
