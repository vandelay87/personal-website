import { handleSessionError } from '@api/auth'
import { useAuth } from '@contexts/AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAutosaveOptions {
  intervalMs?: number
}

export interface UseAutosaveResult {
  status: AutosaveStatus
  lastSavedAt: Date | null
  retry: () => void
}

const DEFAULT_INTERVAL_MS = 2000

const stripDirty = <T extends { dirty: boolean }>(state: T): Omit<T, 'dirty'> => {
  const rest = { ...state } as Partial<T>
  delete rest.dirty
  return rest as Omit<T, 'dirty'>
}

// Assumes state fields have stable key ordering — safe for the reducer's static shape
const isEqualSnapshot = <T extends { dirty: boolean }>(
  a: T | null,
  b: T
): boolean => {
  if (a === null) return false
  return JSON.stringify(stripDirty(a)) === JSON.stringify(stripDirty(b))
}

export const useAutosave = <T extends { dirty: boolean }>(
  state: T,
  saveFn: (state: T, signal: AbortSignal) => Promise<void>,
  options?: UseAutosaveOptions
): UseAutosaveResult => {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS

  const { logout } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState<UseAutosaveResult['status']>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const stateRef = useRef<T>(state)
  const saveFnRef = useRef(saveFn)
  const logoutRef = useRef(logout)
  const navigateRef = useRef(navigate)
  const lastSavedSnapshotRef = useRef<T | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pendingRef = useRef(false)
  const isMountedRef = useRef(true)

  stateRef.current = state
  saveFnRef.current = saveFn
  logoutRef.current = logout
  navigateRef.current = navigate

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const runSave = useCallback(async (snapshot: T) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    if (isMountedRef.current) setStatus('saving')

    try {
      await saveFnRef.current(snapshot, controller.signal)
      if (controller.signal.aborted) return
      lastSavedSnapshotRef.current = snapshot
      if (isMountedRef.current) {
        setLastSavedAt(new Date())
        setStatus('saved')
      }
    } catch (err) {
      if (controller.signal.aborted) return
      const redirected = handleSessionError(err, logoutRef.current, navigateRef.current)
      if (!redirected && isMountedRef.current) {
        setStatus('error')
      }
    }
  }, [])

  const flushPending = useCallback(() => {
    if (!pendingRef.current) return
    clearTimer()
    pendingRef.current = false
    void runSave(stateRef.current)
  }, [clearTimer, runSave])

  useEffect(() => {
    if (!state.dirty) return
    if (isEqualSnapshot(lastSavedSnapshotRef.current, state)) return

    clearTimer()
    pendingRef.current = true
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      pendingRef.current = false
      void runSave(stateRef.current)
    }, intervalMs)
  }, [state, intervalMs, clearTimer, runSave])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushPending()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [flushPending])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      abortRef.current?.abort()
      if (pendingRef.current) {
        clearTimer()
        pendingRef.current = false
        // fire-and-forget: hook is unmounting, no state to update or redirect to dispatch
        const flushController = new AbortController()
        void saveFnRef.current(stateRef.current, flushController.signal)
      } else {
        clearTimer()
      }
    }
  }, [clearTimer])

  const retry = useCallback(() => {
    clearTimer()
    pendingRef.current = false
    void runSave(stateRef.current)
  }, [clearTimer, runSave])

  return { status, lastSavedAt, retry }
}
