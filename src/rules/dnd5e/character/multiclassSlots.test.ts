import { describe, expect, it } from 'vitest'
import { combinedSpellSlotsMax, multiclassCasterLevel } from './multiclassSlots'

describe('multiclassCasterLevel', () => {
  it('combines full and half caster levels', () => {
    const level = multiclassCasterLevel([
      { className: 'Wizard', level: 3 },
      { className: 'Paladin', level: 2 },
    ])
    expect(level).toBe(4)
  })
})

describe('combinedSpellSlotsMax', () => {
  it('returns slots for combined caster level', () => {
    const slots = combinedSpellSlotsMax([
      { className: 'Wizard', level: 3 },
      { className: 'Paladin', level: 2 },
    ])
    expect(slots[0]).toBeGreaterThan(0)
  })
})
