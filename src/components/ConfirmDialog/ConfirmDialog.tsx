
import Button from '@components/Button'
import Typography from '@components/Typography'
import { useRef, type FC, type KeyboardEvent } from 'react'

import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

const TITLE_ID = 'confirm-dialog-title'

const ConfirmDialog: FC<ConfirmDialogProps> = ({ title, message, onConfirm, onCancel, isOpen }) => {
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onCancel()
      return
    }
    if (e.key === 'Tab') {
      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <Typography variant="heading3" as="h2" id={TITLE_ID}>
          {title}
        </Typography>
        <Typography variant="body" className={styles.message}>
          {message}
        </Typography>
        <div className={styles.actions}>
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
