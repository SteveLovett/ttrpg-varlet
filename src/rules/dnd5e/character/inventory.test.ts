import { describe, expect, it } from 'vitest'
import { testItem, testSheet } from '../../../test/sheetFixtures'
import { validateInventory } from './inventory'

describe('validateInventory', () => {
  it('warns when multiple body armor pieces are equipped', () => {
    const sheet = testSheet({
      inventoryItems: [
        testItem({
          kind: 'armor',
          name: 'Chain Mail',
          catalogSlug: 'srd-2024_chain-mail',
          equipped: true,
        }),
        testItem({
          id: 'b',
          kind: 'armor',
          name: 'Leather Armor',
          catalogSlug: 'srd-2024_leather-armor',
          equipped: true,
        }),
      ],
    })
    expect(validateInventory(sheet)).toContain('Multiple body armor pieces are marked equipped.')
  })

  it('warns when multiple shields are equipped', () => {
    const sheet = testSheet({
      inventoryItems: [
        testItem({
          kind: 'armor',
          name: 'Shield',
          catalogSlug: 'srd-2024_shield',
          equipped: true,
        }),
        testItem({
          id: 'b',
          kind: 'armor',
          name: 'Shield',
          catalogSlug: 'srd-2024_shield',
          equipped: true,
        }),
      ],
    })
    expect(validateInventory(sheet)).toContain('Multiple shields are marked equipped.')
  })
})
