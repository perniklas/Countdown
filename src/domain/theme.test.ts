import { describe, expect, it } from 'vitest'
import {
  getGlassVariables,
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

describe('getGlassVariables', () => {
  it('maps the mood range to stable glass gradient values', () => {
    expect(getGlassVariables(0)).toEqual({
      '--glass-hue-a': '12deg',
      '--glass-hue-b': '76deg',
      '--glass-hue-c': '188deg',
      '--glass-hue-d': '314deg',
      '--glass-saturation': '74%',
      '--glass-angle': '108deg',
    })
    expect(getGlassVariables(50)).toEqual({
      '--glass-hue-a': '177deg',
      '--glass-hue-b': '241deg',
      '--glass-hue-c': '353deg',
      '--glass-hue-d': '119deg',
      '--glass-saturation': '85%',
      '--glass-angle': '180deg',
    })
    expect(getGlassVariables(100)).toEqual({
      '--glass-hue-a': '342deg',
      '--glass-hue-b': '46deg',
      '--glass-hue-c': '158deg',
      '--glass-hue-d': '284deg',
      '--glass-saturation': '96%',
      '--glass-angle': '252deg',
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
