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
    'px-4 py-2 rounded focus:outline-none focus:ring-2 transition duration-200 cursor-pointer disabled:cursor-not-allowed'
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-300',
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
