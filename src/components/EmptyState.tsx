import { Plus, Sparkles } from 'lucide-react'

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="empty-state" aria-labelledby="empty-title">
      <Sparkles size={28} aria-hidden="true" />
      <p className="eyebrow">oops no countdowns</p>
      <h1 id="empty-title">What are you looking forward to?</h1>
      <p>Let's start counting</p>
      <button className="primary-button" type="button" onClick={onCreate}>
        <Plus size={18} aria-hidden="true" />
        Create countdown
      </button>
    </section>
  )
}
