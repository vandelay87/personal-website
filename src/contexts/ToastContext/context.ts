import type { ToastTone } from '@components/Toast'
import { createContext, useContext } from 'react'

export interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

export const useToast = () => useContext(ToastContext)
