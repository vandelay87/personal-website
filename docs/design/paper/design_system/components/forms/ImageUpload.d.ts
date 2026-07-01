import * as React from 'react';

/**
 * @startingPoint section="Forms" subtitle="Async image field — empty / processing / ready" viewport="700x220"
 */
export interface ImageUploadProps {
  /** @default 'empty' */
  state?: 'empty' | 'processing' | 'ready';
  /** Preview URL when ready. */
  url?: string;
  label?: string;
  hint?: string;
  /** CSS aspect-ratio for the frame. @default '16/9' */
  aspect?: string;
  /** Fixed height instead of aspect (e.g. step thumbnails). */
  height?: string;
  onUpload?: () => void;
  onRemove?: () => void;
}

export function ImageUpload(props: ImageUploadProps): JSX.Element;
