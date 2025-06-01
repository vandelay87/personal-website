import { ReactNode, ReactElement } from 'react'

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
  const baseStyles =
    'px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed'
  const variantStyles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300 dark:focus:ring-offset-gray-900',
    secondary:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300 dark:focus:ring-offset-gray-900',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]}`}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled ? 'true' : 'false'}
    >
      {children}
    </button>
  )
}

export default Button
