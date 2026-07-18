import { useMemo, useState } from 'react'

export interface SuspenseResource<T> {
  resource: Promise<T>
  retryKey: number
  refresh: () => void
}

// Known caveat (shared by any component that creates a raw Promise for
// `use()` rather than going through a data-fetching library's cache): the
// fetcher can fire twice for the same retryKey under React StrictMode's
// dev-only double-render, since that's the same mechanism StrictMode uses
// to surface impure work in useMemo. Dev-only network noise, not a
// production issue — see the `use` API reference's caveats on this exact
// trade-off.
export const useSuspenseResource = <T>(fetcher: () => Promise<T>): SuspenseResource<T> => {
  const [retryKey, setRetryKey] = useState(0)
  // Only retryKey should force a refetch — fetcher's identity changing
  // shouldn't retrigger it.
  const resource = useMemo(() => fetcher(), [retryKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    resource,
    retryKey,
    refresh: () => setRetryKey((k) => k + 1),
  }
}
