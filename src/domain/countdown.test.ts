import { describe, expect, it } from 'vitest'
import {
  getTimeParts,
  partitionCountdowns,
  type Countdown,
} from './countdown'

const countdown = (
  id: string,
  targetAt: number,
  status: Countdown['status'],
): Countdown => ({
  id,
  title: id,
  targetAt,
  status,
  theme: 'aurora',
  themeSettings: { gradientMood: 50 },
  createdAt: 10,
  updatedAt: 20,
})

describe('getTimeParts', () => {
  it('breaks a positive duration into countdown units', () => {
    expect(getTimeParts(100_000_000, 0)).toEqual({
      totalMs: 100_000_000,
      days: 1,
      hours: 3,
      minutes: 46,
      seconds: 40,
      isComplete: false,
    })
  })

  it('clamps an elapsed countdown to zero', () => {
    expect(getTimeParts(1_000, 1_001)).toEqual({
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isComplete: true,
    })
  })
})

describe('partitionCountdowns', () => {
  it('orders active soonest first and history newest first without mutating input', () => {
    const fixtures = [
      countdown('later', 8_000, 'active'),
      countdown('old', 1_000, 'history'),
      countdown('soon', 2_000, 'active'),
      countdown('recent', 5_000, 'history'),
    ]
    const inputIds = fixtures.map((item) => item.id)

    const result = partitionCountdowns(fixtures)

    expect(result.active.map((item) => item.id)).toEqual(['soon', 'later'])
    expect(result.history.map((item) => item.id)).toEqual(['recent', 'old'])
    expect(fixtures.map((item) => item.id)).toEqual(inputIds)
  })
})
