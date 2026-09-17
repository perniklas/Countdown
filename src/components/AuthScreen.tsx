import { ArrowRight, Sparkles, UserRound } from 'lucide-react'

interface AuthScreenProps {
  onSignIn: () => void
  onContinueWithoutLogin: () => void
  signingIn: boolean
  error: string | null
}

export function AuthScreen({
  onSignIn,
  onContinueWithoutLogin,
  signingIn,
  error,
}: AuthScreenProps) {
  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand-mark" aria-hidden="true">
          <Sparkles size={22} strokeWidth={1.8} />
        </div>
        <p className="eyebrow">Let's count down</p>
        <h1 id="auth-title">It's a countdown app.</h1>
        <p className="auth-copy">
          Put the countdown in the app, look at it, it counts down
        </p>
        <button
          className="google-button"
          type="button"
          onClick={onSignIn}
          disabled={signingIn}
        >
          <span className="google-g" aria-hidden="true">G</span>
          <span>{signingIn ? 'Opening Google…' : 'Continue with Google'}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <div className="auth-divider" aria-hidden="true"><span>or</span></div>
        <button
          className="guest-button"
          type="button"
          onClick={onContinueWithoutLogin}
          disabled={signingIn}
        >
          <UserRound size={19} aria-hidden="true" />
          <span>Continue without login</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p className="auth-note guest-note">Countdowns stay in this browser.</p>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
      </section>
    </main>
  )
}
