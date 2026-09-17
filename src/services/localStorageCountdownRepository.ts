import type {
  Countdown,
  CountdownInput,
  CountdownStatus,
  ThemeId,
} from '../domain/countdown'
import { normalizeGradientMood, THEMES } from '../domain/theme'
import type { CountdownRepository } from './countdownRepository'

export const LOCAL_STORAGE_COUNTDOWNS_KEY = 'moment:guest-countdowns:v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isTheme = (value: unknown): value is ThemeId =>
  typeof value === 'string' && THEMES.some((theme) => theme.id === value)

const isStatus = (value: unknown): value is CountdownStatus =>
  value === 'active' || value === 'history'

const countdownFromStorage = (value: unknown): Countdown | null => {
  if (!isRecord(value) || !isRecord(value.themeSettings)) return null

  if (
    typeof value.id !== 'string' ||
    !value.id ||
    typeof value.title !== 'string' ||
    !value.title.trim() ||
    value.title.length > 80 ||
    typeof value.targetAt !== 'number' ||
    !Number.isFinite(value.targetAt) ||
    !isStatus(value.status) ||
    !isTheme(value.theme) ||
    typeof value.themeSettings.gradientMood !== 'number' ||
    typeof value.createdAt !== 'number' ||
    !Number.isFinite(value.createdAt) ||
    typeof value.updatedAt !== 'number' ||
    !Number.isFinite(value.updatedAt)
  ) {
    return null
  }

  return {
    id: value.id,
    title: value.title.trim(),
    targetAt: value.targetAt,
    status: value.status,
    theme: value.theme,
    themeSettings: {
      gradientMood: normalizeGradientMood(value.themeSettings.gradientMood),
    },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

const normalizeInput = (input: CountdownInput): CountdownInput => ({
  title: input.title.trim(),
  targetAt: input.targetAt,
  theme: input.theme,
  themeSettings: {
    gradientMood: normalizeGradientMood(input.themeSettings.gradientMood),
  },
})

const createLocalId = () =>
  globalThis.crypto?.randomUUID?.() ??
  'local-' + Date.now() + '-' + Math.random().toString(36).slice(2)

export function createLocalStorageCountdownRepository(
  storage: Storage,
): CountdownRepository {
  const listeners = new Set<(items: Countdown[]) => void>()

  const read = (): Countdown[] => {
    const serialized = storage.getItem(LOCAL_STORAGE_COUNTDOWNS_KEY)
    if (!serialized) return []

    try {
      const parsed: unknown = JSON.parse(serialized)
      if (!Array.isArray(parsed)) return []
      return parsed.flatMap((value) => {
        const countdown = countdownFromStorage(value)
        return countdown ? [countdown] : []
      })
    } catch {
      return []
    }
  }

  const publish = (items: Countdown[]) => {
    storage.setItem(LOCAL_STORAGE_COUNTDOWNS_KEY, JSON.stringify(items))
    for (const listener of listeners) listener([...items])
  }

  return {
    subscribe(_uid, onData, onError) {
      listeners.add(onData)
      try {
        onData(read())
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Could not read local countdowns.'))
      }
      return () => {
        listeners.delete(onData)
      }
    },

    async create(_uid, input) {
      const now = Date.now()
      const countdown: Countdown = {
        id: createLocalId(),
        ...normalizeInput(input),
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
      publish([...read(), countdown])
      return countdown.id
    },

    async update(_uid, id, input) {
      const normalized = normalizeInput(input)
      const now = Date.now()
      publish(
        read().map((item) =>
          item.id === id
            ? { ...item, ...normalized, status: 'active', updatedAt: now }
            : item,
        ),
      )
    },

    async remove(_uid, id) {
      publish(read().filter((item) => item.id !== id))
    },

    async archiveExpired(_uid, ids) {
      if (ids.length === 0) return
      const archivedIds = new Set(ids)
      const now = Date.now()
      publish(
        read().map((item) =>
          archivedIds.has(item.id)
            ? { ...item, status: 'history', updatedAt: now }
            : item,
        ),
      )
    },
  }
}