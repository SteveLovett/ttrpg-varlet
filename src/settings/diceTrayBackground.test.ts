import { describe, expect, it } from 'vitest'
import {
  DICE_TRAY_BACKGROUNDS,
  DEFAULT_DICE_TRAY_BACKGROUND_ID,
  getDiceTrayBackground,
  parseDiceTrayBackgroundId,
} from './diceTrayBackground'

describe('diceTrayBackground', () => {
  it('defines five tray backgrounds', () => {
    expect(DICE_TRAY_BACKGROUNDS).toHaveLength(5)
  })

  it('parses valid background ids', () => {
    expect(parseDiceTrayBackgroundId('forest')).toBe('forest')
  })

  it('falls back for unknown ids', () => {
    expect(parseDiceTrayBackgroundId('invalid')).toBe(DEFAULT_DICE_TRAY_BACKGROUND_ID)
  })

  it('resolves background config', () => {
    expect(getDiceTrayBackground('midnight').swatch).toBe('#0b1a3e')
  })

  it('migrates removed moss id to sand', () => {
    expect(parseDiceTrayBackgroundId('moss')).toBe('sand')
    expect(getDiceTrayBackground('sand').label).toBe('Sand')
    expect(getDiceTrayBackground('sand').swatch).toBe('#d8d2c4')
  })
})
