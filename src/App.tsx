import { onAuthStateChanged, type Auth, type User } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { CountdownApp } from './app/CountdownApp'
import { AuthScreen } from './components/AuthScreen'
import { ConfigurationScreen } from './components/ConfigurationScreen'
import {
  firebaseClientState,
  isPopupCancellation,
  signInWithGoogle,
  signOutUser,
} from './firebase'
import { createFirebaseCountdownRepository } from './services/firebaseCountdownRepository'
import { createLocalStorageCountdownRepository } from './services/localStorageCountdownRepository'

const GUEST_MODE_KEY = 'moment:guest-mode:v1'

const readGuestMode = () => {
  try {
    return localStorage.getItem(GUEST_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function ReadyApp({ auth, db }: Extract<typeof firebaseClientState, { ready: true }>) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [signingIn, setSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [guestMode, setGuestMode] = useState(readGuestMode)
  const firebaseRepository = useMemo(
    () => createFirebaseCountdownRepository(db),
    [db],
  )
  const localRepository = useMemo(
    () => createLocalStorageCountdownRepository(localStorage),
    [],
  )

  useEffect(() => onAuthStateChanged(auth, setUser), [auth])

  const handleSignIn = async () => {
    setSigningIn(true)
    setAuthError(null)
    try {
      await signInWithGoogle(auth)
    } catch (error) {
      if (!isPopupCancellation(error)) {
        setAuthError('Google sign-in did not finish. Please try again.')
      }
    } finally {
      setSigningIn(false)
    }
  }

  const handleContinueWithoutLogin = () => {
    setAuthError(null)
    try {
      localStorage.setItem(GUEST_MODE_KEY, 'true')
      setGuestMode(true)
    } catch {
      setAuthError('Local storage is not available in this browser.')
    }
  }

  const handleLeaveGuestMode = () => {
    try {
      localStorage.removeItem(GUEST_MODE_KEY)
    } finally {
      setGuestMode(false)
    }
  }

  if (guestMode) {
    return (
      <CountdownApp
        uid="guest"
        repository={localRepository}
        displayName="Guest"
        onSignOut={handleLeaveGuestMode}
      />
    )
  }

  if (user === undefined) {
    return <main className="boot-screen" aria-label="Loading Moment"><span /></main>
  }

  if (!user) {
    return (
      <AuthScreen
        onSignIn={() => void handleSignIn()}
        onContinueWithoutLogin={handleContinueWithoutLogin}
        signingIn={signingIn}
        error={authError}
      />
    )
  }

  return (
    <CountdownApp
      uid={user.uid}
      repository={firebaseRepository}
      displayName={user.displayName}
      photoURL={user.photoURL}
      onSignOut={() => void signOutUser(auth as Auth)}
    />
  )
}

export default function App() {
  if (!firebaseClientState.ready) {
    return <ConfigurationScreen missing={firebaseClientState.missing} />
  }

  return <ReadyApp {...firebaseClientState} />
}
