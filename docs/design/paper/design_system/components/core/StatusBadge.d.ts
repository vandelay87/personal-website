import * as React from 'react';

/**
 * @startingPoint section="Core" subtitle="Dot-pill record status — success/warning/error/neutral" viewport="700x100"
 */
export interface StatusBadgeProps {
  /** @default 'neutral' */
  tone?: 'success' | 'warning' | 'error' | 'neutral';
  /** Show the leading dot. @default true */
  dot?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function StatusBadge(props: StatusBadgeProps): JSX.Element;
