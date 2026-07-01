import * as React from 'react';

/**
 * @startingPoint section="Content" subtitle="Code panel — filename header + copy button" viewport="700x200"
 */
export interface CodeBlockProps {
  /** Header label (path). Omit for a bare panel. */
  filename?: string;
  code: string;
}

export function CodeBlock(props: CodeBlockProps): JSX.Element;
