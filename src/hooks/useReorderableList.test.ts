import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useReorderableList } from './useReorderableList'

describe('useReorderableList', () => {
  it('add appends an item', () => {
    const { result } = renderHook(() => useReorderableList(['a', 'b']))

    act(() => {
      result.current.add('c')
    })

    expect(result.current.items).toEqual(['a', 'b', 'c'])
  })

  it('remove removes item at index', () => {
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c']))

    act(() => {
      result.current.remove(1)
    })

    expect(result.current.items).toEqual(['a', 'c'])
  })

  it('remove does not remove when only 1 item (minimum enforced)', () => {
    const { result } = renderHook(() => useReorderableList(['a']))

    act(() => {
      result.current.remove(0)
    })

    expect(result.current.items).toEqual(['a'])
  })

  it('moveUp swaps item with previous', () => {
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c']))

    act(() => {
      result.current.moveUp(2)
    })

    expect(result.current.items).toEqual(['a', 'c', 'b'])
  })

  it('moveUp does nothing at index 0 (boundary)', () => {
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c']))

    act(() => {
      result.current.moveUp(0)
    })

    expect(result.current.items).toEqual(['a', 'b', 'c'])
  })

  it('moveDown swaps item with next', () => {
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c']))

    act(() => {
      result.current.moveDown(0)
    })

    expect(result.current.items).toEqual(['b', 'a', 'c'])
  })

  it('moveDown does nothing at last index (boundary)', () => {
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c']))

    act(() => {
      result.current.moveDown(2)
    })

    expect(result.current.items).toEqual(['a', 'b', 'c'])
  })

  it('update replaces item at index', () => {
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c']))

    act(() => {
      result.current.update(1, 'x')
    })

    expect(result.current.items).toEqual(['a', 'x', 'c'])
  })
})
