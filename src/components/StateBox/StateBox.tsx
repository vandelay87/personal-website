import Button from '@components/Button'
import Loading from '@components/Loading'
import Typography from '@components/Typography'
import type { FC, ReactNode } from 'react'

import stateBox from '../../styles/stateBox.module.css'
import styles from './StateBox.module.css'

export interface StateBoxAction {
  label: string
  onClick: () => void
  icon?: ReactNode
}

export type StateBoxProps =
  | { variant: 'loading'; label?: string }
  | {
      variant: 'error'
      icon: ReactNode
      heading: ReactNode
      body: ReactNode
      action?: StateBoxAction
    }

const StateBox: FC<StateBoxProps> = (props) => {
  if (props.variant === 'loading') {
    return (
      <div className={`${stateBox.box} ${stateBox.loading}`}>
        <Loading label={props.label} />
      </div>
    )
  }

  const { icon, heading, body, action } = props

  return (
    <div className={`${stateBox.box} ${stateBox.error}`}>
      <div className={`${stateBox.icon} ${stateBox.iconError}`}>{icon}</div>
      <Typography variant="heading2" className={stateBox.heading}>
        {heading}
      </Typography>
      <Typography variant="body" className={`${stateBox.body} ${styles.errorBody}`}>
        {body}
      </Typography>
      {action && (
        <Button variant="outline" onClick={action.onClick} iconLeft={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default StateBox
