import { completeNewPassword } from '@api/auth'
import Button from '@components/Button'
import Loading from '@components/Loading'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import type { AuthChallenge } from '@types/auth'
import { type FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import styles from './Login.module.css'

const isChallenge = (result: unknown): result is AuthChallenge =>
  typeof result === 'object' &&
  result !== null &&
  'challengeName' in result &&
  (result as AuthChallenge).challengeName === 'NEW_PASSWORD_REQUIRED'

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

  const redirectTo = searchParams.get('redirect') ?? '/admin/recipes'

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

  if (challenge) {
    return (
      <div className={styles.page}>
        <form className={styles.form} onSubmit={handleNewPassword}>
          <Typography variant="heading2" className={styles.title}>
            Set new password
          </Typography>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              className={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-describedby={error ? 'form-error' : undefined}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-describedby={error ? 'form-error' : undefined}
            />
          </div>

          {error && (
            <p id="form-error" className={styles.error}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? <Loading size="small" /> : 'Set new password'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleLogin}>
        <Typography variant="heading2" className={styles.title}>
          Log in
        </Typography>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={error ? 'form-error' : undefined}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={error ? 'form-error' : undefined}
            required
          />
        </div>

        {error && (
          <p id="form-error" className={styles.error}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? <Loading size="small" /> : 'Log in'}
        </Button>
      </form>
    </div>
  )
}

export default Login
