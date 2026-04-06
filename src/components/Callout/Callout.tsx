import type { FC, ReactNode } from 'react'

export interface CalloutProps {
  type: 'tip' | 'warning' | 'info'
  children: ReactNode
}

const Callout: FC<CalloutProps> = () => {
  return null
}

export default Callout
