import { ArrowRight, Sparkles } from 'lucide-react'

interface AuthScreenProps {
  onSignIn: () => void
  signingIn: boolean
  error: string | null
}

export function AuthScreen({ onSignIn, signingIn, error }: AuthScreenProps) {
  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand-mark" aria-hidden="true">
          <Sparkles size={22} strokeWidth={1.8} />
        </div>
        <p className="eyebrow">The moments worth waiting for</p>
        <h1 id="auth-title">Make the wait beautiful.</h1>
        <p className="auth-copy">
          Create personal countdowns, give every moment its own atmosphere,
          and keep them synced wherever you go.
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
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <p className="auth-note">Private by default. Your countdowns are yours.</p>
      </section>
    </main>
  )
}
