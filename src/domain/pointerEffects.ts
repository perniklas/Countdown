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

export interface EventHorizonParallaxOffsets {
  coreX: number
  coreY: number
  discX: number
  discY: number
  discTiltX: number
  discTiltY: number
  haloX: number
  haloY: number
  ringX: number
  ringY: number
  foregroundX: number
  foregroundY: number
  starsX: number
  starsY: number
}

export function getEventHorizonParallax({
  clientX,
  clientY,
  left,
  top,
  width,
  height,
}: ParallaxInput): EventHorizonParallaxOffsets {
  if (width <= 0 || height <= 0) {
    return {
      coreX: 0,
      coreY: 0,
      discX: 0,
      discY: 0,
      discTiltX: 0,
      discTiltY: 0,
      haloX: 0,
      haloY: 0,
      ringX: 0,
      ringY: 0,
      foregroundX: 0,
      foregroundY: 0,
      starsX: 0,
      starsY: 0,
    }
  }

  const horizontal = clamp(((clientX - left) / width - 0.5) * 2, -1, 1)
  const vertical = clamp(((clientY - top) / height - 0.5) * 2, -1, 1)

  return {
    coreX: round(horizontal * 16),
    coreY: round(vertical * 12),
    discX: round(horizontal * 28),
    discY: round(vertical * 20),
    discTiltX: round(-vertical * 10),
    discTiltY: round(horizontal * 12),
    haloX: round(horizontal * 8),
    haloY: round(vertical * 6),
    ringX: round(horizontal * 15),
    ringY: round(vertical * 11),
    foregroundX: round(horizontal * 38),
    foregroundY: round(vertical * 26),
    starsX: round(horizontal * 6),
    starsY: round(vertical * 5),
  }
}

export interface GravitationalLensInput {
  starX: number
  starY: number
  holeX: number
  holeY: number
  shadowRadius: number
  einsteinRadius: number
}

export interface GravitationalLensOffset {
  dx: number
  dy: number
  scale: number
  opacity: number
}

export function getGravitationalLensOffset({
  starX,
  starY,
  holeX,
  holeY,
  shadowRadius,
  einsteinRadius,
}: GravitationalLensInput): GravitationalLensOffset {
  const deltaX = starX - holeX
  const deltaY = starY - holeY
  const distance = Math.hypot(deltaX, deltaY)

  // Stars inside the event horizon shadow are completely consumed by the black hole
  if (distance < shadowRadius) {
    return { dx: 0, dy: 0, scale: 0, opacity: 0 }
  }

  const maxInfluence = Math.max(shadowRadius * 1.5, einsteinRadius * 2.2)
  if (distance >= maxInfluence) {
    return { dx: 0, dy: 0, scale: 1, opacity: 1 }
  }

  const normalX = distance === 0 ? 1 : deltaX / distance
  const normalY = distance === 0 ? 0 : deltaY / distance
  const tangentialX = -normalY
  const tangentialY = normalX

  // General relativity outward radial push + tangential bending around photon sphere
  const factor = (1 - (distance - shadowRadius) / (maxInfluence - shadowRadius)) ** 1.6
  const radialPush = factor * (shadowRadius * 0.45)
  const tangentialBend = factor * (shadowRadius * 0.18)

  return {
    dx: round(normalX * radialPush + tangentialX * tangentialBend),
    dy: round(normalY * radialPush + tangentialY * tangentialBend),
    scale: round(1 + factor * 0.75),
    opacity: 1,
  }
}