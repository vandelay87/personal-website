import { handleSessionError, isNotFoundError } from '@api/auth'
import { fetchRecipeByIdAdmin } from '@api/recipes'
import { useAuth } from '@contexts/AuthContext'
import type { Recipe, RecipeImage } from '@models/recipe'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export type ImageType = 'cover' | `step-${string}`

export interface ImageReadyUpdate {
  imageType: ImageType
  processedAt: number
}

interface IdentifiedImage {
  imageType: ImageType
  image: RecipeImage
}

export interface UseImageProcessingPollOptions {
  intervalMs?: number
  timeoutMs?: number
}

export interface UseImageProcessingPollResult {
  timedOut: boolean
}

const DEFAULT_INTERVAL_MS = 1500
const DEFAULT_TIMEOUT_MS = 60_000

const collectImages = (recipe: Recipe): IdentifiedImage[] => {
  const images: IdentifiedImage[] = [{ imageType: 'cover', image: recipe.coverImage }]
  for (const step of recipe.steps) {
    if (step.image) {
      images.push({ imageType: `step-${step.stepId}`, image: step.image })
    }
  }
  return images
}

const unreadyKeysOf = (recipe: Recipe): string[] =>
  collectImages(recipe)
    .filter(({ image }) => !image.processedAt)
    .map(({ imageType }) => imageType)

export const useImageProcessingPoll = (
  recipe: Recipe | null,
  onReady: (updates: ImageReadyUpdate[]) => void,
  options?: UseImageProcessingPollOptions
): UseImageProcessingPollResult => {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const { logout, getAccessToken } = useAuth()
  const navigate = useNavigate()

  const [timedOut, setTimedOut] = useState(false)

  const onReadyRef = useRef(onReady)
  const logoutRef = useRef(logout)
  const navigateRef = useRef(navigate)
  const getAccessTokenRef = useRef(getAccessToken)
  const recipeRef = useRef(recipe)
  const isMountedRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)
  const nextTickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emittedReadyRef = useRef<Set<string>>(new Set())
  const activeRecipeIdRef = useRef<string | null>(null)

  onReadyRef.current = onReady
  logoutRef.current = logout
  navigateRef.current = navigate
  getAccessTokenRef.current = getAccessToken
  recipeRef.current = recipe

  const recipeId = recipe?.id ?? null
  const unreadyKeysSignature = useMemo(() => {
    if (!recipe) return ''
    return unreadyKeysOf(recipe).sort().join('|')
  }, [recipe])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (recipeId === null || unreadyKeysSignature.length === 0) {
      return
    }

    activeRecipeIdRef.current = recipeId
    const currentRecipe = recipeRef.current
    emittedReadyRef.current = new Set(
      currentRecipe === null
        ? []
        : collectImages(currentRecipe)
            .filter(({ image }) => image.processedAt)
            .map(({ imageType }) => imageType)
    )
    setTimedOut(false)

    const stopPolling = () => {
      if (nextTickTimerRef.current !== null) {
        clearTimeout(nextTickTimerRef.current)
        nextTickTimerRef.current = null
      }
      if (timeoutTimerRef.current !== null) {
        clearTimeout(timeoutTimerRef.current)
        timeoutTimerRef.current = null
      }
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
    }

    const handleTickError = (err: unknown): boolean => {
      if (isNotFoundError(err)) {
        stopPolling()
        return true
      }
      if (handleSessionError(err, logoutRef.current, navigateRef.current)) {
        stopPolling()
        return true
      }
      return false
    }

    const scheduleNextTick = () => {
      if (!isMountedRef.current) return
      if (activeRecipeIdRef.current !== recipeId) return
      if (nextTickTimerRef.current !== null) return
      nextTickTimerRef.current = setTimeout(() => {
        nextTickTimerRef.current = null
        void runTick()
      }, intervalMs)
    }

    const runTick = async () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller
      const tickRecipeId = recipeId

      let token: string
      try {
        token = await getAccessTokenRef.current()
      } catch (err) {
        if (controller.signal.aborted) return
        if (activeRecipeIdRef.current !== tickRecipeId) return
        if (!handleTickError(err)) scheduleNextTick()
        return
      }

      try {
        const fresh = await fetchRecipeByIdAdmin(token, tickRecipeId, controller.signal)
        if (controller.signal.aborted) return
        if (!isMountedRef.current) return
        if (activeRecipeIdRef.current !== tickRecipeId) return

        const newlyReady: ImageReadyUpdate[] = []
        let hasUnready = false
        for (const { imageType, image } of collectImages(fresh)) {
          if (!image.processedAt) {
            hasUnready = true
            continue
          }
          if (!emittedReadyRef.current.has(imageType)) {
            emittedReadyRef.current.add(imageType)
            newlyReady.push({ imageType, processedAt: image.processedAt })
          }
        }

        if (newlyReady.length > 0) {
          onReadyRef.current(newlyReady)
        }

        if (hasUnready) {
          scheduleNextTick()
        } else {
          stopPolling()
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (activeRecipeIdRef.current !== tickRecipeId) return
        if (!handleTickError(err)) scheduleNextTick()
      }
    }

    scheduleNextTick()

    timeoutTimerRef.current = setTimeout(() => {
      stopPolling()
      if (isMountedRef.current) {
        setTimedOut(true)
      }
    }, timeoutMs)

    return () => {
      stopPolling()
    }
  }, [recipeId, unreadyKeysSignature, intervalMs, timeoutMs])

  return { timedOut }
}
