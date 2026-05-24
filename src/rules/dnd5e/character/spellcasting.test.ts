import { describe, expect, it } from 'vitest'
import { testSheet } from '../../../test/sheetFixtures'
import {
  addSpellToSpellcasting,
  classHasSpellcasting,
  createDefaultSpellcasting,
  maxCantripsKnown,
  maxSpellsPrepared,
  pactSlotSummary,
  preparedCapDescription,
  spellAttackBonus,
  spellcastingMode,
  spellSaveDc,
  spellSlotsMax,
  toggleSpellPrepared,
  validateSpellcasting,
} from './spellcasting'

describe('classHasSpellcasting', () => {
  it('identifies casters and non-casters', () => {
    expect(classHasSpellcasting('Wizard')).toBe(true)
    expect(classHasSpellcasting('Fighter')).toBe(false)
  })
})

describe('spellSlotsMax', () => {
  it('returns full caster slots for Wizard level 5', () => {
    const slots = spellSlotsMax('Wizard', 5)
    expect(slots[0]).toBeGreaterThan(0)
    expect(slots[1]).toBeGreaterThan(0)
  })

  it('returns half caster slots for Paladin level 5', () => {
    const full = spellSlotsMax('Wizard', 5)
    const half = spellSlotsMax('Paladin', 5)
    expect(half[2]).toBeLessThanOrEqual(full[2] ?? 0)
  })

  it('returns pact slots for Warlock', () => {
    const slots = spellSlotsMax('Warlock', 5)
    const total = slots.reduce((a, b) => a + b, 0)
    expect(total).toBeGreaterThan(0)
  })
})

describe('maxSpellsPrepared', () => {
  it('uses ability + level for Wizard', () => {
    const sheet = testSheet({
      className: 'Wizard',
      level: 5,
      abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 },
    })
    expect(maxSpellsPrepared('Wizard', sheet.level, sheet.abilities.int)).toBe(8)
  })

  it('uses ability + half level for Paladin', () => {
    const sheet = testSheet({
      className: 'Paladin',
      level: 5,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 },
    })
    expect(maxSpellsPrepared('Paladin', sheet.level, sheet.abilities.cha)).toBe(6)
    expect(preparedCapDescription('Paladin')).toBe('ability + half level')
  })
})

describe('addSpellToSpellcasting', () => {
  it('adds cantrips to cantripSlugs for Wizard', () => {
    const base = testSheet({
      className: 'Wizard',
      spellcasting: createDefaultSpellcasting(testSheet({ className: 'Wizard' }))!,
    })
    const next = addSpellToSpellcasting(base, 'srd-2024_acid-splash')
    expect(next.spellcasting?.cantripSlugs).toContain('srd-2024_acid-splash')
  })

  it('adds leveled spells to spellbook for Wizard', () => {
    const base = testSheet({
      className: 'Wizard',
      spellcasting: createDefaultSpellcasting(testSheet({ className: 'Wizard' }))!,
    })
    const next = addSpellToSpellcasting(base, 'srd-2024_acid-arrow')
    expect(next.spellcasting?.spellbookSlugs).toContain('srd-2024_acid-arrow')
    expect(next.spellcasting?.preparedSlugs).not.toContain('srd-2024_acid-arrow')
  })

  it('adds leveled spells to knownSlugs for Warlock', () => {
    const base = testSheet({
      className: 'Warlock',
      spellcasting: createDefaultSpellcasting(testSheet({ className: 'Warlock' }))!,
    })
    const next = addSpellToSpellcasting(base, 'srd-2024_acid-arrow')
    expect(spellcastingMode('Warlock')).toBe('pact')
    expect(next.spellcasting?.knownSlugs).toContain('srd-2024_acid-arrow')
  })
})

describe('maxCantripsKnown', () => {
  it('returns cantrip allowance for Wizard', () => {
    expect(maxCantripsKnown('Wizard', 1)).toBeGreaterThan(0)
  })
})

describe('spellSaveDc', () => {
  it('computes 8 + prof + ability mod', () => {
    const sheet = testSheet({
      className: 'Wizard',
      level: 5,
      abilities: { str: 10, dex: 10, con: 10, int: 18, wis: 10, cha: 10 },
      spellcasting: createDefaultSpellcasting(testSheet({ className: 'Wizard' }))!,
    })
    expect(spellSaveDc(sheet)).toBe(15)
    expect(spellAttackBonus(sheet)).toBe(7)
  })
})

describe('pactSlotSummary', () => {
  it('describes warlock slots', () => {
    const summary = pactSlotSummary('Warlock', 5)
    expect(summary).toMatch(/slot/i)
  })
})

describe('toggleSpellPrepared', () => {
  it('requires spellbook membership for Wizard', () => {
    let sheet = testSheet({
      className: 'Wizard',
      spellcasting: {
        ...createDefaultSpellcasting(testSheet({ className: 'Wizard' }))!,
        spellbookSlugs: ['srd-2024_acid-arrow'],
      },
    })
    sheet = toggleSpellPrepared(sheet, 'srd-2024_acid-arrow')
    expect(sheet.spellcasting?.preparedSlugs).toContain('srd-2024_acid-arrow')
    const issues = validateSpellcasting(sheet).filter((i) => i.severity === 'error')
    expect(issues.some((i) => i.message.includes('not in the spellbook'))).toBe(false)
  })
})
