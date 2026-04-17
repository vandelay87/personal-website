import { ReactNode, ReactElement, type CSSProperties } from 'react'
import styles from './Button.module.css'

interface ButtonProps {
  onClick: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  ariaLabel?: string
  ariaPressed?: 'true' | 'false'
  className?: string
  style?: CSSProperties
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
  style,
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
      style={style}
    >
      {children}
    </button>
  )
}

export default Button
