import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Countdown } from '../domain/countdown'
import { FakeCountdownRepository } from '../test/fakeCountdownRepository'
import { CountdownApp } from './CountdownApp'

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
