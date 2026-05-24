import { describe, expect, it } from 'vitest'
import { testSheet } from '../../../test/sheetFixtures'
import {
  applyStartingEquipmentSelections,
  isStartingSelectionComplete,
  startingChoiceIds,
} from './startingEquipment'

const FIGHTER_SELECTIONS = { armor: 'a', martial: 'a', ranged: 'a', pack: 'a' }

describe('startingChoiceIds', () => {
  it('returns choice ids for Fighter', () => {
    expect(startingChoiceIds('Fighter')).toEqual(['armor', 'martial', 'ranged', 'pack'])
  })
})

describe('isStartingSelectionComplete', () => {
  it('requires every choice id', () => {
    expect(isStartingSelectionComplete('Fighter', { armor: 'a' })).toBe(false)
    expect(isStartingSelectionComplete('Fighter', FIGHTER_SELECTIONS)).toBe(true)
  })
})

describe('applyStartingEquipmentSelections', () => {
  it('merges items and adds class currency', () => {
    const sheet = applyStartingEquipmentSelections(
      testSheet({ className: 'Fighter', inventory: 'old text' }),
      'Fighter',
      FIGHTER_SELECTIONS,
    )
    expect(sheet.inventoryItems.length).toBeGreaterThan(0)
    expect(sheet.currency.gp).toBe(7)
    expect(sheet.inventory).toBe('old text')
  })

  it('clears legacy inventory text when replacing kit', () => {
    const sheet = applyStartingEquipmentSelections(
      testSheet({ className: 'Fighter', inventory: 'legacy loot' }),
      'Fighter',
      FIGHTER_SELECTIONS,
      true,
    )
    expect(sheet.inventory).toBe('')
    expect(sheet.inventoryItems.length).toBeGreaterThan(0)
  })
})
