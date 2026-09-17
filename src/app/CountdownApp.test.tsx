import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { celebrate } from '../celebrate'
import type { Countdown } from '../domain/countdown'
import { FakeCountdownRepository } from '../test/fakeCountdownRepository'
import { CountdownApp } from './CountdownApp'

vi.mock('../celebrate', () => ({ celebrate: vi.fn() }))

const future = (id: string, hours: number): Countdown => ({
  id,
  title: id,
  targetAt: Date.now() + hours * 60 * 60 * 1_000,
  status: 'active',
  theme: 'aurora',
  themeSettings: { gradientMood: 50 },
  createdAt: 1,
  updatedAt: 1,
})

describe('CountdownApp', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2030-01-01T10:00:00Z').getTime(),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('centers the nearest countdown and reveals the compact library', async () => {
    const user = userEvent.setup()
    const repository = new FakeCountdownRepository([
      future('Later adventure', 48),
      future('Soon adventure', 4),
    ])

    render(
      <CountdownApp
        uid="user-1"
        repository={repository}
        displayName="Ada"
        onSignOut={vi.fn()}
      />,
    )

    expect(
      await screen.findByRole('heading', { name: 'Soon adventure' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /saved countdowns/i }),
    )

    const library = screen.getByRole('dialog', { name: /your countdowns/i })
    expect(within(library).getByText('Later adventure')).toBeInTheDocument()
    expect(within(library).getByText('Soon adventure')).toBeInTheDocument()
  })

  it('creates a countdown and selects it as the hero', async () => {
    const user = userEvent.setup()
    const repository = new FakeCountdownRepository()

    render(
      <CountdownApp
        uid="user-1"
        repository={repository}
        displayName="Ada"
        onSignOut={vi.fn()}
      />,
    )

    await user.click(
      await screen.findByRole('button', { name: /create countdown/i }),
    )
    await user.type(screen.getByLabelText(/countdown name/i), 'Holiday')
    await user.clear(screen.getByLabelText(/^date$/i))
    await user.type(screen.getByLabelText(/^date$/i), '2031-06-12')
    await user.clear(screen.getByLabelText(/^time$/i))
    await user.type(screen.getByLabelText(/^time$/i), '18:30')
    await user.click(screen.getByRole('button', { name: /save countdown/i }))

    expect(
      await screen.findByRole('heading', { name: 'Holiday' }),
    ).toBeInTheDocument()
    expect(repository.items[0]?.title).toBe('Holiday')
  })

  it('keeps the editor open and reports a failed save', async () => {
    const user = userEvent.setup()
    const repository = new FakeCountdownRepository()
    repository.createError = new Error('Could not reach Firestore')

    render(
      <CountdownApp
        uid="user-1"
        repository={repository}
        displayName="Ada"
        onSignOut={vi.fn()}
      />,
    )

    await user.click(
      await screen.findByRole('button', { name: /create countdown/i }),
    )
    await user.type(screen.getByLabelText(/countdown name/i), 'Holiday')
    await user.clear(screen.getByLabelText(/^date$/i))
    await user.type(screen.getByLabelText(/^date$/i), '2031-06-12')
    await user.clear(screen.getByLabelText(/^time$/i))
    await user.type(screen.getByLabelText(/^time$/i), '18:30')
    await user.click(screen.getByRole('button', { name: /save countdown/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach Firestore',
    )
    expect(screen.getByRole('dialog', { name: /new countdown/i })).toBeVisible()
  })
})

  it('celebrates a selected countdown once without archiving it mid-session', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T10:00:00Z'))
    const finalSecond = future('final-second', 1 / 3_600)
    const repository = new FakeCountdownRepository([finalSecond])
    const archive = vi.spyOn(repository, 'archiveExpired')

    render(
      <CountdownApp
        uid="user-1"
        repository={repository}
        displayName="Ada"
        onSignOut={vi.fn()}
      />,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(
      screen.getByRole('heading', { name: 'final-second' }),
    ).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2_500))
    act(() => vi.advanceTimersByTime(5_000))

    expect(celebrate).toHaveBeenCalledTimes(1)
    expect(archive).not.toHaveBeenCalledWith('user-1', ['final-second'])
  })
it('moves the main theme background at different parallax depths and recenters it', () => {
  const repository = new FakeCountdownRepository()

  const { container } = render(
    <CountdownApp
      uid="user-1"
      repository={repository}
      displayName="Ada"
      onSignOut={vi.fn()}
    />,
  )

  const themeRoot = container.querySelector<HTMLElement>('.theme-root')
  expect(themeRoot).not.toBeNull()

  Object.defineProperty(themeRoot!, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      width: 1_000,
      height: 800,
      right: 1_000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  })

  const animationFrame = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      callback(0)
      return 1
    })

  fireEvent.pointerMove(themeRoot!, { clientX: 750, clientY: 200 })

  expect(themeRoot!.style.getPropertyValue('--parallax-far-x')).toBe('6px')
  expect(themeRoot!.style.getPropertyValue('--parallax-far-y')).toBe('-5px')
  expect(themeRoot!.style.getPropertyValue('--parallax-near-x')).toBe('14px')
  expect(themeRoot!.style.getPropertyValue('--parallax-near-y')).toBe('-11px')

  fireEvent.pointerLeave(themeRoot!)

  expect(themeRoot!.style.getPropertyValue('--parallax-far-x')).toBe('0px')
  expect(themeRoot!.style.getPropertyValue('--parallax-far-y')).toBe('0px')
  expect(themeRoot!.style.getPropertyValue('--parallax-near-x')).toBe('0px')
  expect(themeRoot!.style.getPropertyValue('--parallax-near-y')).toBe('0px')

  animationFrame.mockRestore()
})

