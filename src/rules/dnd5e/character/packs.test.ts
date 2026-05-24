import { describe, expect, it } from 'vitest'
import { testSheet } from '../../../test/sheetFixtures'
import { canUnpackPack, getPackContents, unpackPackIntoInventory } from './packs'

describe('packs', () => {
  it('lists explorer pack contents', () => {
    const entries = getPackContents('srd-2024_explorers-pack')
    expect(entries.length).toBeGreaterThan(3)
  })

  it('unpacks into inventory rows and removes the pack', () => {
    const sheet = testSheet({
      inventoryItems: [
        {
          id: 'pack-1',
          kind: 'item',
          catalogSlug: 'srd-2024_explorers-pack',
          name: "Explorer's Pack",
          quantity: 1,
        },
      ],
    })
    const next = unpackPackIntoInventory(sheet, 'srd-2024_explorers-pack')
    expect(next.inventoryItems.length).toBeGreaterThan(0)
    expect(next.inventoryItems.some((i) => i.catalogSlug === 'srd-2024_explorers-pack')).toBe(
      false,
    )
  })

  it('recognizes pack slugs', () => {
    expect(canUnpackPack('srd-2024_explorers-pack')).toBe(true)
    expect(canUnpackPack('srd-2024_longsword')).toBe(false)
  })
})
