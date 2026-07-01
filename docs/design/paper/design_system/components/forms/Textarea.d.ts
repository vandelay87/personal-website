import * as React from 'react';

/** Multi-line text field; shares Input's styling. */
export interface TextareaProps {
  value?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
}

export function Textarea(props: TextareaProps): JSX.Element;
