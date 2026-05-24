import { describe, expect, it } from 'vitest'
import { testItem } from '../../../test/sheetFixtures'
import { consolidateInventoryItems, inventoryStackKey } from './inventoryStack'

describe('inventoryStackKey', () => {
  it('keys custom items by normalized name', () => {
    expect(inventoryStackKey(testItem({ kind: 'custom', name: ' Rope ' }))).toBe('custom:rope')
  })

  it('keys catalog items by kind and slug', () => {
    expect(
      inventoryStackKey(
        testItem({ kind: 'weapon', name: 'Longsword', catalogSlug: 'srd-2024_longsword' }),
      ),
    ).toBe('weapon:srd-2024_longsword')
  })
})

describe('consolidateInventoryItems', () => {
  it('sums quantities for identical stacks', () => {
    const a = testItem({ id: 'a', kind: 'item', name: 'Arrows', catalogSlug: 'srd-2024_arrows-20', quantity: 2 })
    const b = testItem({ id: 'b', kind: 'item', name: 'Arrows', catalogSlug: 'srd-2024_arrows-20', quantity: 3 })
    const merged = consolidateInventoryItems([a, b])
    expect(merged).toHaveLength(1)
    expect(merged[0]?.quantity).toBe(5)
  })

  it('ORs equipped flag when merging', () => {
    const a = testItem({ kind: 'armor', name: 'Shield', catalogSlug: 'srd-2024_shield', equipped: false })
    const b = testItem({ id: 'b', kind: 'armor', name: 'Shield', catalogSlug: 'srd-2024_shield', equipped: true })
    const merged = consolidateInventoryItems([a, b])
    expect(merged[0]?.equipped).toBe(true)
  })

  it('keeps first stack notes when merging', () => {
    const a = testItem({ kind: 'custom', name: 'Gem', notes: 'first', quantity: 1 })
    const b = testItem({ id: 'b', kind: 'custom', name: 'gem', notes: 'second', quantity: 1 })
    const merged = consolidateInventoryItems([a, b])
    expect(merged[0]?.notes).toBe('first')
  })
})
