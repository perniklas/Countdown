import { describe, expect, it } from 'vitest'
import {
  getEventHorizonParallax,
  getGravitationalLensOffset,
  getParallaxOffsets,
  getStarWarp,
} from './pointerEffects'

describe('pointer effects', () => {
  it('maps pointer position to distinct far and near parallax depths', () => {
    expect(
      getParallaxOffsets({
        clientX: 750,
        clientY: 200,
        left: 0,
        top: 0,
        width: 1_000,
        height: 800,
      }),
    ).toEqual({
      farX: 6,
      farY: -5,
      nearX: 14,
      nearY: -11,
    })
  })

  it('bends a nearby star around the pointer and leaves distant stars still', () => {
    expect(
      getStarWarp({
        starX: 60,
        starY: 50,
        pointerX: 50,
        pointerY: 50,
        radius: 100,
      }),
    ).toEqual({
      x: 21.06,
      y: 14.58,
      scale: 1.45,
    })

    expect(
      getStarWarp({
        starX: 200,
        starY: 50,
        pointerX: 50,
        pointerY: 50,
        radius: 100,
      }),
    ).toEqual({ x: 0, y: 0, scale: 1 })
  })

  it('calculates event horizon multi-layer parallax and 3D tilts', () => {
    expect(
      getEventHorizonParallax({
        clientX: 750,
        clientY: 200,
        left: 0,
        top: 0,
        width: 1_000,
        height: 800,
      }),
    ).toEqual({
      coreX: 8,
      coreY: -6,
      discX: 14,
      discY: -10,
      discTiltX: 5,
      discTiltY: 6,
      haloX: 4,
      haloY: -3,
      ringX: 7.5,
      ringY: -5.5,
      foregroundX: 19,
      foregroundY: -13,
      starsX: 3,
      starsY: -2.5,
    })
  })

  it('handles zero or negative dimensions safely for event horizon parallax', () => {
    expect(
      getEventHorizonParallax({
        clientX: 100,
        clientY: 100,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      }),
    ).toEqual({
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
    })
  })

  it('absorbs stars inside the event horizon shadow and deflects stars near the Einstein radius', () => {
    // Inside shadow: distance 50 < shadowRadius 100 -> absorbed
    expect(
      getGravitationalLensOffset({
        starX: 550,
        starY: 500,
        holeX: 500,
        holeY: 500,
        shadowRadius: 100,
        einsteinRadius: 140,
      }),
    ).toEqual({
      dx: 0,
      dy: 0,
      scale: 0,
      opacity: 0,
    })

    // Near Einstein radius: distance 120 -> deflected radially and bent tangentially
    const near = getGravitationalLensOffset({
      starX: 620,
      starY: 500,
      holeX: 500,
      holeY: 500,
      shadowRadius: 100,
      einsteinRadius: 140,
    })
    expect(near.dx).toBeGreaterThan(0)
    expect(near.scale).toBeGreaterThan(1)
    expect(near.opacity).toBe(1)

    // Far away: distance 500 >= maxInfluence (308) -> unperturbed
    expect(
      getGravitationalLensOffset({
        starX: 1000,
        starY: 500,
        holeX: 500,
        holeY: 500,
        shadowRadius: 100,
        einsteinRadius: 140,
      }),
    ).toEqual({
      dx: 0,
      dy: 0,
      scale: 1,
      opacity: 1,
    })
  })
})