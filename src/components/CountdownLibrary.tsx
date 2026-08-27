import { Edit3, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { Countdown } from '../domain/countdown'

interface CountdownLibraryProps {
  active: Countdown[]
  history: Countdown[]
  selectedId: string | null
  onClose: () => void
  onCreate: () => void
  onSelect: (id: string) => void
  onEdit: (countdown: Countdown) => void
  onDelete: (countdown: Countdown) => void
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function CountdownLibrary({
  active,
  history,
  selectedId,
  onClose,
  onCreate,
  onSelect,
  onEdit,
  onDelete,
}: CountdownLibraryProps) {
  const titleId = useId()
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const visibleItems = tab === 'active' ? active : history

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="library-layer">
      <button
        className="library-backdrop"
        type="button"
        aria-label="Close saved countdowns"
        onClick={onClose}
      />
      <aside
        className="countdown-library"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="library-header">
          <div>
            <p className="eyebrow">All your moments</p>
            <h2 id={titleId}>Your countdowns</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close saved countdowns">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="library-tabs" role="tablist" aria-label="Countdown groups">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'active'}
            onClick={() => setTab('active')}
          >
            Upcoming <span>{active.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'history'}
            onClick={() => setTab('history')}
          >
            History <span>{history.length}</span>
          </button>
        </div>

        <div className="library-list">
          {visibleItems.length === 0 ? (
            <div className="library-empty">
              <p>{tab === 'active' ? 'Nothing on the horizon yet.' : 'Your finished moments will collect here.'}</p>
            </div>
          ) : (
            visibleItems.map((countdown) => (
              <article
                className={`library-item ${selectedId === countdown.id ? 'is-selected' : ''}`}
                key={countdown.id}
              >
                <button
                  className="library-item-main"
                  type="button"
                  onClick={() => {
                    onSelect(countdown.id)
                    onClose()
                  }}
                >
                  <span className={`library-theme-dot dot-${countdown.theme}`} />
                  <span>
                    <strong>{countdown.title}</strong>
                    <small>{dateFormatter.format(countdown.targetAt)}</small>
                  </span>
                </button>
                <div className="library-item-actions">
                  <button type="button" aria-label={`Edit ${countdown.title}`} onClick={() => onEdit(countdown)}>
                    <Edit3 size={15} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Delete ${countdown.title}`} onClick={() => onDelete(countdown)}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <button className="primary-button library-create" type="button" onClick={onCreate}>
          <Plus size={17} aria-hidden="true" />
          New countdown
        </button>
      </aside>
    </div>
  )
}
