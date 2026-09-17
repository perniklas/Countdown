import type { ThemeId } from '../domain/countdown'

type StarLayer = 0 | 1 | 2

interface BackgroundStar {
  x: number
  y: number
  size: number
  opacity: number
  color: string
  layer: StarLayer
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

    return {
      x: Math.round(random() * 10_000) / 100,
      y: Math.round(random() * 10_000) / 100,
      size: Math.round((sizeMin + random() * (sizeMax - sizeMin)) * 100) / 100,
      opacity:
        Math.round((opacityMin + random() * (opacityMax - opacityMin)) * 100) /
        100,
      color: random() > 0.78 ? '#d9cc99' : '#ffffff',
      layer,
    }
  })
}

const EVENT_HORIZON_STARS = createBackgroundStars(92)

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
                    key={index}
                    style={{
                      left: star.x + '%',
                      top: star.y + '%',
                      width: star.size + 'px',
                      height: star.size + 'px',
                      opacity: star.opacity,
                      background: star.color,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="eh-hole">
            <span className="eh-halo" />
            <span className="eh-disk" />
            <span className="eh-sphere" />
            <span className="eh-photon-ring" />
            <span className="eh-bloom" />
          </div>
          <span className="eh-dust" />
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
