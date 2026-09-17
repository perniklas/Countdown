import confetti from 'canvas-confetti'

const bursts = [
  { x: 0.08, y: 0.78, angle: 58, interval: 700 },
  { x: 0.5, y: 0.34, angle: 90, interval: 950 },
  { x: 0.92, y: 0.78, angle: 122, interval: 1_250 },
]

export function celebrate(): () => void {
  const shoot = ({ x, y, angle }: (typeof bursts)[number]) => {
    if (document.hidden) return

    void confetti({
      particleCount: 14,
      angle,
      spread: 70,
      startVelocity: 44,
      origin: { x, y },
      colors: ['#ff6b6b', '#ffd43b', '#4dabf7', '#b197fc', '#ffffff'],
      disableForReducedMotion: true,
      zIndex: 1000,
    })
  }

  bursts.forEach(shoot)
  const intervals = bursts.map((burst) =>
    window.setInterval(() => shoot(burst), burst.interval),
  )

  return () => intervals.forEach(window.clearInterval)
}
