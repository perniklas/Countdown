import { describe, expect, it } from 'vitest'
import {
  getAuroraVariables,
  normalizeGradientMood,
  themeById,
  THEMES,
} from './theme'

describe('normalizeGradientMood', () => {
  it('rounds and clamps the saved mood range', () => {
    expect(normalizeGradientMood(-4)).toBe(0)
    expect(normalizeGradientMood(48.6)).toBe(49)
    expect(normalizeGradientMood(120)).toBe(100)
    expect(normalizeGradientMood(Number.NaN)).toBe(50)
  })
})

describe('getAuroraVariables', () => {
  it('maps the range endpoints to stable gradient values', () => {
    expect(getAuroraVariables(0)).toEqual({
      '--aurora-hue-a': '18deg',
      '--aurora-hue-b': '332deg',
      '--aurora-angle': '128deg',
      '--aurora-saturation': '86%',
      '--aurora-lightness': '94%',
    })
    expect(getAuroraVariables(100)).toEqual({
      '--aurora-hue-a': '276deg',
      '--aurora-hue-b': '310deg',
      '--aurora-angle': '205deg',
      '--aurora-saturation': '92%',
      '--aurora-lightness': '89%',
    })
  })
})

describe('theme metadata', () => {
  it('contains the four designed themes and falls back to Aurora', () => {
    expect(THEMES.map((theme) => theme.id)).toEqual([
      'aurora',
      'event-horizon',
      'hyperdrive',
      'paper-riot',
    ])
    expect(themeById('unknown').id).toBe('aurora')
  })
})
