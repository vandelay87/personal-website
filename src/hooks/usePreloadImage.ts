import { useEffect } from 'react'

interface UsePreloadImageOptions {
  fetchPriority?: 'high' | 'low' | 'auto'
  crossOrigin?: 'anonymous' | 'use-credentials'
}

export const usePreloadImage = (
  src: string | undefined,
  options: UsePreloadImageOptions = {}
): void => {
  const { fetchPriority = 'high', crossOrigin } = options

  useEffect(() => {
    if (!src || typeof document === 'undefined') return

    // Preload via Image constructor for immediate loading
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.src = src

    // Add preload link to head for browser optimization
    const link = document.createElement('link')
    link.rel = 'preload'
    link.setAttribute('as', 'image')
    link.href = src

    if (fetchPriority) link.setAttribute('fetchpriority', fetchPriority)
    if (crossOrigin) link.setAttribute('crossorigin', crossOrigin)

    document.head.appendChild(link)

    return () => {
      // Clean up the preload link when component unmounts
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [src, fetchPriority, crossOrigin])
}
