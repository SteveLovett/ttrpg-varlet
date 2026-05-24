import { describe, expect, it } from 'vitest'
import { createEmptySheet } from './types'
import { parseActiveConditions, toggleActiveCondition } from './conditions'

describe('character conditions', () => {
  it('parses valid condition ids only', () => {
    expect(parseActiveConditions(['prone', 'invalid', 'grappled'])).toEqual(['prone', 'grappled'])
  })

  it('toggles conditions on the sheet', () => {
    const sheet = createEmptySheet('Test')
    const next = toggleActiveCondition(sheet, 'prone', true)
    expect(next.activeConditions).toContain('prone')
    const off = toggleActiveCondition(next, 'prone', false)
    expect(off.activeConditions).not.toContain('prone')
  })
})
