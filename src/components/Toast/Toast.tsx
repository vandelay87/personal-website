import type { FC } from 'react'

export interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export const Toast: FC<ToastProps> = () => {
  return null
}

export default Toast
