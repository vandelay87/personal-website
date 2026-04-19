import type { FC } from 'react'

export interface AutosaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: Date | null
  onRetry: () => void
}

const AutosaveStatus: FC<AutosaveStatusProps> = () => {
  throw new Error('AutosaveStatus: not implemented')
}

export default AutosaveStatus
