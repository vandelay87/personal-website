import * as React from 'react';

/**
 * @startingPoint section="Core" subtitle="Rounded container — hairline border, optional fill + hover" viewport="700x200"
 */
export interface CardProps {
  as?: keyof JSX.IntrinsicElements;
  /** Surface fill vs page background. @default false */
  fill?: boolean;
  /** CSS padding value. @default var(--space-6) */
  padding?: string;
  /** CSS border-radius. @default var(--radius-xl) */
  radius?: string;
  /** Subtle hover wash for clickable cards. @default false */
  hover?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
