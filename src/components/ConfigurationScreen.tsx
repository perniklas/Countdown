import { Settings2 } from 'lucide-react'

export function ConfigurationScreen({ missing }: { missing: readonly string[] }) {
  return (
    <main className="configuration-screen">
      <section className="configuration-card">
        <Settings2 size={28} aria-hidden="true" />
        <p className="eyebrow">One small setup step</p>
        <h1>Connect your Firebase web app.</h1>
        <p>
          Add these values to a local <code>.env</code> file, then restart the
          app:
        </p>
        <ul>
          {missing.map((key) => <li key={key}><code>{key}</code></li>)}
        </ul>
        <p className="configuration-note">
          The included <code>.env.example</code> has the complete format.
        </p>
      </section>
    </main>
  )
}
