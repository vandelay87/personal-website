import * as React from 'react';

/**
 * @startingPoint section="Core" subtitle="Text link with hover tint + nudging directional icon" viewport="700x120"
 */
export interface LinkProps {
  href?: string;
  /** @default 'inherit' */
  tone?: 'inherit' | 'muted' | 'accent';
  /** Optional icon (chevron/arrow) that animates on hover. */
  icon?: React.ReactNode;
  /** @default 'right' */
  iconSide?: 'left' | 'right';
  /** Direction the icon nudges on hover. @default 'right' */
  nudge?: 'left' | 'right' | 'up-right' | 'none';
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Link(props: LinkProps): JSX.Element;
