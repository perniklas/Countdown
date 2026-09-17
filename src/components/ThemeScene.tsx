import type { CSSProperties } from 'react'
import type { ThemeId } from '../domain/countdown'

type StarLayer = 0 | 1 | 2

interface BackgroundStar {
  x: number
  y: number
  size: number
  opacity: number
  color: string
  layer: StarLayer
  isLensed?: boolean
  lensAngle?: number
  arcStretch?: number
}

const STAR_LAYERS: StarLayer[] = [0, 1, 2]

// Layer 0 is the smallest/faintest, layer 2 the largest/brightest, so theme
// CSS can move each layer at a different parallax depth.
const LAYER_SIZE_RANGE: Record<StarLayer, [number, number]> = {
  0: [0.55, 0.95],
  1: [0.95, 1.45],
  2: [1.45, 2.15],
}

const LAYER_OPACITY_RANGE: Record<StarLayer, [number, number]> = {
  0: [0.22, 0.42],
  1: [0.4, 0.62],
  2: [0.58, 0.86],
}

const createBackgroundStars = (count: number): BackgroundStar[] => {
  let seed = 0x7a31f2d9
  const random = () => {
    seed = (Math.imul(1_664_525, seed) + 1_013_904_223) >>> 0
    return seed / 4_294_967_296
  }

  return Array.from({ length: count }, (_, index) => {
    const layer = (index % 3) as StarLayer
    const [sizeMin, sizeMax] = LAYER_SIZE_RANGE[layer]
    const [opacityMin, opacityMax] = LAYER_OPACITY_RANGE[layer]

    let x = Math.round(random() * 10_000) / 100
    let y = Math.round(random() * 10_000) / 100
    let isLensed = false
    let lensAngle = 0
    let arcStretch = 1

    // Black hole center is at (50%, 48%)
    const dx = x - 50
    const dy = (y - 48) * 1.25 // spherical aspect ratio correction
    const dist = Math.hypot(dx, dy)
    const shadowRadius = 15.5 // shadow boundary %

    if (dist < shadowRadius) {
      // Gravitational deflection away from shadow interior: never inside
      const angle = Math.atan2(dy, dx)
      const deflectedDist = shadowRadius + 1.2 + random() * 8.5
      x = Math.round((50 + Math.cos(angle) * deflectedDist) * 100) / 100
      y = Math.round((48 + (Math.sin(angle) * deflectedDist) / 1.25) * 100) / 100
      isLensed = true
      lensAngle = Math.round((angle * (180 / Math.PI) + 90) * 10) / 10
      arcStretch = Math.round((1.8 + random() * 1.4) * 100) / 100
    } else if (dist < 36) {
      // Gravitational warping / Einstein arc zone near black hole
      const angle = Math.atan2(dy, dx)
      isLensed = true
      lensAngle = Math.round((angle * (180 / Math.PI) + 90) * 10) / 10
      const proximity = (36 - dist) / (36 - shadowRadius)
      arcStretch = Math.round((1 + proximity ** 1.4 * 2.2) * 100) / 100
    }

    return {
      x,
      y,
      size: Math.round((sizeMin + random() * (sizeMax - sizeMin)) * 100) / 100,
      opacity:
        Math.round((opacityMin + random() * (opacityMax - opacityMin)) * 100) /
        100,
      color: random() > 0.78 ? '#d9cc99' : '#ffffff',
      layer,
      isLensed,
      lensAngle,
      arcStretch,
    }
  })
}

interface AccretionSpark {
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
}

const createAccretionSparks = (count: number): AccretionSpark[] => {
  let seed = 0x5e81d4a2
  const random = () => {
    seed = (Math.imul(1_664_525, seed) + 1_013_904_223) >>> 0
    return seed / 4_294_967_296
  }

  return Array.from({ length: count }, () => ({
    x: Math.round((14 + random() * 72) * 10) / 10,
    y: Math.round((36 + random() * 28) * 10) / 10,
    size: Math.round((1.2 + random() * 2.4) * 10) / 10,
    opacity: Math.round((0.35 + random() * 0.55) * 100) / 100,
    duration: Math.round((4.5 + random() * 6) * 10) / 10,
    delay: Math.round(-random() * 6 * 10) / 10,
  }))
}

const EVENT_HORIZON_STARS = createBackgroundStars(240)
const EVENT_HORIZON_SPARKS = createAccretionSparks(18)

interface ThemeSceneProps {
  theme: ThemeId
}

export function ThemeScene({ theme }: ThemeSceneProps) {
  switch (theme) {
    case 'aurora':
      return (
        <div className="glass-scene">
          <span className="glass-blob glass-blob-a" />
          <span className="glass-blob glass-blob-b" />
          <span className="glass-blob glass-blob-c" />
          <span className="glass-blob glass-blob-d" />
          <span className="glass-grain" />
        </div>
      )

    case 'event-horizon':
      return (
        <div className="eh-scene">
          <div className="eh-starfield">
            {STAR_LAYERS.map((layer) => (
              <div className="eh-star-layer" data-layer={layer} key={layer}>
                {EVENT_HORIZON_STARS.filter(
                  (star) => star.layer === layer,
                ).map((star, index) => (
                  <span
                    className="eh-star"
                    data-x={star.x}
                    data-y={star.y}
                    data-lensed={star.isLensed ? 'true' : undefined}
                    key={index}
                    style={{
                      left: star.x + '%',
                      top: star.y + '%',
                      width: star.size + 'px',
                      height: star.size + 'px',
                      background: star.color,
                      ...({
                        '--star-opacity': star.opacity,
                        ...(star.isLensed
                          ? {
                              '--lens-rot': `${star.lensAngle}deg`,
                              '--lens-stretch': String(star.arcStretch),
                            }
                          : {}),
                      } as CSSProperties),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <span className="eh-dust" />
          <div className="eh-hole">
            <span className="eh-bloom" />
            <div className="eh-rear-lensing">
              <svg
                className="eh-lensing-svg"
                viewBox="0 0 800 600"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                <defs>
                  {/* Ethereal Doppler gradient: incandescent champagne & radiant white-gold */}
                  <linearGradient id="eh-doppler-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                    <stop offset="22%" stopColor="#fff8e4" stopOpacity="0.78" />
                    <stop offset="46%" stopColor="#ffd98c" stopOpacity="0.65" />
                    <stop offset="74%" stopColor="#e88a24" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#8c3300" stopOpacity="0.12" />
                  </linearGradient>

                  <linearGradient id="eh-arch-inner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="25%" stopColor="#fff2cf" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#ffc562" stopOpacity="0.7" />
                    <stop offset="78%" stopColor="#db6e16" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#662200" stopOpacity="0.1" />
                  </linearGradient>

                  {/* Gradient mask to feather the upper arch edges and eliminate cutoffs */}
                  <radialGradient id="eh-arch-vignette" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="68%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="88%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>

                  {/* Fades the crescent tips at the left/right ends so they dissolve instead of ending bluntly */}
                  <mask id="eh-feather-mask">
                    <rect x="0" y="0" width="800" height="600" fill="url(#eh-arch-vignette)" />
                  </mask>
                </defs>

                {/* Upper Lensed Arch: soft continuous curves that blend seamlessly without cutoffs */}
                <g mask="url(#eh-feather-mask)">
                  <path
                    className="eh-upper-arch-base"
                    d="M 40,310 C 100,105 250,45 400,45 C 550,45 700,105 760,310 C 660,215 520,175 400,175 C 280,175 140,215 40,310 Z"
                    fill="url(#eh-doppler-grad)"
                    opacity="0.12"
                  />
                  <path
                    className="eh-upper-arch-core"
                    d="M 100,310 C 160,140 270,90 400,90 C 530,90 640,140 700,310 C 620,210 510,180 400,180 C 290,180 180,210 100,310 Z"
                    fill="url(#eh-arch-inner-grad)"
                    opacity="0.12"
                  />
                  <path
                    className="eh-upper-arch-filament"
                    d="M 140,310 C 200,195 290,182 400,182 C 510,182 600,195 660,310"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    opacity="0.9"
                  />

                  {/* Lower Lensed Arch: subtle underside curve */}
                  <path
                    className="eh-lower-arch-base"
                    d="M 110,300 C 170,390 280,422 400,422 C 520,422 630,390 690,300 C 620,360 510,395 400,395 C 290,395 180,360 110,300 Z"
                    fill="url(#eh-doppler-grad)"
                    opacity="0.1"
                  />
                  <path
                    className="eh-lower-arch-filament"
                    d="M 170,300 C 220,380 300,398 400,398 C 500,398 580,380 630,300"
                    fill="none"
                    stroke="#ffeec7"
                    strokeWidth="1.4"
                    opacity="0.7"
                  />
                </g>
              </svg>
            </div>
            <div className="eh-caustic-rings" />
            <div className="eh-singularity">
              <span className="eh-sphere" />
            </div>
            <span className="eh-photon-ring" />
            <div className="eh-front-disc">
              <div className="eh-disc-surface">
                <div className="eh-disc-plasma" />
                <div className="eh-disc-rings" />
                <div className="eh-disc-isco" />
              </div>
            </div>
            <div className="eh-doppler-boost" />
            <div className="eh-filaments">
              <span className="eh-filament eh-fil-1" />
              <span className="eh-filament eh-fil-2" />
              <span className="eh-filament eh-fil-3" />
            </div>
            <span className="eh-anamorphic-flare" />
            <div className="eh-sparks">
              {EVENT_HORIZON_SPARKS.map((spark, index) => (
                <span
                  key={index}
                  className="eh-spark"
                  style={{
                    left: spark.x + '%',
                    top: spark.y + '%',
                    width: spark.size + 'px',
                    height: spark.size + 'px',
                    opacity: spark.opacity,
                    animationDuration: spark.duration + 's',
                    animationDelay: spark.delay + 's',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )

    case 'hyperdrive':
      return (
        <div className="sundown-scene">
          <span className="sundown-sky" />
          <span className="sundown-stars" />
          <span className="sundown-sun" />
          <span className="sundown-haze" />
          <span className="sundown-horizon" />
          <span className="sundown-grid" />
          <span className="sundown-palm sundown-palm-left" />
          <span className="sundown-palm sundown-palm-right" />
          <span className="sundown-scanlines" />
        </div>
      )

    case 'paper-riot':
      return (
        <div className="paper-scene">
          <span className="paper-ink paper-ink-a" />
          <span className="paper-ink paper-ink-b" />
          <span className="paper-ink paper-ink-c" />
          <span className="paper-halftone" />
          <span className="paper-grain" />
        </div>
      )

    default:
      return null
  }
}

