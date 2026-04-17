import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useReorderableList } from './useReorderableList'

describe('useReorderableList', () => {
  it('add appends an item', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a', 'b'], onChange))

    act(() => {
      result.current.add('c')
    })

    expect(onChange).toHaveBeenCalledWith(['a', 'b', 'c'])
  })

  it('remove removes item at index', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c'], onChange))

    act(() => {
      result.current.remove(1)
    })

    expect(onChange).toHaveBeenCalledWith(['a', 'c'])
  })

  it('remove does not fire when only 1 item (minimum enforced)', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a'], onChange))

    act(() => {
      result.current.remove(0)
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('moveUp swaps item with previous', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c'], onChange))

    act(() => {
      result.current.moveUp(2)
    })

    expect(onChange).toHaveBeenCalledWith(['a', 'c', 'b'])
  })

  it('moveUp does nothing at index 0 (boundary)', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c'], onChange))

    act(() => {
      result.current.moveUp(0)
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('moveDown swaps item with next', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c'], onChange))

    act(() => {
      result.current.moveDown(0)
    })

    expect(onChange).toHaveBeenCalledWith(['b', 'a', 'c'])
  })

  it('moveDown does nothing at last index (boundary)', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c'], onChange))

    act(() => {
      result.current.moveDown(2)
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('update replaces item at index', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useReorderableList(['a', 'b', 'c'], onChange))

    act(() => {
      result.current.update(1, 'x')
    })

    expect(onChange).toHaveBeenCalledWith(['a', 'x', 'c'])
  })
})
