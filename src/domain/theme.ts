import type { ThemeId } from './countdown'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
}

export const THEMES: readonly ThemeDefinition[] = [
  { id: 'aurora', name: 'Aurora', description: 'Soft, calm, luminous' },
  {
    id: 'event-horizon',
    name: 'Event Horizon',
    description: 'Dark, orbital, infinite',
  },
  {
    id: 'hyperdrive',
    name: 'Hyperdrive',
    description: 'Neon, electric, fast',
  },
  {
    id: 'paper-riot',
    name: 'Paper Riot',
    description: 'Bold, tactile, playful',
  },
]

export function themeById(value: string | null | undefined): ThemeDefinition {
  return THEMES.find((theme) => theme.id === value) ?? THEMES[0]
}

export function normalizeGradientMood(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.round(Math.min(100, Math.max(0, value)))
}

const interpolate = (start: number, end: number, amount: number) =>
  Math.round(start + (end - start) * amount)

export function getAuroraVariables(mood: number): Record<string, string> {
  const amount = normalizeGradientMood(mood) / 100
  return {
    '--aurora-hue-a': `${interpolate(18, 276, amount)}deg`,
    '--aurora-hue-b': `${interpolate(332, 310, amount)}deg`,
    '--aurora-angle': `${interpolate(128, 205, amount)}deg`,
    '--aurora-saturation': `${interpolate(86, 92, amount)}%`,
    '--aurora-lightness': `${interpolate(94, 89, amount)}%`,
  }
}
