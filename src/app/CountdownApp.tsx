import { LogOut, Menu, Plus, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CountdownEditor } from '../components/CountdownEditor'
import { CountdownLibrary } from '../components/CountdownLibrary'
import { EmptyState } from '../components/EmptyState'
import { HeroCountdown } from '../components/HeroCountdown'
import { Toast } from '../components/Toast'
import { partitionCountdowns, type Countdown, type CountdownInput } from '../domain/countdown'
import { getAuroraVariables } from '../domain/theme'
import { useCountdowns } from '../hooks/useCountdowns'
import type { CountdownRepository } from '../services/countdownRepository'

interface CountdownAppProps {
  uid: string
  repository: CountdownRepository
  displayName: string | null
  photoURL?: string | null
  onSignOut: () => void
  onReachZero?: (countdown: Countdown) => void
}

export function CountdownApp({
  uid,
  repository,
  displayName,
  photoURL,
  onSignOut,
  onReachZero,
}: CountdownAppProps) {
  const countdowns = useCountdowns(uid, repository)
  const { active, history } = useMemo(
    () => partitionCountdowns(countdowns.items),
    [countdowns.items],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Countdown | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelectedId((current) => {
      if (current && countdowns.items.some((item) => item.id === current)) {
        return current
      }
      return active[0]?.id ?? null
    })
  }, [active, countdowns.items])

  const selected = countdowns.items.find((item) => item.id === selectedId) ?? null
  const theme = selected?.theme ?? 'aurora'
  const gradientMood = selected?.themeSettings.gradientMood ?? 50
  const themeStyle = getAuroraVariables(gradientMood) as CSSProperties

  const openCreate = () => {
    setLibraryOpen(false)
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (countdown: Countdown) => {
    setLibraryOpen(false)
    setEditing(countdown)
    setEditorOpen(true)
  }

  const save = async (input: CountdownInput) => {
    setSaving(true)
    try {
      if (editing) {
        await countdowns.update(editing.id, input)
        setSelectedId(editing.id)
      } else {
        const id = await countdowns.create(input)
        setSelectedId(id)
      }
      setEditorOpen(false)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (countdown: Countdown) => {
    const confirmed = window.confirm(`Delete “${countdown.title}”?`)
    if (!confirmed) return
    try {
      await countdowns.remove(countdown.id)
    } catch {
      return
    }
  }

  return (
    <main className={`theme-root theme-${theme}`} style={themeStyle}>
      <div className="app-decoration" aria-hidden="true">
        <span className="decoration-one" />
        <span className="decoration-two" />
        <span className="decoration-three" />
      </div>

      <header className="app-header">
        <a className="app-brand" href="/" aria-label="Moment home">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>Moment</span>
        </a>
        <div className="header-actions">
          <button className="header-button new-header-button" type="button" onClick={openCreate}>
            <Plus size={17} aria-hidden="true" />
            <span>New</span>
          </button>
          <button className="header-button" type="button" onClick={() => setLibraryOpen(true)} aria-label="Saved countdowns">
            <Menu size={18} aria-hidden="true" />
            <span>Saved</span>
            <b>{active.length}</b>
          </button>
          <div className="user-menu">
            {photoURL ? <img src={photoURL} alt="" referrerPolicy="no-referrer" /> : <span>{displayName?.charAt(0).toUpperCase() || 'M'}</span>}
            <small>{displayName?.split(' ')[0] || 'You'}</small>
            <button type="button" onClick={onSignOut} aria-label="Sign out">
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="app-content">
        {countdowns.loading ? (
          <div className="loading-state" aria-live="polite">
            <span className="loading-orbit" />
            <p>Gathering your moments…</p>
          </div>
        ) : selected ? (
          <HeroCountdown
            countdown={selected}
            onEdit={() => openEdit(selected)}
            onReachZero={
              selected.status === 'active' && onReachZero
                ? () => onReachZero(selected)
                : undefined
            }
          />
        ) : (
          <EmptyState onCreate={openCreate} />
        )}
      </div>

      <footer className="app-footer">
        <span>{history.length > 0 ? `${history.length} moment${history.length === 1 ? '' : 's'} in history` : 'Make time feel special'}</span>
        <button type="button" onClick={() => setLibraryOpen(true)}>Open your library</button>
      </footer>

      {libraryOpen ? (
        <CountdownLibrary
          active={active}
          history={history}
          selectedId={selectedId}
          onClose={() => setLibraryOpen(false)}
          onCreate={openCreate}
          onSelect={setSelectedId}
          onEdit={openEdit}
          onDelete={(item) => void remove(item)}
        />
      ) : null}

      {editorOpen ? (
        <CountdownEditor
          key={editing?.id ?? 'new'}
          countdown={editing}
          saving={saving}
          onSave={save}
          onClose={() => {
            if (!saving) {
              setEditorOpen(false)
              setEditing(null)
            }
          }}
        />
      ) : null}

      {countdowns.error ? (
        <Toast message={countdowns.error.message} onDismiss={countdowns.clearError} />
      ) : null}
    </main>
  )
}
