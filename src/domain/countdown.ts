export type ThemeId =
  | 'aurora'
  | 'event-horizon'
  | 'hyperdrive'
  | 'valheim'

export type ValheimBiome = 'meadows' | 'black-forest' | 'swamp' | 'mountains' | 'plains'

export type CountdownStatus = 'active' | 'history'

export interface Countdown {
  id: string
  title: string
  targetAt: number
  status: CountdownStatus
  theme: ThemeId
  themeSettings: { gradientMood: number; biome?: ValheimBiome }
  createdAt: number
  updatedAt: number
}

export type CountdownInput = Pick<
  Countdown,
  'title' | 'targetAt' | 'theme' | 'themeSettings'
>

export interface TimeParts {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

export function getTimeParts(targetAt: number, now = Date.now()): TimeParts {
  const totalMs = Math.max(0, targetAt - now)
  const totalSeconds = Math.floor(totalMs / 1_000)

  return {
    totalMs,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    isComplete: totalMs === 0,
  }
}

export function partitionCountdowns(items: readonly Countdown[]): {
  active: Countdown[]
  history: Countdown[]
} {
  return {
    active: items
      .filter((item) => item.status === 'active')
      .sort((a, b) => a.targetAt - b.targetAt),
    history: items
      .filter((item) => item.status === 'history')
      .sort((a, b) => b.targetAt - a.targetAt),
  }
}
