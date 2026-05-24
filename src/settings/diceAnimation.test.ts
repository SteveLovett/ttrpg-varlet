import { describe, expect, it } from 'vitest'
import { resolveDicePresentation } from './diceAnimation'

describe('resolveDicePresentation', () => {
  it('instant mode disables animation', () => {
    expect(resolveDicePresentation('instant', 'full')).toEqual({
      pseudo3d: false,
      full3d: false,
      instant: true,
    })
  })

  it('auto uses 3d on full tray when webgl available', () => {
    expect(resolveDicePresentation('auto', 'full', { webglAvailable: true })).toMatchObject({
      full3d: true,
      instant: false,
    })
  })

  it('auto uses pseudo3d on compact tray', () => {
    expect(resolveDicePresentation('auto', 'compact', { webglAvailable: true })).toMatchObject({
      pseudo3d: true,
      full3d: false,
    })
  })

  it('respects reduced motion', () => {
    expect(
      resolveDicePresentation('auto', 'full', { reducedMotion: true, webglAvailable: true }),
    ).toMatchObject({ instant: true })
  })
})
