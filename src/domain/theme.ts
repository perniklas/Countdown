import type { Countdown, ThemeId, ValheimBiome } from './countdown'

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
    id: 'valheim',
    name: 'Valheim',
    description: 'A quiet moment in the tenth world',
  },
]

export function themeById(value: string | null | undefined): ThemeDefinition {
  return THEMES.find((theme) => theme.id === (value === 'paper-riot' ? 'valheim' : value)) ?? THEMES[0]
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

export const VALHEIM_BIOMES: readonly { id: ValheimBiome; name: string; description: string }[] = [
  { id: 'meadows', name: 'Meadows', description: 'Golden sunbeams, soft grass, and a place to call home.' },
  { id: 'black-forest', name: 'Black Forest', description: 'Ancient pines, blue mist, and lights between the trees.' },
  { id: 'swamp', name: 'Swamp', description: 'Rain on still water beneath a canopy of crooked branches.' },
  { id: 'mountains', name: 'Mountains', description: 'Moonlit peaks, cold air, and snow carried on the wind.' },
  { id: 'plains', name: 'Plains', description: 'Endless amber grass and standing stones in the evening light.' },
]

export function normalizeValheimBiome(value: unknown): ValheimBiome {
  return VALHEIM_BIOMES.find((biome) => biome.id === value)?.id ?? 'meadows'
}

// Keep legacy countdowns usable without a destructive data migration.
export function storedThemeId(value: unknown): ThemeId | null {
  if (value === 'paper-riot') return 'valheim'
  return THEMES.find((theme) => theme.id === value)?.id ?? null
}

export function normalizeThemeSettings(
  theme: ThemeId,
  settings: { gradientMood: number; biome?: unknown },
): Countdown['themeSettings'] {
  return {
    gradientMood: normalizeGradientMood(settings.gradientMood),
    ...(theme === 'valheim' || settings.biome !== undefined
      ? { biome: normalizeValheimBiome(settings.biome) }
      : {}),
  }
}
