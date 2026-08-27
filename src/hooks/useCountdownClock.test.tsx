import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdownClock } from './useCountdownClock'

describe('useCountdownClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ticks to zero and notifies once after observing positive time', () => {
    const reached = vi.fn()
    const targetAt = Date.now() + 1_000
    const { result } = renderHook(() => useCountdownClock(targetAt, reached))

    expect(result.current.isComplete).toBe(false)

    act(() => vi.advanceTimersByTime(2_500))

    expect(result.current.isComplete).toBe(true)
    expect(result.current.seconds).toBe(0)
    expect(reached).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(5_000))
    expect(reached).toHaveBeenCalledTimes(1)
  })

  it('does not celebrate a countdown that was already complete on selection', () => {
    const reached = vi.fn()
    renderHook(() => useCountdownClock(Date.now() - 1_000, reached))

    act(() => vi.advanceTimersByTime(1_000))

    expect(reached).not.toHaveBeenCalled()
  })

  it('resets its crossing state when the selected target changes', () => {
    const reached = vi.fn()
    const { rerender } = renderHook(
      ({ targetAt }) => useCountdownClock(targetAt, reached),
      { initialProps: { targetAt: Date.now() + 500 } },
    )

    act(() => vi.advanceTimersByTime(1_000))
    expect(reached).toHaveBeenCalledTimes(1)

    rerender({ targetAt: Date.now() + 500 })
    act(() => vi.advanceTimersByTime(1_000))

    expect(reached).toHaveBeenCalledTimes(2)
  })
})
