import type { Recipe } from '@models/recipe'

export interface ImageReadyUpdate {
  key: string
  processedAt: number
}

export interface UseImageProcessingPollOptions {
  intervalMs?: number
  timeoutMs?: number
}

export interface UseImageProcessingPollResult {
  timedOut: boolean
}

// Stub — implementation arrives with the TDD pass. Returns the idle shape so
// the test file can import a real module and fail on behaviour, not imports.
export const useImageProcessingPoll = (
  _recipe: Recipe | null,
  _onReady: (updates: ImageReadyUpdate[]) => void,
  _options?: UseImageProcessingPollOptions
): UseImageProcessingPollResult => {
  return { timedOut: false }
}
