import { describe, expect, it } from 'vitest'
import { createEmptySheet, parseSheetJson, SHEET_VERSION } from './types'

describe('parseSheetJson', () => {
  it('returns null when name is missing', () => {
    expect(parseSheetJson({})).toBeNull()
  })

  it('migrates v1 legacy inventory string only', () => {
    const parsed = parseSheetJson({
      version: 1,
      name: 'Legacy',
      inventory: 'rope, 10 gp',
    })
    expect(parsed?.version).toBe(SHEET_VERSION)
    expect(parsed?.inventory).toBe('rope, 10 gp')
    expect(parsed?.inventoryItems).toEqual([])
  })

  it('parses v2 inventory items and currency', () => {
    const parsed = parseSheetJson({
      version: 2,
      name: 'Equipped',
      inventoryItems: [
        {
          id: 'i1',
          kind: 'armor',
          name: 'Shield',
          catalogSlug: 'srd-2024_shield',
          quantity: 1,
          equipped: true,
        },
      ],
      currency: { gp: 25 },
    })
    expect(parsed?.inventoryItems).toHaveLength(1)
    expect(parsed?.inventoryItems[0]?.equipped).toBe(true)
    expect(parsed?.currency.gp).toBe(25)
  })

  it('parses spellcasting block on v3 sheets', () => {
    const parsed = parseSheetJson({
      version: 3,
      name: 'Caster',
      className: 'Wizard',
      spellcasting: {
        ability: 'int',
        cantripSlugs: ['srd-2024_acid-splash'],
        knownSlugs: [],
        preparedSlugs: ['srd-2024_acid-arrow'],
        slotsUsed: { 1: 2 },
      },
    })
    expect(parsed?.spellcasting?.ability).toBe('int')
    expect(parsed?.spellcasting?.cantripSlugs).toContain('srd-2024_acid-splash')
    expect(parsed?.spellcasting?.slotsUsed[1]).toBe(2)
  })

  it('defaults invalid spellcasting ability to int', () => {
    const parsed = parseSheetJson({
      name: 'Bad ability',
      spellcasting: { ability: 'invalid', cantripSlugs: [], knownSlugs: [], preparedSlugs: [] },
    })
    expect(parsed?.spellcasting?.ability).toBe('int')
  })
})

describe('createEmptySheet', () => {
  it('starts at sheet version 3 with empty spellcasting', () => {
    const sheet = createEmptySheet()
    expect(sheet.version).toBe(SHEET_VERSION)
    expect(sheet.spellcasting).toBeNull()
    expect(sheet.inventoryItems).toEqual([])
  })
})
