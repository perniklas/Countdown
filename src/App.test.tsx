import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, onUser: (user: null) => void) => {
    onUser(null)
    return () => undefined
  },
}))

vi.mock('./firebase', () => ({
  firebaseClientState: {
    ready: true,
    auth: {},
    db: {},
  },
  isPopupCancellation: () => false,
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}))

import App from './App'

describe('guest mode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('enters without login, survives reload, and exits to authentication', async () => {
    const user = userEvent.setup()
    const firstRender = render(<App />)

    await user.click(
      await screen.findByRole('button', { name: /continue without login/i }),
    )

    expect(
      await screen.findByRole('button', { name: /create countdown/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Guest')).toBeInTheDocument()

    firstRender.unmount()
    render(<App />)

    expect(await screen.findByText('Guest')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(
      await screen.findByRole('button', { name: /continue without login/i }),
    ).toBeInTheDocument()
  })
})