import { useCallback, useState } from 'react'

export const useReorderableList = <T>(initial: T[]) => {
  const [items, setItems] = useState<T[]>(initial)

  const add = useCallback((item: T) => {
    setItems((prev) => [...prev, item])
  }, [])

  const remove = useCallback((index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }, [])

  const update = useCallback((index: number, item: T) => {
    setItems((prev) => prev.map((existing, i) => (i === index ? item : existing)))
  }, [])

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return
    setItems((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }, [])

  const moveDown = useCallback((index: number) => {
    setItems((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }, [])

  return { items, add, remove, update, moveUp, moveDown }
}
