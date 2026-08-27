import { describe, expect, it } from 'vitest'
import { countdownToDraft, draftToInput, type CountdownDraft } from './editor'

const futureNow = new Date(2030, 3, 11, 10, 0).getTime()

const validDraft: CountdownDraft = {
  title: 'Launch day',
  date: '2030-04-12',
  time: '18:30',
  theme: 'aurora',
  gradientMood: 42,
}

describe('draftToInput', () => {
  it('converts local date and time into an absolute timestamp', () => {
    const result = draftToInput(validDraft, futureNow)

    expect(result).toEqual({
      ok: true,
      value: {
        title: 'Launch day',
        targetAt: new Date(2030, 3, 12, 18, 30).getTime(),
        theme: 'aurora',
        themeSettings: { gradientMood: 42 },
      },
    })
  })

  it.each([
    [{ ...validDraft, title: '   ' }, 'Give your countdown a name.'],
    [{ ...validDraft, title: 'x'.repeat(81) }, 'Keep the name to 80 characters or fewer.'],
    [{ ...validDraft, date: '' }, 'Choose a date and time.'],
    [{ ...validDraft, date: '2030-02-30' }, 'Choose a valid date and time.'],
    [{ ...validDraft, date: '2030-04-10' }, 'Choose a time in the future.'],
  ])('rejects an invalid draft with a useful message', (draft, message) => {
    expect(draftToInput(draft, futureNow)).toEqual({ ok: false, message })
  })
})

describe('countdownToDraft', () => {
  it('formats a stored timestamp for local date and time inputs', () => {
    expect(
      countdownToDraft({
        id: 'launch',
        title: 'Launch day',
        targetAt: new Date(2030, 3, 12, 8, 5).getTime(),
        status: 'active',
        theme: 'hyperdrive',
        themeSettings: { gradientMood: 68 },
        createdAt: 1,
        updatedAt: 2,
      }),
    ).toEqual({
      title: 'Launch day',
      date: '2030-04-12',
      time: '08:05',
      theme: 'hyperdrive',
      gradientMood: 68,
    })
  })
})
