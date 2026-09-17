import { describe, expect, it } from 'vitest'
import { getParallaxOffsets, getStarWarp } from './pointerEffects'

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
})