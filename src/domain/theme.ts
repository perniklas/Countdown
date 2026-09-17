import type { ThemeId } from './countdown'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
}

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: 'aurora',
    name: 'Glasswater',
    description: 'Light bent through wet glass',
  },
  {
    id: 'event-horizon',
    name: 'Event Horizon',
    description: 'Falling toward something enormous',
  },
  {
    id: 'hyperdrive',
    name: 'Miami Sundown',
    description: 'Last light over the strip',
  },
  {
    id: 'paper-riot',
    name: 'Paper Riot',
    description: 'Two inks, one pass, slightly off',
  },
]

export function themeById(value: string | null | undefined): ThemeDefinition {
  return THEMES.find((theme) => theme.id === value) ?? THEMES[0]
}

export function normalizeGradientMood(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.round(Math.min(100, Math.max(0, value)))
}

const wrapHue = (value: number) => Math.round(((value % 360) + 360) % 360)

export function getGlassVariables(mood: number): Record<string, string> {
  const amount = normalizeGradientMood(mood) / 100
  const hue = 12 + amount * 330
  return {
    '--glass-hue-a': `${wrapHue(hue)}deg`,
    '--glass-hue-b': `${wrapHue(hue + 64)}deg`,
    '--glass-hue-c': `${wrapHue(hue + 176)}deg`,
    '--glass-hue-d': `${wrapHue(hue - 58)}deg`,
    '--glass-saturation': `${Math.round(74 + amount * 22)}%`,
    '--glass-angle': `${Math.round(108 + amount * 144)}deg`,
  }
}
