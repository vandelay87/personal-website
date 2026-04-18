import { handleSessionError } from '@api/auth'
import { fetchUsers, inviteUser, removeUser, UserExistsError } from '@api/users'
import Button from '@components/Button'
import ConfirmDialog from '@components/ConfirmDialog'
import Loading from '@components/Loading'
import Toast, { type ToastState } from '@components/Toast'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import type { AdminRole, AdminUser } from '@models/auth'
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './UserManagement.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim())

const UserManagement = () => {
  const { getAccessToken, logout, user: currentUser } = useAuth()
  const navigate = useNavigate()
  const emailInputId = useId()
  const roleInputId = useId()
  const emailErrorId = useId()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const [inviteFormOpen, setInviteFormOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('contributor')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const token = await getAccessToken()
      const data = await fetchUsers(token)
      setUsers(data)
    } catch (err) {
      if (!handleSessionError(err, logout, navigate)) {
        setError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, logout, navigate])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const resetInviteForm = () => {
    setInviteFormOpen(false)
    setInviteEmail('')
    setInviteRole('contributor')
    setInviteError(null)
  }

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidEmail(inviteEmail) || inviteSubmitting) return

    const trimmedEmail = inviteEmail.trim()
    setInviteSubmitting(true)
    setInviteError(null)
    try {
      const token = await getAccessToken()
      await inviteUser(token, trimmedEmail, inviteRole)
      resetInviteForm()
      setToast({ message: `Invite sent to ${trimmedEmail}`, type: 'success' })
      await loadUsers()
    } catch (err) {
      if (err instanceof UserExistsError) {
        setInviteError('User already exists')
      } else if (!handleSessionError(err, logout, navigate)) {
        setInviteError('Something went wrong. Please try again.')
      }
    } finally {
      setInviteSubmitting(false)
    }
  }

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return
    const target = removeTarget
    setRemoveTarget(null)
    try {
      const token = await getAccessToken()
      await removeUser(token, target.userId)
      setToast({ message: `User ${target.email} removed`, type: 'success' })
      await loadUsers()
    } catch (err) {
      if (!handleSessionError(err, logout, navigate)) {
        setToast({ message: 'Failed to remove user', type: 'error' })
      }
    }
  }

  const emailValid = isValidEmail(inviteEmail)
  const submitDisabled = !emailValid || inviteSubmitting

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingWrapper}>
          <Loading />
        </div>
      )
    }

    if (error) {
      return (
        <>
          <Typography variant="body">Something went wrong.</Typography>
          <Button onClick={loadUsers}>Retry</Button>
        </>
      )
    }

    return (
      <>
        <div className={styles.header}>
          <Typography variant="heading2">Users</Typography>
          {!inviteFormOpen && (
            <Button onClick={() => setInviteFormOpen(true)}>Invite user</Button>
          )}
        </div>

        {inviteFormOpen && (
          <form className={styles.inviteForm} onSubmit={handleInviteSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor={emailInputId} className={styles.label}>
                Email
              </label>
              <input
                id={emailInputId}
                type="email"
                value={inviteEmail}
                onChange={(event) => {
                  setInviteEmail(event.target.value)
                  setInviteError(null)
                }}
                aria-invalid={inviteError !== null}
                aria-describedby={inviteError ? emailErrorId : undefined}
                className={styles.input}
                autoComplete="email"
                required
              />
              {inviteError && (
                <Typography variant="caption" id={emailErrorId} className={styles.fieldError}>
                  {inviteError}
                </Typography>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor={roleInputId} className={styles.label}>
                Role
              </label>
              <select
                id={roleInputId}
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as AdminRole)}
                className={styles.input}
              >
                <option value="contributor">Contributor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <Button onClick={resetInviteForm} variant="secondary">
                Cancel
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                Send invite
              </Button>
            </div>
          </form>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userRow) => {
                const isSelf = userRow.email === currentUser?.email
                return (
                  <tr key={userRow.userId}>
                    <td>{userRow.email}</td>
                    <td>
                      <span className={styles.badge} data-role={userRow.role}>
                        {userRow.role === 'admin' ? 'Admin' : 'Contributor'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.status} data-status={userRow.status}>
                        {userRow.status === 'confirmed' ? 'Confirmed' : 'Invite sent'}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      {!isSelf && (
                        <Button
                          onClick={() => setRemoveTarget(userRow)}
                          variant="secondary"
                          ariaLabel={`Remove ${userRow.email}`}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ConfirmDialog
          title="Remove user"
          message={
            removeTarget
              ? `Are you sure you want to remove ${removeTarget.email}? They will lose access immediately.`
              : ''
          }
          isOpen={removeTarget !== null}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setRemoveTarget(null)}
          confirmLabel="Confirm"
        />
      </>
    )
  }

  return (
    <div className={styles.page}>
      {renderContent()}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}

export default UserManagement
