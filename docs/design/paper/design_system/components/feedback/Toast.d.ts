import * as React from 'react';

/**
 * @startingPoint section="Feedback" subtitle="Quiet dismissible toast — success/error/info" viewport="700x120"
 */
export interface ToastProps {
  /** @default 'info' */
  tone?: 'success' | 'error' | 'info';
  children?: React.ReactNode;
  /** Click-anywhere dismiss handler. */
  onDismiss?: () => void;
}

export function Toast(props: ToastProps): JSX.Element;
