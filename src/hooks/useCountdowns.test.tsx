import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Countdown, CountdownInput } from '../domain/countdown'
import type { CountdownRepository } from '../services/countdownRepository'
import { useCountdowns } from './useCountdowns'

const item = (
  id: string,
  targetAt: number,
  status: Countdown['status'] = 'active',
): Countdown => ({
  id,
  title: id,
  targetAt,
  status,
  theme: 'aurora',
  themeSettings: { gradientMood: 50 },
  createdAt: 1,
  updatedAt: 1,
})

function repositoryDouble() {
  let emit: (items: Countdown[]) => void = () => undefined
  let fail: (error: Error) => void = () => undefined
  const repository: CountdownRepository = {
    subscribe: vi.fn((_uid, onData, onError) => {
      emit = onData
      fail = onError
      return vi.fn()
    }),
    create: vi.fn(async (_uid: string, _input: CountdownInput) => 'created'),
    update: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    archiveExpired: vi.fn(async () => undefined),
  }
  return {
    repository,
    emit: (items: Countdown[]) => act(() => emit(items)),
    fail: (error: Error) => act(() => fail(error)),
  }
}

describe('useCountdowns', () => {
  it('archives only countdowns expired in the initial snapshot', async () => {
    const now = 5_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const source = repositoryDouble()
    const { result } = renderHook(() =>
      useCountdowns('user-1', source.repository),
    )

    source.emit([
      item('elapsed-on-load', now - 1),
      item('future', now + 1_000),
      item('old-history', now - 2_000, 'history'),
    ])

    await waitFor(() =>
      expect(source.repository.archiveExpired).toHaveBeenCalledWith(
        'user-1',
        ['elapsed-on-load'],
      ),
    )
    expect(result.current.loading).toBe(false)
    expect(result.current.items).toHaveLength(3)

    source.emit([
      item('elapsed-on-load', now - 1),
      item('elapsed-later', now - 2),
    ])

    expect(source.repository.archiveExpired).toHaveBeenCalledTimes(1)
  })

  it('exposes subscription errors and leaves the hook usable', () => {
    const source = repositoryDouble()
    const { result } = renderHook(() =>
      useCountdowns('user-1', source.repository),
    )

    source.fail(new Error('Connection lost'))

    expect(result.current.loading).toBe(false)
    expect(result.current.error?.message).toBe('Connection lost')
    expect(result.current.items).toEqual([])
  })
})
