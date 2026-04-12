import type { Step } from '@types/recipe'
import type { FC } from 'react'

export interface StepListProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
  getToken: () => Promise<string>
}

const StepList: FC<StepListProps> = () => {
  return null
}

export default StepList
