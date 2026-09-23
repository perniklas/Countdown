import { LogOut, Menu, Plus, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { celebrate } from '../celebrate'
import { CountdownEditor } from '../components/CountdownEditor'
import { CountdownLibrary } from '../components/CountdownLibrary'
import { EmptyState } from '../components/EmptyState'
import { HeroCountdown } from '../components/HeroCountdown'
import { Toast } from '../components/Toast'
import { ThemeScene } from '../components/ThemeScene'
import { partitionCountdowns, type Countdown, type CountdownInput } from '../domain/countdown'
import {
  getEventHorizonParallax,
  getGravitationalLensOffset,
  getParallaxOffsets,
} from '../domain/pointerEffects'
import { getGlassVariables, normalizeValheimBiome, VALHEIM_BIOMES } from '../domain/theme'
import { useCountdowns } from '../hooks/useCountdowns'
import type { CountdownRepository } from '../services/countdownRepository'

type DeviceMotionState = 'idle' | 'active' | 'denied' | 'unavailable'

type DeviceOrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const round3 = (value: number) => Math.round(value * 1_000) / 1_000

const EH_PARALLAX_PROPERTIES = [
  '--eh-disc-x',
  '--eh-disc-y',
  '--eh-disc-tilt-x',
  '--eh-disc-tilt-y',
  '--eh-core-x',
  '--eh-core-y',
  '--eh-halo-x',
  '--eh-halo-y',
  '--eh-ring-x',
  '--eh-ring-y',
  '--eh-fg-x',
  '--eh-fg-y',
  '--eh-stars-x',
  '--eh-stars-y',
] as const

const resetSceneMotion = (root: HTMLElement) => {
  root.style.setProperty('--pointer-x', '0.5')
  root.style.setProperty('--pointer-y', '0.5')
  root.style.setProperty('--parallax-far-x', '0px')
  root.style.setProperty('--parallax-far-y', '0px')
  root.style.setProperty('--parallax-near-x', '0px')
  root.style.setProperty('--parallax-near-y', '0px')

  for (const prop of EH_PARALLAX_PROPERTIES) {
    root.style.setProperty(prop, prop.includes('tilt') ? '0deg' : '0px')
  }

  root.querySelectorAll<HTMLElement>('.eh-star').forEach((star) => {
    star.style.setProperty('--warp-x', '0px')
    star.style.setProperty('--warp-y', '0px')
    star.style.setProperty('--warp-scale', '1')
    star.style.setProperty('--lens-opacity', '1')
  })
}
interface CountdownAppProps {
  uid: string
  repository: CountdownRepository
  displayName: string | null
  photoURL?: string | null
  onSignOut: () => void
}

export function CountdownApp({
  uid,
  repository,
  displayName,
  photoURL,
  onSignOut,
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
  const [deviceMotion, setDeviceMotion] = useState<DeviceMotionState>('idle')

  const celebrationStop = useRef<(() => void) | null>(null)
  const themeRootRef = useRef<HTMLElement>(null)
  const pointerFrame = useRef<number | null>(null)
  const latestPointer = useRef<{ root: HTMLElement; clientX: number; clientY: number } | null>(null)
  const deviceMotionBaseline = useRef<{ beta: number; gamma: number } | null>(null)

  const selected =
    countdowns.items.find((item) => item.id === selectedId) ?? active[0] ?? null
  const resolvedSelectedId = selected?.id ?? null
  const theme = selected?.theme ?? 'aurora'
  const biome = normalizeValheimBiome(selected?.themeSettings.biome)
  const gradientMood = selected?.themeSettings.gradientMood ?? 50
  const themeStyle =
    theme === 'aurora' ? (getGlassVariables(gradientMood) as CSSProperties) : undefined
  useEffect(() => {
    if (
      selected &&
      (selected.status === 'history' || selected.targetAt <= Date.now())
    ) {
      celebrationStop.current = celebrate()
    }

    return () => {
      celebrationStop.current?.()
      celebrationStop.current = null
    }
  }, [resolvedSelectedId, selected?.status, selected?.targetAt])

  useEffect(() => {
    if (pointerFrame.current !== null) {
      cancelAnimationFrame(pointerFrame.current)
      pointerFrame.current = null
    }
    latestPointer.current = null
    if (themeRootRef.current) resetSceneMotion(themeRootRef.current)

    return () => {
      if (pointerFrame.current !== null) {
        cancelAnimationFrame(pointerFrame.current)
      }
    }
  }, [biome, theme])

  useEffect(() => {
    if (theme !== 'valheim' || biome !== 'meadows' || deviceMotion !== 'active') return
    deviceMotionBaseline.current = null

    const root = themeRootRef.current
    if (!root) return

    const updateFromDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
        event.beta === null ||
        event.gamma === null
      ) {
        return
      }

      if (!deviceMotionBaseline.current) {
        deviceMotionBaseline.current = { beta: event.beta, gamma: event.gamma }
        return
      }

      const horizontal = Math.min(1, Math.max(-1, (event.gamma - deviceMotionBaseline.current.gamma) / 25))
      const vertical = Math.min(1, Math.max(-1, (event.beta - deviceMotionBaseline.current.beta) / 25))
      root.style.setProperty('--pointer-x', String(round3(0.5 + horizontal * 0.25)))
      root.style.setProperty('--pointer-y', String(round3(0.5 + vertical * 0.25)))
    }

    window.addEventListener('deviceorientation', updateFromDeviceOrientation, true)
    return () => {
      window.removeEventListener('deviceorientation', updateFromDeviceOrientation, true)
      resetSceneMotion(root)
    }
  }, [biome, deviceMotion, theme])
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


  const handleReachZero = () => {
    celebrationStop.current?.()
    celebrationStop.current = celebrate()
  }
  const enableDeviceMotion = async () => {
    if (
      !window.isSecureContext ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setDeviceMotion('unavailable')
      return
    }

    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setDeviceMotion('unavailable')
      return
    }

    const orientation = DeviceOrientationEvent as DeviceOrientationWithPermission
    try {
      if (orientation.requestPermission) {
        const permission = await orientation.requestPermission()
        if (permission !== 'granted') {
          setDeviceMotion('denied')
          return
        }
      }
      setDeviceMotion('active')
    } catch {
      setDeviceMotion('denied')
    }
  }
  const moveBackgroundWithPointer = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      event.pointerType === 'touch' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    latestPointer.current = {
      root: event.currentTarget,
      clientX: event.clientX,
      clientY: event.clientY,
    }
    if (pointerFrame.current !== null) return

    pointerFrame.current = requestAnimationFrame(() => {
      pointerFrame.current = null
      const pointer = latestPointer.current
      if (!pointer) return

      const rect = pointer.root.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const pointerFractionX = round3(clamp01((pointer.clientX - rect.left) / rect.width))
      const pointerFractionY = round3(clamp01((pointer.clientY - rect.top) / rect.height))
      pointer.root.style.setProperty('--pointer-x', String(pointerFractionX))
      pointer.root.style.setProperty('--pointer-y', String(pointerFractionY))

      if (theme === 'aurora') {
        const offsets = getParallaxOffsets({
          clientX: pointer.clientX,
          clientY: pointer.clientY,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
        pointer.root.style.setProperty('--parallax-far-x', String(offsets.farX) + 'px')
        pointer.root.style.setProperty('--parallax-far-y', String(offsets.farY) + 'px')
        pointer.root.style.setProperty('--parallax-near-x', String(offsets.nearX) + 'px')
        pointer.root.style.setProperty('--parallax-near-y', String(offsets.nearY) + 'px')
      }

      if (theme === 'event-horizon') {
        const offsets = getEventHorizonParallax({
          clientX: pointer.clientX,
          clientY: pointer.clientY,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
        pointer.root.style.setProperty('--eh-disc-x', `${offsets.discX}px`)
        pointer.root.style.setProperty('--eh-disc-y', `${offsets.discY}px`)
        pointer.root.style.setProperty('--eh-disc-tilt-x', `${offsets.discTiltX}deg`)
        pointer.root.style.setProperty('--eh-disc-tilt-y', `${offsets.discTiltY}deg`)
        pointer.root.style.setProperty('--eh-core-x', `${offsets.coreX}px`)
        pointer.root.style.setProperty('--eh-core-y', `${offsets.coreY}px`)
        pointer.root.style.setProperty('--eh-halo-x', `${offsets.haloX}px`)
        pointer.root.style.setProperty('--eh-halo-y', `${offsets.haloY}px`)
        pointer.root.style.setProperty('--eh-ring-x', `${offsets.ringX}px`)
        pointer.root.style.setProperty('--eh-ring-y', `${offsets.ringY}px`)
        pointer.root.style.setProperty('--eh-fg-x', `${offsets.foregroundX}px`)
        pointer.root.style.setProperty('--eh-fg-y', `${offsets.foregroundY}px`)
        pointer.root.style.setProperty('--eh-stars-x', `${offsets.starsX}px`)
        pointer.root.style.setProperty('--eh-stars-y', `${offsets.starsY}px`)

        const sphere = pointer.root.querySelector('.eh-singularity')
        if (sphere) {
          const sphereRect = sphere.getBoundingClientRect()
          const holeX = sphereRect.left + sphereRect.width / 2 - rect.left
          const holeY = sphereRect.top + sphereRect.height / 2 - rect.top
          const shadowRadius = sphereRect.width / 2
          const einsteinRadius = shadowRadius * 1.4

          pointer.root
            .querySelectorAll<HTMLElement>('.eh-star')
            .forEach((star) => {
              const lens = getGravitationalLensOffset({
                starX: (Number(star.dataset.x) / 100) * rect.width,
                starY: (Number(star.dataset.y) / 100) * rect.height,
                holeX,
                holeY,
                shadowRadius,
                einsteinRadius,
              })
              star.style.setProperty('--warp-x', String(lens.dx) + 'px')
              star.style.setProperty('--warp-y', String(lens.dy) + 'px')
              star.style.setProperty('--warp-scale', String(lens.scale))
              star.style.setProperty('--lens-opacity', String(lens.opacity))
            })
        }
      }
    })
  }

  const recenterBackground = (event: ReactPointerEvent<HTMLElement>) => {
    latestPointer.current = null
    if (pointerFrame.current !== null) {
      cancelAnimationFrame(pointerFrame.current)
      pointerFrame.current = null
    }
    resetSceneMotion(event.currentTarget)
  }
  return (
    <main
      className={`theme-root theme-${theme}`}
      data-biome={theme === 'valheim' ? biome : undefined}
      ref={themeRootRef}
      style={themeStyle}
      onPointerMove={moveBackgroundWithPointer}
      onPointerLeave={recenterBackground}
    >
      <div className="app-decoration" aria-hidden="true">
        <ThemeScene theme={theme} biome={biome} />
      </div>

      {theme === 'valheim' && biome === 'meadows' && deviceMotion !== 'active' ? (
        <div className="valheim-motion-control" aria-live="polite">
          <button
            type="button"
            onClick={() => void enableDeviceMotion()}
            disabled={deviceMotion !== 'idle'}
          >
            {deviceMotion === 'idle' ? 'Enable device motion' : 'Device motion unavailable'}
          </button>
        </div>
      ) : null}
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
              selected.status === 'active'
                ? handleReachZero
                : undefined
            }
          />
        ) : (
          <EmptyState onCreate={openCreate} />
        )}
      </div>

      <footer className="app-footer">
        <span>{theme === 'valheim' ? 'Valheim · ' + VALHEIM_BIOMES.find((item) => item.id === biome)?.name : ''}</span>
        <button type="button" onClick={() => setLibraryOpen(true)}>Open your library</button>
      </footer>

      {libraryOpen ? (
        <CountdownLibrary
          active={active}
          history={history}
          selectedId={resolvedSelectedId}
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


