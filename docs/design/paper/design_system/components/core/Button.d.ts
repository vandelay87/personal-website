import * as React from 'react';

/**
 * @startingPoint section="Core" subtitle="Primary action control — solid, outline, danger; pill or rounded" viewport="700x150"
 */
export interface ButtonProps {
  /** Visual weight. @default 'solid' */
  variant?: 'solid' | 'outline' | 'danger';
  /** Corner treatment. `pill` for marketing CTAs, `rounded` for forms. @default 'rounded' */
  shape?: 'rounded' | 'pill';
  /** @default 'md' */
  size?: 'sm' | 'md';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  /** Shows a spinner and blocks interaction. @default false */
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
