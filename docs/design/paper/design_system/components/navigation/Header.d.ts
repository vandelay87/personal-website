import * as React from 'react';

/**
 * @startingPoint section="Navigation" subtitle="Site shell top bar — public & admin variants" viewport="1080x88"
 */
export interface HeaderLink {
  label: string;
  href: string;
  /** Marks the current page (full-strength text). */
  active?: boolean;
}

export interface HeaderProps {
  /** @default 'public' */
  variant?: 'public' | 'admin';
  /** Wordmark text. @default 'Akli Aissat' */
  brand?: string;
  brandHref?: string;
  links?: HeaderLink[];
  /** Sticky + translucent blur. @default true */
  sticky?: boolean;
  /** Admin: signed-in email shown at right. */
  email?: string;
  /** Admin: Log out handler (renders the button when set). */
  onLogout?: () => void;
  /** @default 'light' */
  theme?: 'light' | 'dark';
  onToggle?: () => void;
}

export function Header(props: HeaderProps): JSX.Element;
