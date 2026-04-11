import type { FC } from 'react'

export interface ConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

export const ConfirmDialog: FC<ConfirmDialogProps> = () => {
  return null
}

export default ConfirmDialog
