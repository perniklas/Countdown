import type { Countdown, CountdownInput, ThemeId } from './countdown'
import { normalizeGradientMood } from './theme'

export interface CountdownDraft {
  title: string
  date: string
  time: string
  theme: ThemeId
  gradientMood: number
}

export type DraftResult =
  | { ok: true; value: CountdownInput }
  | { ok: false; message: string }

const pad = (value: number) => value.toString().padStart(2, '0')

function localTimestamp(date: string, time: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time)

  if (!dateMatch || !timeMatch) return null

  const [, yearText, monthText, dayText] = dateMatch
  const [, hourText, minuteText] = timeMatch
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const value = new Date(year, month - 1, day, hour, minute)

  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) {
    return null
  }

  return value.getTime()
}

export function draftToInput(
  draft: CountdownDraft,
  now = Date.now(),
): DraftResult {
  const title = draft.title.trim()

  if (!title) {
    return { ok: false, message: 'Give your countdown a name.' }
  }

  if (title.length > 80) {
    return {
      ok: false,
      message: 'Keep the name to 80 characters or fewer.',
    }
  }

  if (!draft.date || !draft.time) {
    return { ok: false, message: 'Choose a date and time.' }
  }

  const targetAt = localTimestamp(draft.date, draft.time)
  if (targetAt === null) {
    return { ok: false, message: 'Choose a valid date and time.' }
  }

  if (targetAt <= now) {
    return { ok: false, message: 'Choose a time in the future.' }
  }

  return {
    ok: true,
    value: {
      title,
      targetAt,
      theme: draft.theme,
      themeSettings: {
        gradientMood: normalizeGradientMood(draft.gradientMood),
      },
    },
  }
}

export function countdownToDraft(countdown: Countdown): CountdownDraft {
  const target = new Date(countdown.targetAt)
  return {
    title: countdown.title,
    date: `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`,
    time: `${pad(target.getHours())}:${pad(target.getMinutes())}`,
    theme: countdown.theme,
    gradientMood: normalizeGradientMood(
      countdown.themeSettings.gradientMood,
    ),
  }
}

export function emptyDraft(now = new Date()): CountdownDraft {
  const target = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000)
  target.setSeconds(0, 0)
  return {
    title: '',
    date: `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`,
    time: `${pad(target.getHours())}:${pad(target.getMinutes())}`,
    theme: 'aurora',
    gradientMood: 50,
  }
}
