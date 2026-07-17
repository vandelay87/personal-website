import Button from '@components/Button'
import Typography from '@components/Typography'
import { useEffect, useRef, type FC, type MouseEvent, type ReactNode } from 'react'

import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Danger icon + red confirm button (destructive actions). @default false */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const TITLE_ID = 'confirm-dialog-title'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (!dialog.open) dialog.showModal()
      dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      triggerRef.current?.focus()
      triggerRef.current = null
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  const handleScrimClick = (event: MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (!dialog || event.target !== dialog) return

    // `.dialog`'s background/border/padding live on the <dialog> element
    // itself (no separate inner wrapper), so `target === dialog` alone
    // doesn't distinguish a genuine scrim click from a click that lands in
    // the dialog's own padding (still `target === dialog`, since the padding
    // area has no other element painted over it). Compare against the
    // rendered box instead: outside it is the ::backdrop (scrim), inside it
    // is dialog content/whitespace.
    const rect = dialog.getBoundingClientRect()
    const clickedInsideDialogBox =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom

    if (!clickedInsideDialogBox) {
      onCancel()
    }
  }

  return (
    // The click listener only distinguishes a scrim click (event.target ===
    // the dialog element itself, since the ::backdrop is not a real
    // descendant) from a click inside the dialog's content; Escape/close is
    // handled natively by <dialog>. There is no interactive-element
    // alternative for this check.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={dialogRef}
      aria-labelledby={TITLE_ID}
      className={styles.dialog}
      onClick={handleScrimClick}
      onCancel={onCancel}
    >
      {open && (
        <>
          <Typography
            variant="heading3"
            as="h2"
            id={TITLE_ID}
            className={danger ? styles.dangerTitle : undefined}
          >
            {title}
          </Typography>
          {children && (
            <Typography variant="body" className={styles.message}>
              {children}
            </Typography>
          )}
          <div className={styles.actions}>
            <Button onClick={onCancel} variant="outline">
              {cancelLabel}
            </Button>
            <Button onClick={onConfirm} variant={danger ? 'danger' : 'solid'}>
              {confirmLabel}
            </Button>
          </div>
        </>
      )}
    </dialog>
  )
}

export default ConfirmDialog
