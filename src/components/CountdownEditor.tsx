import { Check, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import type { Countdown, CountdownInput, ThemeId } from '../domain/countdown'
import {
  countdownToDraft,
  draftToInput,
  emptyDraft,
  type CountdownDraft,
} from '../domain/editor'
import { THEMES, VALHEIM_BIOMES, normalizeValheimBiome } from '../domain/theme'

interface CountdownEditorProps {
  countdown: Countdown | null
  saving: boolean
  onSave: (input: CountdownInput) => Promise<void>
  onClose: () => void
}

export function CountdownEditor({
  countdown,
  saving,
  onSave,
  onClose,
}: CountdownEditorProps) {
  const titleId = useId()
  const [draft, setDraft] = useState<CountdownDraft>(() =>
    countdown ? countdownToDraft(countdown) : emptyDraft(),
  )
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  const update = <Key extends keyof CountdownDraft>(
    key: Key,
    value: CountdownDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = draftToInput(draft)
    if (!result.ok) {
      setMessage(result.message)
      return
    }

    setMessage(null)
    try {
      await onSave(result.value)
    } catch {
      return
    }
  }

  return (
    <div className="modal-layer">
      <button
        className="modal-backdrop"
        type="button"
        aria-label="Close editor"
        onClick={onClose}
        disabled={saving}
      />
      <section
        className="editor-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="editor-header">
          <div>
            <p className="eyebrow">{countdown ? 'Change the moment' : 'A new moment'}</p>
            <h2 id={titleId}>{countdown ? 'Edit countdown' : 'New countdown'}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close editor"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={submit} className="editor-form">
          <label className="field field-wide">
            <span>Countdown name</span>
            <input
              autoFocus
              value={draft.title}
              maxLength={80}
              placeholder="Summer in Lisbon"
              onChange={(event) => update('title', event.target.value)}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => update('date', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Time</span>
              <input
                type="time"
                value={draft.time}
                onChange={(event) => update('time', event.target.value)}
              />
            </label>
          </div>

          <fieldset className="theme-fieldset">
            <legend>Choose an atmosphere</legend>
            <div className="theme-options" role="radiogroup" aria-label="Theme">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-option theme-swatch-${theme.id}`}
                  type="button"
                  role="radio"
                  aria-checked={draft.theme === theme.id}
                  onClick={() => update('theme', theme.id as ThemeId)}
                >
                  <span className="theme-option-check" aria-hidden="true">
                    {draft.theme === theme.id ? <Check size={14} /> : null}
                  </span>
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                </button>
              ))}
            </div>
          </fieldset>

          {draft.theme === 'aurora' ? (
            <label className="mood-field">
              <span>
                <strong>Background mood</strong>
                <output>{draft.gradientMood}</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={draft.gradientMood}
                onChange={(event) =>
                  update('gradientMood', Number(event.target.value))
                }
              />
              <span className="mood-labels" aria-hidden="true">
                <small>Ember</small><small>Lagoon</small><small>Orchid</small>
              </span>
            </label>
          ) : null}

          {draft.theme === 'valheim' ? (
            <label className="field biome-field">
              <span>Valheim biome</span>
              <select
                value={draft.biome ?? 'meadows'}
                onChange={(event) => update('biome', normalizeValheimBiome(event.target.value))}
                aria-describedby={titleId + '-biome-description'}
              >
                {VALHEIM_BIOMES.map((biome) => <option key={biome.id} value={biome.id}>{biome.name}</option>)}
              </select>
              <small id={titleId + '-biome-description'}>
                {VALHEIM_BIOMES.find((biome) => biome.id === (draft.biome ?? 'meadows'))?.description}
              </small>
            </label>
          ) : null}

          {message ? <p className="form-message" role="alert">{message}</p> : null}

          <footer className="editor-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save countdown'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
