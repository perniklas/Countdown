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

function ReadyApp({ auth, db }: Extract<typeof firebaseClientState, { ready: true }>) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [signingIn, setSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const repository = useMemo(() => createFirebaseCountdownRepository(db), [db])

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

  if (user === undefined) {
    return <main className="boot-screen" aria-label="Loading Moment"><span /></main>
  }

  if (!user) {
    return (
      <AuthScreen
        onSignIn={() => void handleSignIn()}
        signingIn={signingIn}
        error={authError}
      />
    )
  }

  return (
    <CountdownApp
      uid={user.uid}
      repository={repository}
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
