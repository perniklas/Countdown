interface ParallaxInput {
  clientX: number
  clientY: number
  left: number
  top: number
  width: number
  height: number
}

export interface ParallaxOffsets {
  farX: number
  farY: number
  nearX: number
  nearY: number
}

interface StarWarpInput {
  starX: number
  starY: number
  pointerX: number
  pointerY: number
  radius: number
}

export interface StarWarp {
  x: number
  y: number
  scale: number
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

const round = (value: number) => Math.round(value * 100) / 100

export function getParallaxOffsets({
  clientX,
  clientY,
  left,
  top,
  width,
  height,
}: ParallaxInput): ParallaxOffsets {
  if (width <= 0 || height <= 0) {
    return { farX: 0, farY: 0, nearX: 0, nearY: 0 }
  }

  const horizontal = clamp(((clientX - left) / width - 0.5) * 2, -1, 1)
  const vertical = clamp(((clientY - top) / height - 0.5) * 2, -1, 1)

  return {
    farX: round(horizontal * 12),
    farY: round(vertical * 10),
    nearX: round(horizontal * 28),
    nearY: round(vertical * 22),
  }
}

export function getStarWarp({
  starX,
  starY,
  pointerX,
  pointerY,
  radius,
}: StarWarpInput): StarWarp {
  const deltaX = starX - pointerX
  const deltaY = starY - pointerY
  const distance = Math.hypot(deltaX, deltaY)

  if (radius <= 0 || distance >= radius) {
    return { x: 0, y: 0, scale: 1 }
  }

  const normalX = distance === 0 ? 1 : deltaX / distance
  const normalY = distance === 0 ? 0 : deltaY / distance
  const influence = (1 - distance / radius) ** 2
  const radialPull = influence * 26
  const orbitalBend = influence * 18

  return {
    x: round(normalX * radialPull - normalY * orbitalBend),
    y: round(normalY * radialPull + normalX * orbitalBend),
    scale: round(1 + influence * 0.55),
  }
}