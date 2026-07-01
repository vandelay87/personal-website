import * as React from 'react';

/**
 * @startingPoint section="Overlays" subtitle="Modal confirm — optional danger styling" viewport="700x260"
 */
export interface ConfirmDialogProps {
  open?: boolean;
  title?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Danger icon + red confirm button (destructive actions). @default false */
  danger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element;
