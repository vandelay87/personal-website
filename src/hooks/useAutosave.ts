// Stub — real implementation to be added by feature agent.
// See issue #148 / docs/prds/draft-recipes.md.

export interface UseAutosaveOptions {
  intervalMs?: number
}

export interface UseAutosaveResult {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: Date | null
  retry: () => void
}

export const useAutosave = <T extends { dirty: boolean }>(
  _state: T,
  _saveFn: (state: T, signal: AbortSignal) => Promise<void>,
  _options?: UseAutosaveOptions
): UseAutosaveResult => {
  throw new Error('useAutosave: not implemented')
}
