import { describe, expect, it } from 'vitest'
import { testItem, testSheet } from '../../../test/sheetFixtures'
import {
  carryingCapacityLb,
  encumbranceStatus,
  inventoryItemWeightLb,
  totalInventoryWeightLb,
} from './inventoryWeight'

describe('inventoryItemWeightLb', () => {
  it('sums item weight from catalog', () => {
    const item = testItem({
      kind: 'item',
      catalogSlug: 'srd-2024_backpack',
      name: 'Backpack',
      quantity: 2,
    })
    const per = inventoryItemWeightLb(item)
    expect(per).toBeGreaterThan(0)
  })
})

describe('carryingCapacityLb', () => {
  it('uses STR × 15', () => {
    const sheet = testSheet({ abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } })
    expect(carryingCapacityLb(sheet)).toBe(240)
  })
})

describe('encumbranceStatus', () => {
  it('returns ok for light load', () => {
    expect(encumbranceStatus(testSheet())).toBe('ok')
  })
})

describe('totalInventoryWeightLb', () => {
  it('aggregates stack quantities', () => {
    const sheet = testSheet({
      inventoryItems: [
        testItem({ kind: 'item', catalogSlug: 'srd-2024_backpack', name: 'Backpack' }),
      ],
    })
    expect(totalInventoryWeightLb(sheet)).toBeGreaterThan(0)
  })
})
