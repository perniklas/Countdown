import confetti from 'canvas-confetti'

export function celebrate() {
  const common = {
    disableForReducedMotion: true,
    colors: ['#ff6b6b', '#ffd43b', '#4dabf7', '#b197fc', '#ffffff'],
    ticks: 180,
    zIndex: 1000,
  }

  try {
    void confetti({
      ...common,
      particleCount: 55,
      angle: 58,
      spread: 62,
      startVelocity: 52,
      origin: { x: 0, y: 0.72 },
    })
    void confetti({
      ...common,
      particleCount: 55,
      angle: 122,
      spread: 62,
      startVelocity: 52,
      origin: { x: 1, y: 0.72 },
    })
    void confetti({
      ...common,
      particleCount: 80,
      spread: 115,
      startVelocity: 38,
      scalar: 0.92,
      origin: { x: 0.5, y: 0.44 },
    })
  } catch {
    return
  }
}
