import * as React from 'react';
/** Shimmer placeholder for an asset still processing. */
export interface ProcessingPlaceholderProps {
  /** @default '16/9' */
  aspect?: string;
  height?: string;
  label?: string;
  /** Compact variant (step thumbnails). @default false */
  small?: boolean;
}
export function ProcessingPlaceholder(props: ProcessingPlaceholderProps): JSX.Element;
