import * as React from 'react';

/**
 * @startingPoint section="Navigation" subtitle="Round light/dark toggle" viewport="700x90"
 */
export interface ThemeToggleProps {
  /** @default 'light' */
  theme?: 'light' | 'dark';
  onToggle?: () => void;
}

export function ThemeToggle(props: ThemeToggleProps): JSX.Element;
