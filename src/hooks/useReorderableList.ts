import { useCallback } from 'react'

export const useReorderableList = <T>(items: T[], onChange: (items: T[]) => void) => {
  const add = useCallback(
    (item: T) => {
      onChange([...items, item])
    },
    [items, onChange]
  )

  const remove = useCallback(
    (index: number) => {
      if (items.length <= 1) return
      onChange(items.filter((_, i) => i !== index))
    },
    [items, onChange]
  )

  const update = useCallback(
    (index: number, item: T) => {
      onChange(items.map((existing, i) => (i === index ? item : existing)))
    },
    [items, onChange]
  )

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return
      const next = [...items]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      onChange(next)
    },
    [items, onChange]
  )

  const moveDown = useCallback(
    (index: number) => {
      if (index >= items.length - 1) return
      const next = [...items]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      onChange(next)
    },
    [items, onChange]
  )

  return { add, remove, update, moveUp, moveDown }
}
