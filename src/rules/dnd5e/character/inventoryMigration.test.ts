import { describe, expect, it } from 'vitest'
import { testItem, testSheet } from '../../../test/sheetFixtures'
import {
  applyLegacyInventoryMigration,
  parseLegacyInventoryText,
  previewLegacyInventoryMigration,
  shouldOfferLegacyInventoryMigration,
} from './inventoryMigration'

describe('parseLegacyInventoryText', () => {
  it('splits lines and commas', () => {
    const lines = parseLegacyInventoryText('rope, 10 gp\n2x torch')
    expect(lines.length).toBeGreaterThanOrEqual(2)
  })
})

describe('previewLegacyInventoryMigration', () => {
  it('detects gp as currency', () => {
    const matches = previewLegacyInventoryMigration('25 gp')
    expect(matches.some((m) => m.kind === 'currency')).toBe(true)
  })

  it('matches catalog items by name', () => {
    const matches = previewLegacyInventoryMigration('Backpack')
    const catalog = matches.filter((m) => m.kind === 'catalog')
    expect(catalog.length).toBeGreaterThan(0)
  })
})

describe('applyLegacyInventoryMigration', () => {
  it('adds items and clears text when requested', () => {
    const sheet = testSheet({ inventory: 'Backpack', inventoryItems: [] })
    const next = applyLegacyInventoryMigration(sheet, { clearText: true })
    expect(next.inventoryItems.length).toBeGreaterThan(0)
    expect(next.inventory).toBe('')
  })
})

describe('shouldOfferLegacyInventoryMigration', () => {
  it('is true when text exists and no catalog rows', () => {
    expect(shouldOfferLegacyInventoryMigration(testSheet({ inventory: 'rope' }))).toBe(true)
    expect(
      shouldOfferLegacyInventoryMigration(
        testSheet({ inventory: 'rope', inventoryItems: [testItem({ name: 'Rope' })] }),
      ),
    ).toBe(false)
  })
})
