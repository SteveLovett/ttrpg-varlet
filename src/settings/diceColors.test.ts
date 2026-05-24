import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DICE_COLOR_THEME_ID,
  DICE_COLOR_THEMES,
  getDiceColorTheme,
  parseDiceColorThemeId,
} from './diceColors'

describe('diceColors', () => {
  it('defines five themes', () => {
    expect(DICE_COLOR_THEMES).toHaveLength(5)
  })

  it('parses valid theme ids', () => {
    expect(parseDiceColorThemeId('frost')).toBe('frost')
  })

  it('falls back for unknown ids', () => {
    expect(parseDiceColorThemeId('invalid')).toBe(DEFAULT_DICE_COLOR_THEME_ID)
  })

  it('uses solid custom colorsets for frost, ember, and arcane', () => {
    expect(getDiceColorTheme('frost').customColorset?.texture).toBe('none')
    expect(getDiceColorTheme('frost').customColorset?.background).toBe('#4a8fc7')
    expect(getDiceColorTheme('ember').customColorset?.texture).toBe('none')
    expect(getDiceColorTheme('arcane').customColorset?.background).toBe('#7c3aed')
  })
})
