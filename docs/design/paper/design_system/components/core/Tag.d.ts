import * as React from 'react';

/**
 * @startingPoint section="Core" subtitle="Mono chip — tech tag, category, removable, or filter button" viewport="700x120"
 */
export interface TagProps {
  /** `span` for display, `button` for an interactive filter chip. @default 'span' */
  as?: 'span' | 'button';
  /** Selected filter state (accent fill). @default false */
  active?: boolean;
  /** Adds a ✕ remove control (editor tag input). @default false */
  removable?: boolean;
  onRemove?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Tag(props: TagProps): JSX.Element;
