import { completeNewPassword } from '@api/auth'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import type { AuthChallenge } from '@models/auth'
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import styles from './Login.module.css'

const isChallenge = (result: unknown): result is AuthChallenge =>
  typeof result === 'object' &&
  result !== null &&
  'challengeName' in result &&
  (result as AuthChallenge).challengeName === 'NEW_PASSWORD_REQUIRED'

interface FieldConfig {
  id: string
  name: string
  label: string
  type: string
  autoComplete: string
  placeholder: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [challenge, setChallenge] = useState<AuthChallenge | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const firstFieldRef = useRef<HTMLInputElement>(null)

  const redirectTo = searchParams.get('redirect') ?? '/admin/recipes'
  const isSetPassword = Boolean(challenge)

  // Moves focus to the first field of the newly-shown form when the Cognito
  // NEW_PASSWORD_REQUIRED challenge flips the page from sign-in to
  // set-password mode. `challenge` only ever transitions null -> set (never
  // back), so this effect's own [isSetPassword] dependency already gates it
  // to firing once, on that transition — it can't re-fire on mount, since
  // isSetPassword starts false there.
  useEffect(() => {
    if (isSetPassword) {
      firstFieldRef.current?.focus()
    }
  }, [isSetPassword])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)

      if (isChallenge(result)) {
        setChallenge(result)
      } else {
        navigate(redirectTo)
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Something went wrong. Please try again.')
      } else if (
        err instanceof Error &&
        (err.message.includes('401') || err.message.includes('Unauthorized'))
      ) {
        setError('Incorrect email or password')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNewPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await completeNewPassword(email, challenge!.session, newPassword)
      navigate(redirectTo)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = isSetPassword
    ? {
        heading: 'Set a new password',
        subheading: 'Your account needs a password before you can continue.',
        idleLabel: 'Set password & continue',
        loadingLabel: 'Saving…',
      }
    : {
        heading: 'Sign in',
        subheading: 'Enter your credentials to access the admin.',
        idleLabel: 'Sign in',
        loadingLabel: 'Signing in…',
      }
  const submitLabel = loading ? copy.loadingLabel : copy.idleLabel

  const fields: FieldConfig[] = isSetPassword
    ? [
        {
          id: 'new-password',
          name: 'newPassword',
          label: 'New password',
          type: 'password',
          autoComplete: 'new-password',
          placeholder: 'At least 8 characters',
          value: newPassword,
          onChange: (e) => setNewPassword(e.target.value),
        },
        {
          id: 'confirm-password',
          name: 'confirmPassword',
          label: 'Confirm password',
          type: 'password',
          autoComplete: 'new-password',
          placeholder: 'Re-enter your new password',
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
        },
      ]
    : [
        {
          id: 'email',
          name: 'email',
          label: 'Email',
          type: 'email',
          autoComplete: 'username',
          placeholder: 'you@akli.dev',
          value: email,
          onChange: (e) => setEmail(e.target.value),
        },
        {
          id: 'password',
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'current-password',
          placeholder: '••••••••••',
          value: password,
          onChange: (e) => setPassword(e.target.value),
        },
      ]

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Card fill radius="var(--radius-2xl)" padding="clamp(26px, 4vw, 34px)">
          <header className={styles.cardHeader}>
            <Typography variant="heading3" as="h1" className={styles.heading}>
              {copy.heading}
            </Typography>
            <Typography variant="body" as="p" className={styles.subheading}>
              {copy.subheading}
            </Typography>
          </header>

          {error && (
            <div id="form-error" role="alert" className={styles.errorBox}>
              <span aria-hidden="true" className={styles.errorDot}>
                ●
              </span>
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          <form
            className={styles.form}
            onSubmit={isSetPassword ? handleNewPassword : handleLogin}
            noValidate
          >
            {fields.map((field, index) => (
              <label key={field.id} className={styles.field} htmlFor={field.id}>
                <Typography variant="label" as="span">
                  {field.label}
                </Typography>
                <Input
                  ref={index === 0 ? firstFieldRef : undefined}
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={field.onChange}
                  ariaDescribedBy={error ? 'form-error' : undefined}
                />
              </label>
            ))}

            <Button type="submit" loading={loading} fullWidth>
              {submitLabel}
            </Button>
          </form>

          {isSetPassword && (
            <Typography variant="caption" as="p" className={styles.footnote}>
              First time signing in? Choose a password to finish setting up your account.
            </Typography>
          )}
        </Card>

        <Typography variant="caption" as="p" className={styles.belowCard}>
          Authorized access only.
        </Typography>
      </div>
    </div>
  )
}

export default Login
