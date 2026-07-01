import * as React from 'react';

/**
 * @startingPoint section="Forms" subtitle="Text field with focus ring, prefix icon, invalid state" viewport="700x120"
 */
export interface InputProps {
  type?: string;
  value?: string;
  placeholder?: string;
  /** Error border + ring. @default false */
  invalid?: boolean;
  disabled?: boolean;
  /** Leading icon (e.g. search). */
  prefixIcon?: React.ReactNode;
  /** Trailing node (e.g. clear ✕). */
  suffix?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
