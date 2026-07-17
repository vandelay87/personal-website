import { handleSessionError } from '@api/auth'
import { fetchUsers, inviteUser, removeUser, UserExistsError } from '@api/users'
import Button from '@components/Button'
import ConfirmDialog from '@components/ConfirmDialog'
import { IconAlertCircle, iconDelete, iconInvite, iconRetry, iconWarning } from '@components/icons'
import Input from '@components/Input'
import StateBox from '@components/StateBox'
import StatusBadge from '@components/StatusBadge'
import Typography from '@components/Typography'
import { useAuth } from '@contexts/AuthContext'
import { useToast } from '@contexts/ToastContext'
import type { AdminRole, AdminUser } from '@models/auth'
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import interactions from '../../../styles/interactions.module.css'
import text from '../../../styles/text.module.css'
import styles from './UserManagement.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim())

const ROLE_OPTIONS: AdminRole[] = ['contributor', 'admin']

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: 'Admin',
  contributor: 'Contributor',
}

const ROLE_HINT: Record<AdminRole, string> = {
  admin:
    'Admins can manage recipes and users, including inviting and removing people.',
  contributor: "Contributors can create and manage recipes, but can't manage users.",
}

const UserManagement = () => {
  const { getAccessToken, logout, user: currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const emailInputId = useId()
  const emailErrorId = useId()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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
      showToast(`Invite sent to ${trimmedEmail}`, 'success')
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
      showToast(`User ${target.email} removed`, 'success')
      await loadUsers()
    } catch (err) {
      if (!handleSessionError(err, logout, navigate)) {
        showToast('Failed to remove user', 'error')
      }
    }
  }

  const emailValid = isValidEmail(inviteEmail)
  const submitDisabled = !emailValid || inviteSubmitting

  const renderBody = () => {
    if (loading) {
      return <StateBox variant="loading" label="Loading users…" />
    }

    if (error) {
      return (
        <StateBox
          variant="error"
          icon={iconWarning}
          heading="Couldn't load users"
          body="Something went wrong reaching the server. Check your connection and try again."
          action={{ label: 'Retry', onClick: loadUsers, icon: iconRetry }}
        />
      )
    }

    return (
      <>
        {inviteFormOpen && (
          <div className={styles.inviteCard}>
            <div className={styles.inviteCardHeader}>
              <Typography variant="heading2" className={styles.inviteHeading}>
                Invite a user
              </Typography>
              <button
                type="button"
                className={`${interactions.focusRing} ${styles.closeButton}`}
                onClick={resetInviteForm}
                aria-label="Close"
              >
                &#10005;
              </button>
            </div>

            <form className={styles.inviteForm} onSubmit={handleInviteSubmit} noValidate>
              <div className={styles.field}>
                <label htmlFor={emailInputId} className={styles.label}>
                  Email address
                </label>
                <Input
                  id={emailInputId}
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => {
                    setInviteEmail(event.target.value)
                    setInviteError(null)
                  }}
                  invalid={inviteError !== null}
                  ariaDescribedBy={inviteError ? emailErrorId : undefined}
                  autoComplete="email"
                  required
                />
                {inviteError && (
                  <Typography
                    variant="caption"
                    id={emailErrorId}
                    role="alert"
                    className={styles.fieldError}
                  >
                    <IconAlertCircle size={13} ariaHidden />
                    {inviteError}
                  </Typography>
                )}
              </div>

              <fieldset className={styles.roleField}>
                <legend className={styles.label}>Role</legend>
                <div className={styles.roleSeg}>
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`${interactions.focusRing} ${styles.roleOption}`}
                      aria-pressed={inviteRole === role}
                      onClick={() => setInviteRole(role)}
                    >
                      {ROLE_LABEL[role]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className={styles.actionsField}>
                <span className={styles.actionsSpacer} aria-hidden="true">
                  &nbsp;
                </span>
                <div className={styles.formActions}>
                  <Button
                    onClick={resetInviteForm}
                    variant="outline"
                    className={styles.formActionButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitDisabled}
                    className={styles.formActionButton}
                    iconLeft={
                      inviteSubmitting ? (
                        <span
                          className={`${interactions.spinner} ${interactions.spinnerSm}`}
                          aria-hidden="true"
                        />
                      ) : undefined
                    }
                  >
                    {inviteSubmitting ? 'Sending…' : 'Send invite'}
                  </Button>
                </div>
              </div>
            </form>

            <Typography variant="caption" className={styles.roleHint}>
              {ROLE_HINT[inviteRole]}
            </Typography>
          </div>
        )}

        <ul className={styles.list}>
          {users.map((userRow) => {
            const isSelf = userRow.email === currentUser?.email
            const initial = (userRow.email[0] ?? '?').toUpperCase()
            return (
              <li key={userRow.userId} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initial}
                  </span>
                  <div className={styles.rowIdentity}>
                    <span className={styles.rowEmail}>{userRow.email}</span>
                    {isSelf && (
                      <span className={`${text.tagChipBase} ${styles.selfTag}`}>You</span>
                    )}
                  </div>
                </div>
                <div className={styles.rowMeta}>
                  <StatusBadge
                    dot={false}
                    tone={userRow.role === 'admin' ? 'accent' : 'neutral'}
                    shape="pill"
                  >
                    {ROLE_LABEL[userRow.role]}
                  </StatusBadge>
                  <span className={styles.statusCell} data-status={userRow.status}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {userRow.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </span>
                  <div className={styles.rowActionSlot}>
                    {!isSelf && (
                      <button
                        type="button"
                        className={`${interactions.focusRing} ${styles.removeAction}`}
                        onClick={() => setRemoveTarget(userRow)}
                        title="Remove user"
                      >
                        {iconDelete}
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <ConfirmDialog
          title="Remove user"
          danger
          open={removeTarget !== null}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setRemoveTarget(null)}
          confirmLabel="Confirm"
        >
          {removeTarget &&
            `Remove ${removeTarget.email}? They will lose access immediately. This can't be undone.`}
        </ConfirmDialog>
      </>
    )
  }

  // "person"/"people" is an irregular plural pluralize.ts can't produce
  // (it only appends "s" to the singular) — spelled out directly here.
  const subtitle =
    users.length === 1 ? '1 person has access' : `${users.length} people have access`

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Typography variant="heading1" className={styles.heading}>
            Users
          </Typography>
          {!loading && !error && (
            <Typography variant="body" className={styles.subtitle}>
              {subtitle}
            </Typography>
          )}
        </div>
        {!loading && !error && !inviteFormOpen && (
          <Button onClick={() => setInviteFormOpen(true)} iconLeft={iconInvite}>
            Invite user
          </Button>
        )}
      </div>

      {renderBody()}
    </div>
  )
}

export default UserManagement
