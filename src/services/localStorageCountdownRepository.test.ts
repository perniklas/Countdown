import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CountdownInput } from '../domain/countdown'
import {
  createLocalStorageCountdownRepository,
  LOCAL_STORAGE_COUNTDOWNS_KEY,
} from './localStorageCountdownRepository'

const input: CountdownInput = {
  title: 'Local launch',
  targetAt: 4_000,
  theme: 'event-horizon',
  themeSettings: { gradientMood: 64 },
}

describe('localStorage countdown repository', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
  })

  it('persists a created countdown for a new repository instance', async () => {
    const repository = createLocalStorageCountdownRepository(localStorage)
    const id = await repository.create('guest', input)

    const snapshots: unknown[] = []
    const reloaded = createLocalStorageCountdownRepository(localStorage)
    reloaded.subscribe(
      'guest',
      (items) => snapshots.push(items),
      (error) => {
        throw error
      },
    )

    expect(snapshots).toEqual([[
      {
        id,
        ...input,
        status: 'active',
        createdAt: 1_000,
        updatedAt: 1_000,
      },
    ]])
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_COUNTDOWNS_KEY)!)).toEqual(
      snapshots[0],
    )
  })

  it('updates, archives, removes, and publishes each local change', async () => {
    const repository = createLocalStorageCountdownRepository(localStorage)
    const snapshots: string[][] = []
    repository.subscribe(
      'guest',
      (items) => snapshots.push(items.map((item) => item.status)),
      (error) => {
        throw error
      },
    )

    const id = await repository.create('guest', input)
    vi.spyOn(Date, 'now').mockReturnValue(2_000)
    await repository.update('guest', id, {
      ...input,
      title: 'Updated locally',
    })
    await repository.archiveExpired('guest', [id])
    await repository.remove('guest', id)

    expect(snapshots).toEqual([
      [],
      ['active'],
      ['active'],
      ['history'],
      [],
    ])
  })
})