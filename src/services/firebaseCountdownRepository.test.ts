import { describe, expect, it } from 'vitest'
import {
  countdownFromDocument,
  serializeCountdown,
  type TimestampLike,
} from './firebaseCountdownRepository'

const timestamp = (milliseconds: number): TimestampLike => ({
  toMillis: () => milliseconds,
})

describe('countdownFromDocument', () => {
  it('maps a valid Firestore document into the domain model', () => {
    expect(
      countdownFromDocument('abc', {
        title: 'Launch',
        targetAt: timestamp(2_000),
        status: 'active',
        theme: 'aurora',
        themeSettings: { gradientMood: 72 },
        createdAt: timestamp(1_000),
        updatedAt: timestamp(1_500),
      }),
    ).toEqual({
      id: 'abc',
      title: 'Launch',
      targetAt: 2_000,
      status: 'active',
      theme: 'aurora',
      themeSettings: { gradientMood: 72 },
      createdAt: 1_000,
      updatedAt: 1_500,
    })
  })

  it.each([
    ['empty title', { title: '', targetAt: timestamp(2_000) }],
    [
      'unknown theme',
      {
        title: 'Launch',
        targetAt: timestamp(2_000),
        status: 'active',
        theme: 'plain',
        themeSettings: { gradientMood: 50 },
        createdAt: timestamp(1_000),
        updatedAt: timestamp(1_500),
      },
    ],
    [
      'invalid mood',
      {
        title: 'Launch',
        targetAt: timestamp(2_000),
        status: 'active',
        theme: 'aurora',
        themeSettings: { gradientMood: 150 },
        createdAt: timestamp(1_000),
        updatedAt: timestamp(1_500),
      },
    ],
  ])('returns null for a malformed record: %s', (_name, data) => {
    expect(countdownFromDocument('bad', data)).toBeNull()
  })
})

describe('serializeCountdown', () => {
  it('creates the validated mutable Firestore fields', () => {
    expect(
      serializeCountdown({
        title: '  Holiday  ',
        targetAt: 5_000,
        theme: 'valheim',
        themeSettings: { gradientMood: 64.4 },
      }),
    ).toEqual({
      title: 'Holiday',
      targetAt: 5_000,
      theme: 'valheim',
      themeSettings: { gradientMood: 64, biome: 'meadows' },
    })
  })
})
