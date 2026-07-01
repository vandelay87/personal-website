import * as React from 'react';

/**
 * @startingPoint section="Feedback" subtitle="Article note — tip / warning / info" viewport="700x140"
 */
export interface CalloutProps {
  /** @default 'tip' */
  type?: 'tip' | 'warning' | 'info';
  children?: React.ReactNode;
}

export function Callout(props: CalloutProps): JSX.Element;
