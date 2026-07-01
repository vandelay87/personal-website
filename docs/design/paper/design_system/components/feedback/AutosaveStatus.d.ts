import * as React from 'react';

/**
 * @startingPoint section="Feedback" subtitle="Autosave indicator — saving / saved / error+retry" viewport="700x100"
 */
export interface AutosaveStatusProps {
  /** @default 'saved' */
  state?: 'saving' | 'saved' | 'error';
  /** Relative-time label, e.g. "Saved just now". @default 'Saved' */
  savedLabel?: string;
  onRetry?: () => void;
}

export function AutosaveStatus(props: AutosaveStatusProps): JSX.Element;
