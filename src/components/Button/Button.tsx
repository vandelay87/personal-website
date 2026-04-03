import { ReactNode, ReactElement } from 'react'
import styles from './Button.module.css'

interface ButtonProps {
  onClick: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  ariaLabel?: string
}

const Button = ({
  onClick,
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  ariaLabel,
}: ButtonProps): ReactElement => {
  const className = [styles.button, styles[variant]].join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

export default Button
