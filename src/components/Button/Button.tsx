import { ReactNode, ReactElement } from 'react'
import styles from './Button.module.css'

interface ButtonProps {
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  ariaLabel?: string
  ariaPressed?: 'true' | 'false'
  className?: string
}

const Button = ({
  onClick,
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  ariaLabel,
  ariaPressed,
  className: extraClassName,
}: ButtonProps): ReactElement => {
  const className = [styles.button, styles[variant], extraClassName].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  )
}

export default Button
