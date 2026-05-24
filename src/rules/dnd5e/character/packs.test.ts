import { describe, expect, it } from 'vitest'
import { testSheet } from '../../../test/sheetFixtures'
import { canUnpackPack, getPackContents, unpackPackIntoInventory } from './packs'

describe('packs', () => {
  it('lists explorer pack contents', () => {
    const entries = getPackContents('srd-2024_explorers-pack')
    expect(entries.length).toBeGreaterThan(3)
  })

  it('unpacks into inventory rows', () => {
    const sheet = testSheet()
    const next = unpackPackIntoInventory(sheet, 'srd-2024_explorers-pack')
    expect(next.inventoryItems.length).toBeGreaterThan(sheet.inventoryItems.length)
  })

  it('recognizes pack slugs', () => {
    expect(canUnpackPack('srd-2024_explorers-pack')).toBe(true)
    expect(canUnpackPack('srd-2024_longsword')).toBe(false)
  })
})
